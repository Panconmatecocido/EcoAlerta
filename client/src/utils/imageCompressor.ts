// Inicio de Fase 1 (Setup): compresión y validación del tamaño de imágenes.
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export const MAX_IMAGE_DIMENSION = 1080;
export const MAX_IMAGE_SIZE_BYTES = 1_258_291;

const DIMENSION_STEPS = [1080, 900, 720, 540, 360];
const COMPRESSION_QUALITIES = [0.75, 0.55, 0.35];

export interface CompressedImage {
  uri: string;
  width: number;
  height: number;
  size: number;
}

export const imageUriToDataUri = async (uri: string): Promise<string> => {
  if (!uri.trim()) {
    throw new Error('Se requiere la URI de una imagen para compartirla.');
  }

  if (uri.startsWith('data:image/')) return uri;

  const base64 = await new File(uri).base64();
  if (!base64) {
    throw new Error('No se pudo leer el contenido de la imagen seleccionada.');
  }

  return `data:image/jpeg;base64,${base64}`;
};

export const compressImage = async (uri: string): Promise<CompressedImage> => {
  if (!uri.trim()) {
    throw new Error('Se requiere la URI de una imagen para comprimirla.');
  }

  const image = ImageManipulator.manipulate(uri);
  const original = await image.renderAsync();
  const longestSide = Math.max(original.width, original.height);

  if (longestSide <= 0) {
    throw new Error('No se pudieron determinar las dimensiones de la imagen.');
  }

  const dimensionSteps = DIMENSION_STEPS.filter((step, index, steps) => {
    const dimension = Math.min(step, longestSide);
    return steps.findIndex((candidate) => Math.min(candidate, longestSide) === dimension) === index;
  });

  for (const maxDimension of dimensionSteps) {
    const resizeAction =
      original.width >= original.height
        ? { width: Math.min(maxDimension, original.width) }
        : { height: Math.min(maxDimension, original.height) };

    for (const compress of COMPRESSION_QUALITIES) {
      image.reset().resize(resizeAction);
      const result = await (await image.renderAsync()).saveAsync({
        compress,
        format: SaveFormat.JPEG,
      });
      const file = new File(result.uri);
      let keepResult = false;

      try {
        const info = file.info();
        if (!info.exists || typeof info.size !== 'number') {
          throw new Error('No se pudo verificar el tamaño de la imagen comprimida.');
        }

        if (info.size < MAX_IMAGE_SIZE_BYTES) {
          keepResult = true;
          return {
            uri: result.uri,
            width: result.width,
            height: result.height,
            size: info.size,
          };
        }
      } finally {
        if (!keepResult && file.exists) {
          file.delete();
        }
      }
    }
  }

  throw new Error('La imagen no pudo comprimirse a menos de 1.2 MB.');
};
