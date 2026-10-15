// src/services/adminService.ts

import { clienteApi } from './api';
import { DenunciaMock } from '../mocks/denuncias';
import { AgenteResumen, MetricasAdmin } from '../mocks/adminDashboard';

export interface RespuestaApi<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const adminService = {
  // Obtener métricas para el inicio del Admin
  obtenerMetricas: async (municipioId?: string): Promise<MetricasAdmin> => {
    const query = municipioId ? `?municipioId=${municipioId}` : '';
    const res = await clienteApi<RespuestaApi<MetricasAdmin>>(`/denuncias/metricas${query}`);
    return res.data;
  },

  // Obtener lista de denuncias filtradas
  obtenerDenuncias: async (filtro = 'TODAS', busqueda = '', municipioId?: string): Promise<DenunciaMock[]> => {
    const params = new URLSearchParams();
    if (filtro !== 'TODAS') params.append('estado', filtro);
    if (busqueda) params.append('busqueda', busqueda);
    if (municipioId) params.append('municipioId', municipioId);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await clienteApi<RespuestaApi<any[]>>(`/denuncias${query}`);

    // Mapeo para adaptar los campos de la base de datos de Supabase a los componentes del cliente
    return res.data.map((item) => ({
      id: item.id,
      titulo: item.titulo,
      categoria: item.categoria,
      fecha: new Date(item.creadoEn).toISOString().split('T')[0],
      estado: item.estado,
      ubicacion: item.direccion,
    }));
  },

  // Cambiar estado de una denuncia
  cambiarEstadoDenuncia: async (id: string, nuevoEstado: string) => {
    return clienteApi<RespuestaApi<any>>(`/denuncias/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: nuevoEstado }),
    });
  },

  // Asignar agente de campo
  asignarAgente: async (denunciaId: string, agenteId: string) => {
    return clienteApi<RespuestaApi<any>>(`/denuncias/${denunciaId}/asignar`, {
      method: 'PATCH',
      body: JSON.stringify({ agenteId }),
    });
  },

  // Obtener lista de agentes de campo
  obtenerAgentes: async (municipioId?: string): Promise<AgenteResumen[]> => {
    const query = municipioId ? `?municipioId=${municipioId}` : '';
    const res = await clienteApi<RespuestaApi<AgenteResumen[]>>(`/agentes${query}`);
    return res.data;
  },

  // Alternar disponibilidad de un agente
  cambiarDisponibilidadAgente: async (agenteId: string, disponible: boolean) => {
    return clienteApi<RespuestaApi<any>>(`/agentes/${agenteId}/disponibilidad`, {
      method: 'PATCH',
      body: JSON.stringify({ disponible }),
    });
  },
};