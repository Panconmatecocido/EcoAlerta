import { api } from './api';
import { compressImage, imageUriToDataUri } from '../utils/imageCompressor';

/** Comprime la imagen local, la sube a Supabase Storage vía el servidor y devuelve su URL pública. */
export const subirImagenProducto = async (uriLocal: string): Promise<string> => {
  const comprimida = await compressImage(uriLocal);
  const imagen = await imageUriToDataUri(comprimida.uri);
  const res = await api.post<{ success: boolean; data: { url: string } }>('/api/productos/imagen', { imagen });
  return res.data.url;
};
