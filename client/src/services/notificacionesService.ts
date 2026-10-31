import { api } from './api';

export interface NotificacionServidor {
  id: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  creadoEn: string;
}

export const obtenerNotificacionesCiudadano = async (
  ciudadanoId: string
): Promise<NotificacionServidor[]> => {
  const res = await api.get<{ success: boolean; data: NotificacionServidor[] }>(
    `/api/notificaciones/ciudadano/${ciudadanoId}`
  );
  return Array.isArray(res) ? res : res.data || [];
};
