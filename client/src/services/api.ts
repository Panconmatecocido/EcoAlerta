// Conexion a APIs / Base de datos (.ts)
//Conexion con la API de productos para obtener los productos disponibles y sus detalles
import { Product } from '../interfaces/product';

const API_URL = 'http://localhost:3000/api'; // Ajustar según entorno

export const getProducts = async (category?: string, search?: string): Promise<Product[]> => {
  const params = new URLSearchParams();
  if (category && category !== 'Todas') params.append('category', category);
  if (search) params.append('search', search);

  const response = await fetch(`${API_URL}/products?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Error al obtener los productos');
  }
  return response.json();
};