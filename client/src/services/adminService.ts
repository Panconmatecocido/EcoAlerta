// src/services/adminService.ts
import { api } from './api';
import { MetricasAdmin, METRICAS_MOCK } from '../mocks/adminDashboard';
import { PrioridadCaso } from '../components/agent/PrioritySemaphoreBadge';

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
  casoActivoId?: string;
  casoActivoCodigo?: string;
  casoActivoTitulo?: string;
  casoActivoEstado?: string;
}

export type EstadoDenunciaAdmin =
  | 'PENDIENTE'
  | 'APROBADO'
  | 'EN_PROCESO'
  | 'EN_VERIFICACION'
  | 'VERIFICADO_PENDIENTE'
  | 'EN_SANEAMIENTO'
  | 'RESUELTO_TECNICO'
  | 'RESUELTO'
  | 'RECHAZADO'
  | 'CERRADO_INACCESIBLE';

export interface Denuncia {
  id: string;
  codigo?: string;
  titulo: string;
  descripcion?: string;
  categoria: string;
  ubicacion: string;
  fecha: string;
  estado: EstadoDenunciaAdmin;
  prioridad?: PrioridadCaso;
  observacionesAdmin?: string;
  intentosInaccesible?: number;
  puntosOtorgados?: number;
  agenteAsignadoId?: string;
  agenteAsignadoNombre?: string;
}

export const adminService = {
  // Métricas
  obtenerMetricas: async (municipioId?: string): Promise<MetricasAdmin> => {
    try {
      const query = municipioId ? `?municipioId=${municipioId}` : '';
      const res = await api.get<RespuestaApi<MetricasAdmin> | MetricasAdmin>(
        `/api/denuncias/metricas${query}`
      );
      return 'data' in res ? res.data : res;
    } catch {
      return METRICAS_MOCK;
    }
  },

  // Denuncias
  obtenerDenuncias: async (params?: {
    estado?: string;
    busqueda?: string;
    municipioId?: string;
  }): Promise<Denuncia[]> => {
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
      codigo: item.codigo,
      titulo: item.titulo,
      descripcion: item.descripcion,
      categoria: item.categoria,
      ubicacion: item.ubicacion ?? item.direccion ?? '',
      fecha:
        item.fecha ??
        (item.creadoEn ? new Date(item.creadoEn).toISOString().split('T')[0] : ''),
      estado: item.estado,
      prioridad: item.prioridad ?? 'MEDIA',
      observacionesAdmin: item.observacionesAdmin ?? undefined,
      intentosInaccesible: item.intentosInaccesible ?? 0,
      puntosOtorgados: item.puntosOtorgados ?? 0,
      agenteAsignadoId: item.agenteAsignadoId ?? item.agenteId ?? item.agente?.id,
      agenteAsignadoNombre: item.agenteAsignadoNombre ?? item.agente?.nombre,
    }));
  },

  actualizarEstadoDenuncia: async (id: string, estado: string) => {
    return await api.patch<RespuestaApi<any>>(`/api/denuncias/${id}/estado`, { estado });
  },

  // Triaje Inicial (FR-001: Aprobar con Prioridad hacia APROBADO, o Rechazar con motivo hacia RECHAZADO)
  triajeDenuncia: async (
    id: string,
    payload: {
      accion: 'APROBAR' | 'RECHAZAR';
      prioridad?: PrioridadCaso;
      observacionesAdmin?: string;
    }
  ) => {
    return await api.patch<RespuestaApi<any>>(`/api/denuncias/${id}/triaje`, payload);
  },

  // Desasignar / Liberar Caso a la Bolsa General (FR-006: retorna a APROBADO o mantiene EN_SANEAMIENTO)
  liberarCasoAgente: async (denunciaId: string, motivo?: string) => {
    return await api.patch<RespuestaApi<any>>(`/api/denuncias/${denunciaId}/liberar`, {
      motivo: motivo || 'Desasignado por Administrador Municipal',
    });
  },

  asignarAgenteDenuncia: async (denunciaId: string, agenteId: string) => {
    return await api.patch<RespuestaApi<any>>(`/api/denuncias/${denunciaId}/asignar`, {
      agenteId,
    });
  },

  // Agentes
  obtenerAgentes: async (municipioId?: string): Promise<Agente[]> => {
    const query = municipioId ? `?municipioId=${municipioId}` : '';
    const res = await api.get<RespuestaApi<Agente[]> | Agente[]>(`/api/agentes${query}`);
    return Array.isArray(res) ? res : res.data || [];
  },

  alternarDisponibilidadAgente: async (agenteId: string, disponible: boolean) => {
    return await api.patch<RespuestaApi<any>>(`/api/agentes/${agenteId}/disponibilidad`, {
      disponible,
    });
  },
};