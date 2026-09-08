// src/context/CartContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Producto } from '../interfaces/product';

export interface CartItem {
  producto: Producto;
  cantidad: number;
}

interface ContextoCarritoTipo {
  carrito: CartItem[];
  userPoints: number;
  shippingPoints: number;
  shippingARS: number;
  agregarAlCarrito: (producto: Producto) => void;
  actualizarCantidad: (productoId: string, delta: number) => void;
  eliminarDelCarrito: (productoId: string) => void;
  obtenerSubtotalPuntos: () => number;
  obtenerTotalPuntos: () => number;
}

const CartContext = createContext<ContextoCarritoTipo | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  
  // Mocks de puntos de usuario y costo de envío
  const userPoints = 1250;
  const shippingPoints = 100;
  const shippingARS = 1000;

  // Agregar producto o incrementar cantidad
  const agregarAlCarrito = (producto: Producto) => {
    setCarrito((carritoPrevio) => {
      const indiceExistente = carritoPrevio.findIndex(
        (item) => item.producto.id === producto.id
      );

      if (indiceExistente > -1) {
        const carritoActualizado = [...carritoPrevio];
        carritoActualizado[indiceExistente].cantidad += 1;
        return carritoActualizado;
      }

      return [...carritoPrevio, { producto, cantidad: 1 }];
    });
  };

  // Modificar cantidad (+1 o -1), eliminando el producto si llega a 0
  const actualizarCantidad = (productoId: string, delta: number) => {
    setCarrito((carritoPrevio) =>
      carritoPrevio
        .map((item) => {
          if (item.producto.id === productoId) {
            const nuevaCantidad = item.cantidad + delta;
            return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  // Eliminar producto directamente del carrito
  const eliminarDelCarrito = (productoId: string) => {
    setCarrito((carritoPrevio) =>
      carritoPrevio.filter((item) => item.producto.id !== productoId)
    );
  };

  // Subtotal de puntos del carrito
  const obtenerSubtotalPuntos = () => {
    return carrito.reduce((acumulado, item) => {
      const valorPuntos = item.producto.precio ?? 0;
      return acumulado + valorPuntos * item.cantidad;
    }, 0);
  };

  // Total de puntos incluyendo el envío (si hay productos en el carrito)
  const obtenerTotalPuntos = () => {
    const subtotal = obtenerSubtotalPuntos();
    return subtotal + (carrito.length > 0 ? shippingPoints : 0);
  };

  return (
    <CartContext.Provider
      value={{
        carrito,
        userPoints,
        shippingPoints,
        shippingARS,
        agregarAlCarrito,
        actualizarCantidad,
        eliminarDelCarrito,
        obtenerSubtotalPuntos,
        obtenerTotalPuntos,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const contexto = useContext(CartContext);
  if (!contexto) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return contexto;
};