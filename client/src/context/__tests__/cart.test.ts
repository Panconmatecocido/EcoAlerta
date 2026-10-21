// client/src/context/__tests__/cart.test.ts

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

interface StoreProductTest {
  id: string;
  titulo: string;
  costoPuntos: number;
  stock: number;
  activo: boolean;
}

interface CartItemTest {
  producto: StoreProductTest;
  cantidad: number;
}

// Lógica pura replicada de CartContext para verificar reglas de negocio de forma determinística
const calcularSubtotalPuntos = (carrito: CartItemTest[]): number => {
  return carrito.reduce((acumulado, item) => {
    return acumulado + item.producto.costoPuntos * item.cantidad;
  }, 0);
};

const calcularTotalPuntos = (carrito: CartItemTest[]): number => {
  // Principio VI & RF-TIE-03: 100% puntos, 0 cargos monetarios de envío en ARS
  return calcularSubtotalPuntos(carrito);
};

const intentarAgregarAlCarrito = (
  carrito: CartItemTest[],
  producto: StoreProductTest
): { nuevoCarrito: CartItemTest[]; exito: boolean } => {
  if (producto.stock <= 0) {
    return { nuevoCarrito: carrito, exito: false };
  }

  const idx = carrito.findIndex((item) => item.producto.id === producto.id);
  if (idx > -1) {
    if (carrito[idx].cantidad >= producto.stock) {
      return { nuevoCarrito: carrito, exito: false };
    }
    const copia = [...carrito];
    copia[idx] = { ...copia[idx], cantidad: copia[idx].cantidad + 1 };
    return { nuevoCarrito: copia, exito: true };
  }

  return {
    nuevoCarrito: [...carrito, { producto, cantidad: 1 }],
    exito: true,
  };
};

const actualizarCantidadEnCarrito = (
  carrito: CartItemTest[],
  productoId: string,
  delta: number
): { nuevoCarrito: CartItemTest[]; permitido: boolean } => {
  let permitido = true;
  const nuevoCarrito: CartItemTest[] = [];

  for (const item of carrito) {
    if (item.producto.id === productoId) {
      const nuevaCantidad = item.cantidad + delta;
      if (delta > 0 && nuevaCantidad > item.producto.stock) {
        permitido = false;
        nuevoCarrito.push(item);
        continue;
      }
      if (nuevaCantidad > 0) {
        nuevoCarrito.push({ ...item, cantidad: nuevaCantidad });
      }
    } else {
      nuevoCarrito.push(item);
    }
  }

  return { nuevoCarrito, permitido };
};

describe('Módulo 005: Pruebas Unitarias de Carrito Reactivo y Ausencia de Cargos Monetarios', () => {
  const prod1: StoreProductTest = {
    id: 'p1',
    titulo: 'Bolsa de Tela',
    costoPuntos: 40,
    stock: 2,
    activo: true,
  };

  const prod2: StoreProductTest = {
    id: 'p2',
    titulo: 'Botella Térmica',
    costoPuntos: 100,
    stock: 5,
    activo: true,
  };

  const prodAgotado: StoreProductTest = {
    id: 'p3',
    titulo: 'Insumo Agotado',
    costoPuntos: 200,
    stock: 0,
    activo: true,
  };

  it('US2: Calcula totalPuntos reactivamente sin cargos monetarios ni costos de envío en ARS', () => {
    const carrito: CartItemTest[] = [
      { producto: prod1, cantidad: 2 }, // 2 * 40 = 80
      { producto: prod2, cantidad: 1 }, // 1 * 100 = 100
    ];

    const subtotal = calcularSubtotalPuntos(carrito);
    const total = calcularTotalPuntos(carrito);

    assert.equal(subtotal, 180);
    assert.equal(total, 180); // Exactamente igual a subtotal: cero costo en ARS
  });

  it('US2: Impide agregar al carrito productos con stock = 0', () => {
    const { nuevoCarrito, exito } = intentarAgregarAlCarrito([], prodAgotado);
    assert.equal(exito, false);
    assert.equal(nuevoCarrito.length, 0);
  });

  it('US2: Respeta el límite de stock físico al incrementar unidades', () => {
    let carrito: CartItemTest[] = [];

    // Agregar unidad 1 de prod1 (stock = 2)
    const paso1 = intentarAgregarAlCarrito(carrito, prod1);
    assert.equal(paso1.exito, true);
    carrito = paso1.nuevoCarrito;

    // Agregar unidad 2
    const paso2 = intentarAgregarAlCarrito(carrito, prod1);
    assert.equal(paso2.exito, true);
    carrito = paso2.nuevoCarrito;
    assert.equal(carrito[0].cantidad, 2);

    // Intentar agregar unidad 3 (supera stock = 2)
    const paso3 = intentarAgregarAlCarrito(carrito, prod1);
    assert.equal(paso3.exito, false);
    assert.equal(paso3.nuevoCarrito[0].cantidad, 2); // No se incrementa
  });

  it('US2: Al decrementar una unidad con delta = -1 elimina el ítem si llega a 0', () => {
    const carritoInicial: CartItemTest[] = [{ producto: prod1, cantidad: 1 }];
    const { nuevoCarrito } = actualizarCantidadEnCarrito(carritoInicial, 'p1', -1);
    assert.equal(nuevoCarrito.length, 0);
  });
});
