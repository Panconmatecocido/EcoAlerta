// src/services/api.ts
import { Producto } from '../interfaces/product';
import { MOCK_PRODUCTOS } from '../mocks/productos';

export const obtenerProductos = async (
  categoria?: string,
  busqueda?: string
): Promise<Producto[]> => {
  // Simula un tiempo de respuesta de red (300ms) para probar la ActivityIndicator
  await new Promise((resolve) => setTimeout(resolve, 300));

  let resultados = [...MOCK_PRODUCTOS];

  // Filtrado por Categoría
  if (categoria && categoria !== 'Todas') {
    resultados = resultados.filter(
      (prod) => prod.categoria?.toLowerCase() === categoria.toLowerCase()
    );
  }

  // Filtrado por Búsqueda (nombre o descripción)
  if (busqueda && busqueda.trim() !== '') {
    const termino = busqueda.toLowerCase();
    resultados = resultados.filter(
      (prod) =>
        prod.nombre.toLowerCase().includes(termino) ||
        prod.descripcion?.toLowerCase().includes(termino)
    );
  }

  return resultados;
};