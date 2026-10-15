// src/services/adminService.ts
import { api } from './api';

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
  obtenerMetricas: async () => {
    return await api.get('/api/denuncias/metricas');
  },

  // Denuncias
  obtenerDenuncias: async (params?: { estado?: string; busqueda?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return await api.get(`/api/denuncias?${query}`);
  },

  actualizarEstadoDenuncia: async (id: string, estado: string) => {
    return await api.patch(`/api/denuncias/${id}/estado`, { estado });
  },

  asignarAgenteDenuncia: async (denunciaId: string, agenteId: string) => {
    return await api.patch(`/api/denuncias/${denunciaId}/asignar`, { agenteId });
  },

  // Agentes
  obtenerAgentes: async () => {
    return await api.get('/api/agentes');
  },

  alternarDisponibilidadAgente: async (agenteId: string, disponible: boolean) => {
    return await api.patch(`/api/agentes/${agenteId}/disponibilidad`, { disponible });
  },
};