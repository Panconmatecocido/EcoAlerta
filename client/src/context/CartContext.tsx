// client/src/context/CartContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StoreProduct } from '../repositories/store/IStoreRepository';

export interface CartItem {
  producto: StoreProduct;
  cantidad: number;
}

const STORAGE_KEY = '@ecoalerta_cart';

interface ContextoCarritoTipo {
  carrito: CartItem[];
  userPoints: number;
  agregarAlCarrito: (producto: StoreProduct) => boolean;
  actualizarCantidad: (productoId: string, delta: number) => boolean;
  eliminarDelCarrito: (productoId: string) => void;
  vaciarCarrito: () => void;
  obtenerSubtotalPuntos: () => number;
  obtenerTotalPuntos: () => number;
}

const CartContext = createContext<ContextoCarritoTipo | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const [cargadoInicial, setCargadoInicial] = useState<boolean>(false);

  // Cargar carrito persistido desde AsyncStorage
  useEffect(() => {
    const cargarCarritoPersistido = async () => {
      try {
        const guardado = await AsyncStorage.getItem(STORAGE_KEY);
        if (guardado) {
          const parsed = JSON.parse(guardado);
          if (Array.isArray(parsed)) {
            setCarrito(parsed);
          }
        }
      } catch (error) {
        console.error('Error al cargar el carrito desde AsyncStorage:', error);
      } finally {
        setCargadoInicial(true);
      }
    };

    cargarCarritoPersistido();
  }, []);

  // Guardar en AsyncStorage cada vez que cambie el carrito
  useEffect(() => {
    if (!cargadoInicial) return;

    const guardarCarrito = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
      } catch (error) {
        console.error('Error al guardar el carrito en AsyncStorage:', error);
      }
    };

    guardarCarrito();
  }, [carrito, cargadoInicial]);

  // Agregar producto o incrementar cantidad respetando el límite de stock
  const agregarAlCarrito = (producto: StoreProduct): boolean => {
    if (producto.stock <= 0) {
      return false;
    }

    let pudoAgregar = true;

    setCarrito((carritoPrevio) => {
      const indiceExistente = carritoPrevio.findIndex(
        (item) => item.producto.id === producto.id
      );

      if (indiceExistente > -1) {
        const itemActual = carritoPrevio[indiceExistente];
        if (itemActual.cantidad >= producto.stock) {
          pudoAgregar = false;
          return carritoPrevio;
        }

        const carritoActualizado = [...carritoPrevio];
        carritoActualizado[indiceExistente] = {
          ...itemActual,
          cantidad: itemActual.cantidad + 1,
          producto, // actualiza precio/stock vigente
        };
        return carritoActualizado;
      }

      return [...carritoPrevio, { producto, cantidad: 1 }];
    });

    return pudoAgregar;
  };

  // Modificar cantidad (+1 o -1), validando contra stock disponible
  const actualizarCantidad = (productoId: string, delta: number): boolean => {
    let permitido = true;

    setCarrito((carritoPrevio) => {
      const nuevoCarrito: CartItem[] = [];

      for (const item of carritoPrevio) {
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

      return nuevoCarrito;
    });

    return permitido;
  };

  // Eliminar producto directamente del carrito
  const eliminarDelCarrito = (productoId: string) => {
    setCarrito((carritoPrevio) =>
      carritoPrevio.filter((item) => item.producto.id !== productoId)
    );
  };

  // Vaciar el carrito completamente tras procesar un canje
  const vaciarCarrito = () => {
    setCarrito([]);
    AsyncStorage.removeItem(STORAGE_KEY).catch((err) =>
      console.error('Error al limpiar AsyncStorage:', err)
    );
  };

  // Subtotal de puntos del carrito (100% en puntos, sin cargos en ARS)
  const obtenerSubtotalPuntos = () => {
    return carrito.reduce((acumulado, item) => {
      const valorPuntos = item.producto.costoPuntos ?? 0;
      return acumulado + valorPuntos * item.cantidad;
    }, 0);
  };

  // Total de puntos: igual al subtotal (retiro presencial en sucursal municipal, $0 costo monetario)
  const obtenerTotalPuntos = () => {
    return obtenerSubtotalPuntos();
  };

  return (
    <CartContext.Provider
      value={{
        carrito,
        userPoints: 0,
        agregarAlCarrito,
        actualizarCantidad,
        eliminarDelCarrito,
        vaciarCarrito,
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