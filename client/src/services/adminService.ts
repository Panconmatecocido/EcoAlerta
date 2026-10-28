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
  latitudActual?: number | null;
  longitudActual?: number | null;
  ubicacionActualizadaEn?: string | null;
  casosAsignados: number;
  casoActivoId?: string;
  casoActivoCodigo?: string;
  casoActivoTitulo?: string;
  casoActivoEstado?: string;
}

export interface AgenteCandidato {
  id: string;
  nombre: string;
  disponible: boolean;
  casosActivos: number;
  distanciaMetros: number;
  ubicacionActualizadaEn: string;
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

export type PrioridadDenuncia = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export interface Denuncia {
  id: string;
  codigo?: string;
  titulo: string;
  descripcion?: string;
  categoria: string;
  direccion?: string;
  ubicacion?: string;
  latitud?: number | null;
  longitud?: number | null;
  prioridad?: PrioridadDenuncia;
  fecha: string;
  estado: EstadoDenunciaAdmin;
  observacionesAdmin?: string;
  intentosInaccesible?: number;
  puntosOtorgados?: number;
  agenteAsignadoId?: string;
  agenteAsignadoNombre?: string;
  imagenUrl?: string | null;
  fotoVerificacionUrl?: string;
  fotoSolucionUrl?: string;
  informeSolucion?: string;
  fechaVerificacion?: string;
  fechaResolucion?: string;
  ciudadanoId?: string;
  ciudadanoNombre?: string;
}

export interface DenunciaPersistida {
  id: string;
  codigo: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  direccion?: string;
  ubicacion?: string;
  latitud?: number | null;
  longitud?: number | null;
  estado: Denuncia['estado'];
  prioridad: PrioridadDenuncia;
  creadoEn: string;
  agenteId?: string | null;
  agente?: { id: string; nombre: string } | null;
  observacionesAdmin?: string;
  intentosInaccesible?: number;
  puntosOtorgados?: number;
  imagenUrl?: string | null;
  fotoVerificacionUrl?: string;
  fotoSolucionUrl?: string;
  informeSolucion?: string;
  fechaVerificacion?: string;
  fechaResolucion?: string;
  ciudadanoId?: string;
  ciudadano?: { id: string; nombre: string } | null;
}

function mapDenunciaPersistida(item: any): Denuncia {
  const dateSource = item.creadoEn || item.fecha;
  const timestamp = dateSource ? new Date(dateSource) : new Date();
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error(`El reporte ${item.id} tiene una fecha de creación no válida`);
  }

  const result: Denuncia = {
    id: item.id,
    codigo: item.codigo,
    titulo: item.titulo,
    descripcion: item.descripcion,
    categoria: item.categoria,
    direccion: item.direccion ?? item.ubicacion ?? '',
    latitud: item.latitud ?? null,
    longitud: item.longitud ?? null,
    prioridad: item.prioridad,
    fecha: timestamp.toISOString().split('T')[0],
    estado: item.estado,
    agenteAsignadoId: item.agente?.id ?? item.agenteId ?? item.agenteAsignadoId ?? undefined,
    agenteAsignadoNombre: item.agente?.nombre ?? item.agenteAsignadoNombre ?? undefined,
  };

  if (item.ubicacion !== undefined) result.ubicacion = item.ubicacion;
  if (item.observacionesAdmin !== undefined) result.observacionesAdmin = item.observacionesAdmin;
  if (item.intentosInaccesible !== undefined) result.intentosInaccesible = item.intentosInaccesible;
  if (item.puntosOtorgados !== undefined) result.puntosOtorgados = item.puntosOtorgados;
  if (item.imagenUrl !== undefined) result.imagenUrl = item.imagenUrl;
  if (item.fotoVerificacionUrl !== undefined) result.fotoVerificacionUrl = item.fotoVerificacionUrl;
  if (item.fotoSolucionUrl !== undefined) result.fotoSolucionUrl = item.fotoSolucionUrl;
  if (item.informeSolucion !== undefined) result.informeSolucion = item.informeSolucion;
  if (item.fechaVerificacion !== undefined) result.fechaVerificacion = item.fechaVerificacion;
  if (item.fechaResolucion !== undefined) result.fechaResolucion = item.fechaResolucion;
  if (item.ciudadanoId !== undefined) result.ciudadanoId = item.ciudadanoId;
  if (item.ciudadano?.id !== undefined) result.ciudadanoId = item.ciudadano.id;
  if (item.ciudadano?.nombre !== undefined) result.ciudadanoNombre = item.ciudadano.nombre;

  return result;
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
    const res = await api.get<RespuestaApi<DenunciaPersistida[]>>(endpoint);
    if (!res || res.success !== true || !Array.isArray(res.data)) {
      throw new Error(res?.message || 'La respuesta de reportes del servidor no es válida');
    }

    return res.data.map(mapDenunciaPersistida);
  },

  obtenerDetalleDenuncia: async (id: string): Promise<Denuncia> => {
    const response = await api.get<RespuestaApi<DenunciaPersistida>>(
      `/api/denuncias/${encodeURIComponent(id)}`
    );
    if (!response || response.success !== true || !response.data) {
      throw new Error(response?.message || 'No se pudo obtener el detalle del reporte');
    }
    return mapDenunciaPersistida(response.data);
  },

  // Triaje Inicial (FR-001: Aprobar con Prioridad hacia APROBADO, o Rechazar con motivo hacia RECHAZADO)
  triajeDenuncia: async (
    id: string,
    decision:
      | { accion: 'APROBAR'; prioridad?: PrioridadCaso | PrioridadDenuncia; observacionesAdmin?: string }
      | { accion: 'RECHAZAR'; observacionesAdmin?: string; prioridad?: PrioridadCaso | PrioridadDenuncia }
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

  // Asignación directa o por proximidad
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

  // Desasignar / Liberar Caso a la Bolsa General
  liberarCasoAgente: async (
    denunciaId: string,
    motivo?: string
  ): Promise<RespuestaApi<DenunciaPersistida>> => {
    if (motivo) {
      return api.patch(`/api/denuncias/${encodeURIComponent(denunciaId)}/liberar`, { motivo });
    }
    return api.patch(`/api/denuncias/${encodeURIComponent(denunciaId)}/liberar`);
  },

  // Validación de Veracidad y Acreditación Atómica de Puntos (FR-001, FR-002 / US1)
  validarVeracidadYAcreditarPuntos: async (
    id: string,
    payload: {
      decision: 'APROBAR_VERACIDAD' | 'RECHAZAR_FALSO';
      puntos?: number;
      observacionesAdmin?: string;
    }
  ) => {
    return await api.patch<RespuestaApi<any>>(`/api/denuncias/${id}/validar-veracidad`, payload);
  },

  // Certificación Final Antes vs. Después u Observación (FR-004, FR-005 / US3)
  certificarSaneamientoFinal: async (
    id: string,
    payload: {
      decision: 'CERTIFICAR' | 'OBSERVAR_REHACER';
      observacionesAdmin?: string;
    }
  ) => {
    return await api.patch<RespuestaApi<any>>(`/api/denuncias/${id}/certificar`, payload);
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

  obtenerDisponibilidadPropia: async (): Promise<RespuestaApi<{ disponible: boolean }>> => {
    const response = await api.get<RespuestaApi<{ disponible: boolean }>>('/api/agentes/me/estado');
    if (!response || response.success !== true || typeof response.data?.disponible !== 'boolean') {
      throw new Error(response?.message || 'La respuesta del estado del agente no es válida');
    }
    return response;
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
