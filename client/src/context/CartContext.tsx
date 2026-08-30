// Define la interfaz de los productos y puntos

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Producto } from '../interfaces/product';

// Estructura de cada elemento dentro del carrito
export interface CartItem {
    producto: Producto;
    cantidad: number;
}

// Lo que expone el contexto
interface ContextoCarritoTipo {
    carrito: CartItem[];
    agregarAlCarrito: (producto: Producto) => void;
    puntosTotales: number;
}

const CartContext = createContext<ContextoCarritoTipo | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [carrito, setCarrito] = useState<CartItem[]>([]);

    // Función para agregar un producto o sumar cantidad si ya existe
    const agregarAlCarrito = (producto: Producto) => {
        setCarrito((carritoPrevio) => {
            const indiceExistente = carritoPrevio.findIndex (item => item.producto.id === producto.id);

            if (indiceExistente > -1) {
                const carritoActualizado = [...carritoPrevio];
                carritoActualizado[indiceExistente].cantidad += 1;
                return carritoActualizado;
            }

            return [...carritoPrevio, { producto, cantidad: 1 }];
        });
    };

    // Suma total de puntos multiplicando el precio en puntos por la cantidad
    const puntosTotales = carrito.reduce((acumulado, item) => acumulado + item.producto.precio * item.cantidad, 0);

    return (
        <CartContext.Provider value={{ carrito, agregarAlCarrito, puntosTotales }}>
            {children}
        </CartContext.Provider>
    );
}

// Hook personalizado para consumir el contexto en los componentes
export const useCart = () => {
    const contexto = useContext(CartContext);
    if (!contexto) {
        throw new Error('useCart debe ser usado dentro de un CartProvider');
    }   
    return contexto;
};