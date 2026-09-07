// src/context/CartContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Producto } from '../interfaces/product';

// Estructura de cada item dentro del carrito
export interface CartItem {
  producto: Producto;
  cantidad: number;
}

// Lo que expone el Contexto a los componentes
interface ContextoCarritoTipo {
  carrito: CartItem[];
  agregarAlCarrito: (producto: Producto) => void;
  puntosTotales: number;
}

const CartContext = createContext<ContextoCarritoTipo | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [carrito, setCarrito] = useState<CartItem[]>([]);

  // Agrega un producto o incrementa la cantidad si ya está en la lista
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

  // Suma total de puntos compatible con precio, pointsPrice o price
  const puntosTotales = carrito.reduce((acumulado, item) => {
    const valorPuntos =
      item.producto.precio ??
      (item.producto as any).pointsPrice ??
      (item.producto as any).price ??
      0;
    return acumulado + valorPuntos * item.cantidad;
  }, 0);

  return (
    <CartContext.Provider value={{ carrito, agregarAlCarrito, puntosTotales }}>
      {children}
    </CartContext.Provider>
  );
};

// Hook personalizado para consumir el contexto en la Tienda
export const useCart = () => {
  const contexto = useContext(CartContext);
  if (!contexto) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return contexto;
};