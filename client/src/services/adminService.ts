// src/services/adminService.ts
import { api } from './api';
import { MetricasAdmin } from '../mocks/adminDashboard';

export interface RespuestaApi<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface Agente {
  id: string;
  nombre: string;
  email: string;
  disponible: boolean;
  casosAsignados: number;
}

export interface Denuncia {
  id: string;
  titulo: string;
  categoria: string;
  ubicacion: string;
  fecha: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO' | 'RECHAZADO';
  agenteAsignadoId?: string;
  agenteAsignadoNombre?: string;
}

export const adminService = {
  // Métricas
  obtenerMetricas: async (municipioId?: string): Promise<MetricasAdmin> => {
    const query = municipioId ? `?municipioId=${municipioId}` : '';
    const res = await api.get<RespuestaApi<MetricasAdmin> | MetricasAdmin>(
      `/api/denuncias/metricas${query}`
    );
    return 'data' in res ? res.data : res;
  },

  // Denuncias
  obtenerDenuncias: async (params?: { estado?: string; busqueda?: string; municipioId?: string }): Promise<Denuncia[]> => {
    const cleanParams: Record<string, string> = {};
    if (params?.estado && params.estado !== 'TODAS') cleanParams.estado = params.estado;
    if (params?.busqueda) cleanParams.busqueda = params.busqueda;
    if (params?.municipioId) cleanParams.municipioId = params.municipioId;

    const queryStr = new URLSearchParams(cleanParams).toString();
    const endpoint = queryStr ? `/api/denuncias?${queryStr}` : '/api/denuncias';
    const res = await api.get<RespuestaApi<any[]> | any[]>(endpoint);
    const lista = Array.isArray(res) ? res : res.data || [];

    return lista.map((item: any) => ({
      id: item.id,
      titulo: item.titulo,
      categoria: item.categoria,
      ubicacion: item.ubicacion ?? item.direccion ?? '',
      fecha: item.fecha ?? (item.creadoEn ? new Date(item.creadoEn).toISOString().split('T')[0] : ''),
      estado: item.estado,
      agenteAsignadoId: item.agenteAsignadoId ?? item.agenteId ?? item.agente?.id,
      agenteAsignadoNombre: item.agenteAsignadoNombre ?? item.agente?.nombre,
    }));
  },

  actualizarEstadoDenuncia: async (id: string, estado: string) => {
    return await api.patch<RespuestaApi<any>>(`/api/denuncias/${id}/estado`, { estado });
  },

  asignarAgenteDenuncia: async (denunciaId: string, agenteId: string) => {
    return await api.patch<RespuestaApi<any>>(`/api/denuncias/${denunciaId}/asignar`, { agenteId });
  },

  // Agentes
  obtenerAgentes: async (municipioId?: string): Promise<Agente[]> => {
    const query = municipioId ? `?municipioId=${municipioId}` : '';
    const res = await api.get<RespuestaApi<Agente[]> | Agente[]>(`/api/agentes${query}`);
    return Array.isArray(res) ? res : res.data || [];
  },

  alternarDisponibilidadAgente: async (agenteId: string, disponible: boolean) => {
    return await api.patch<RespuestaApi<any>>(`/api/agentes/${agenteId}/disponibilidad`, { disponible });
  },
};