// src/services/denunciaService.ts
import { api } from './api';
import { getStoredDenuncias, saveNewDenuncia } from '../utils/storage';

export interface CrearDenunciaPayload {
  titulo: string;
  categoria: 'BASURAL' | 'FOCO_DENGUE' | 'TERRENO_BALDIO' | 'OTRO';
  descripcion: string;
  ubicacion: string;
  latitud?: number;
  longitud?: number;
  fotoUri?: string; // URI local capturada por la cámara o galería
  ciudadanoId?: string;
  municipioId?: string;
}

export interface DenunciaCiudadano {
  id: string;
  titulo: string;
  categoria: string;
  descripcion: string;
  ubicacion: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO' | 'RECHAZADO';
  fecha: string;
  fotoUrl?: string;
  puntosOtorgados?: number;
}

export const denunciaService = {
  // Obtener reportes creados por el ciudadano autenticado
  obtenerMisDenuncias: async (ciudadanoId?: string): Promise<DenunciaCiudadano[]> => {
    try {
      const query = ciudadanoId ? `?ciudadanoId=${ciudadanoId}` : '';
      const res = await api.get<{ success: boolean; data: any[] } | any[]>(
        `/api/denuncias/mis-denuncias${query}`
      );
      const lista = Array.isArray(res) ? res : res.data || [];
      if (lista.length > 0) {
        return lista.map((item: any) => ({
          id: item.id,
          titulo: item.titulo,
          categoria: item.categoria,
          descripcion: item.descripcion,
          ubicacion: item.direccion || item.ubicacion || '',
          estado: item.estado,
          fecha: item.creadoEn ? new Date(item.creadoEn).toISOString().split('T')[0] : '',
          fotoUrl: item.imagenUrl || item.fotoUrl,
          puntosOtorgados: item.puntosOtorgados ?? 0,
        }));
      }
    } catch (err) {
      console.warn('No se pudo conectar con el servidor para mis denuncias:', err);
    }

    // Fallback a almacenamiento local persistente
    const guardadas = await getStoredDenuncias();
    return guardadas.map((item) => ({
      id: item.id,
      titulo: item.titulo,
      categoria: item.categoria,
      descripcion: item.descripcion,
      ubicacion: item.ubicacion,
      estado: item.estado,
      fecha: item.fecha,
      fotoUrl: item.fotoUrl,
      puntosOtorgados: item.puntosOtorgados ?? 0,
    }));
  },

  // Crear una nueva denuncia enviando datos en JSON
  crearDenuncia: async (payload: CrearDenunciaPayload): Promise<DenunciaCiudadano> => {
    const jsonBody = {
      titulo: payload.titulo,
      categoria: payload.categoria,
      descripcion: payload.descripcion,
      ubicacion: payload.ubicacion,
      direccion: payload.ubicacion,
      latitud: payload.latitud,
      longitud: payload.longitud,
      fotoUri: payload.fotoUri,
      imagenUrl: payload.fotoUri,
      ciudadanoId: payload.ciudadanoId,
      municipioId: payload.municipioId,
    };

    let denunciaCreada: DenunciaCiudadano;

    try {
      const res = await api.post<{ success: boolean; data: any; message?: string }>(
        '/api/denuncias',
        jsonBody
      );

      const raw = res && res.data ? res.data : res;
      denunciaCreada = {
        id: raw.id || `den-${Date.now()}`,
        titulo: raw.titulo || payload.titulo,
        categoria: raw.categoria || payload.categoria,
        descripcion: raw.descripcion || payload.descripcion,
        ubicacion: raw.direccion || raw.ubicacion || payload.ubicacion,
        estado: (raw.estado as any) || 'PENDIENTE',
        fecha: raw.creadoEn
          ? new Date(raw.creadoEn).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        fotoUrl: raw.imagenUrl || raw.fotoUrl || payload.fotoUri,
        puntosOtorgados: raw.puntosOtorgados ?? 0,
      };
    } catch (error: any) {
      // Si el servidor devolvió un error específico (ej: 400), propagar el error real
      // Si es error de red o timeout pero estamos en desarrollo/pruebas locales, persistir
      const errorMsg = error?.message || '';
      const esFalloConexion =
        errorMsg.includes('Network') ||
        errorMsg.includes('Failed to fetch') ||
        errorMsg.includes('timed out') ||
        errorMsg.includes('ECONNREFUSED');

      if (!esFalloConexion && errorMsg) {
        throw error;
      }

      console.warn('Servidor no disponible, persistiendo localmente:', errorMsg);
      denunciaCreada = {
        id: `den-${Date.now()}`,
        titulo: payload.titulo,
        categoria: payload.categoria,
        descripcion: payload.descripcion,
        ubicacion: payload.ubicacion,
        estado: 'PENDIENTE',
        fecha: new Date().toISOString().split('T')[0],
        fotoUrl: payload.fotoUri,
        puntosOtorgados: 0,
      };
    }

    // Persistir localmente para resiliencia y acceso inmediato
    await saveNewDenuncia(denunciaCreada);

    return denunciaCreada;
  },
};