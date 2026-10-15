// src/services/denunciaService.ts
import { clienteApi } from './api';

export interface CrearDenunciaPayload {
  titulo: string;
  categoria: 'BASURAL' | 'FOCO_DENGUE' | 'TERRENO_BALDIO' | 'OTRO';
  descripcion: string;
  ubicacion: string;
  latitud?: number;
  longitud?: number;
  fotoUri?: string; // URI local capturada por la cámara o galería
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
  obtenerMisDenuncias: async (): Promise<DenunciaCiudadano[]> => {
    return await clienteApi<DenunciaCiudadano[]>('/api/denuncias/mis-denuncias');
  },

  // Crear una nueva denuncia enviando datos y foto (FormData)
  crearDenuncia: async (payload: CrearDenunciaPayload): Promise<DenunciaCiudadano> => {
    const formData = new FormData();
    formData.append('titulo', payload.titulo);
    formData.append('categoria', payload.categoria);
    formData.append('descripcion', payload.descripcion);
    formData.append('ubicacion', payload.ubicacion);

    if (payload.latitud) formData.append('latitud', payload.latitud.toString());
    if (payload.longitud) formData.append('longitud', payload.longitud.toString());

    if (payload.fotoUri) {
      const filename = payload.fotoUri.split('/').pop() || 'evidencia.jpg';
      const match = /\.(\w+)\$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('foto', {
        uri: payload.fotoUri,
        name: filename,
        type,
      } as any);
    }

    // Nota: Para FormData se envía mediante fetch directo o sin encabezado Content-Type manual
    return await clienteApi<DenunciaCiudadano>('/api/denuncias', {
      method: 'POST',
      body: formData,
      headers: {
        // Al usar FormData en React Native, fetch asigna automáticamente el boundary si no definimos Content-Type
      },
    });
  },
};