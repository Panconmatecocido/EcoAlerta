const TIPOS_PERMITIDOS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export class ErrorAlmacenamiento extends Error {
  constructor(message: string, readonly estado: number = 500) {
    super(message);
  }
}

const leerConfiguracion = () => {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'productos';
  if (!url || !clave) {
    throw new ErrorAlmacenamiento(
      'El almacenamiento de imágenes no está configurado (faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY)'
    );
  }
  return { url, clave, bucket };
};

/** Sube una imagen en formato data URI al bucket público de Supabase y devuelve su URL pública. */
export const subirImagenProducto = async (dataUri: string): Promise<string> => {
  const coincidencia = /^data:(image\/[a-z+]+);base64,([A-Za-z0-9+/=]+)$/i.exec(dataUri);
  if (!coincidencia) {
    throw new ErrorAlmacenamiento('La imagen no tiene un formato válido', 400);
  }

  const tipo = coincidencia[1].toLowerCase();
  const extension = TIPOS_PERMITIDOS[tipo];
  if (!extension) {
    throw new ErrorAlmacenamiento('Formato no permitido. Usá JPG, PNG o WEBP', 400);
  }

  const contenido = Buffer.from(coincidencia[2], 'base64');
  const { url, clave, bucket } = leerConfiguracion();
  const ruta = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;

  const respuesta = await fetch(`${url}/storage/v1/object/${bucket}/${ruta}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${clave}`,
      apikey: clave,
      'Content-Type': tipo,
      'Cache-Control': 'max-age=31536000',
    },
    body: contenido,
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => '');
    console.error('Error de Supabase Storage:', respuesta.status, detalle);
    throw new ErrorAlmacenamiento('No se pudo subir la imagen al almacenamiento');
  }

  return `${url}/storage/v1/object/public/${bucket}/${ruta}`;
};
