// src/services/tiendaService.ts
import { api } from './api';

export interface Producto {
  id: string;
  titulo: string;
  descripcion: string;
  costoPuntos: number;
  stock: number;
  imagenUrl?: string;
}

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

export interface ResultadoCanje {
  id: string;
  codigoRetiro: string;
  puntosDescontados: number;
  nuevoSaldoPuntos: number;
  fecha: string;
}

export const tiendaService = {
  // Obtener catálogo de insumos ecológicos
  obtenerProductos: async (): Promise<Producto[]> => {
    return await api.get<Producto[]>('/api/productos');
  },

  // Procesar canje deduciendo puntos
  procesarCanje: async (items: { productoId: string; cantidad: number }[]): Promise<ResultadoCanje> => {
    return await api.post<ResultadoCanje>('/api/canjes', { items });
  },
};