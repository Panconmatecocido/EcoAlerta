// Conexion a APIs / Base de datos (.ts)
//Conexion con la API de productos para obtener los productos disponibles y sus detalles
import { Producto } from '../interfaces/product';

const API_URL = 'http://localhost:3000/api'; // Ajustar según entorno

export const obtenerProductos = async (categoria?: string, busqueda?: string): Promise<Producto[]> => {
  const parametros = new URLSearchParams();
  if (categoria && categoria !== 'Todas') parametros.append('category', categoria);
  if (busqueda) parametros.append('search', busqueda);

  const respuesta = await fetch(`${API_URL}/products?${parametros.toString()}`);
  if (!respuesta.ok) {
    throw new Error('Error al obtener los productos');
  }
  return respuesta.json();
};