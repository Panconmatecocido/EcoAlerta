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
    const res = await api.get<{ success: boolean; data: Producto[] } | Producto[]>('/api/productos');
    return Array.isArray(res) ? res : res.data || [];
  },

  // Procesar canje deduciendo puntos
  procesarCanje: async (items: { productoId: string; cantidad: number }[]): Promise<ResultadoCanje> => {
    return await api.post<ResultadoCanje>('/api/canjes', { items });
  },

  // Obtener historial de canjes del ciudadano
  obtenerMisCanjes: async (ciudadanoId: string): Promise<ResultadoCanje[]> => {
    try {
      const res = await api.get<{ success: boolean; data: any[] }>(`/api/canjes/ciudadano/${ciudadanoId}`);
      const items = Array.isArray(res) ? res : res.data || [];
      return items.map((c: any) => ({
        id: c.id,
        codigoRetiro: c.codigoRetiro,
        puntosDescontados: c.totalPuntos,
        nuevoSaldoPuntos: 0,
        fecha: c.creadoEn ? new Date(c.creadoEn).toLocaleDateString('es-AR') : '',
      }));
    } catch {
      return [];
    }
  },
};