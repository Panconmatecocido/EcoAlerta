import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const subirImagenSupabase = async (file: Express.Multer.File): Promise<string> => {
  const fileExt = file.originalname.split('.').pop() || 'jpg';
  const fileName = `denuncia_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
  const filePath = `evidencias/${fileName}`;

  const { error } = await supabase.storage
    .from('denuncias-evidencias')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) {
    throw new Error(`Error al subir imagen a Supabase Storage: ${error.message}`);
  }

  // Obtener URL pública
  const { data } = supabase.storage
    .from('denuncias-evidencias')
    .getPublicUrl(filePath);

  return data.publicUrl;
};