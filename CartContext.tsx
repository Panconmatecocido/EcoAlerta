import React, { createContext, useContext, useState } from 'react';

export interface CartItem {
  id: string;
  title: string;
  points: number;
  quantity: number;
  image: string;
}

interface CartContextType {
  cart: CartItem[];
  userPoints: number;
  shippingPoints: number;
  shippingARS: number;
  pointsToARSExchangeRate: number; // Ej: 1 punto = 1 ARS
  updateQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  getSubtotalPoints: () => number;
  getTotalPoints: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userPoints] = useState(1250);
  const shippingPoints = 100;
  const shippingARS = 10;
  const pointsToARSExchangeRate = 1;

  const [cart, setCart] = useState<CartItem[]>([
    { id: '1', title: 'Cepillo de bambú', points: 300, quantity: 2, image: 'https://via.placeholder.com/80' },
    { id: '2', title: 'Bolsa ecológica', points: 500, quantity: 1, image: 'https://via.placeholder.com/80' },
    { id: '3', title: 'Macetas ecológicas', points: 750, quantity: 1, image: 'https://via.placeholder.com/80' },
  ]);

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      })
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const getSubtotalPoints = () => {
    return cart.reduce((sum, item) => sum + item.points * item.quantity, 0);
  };

  const getTotalPoints = () => {
    return getSubtotalPoints() + shippingPoints;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        userPoints,
        shippingPoints,
        shippingARS,
        pointsToARSExchangeRate,
        updateQuantity,
        removeItem,
        getSubtotalPoints,
        getTotalPoints,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart debe usarse dentro de CartProvider');
  return context;
};
