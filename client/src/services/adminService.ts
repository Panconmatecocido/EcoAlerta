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

export interface AgenteCandidato {
  id: string;
  nombre: string;
  disponible: boolean;
  casosActivos: number;
  distanciaMetros: number;
  ubicacionActualizadaEn: string;
}

export interface Denuncia {
  id: string;
  codigo: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  fecha: string;
  estado:
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
  agenteAsignadoId?: string;
  agenteAsignadoNombre?: string;
}

export type PrioridadDenuncia = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export interface DenunciaPersistida {
  id: string;
  codigo: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  estado: Denuncia['estado'];
  prioridad: PrioridadDenuncia;
  creadoEn: string;
  agenteId?: string | null;
  agente?: { id: string; nombre: string } | null;
}

function mapDenunciaPersistida(item: DenunciaPersistida): Denuncia {
  const timestamp = new Date(item.creadoEn);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error(`El reporte ${item.id} tiene una fecha de creación no válida`);
  }
  return {
    id: item.id,
    codigo: item.codigo,
    titulo: item.titulo,
    descripcion: item.descripcion,
    categoria: item.categoria,
    direccion: item.direccion,
    latitud: item.latitud,
    longitud: item.longitud,
    prioridad: item.prioridad,
    fecha: timestamp.toISOString().split('T')[0],
    estado: item.estado,
    agenteAsignadoId: item.agente?.id ?? item.agenteId ?? undefined,
    agenteAsignadoNombre: item.agente?.nombre,
  };
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
  obtenerDenuncias: async (params?: { estado?: string; busqueda?: string }): Promise<Denuncia[]> => {
    const cleanParams: Record<string, string> = {};
    if (params?.estado && params.estado !== 'TODAS') cleanParams.estado = params.estado;
    if (params?.busqueda) cleanParams.busqueda = params.busqueda;

    const queryStr = new URLSearchParams(cleanParams).toString();
    const endpoint = queryStr ? `/api/denuncias?${queryStr}` : '/api/denuncias';
    const res = await api.get<RespuestaApi<DenunciaPersistida[]>>(endpoint);
    if (!res || res.success !== true || !Array.isArray(res.data)) {
      throw new Error(res?.message || 'La respuesta de reportes del servidor no es válida');
    }

    return res.data.map(mapDenunciaPersistida);
  },

  triajeDenuncia: async (
    id: string,
    decision:
      | { accion: 'APROBAR'; prioridad: PrioridadDenuncia }
      | { accion: 'RECHAZAR'; observacionesAdmin: string }
  ): Promise<Denuncia> => {
    const response = await api.patch<RespuestaApi<DenunciaPersistida>>(
      `/api/denuncias/${encodeURIComponent(id)}/triaje`,
      decision
    );
    if (!response || response.success !== true || !response.data) {
      throw new Error(response?.message || 'No se pudo confirmar el triaje del reporte');
    }
    return mapDenunciaPersistida(response.data);
  },

  asignarAgenteDenuncia: async (denunciaId: string, agenteId: string): Promise<Denuncia> => {
    const response = await api.patch<RespuestaApi<DenunciaPersistida>>(
      `/api/denuncias/${encodeURIComponent(denunciaId)}/asignar`,
      { agenteId }
    );
    if (!response || response.success !== true || !response.data) {
      throw new Error(response?.message || 'No se pudo confirmar la asignación del reporte');
    }
    return mapDenunciaPersistida(response.data);
  },

  liberarCasoAgente: async (
    denunciaId: string
  ): Promise<RespuestaApi<DenunciaPersistida>> => {
    return api.patch(`/api/denuncias/${encodeURIComponent(denunciaId)}/liberar`);
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

  actualizarDisponibilidadPropia: async (
    disponible: boolean,
    ubicacion?: { latitud: number; longitud: number }
  ): Promise<RespuestaApi<{ id: string; disponible: boolean; ubicacionActualizadaEn: string | null }>> => {
    if (disponible && !ubicacion) {
      throw new Error('Se requiere ubicación GPS para activar la disponibilidad');
    }
    const body = disponible ? { disponible, ...ubicacion } : { disponible };
    return api.patch('/api/agentes/me/disponibilidad', body);
  },

  actualizarUbicacionPropia: async (
    latitud: number,
    longitud: number
  ): Promise<RespuestaApi<{ ubicacionActualizadaEn: string }>> =>
    api.patch('/api/agentes/me/ubicacion', { latitud, longitud }),

  obtenerAgentesCandidatos: async (denunciaId: string): Promise<AgenteCandidato[]> => {
    const response = await api.get<RespuestaApi<AgenteCandidato[]>>(
      `/api/denuncias/${encodeURIComponent(denunciaId)}/agentes-disponibles`
    );
    if (!response || response.success !== true || !Array.isArray(response.data)) {
      throw new Error(response?.message || 'La respuesta de agentes candidatos no es válida');
    }
    return response.data;
  },
};