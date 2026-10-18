// src/services/adminService.ts
import { api } from './api';
import { MetricasAdmin } from '../mocks/adminDashboard';
import { getStoredDenuncias, saveStoredDenuncias } from '../utils/storage';

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
    let lista: any[] = [];

    try {
      const res = await api.get<RespuestaApi<any[]> | any[]>(endpoint);
      lista = Array.isArray(res) ? res : res.data || [];
    } catch (err) {
      console.warn('No se pudo conectar al servidor para obtener denuncias:', err);
    }

    // Integrar denuncias del almacenamiento persistente local
    const locales = await getStoredDenuncias();
    const idsExistentes = new Set(lista.map((item: any) => item.id));

    for (const loc of locales) {
      if (!idsExistentes.has(loc.id)) {
        lista.unshift({
          id: loc.id,
          titulo: loc.titulo,
          categoria: loc.categoria,
          direccion: loc.ubicacion,
          ubicacion: loc.ubicacion,
          estado: loc.estado,
          creadoEn: loc.fecha,
          agenteAsignadoId: loc.agenteAsignadoId,
          agenteAsignadoNombre: loc.agenteAsignadoNombre,
        });
      }
    }

    let resultado = lista.map((item: any) => ({
      id: item.id,
      titulo: item.titulo,
      categoria: item.categoria,
      ubicacion: item.ubicacion ?? item.direccion ?? '',
      fecha: item.fecha ?? (item.creadoEn ? new Date(item.creadoEn).toISOString().split('T')[0] : ''),
      estado: item.estado,
      agenteAsignadoId: item.agenteAsignadoId ?? item.agenteId ?? item.agente?.id,
      agenteAsignadoNombre: item.agenteAsignadoNombre ?? item.agente?.nombre,
    }));

    if (params?.estado && params.estado !== 'TODAS') {
      resultado = resultado.filter((d) => d.estado === params.estado);
    }

    if (params?.busqueda && params.busqueda.trim() !== '') {
      const termino = params.busqueda.toLowerCase();
      resultado = resultado.filter(
        (d) =>
          d.titulo.toLowerCase().includes(termino) ||
          d.ubicacion.toLowerCase().includes(termino) ||
          d.categoria.toLowerCase().includes(termino)
      );
    }

    return resultado;
  },

  actualizarEstadoDenuncia: async (id: string, estado: string) => {
    try {
      await api.patch<RespuestaApi<any>>(`/api/denuncias/${id}/estado`, { estado });
    } catch (err) {
      console.warn('No se pudo actualizar estado en servidor, actualizando localmente:', err);
    }

    // Actualizar también en almacenamiento local
    const guardadas = await getStoredDenuncias();
    const index = guardadas.findIndex((d) => d.id === id);
    if (index >= 0) {
      guardadas[index].estado = estado as any;
      await saveStoredDenuncias(guardadas);
    }
  },

  asignarAgenteDenuncia: async (denunciaId: string, agenteId: string, agenteNombre?: string) => {
    try {
      await api.patch<RespuestaApi<any>>(`/api/denuncias/${denunciaId}/asignar`, { agenteId });
    } catch (err) {
      console.warn('No se pudo asignar agente en servidor, actualizando localmente:', err);
    }

    // Actualizar también en almacenamiento local
    const guardadas = await getStoredDenuncias();
    const index = guardadas.findIndex((d) => d.id === denunciaId);
    if (index >= 0) {
      guardadas[index].agenteAsignadoId = agenteId;
      if (agenteNombre) guardadas[index].agenteAsignadoNombre = agenteNombre;
      guardadas[index].estado = 'EN_PROCESO';
      await saveStoredDenuncias(guardadas);
    }
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