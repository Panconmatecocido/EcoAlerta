// Inicio de Fase 6 (Polish & QA): pruebas del límite de compresión y caché local.
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  compressImage,
  imageUriToDataUri,
  MAX_IMAGE_DIMENSION,
  MAX_IMAGE_SIZE_BYTES,
} from '../imageCompressor';
import { LocalReportRepository } from '../../repositories/reports/LocalReportRepository';
import { CreateReportDTO } from '../../repositories/reports/IReportRepository';

jest.mock('@react-native-async-storage/async-storage', () => {
  const values = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
      removeItem: jest.fn(async (key: string) => {
        values.delete(key);
      }),
      clear: jest.fn(async () => {
        values.clear();
      }),
    },
  };
});

jest.mock('expo-file-system', () => ({
  File: class {
    uri: string;
    exists = true;

    constructor(uri: string) {
      this.uri = uri;
    }

    info() {
      const sizes = (globalThis as typeof globalThis & { __imageFileSizes?: number[] })
        .__imageFileSizes;
      const size = sizes?.length ? sizes.shift() : 1_258_290;
      return { exists: true, size };
    }

    async base64() {
      return 'compressed-image-content';
    }

    delete() {}
  },
}));

jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: {
    manipulate: (uri: string) => {
      let resizeAction: { width?: number; height?: number } | undefined;
      const actions = (globalThis as typeof globalThis & { __resizeActions?: unknown[] })
        .__resizeActions;
      return {
        reset() {
          resizeAction = undefined;
          return this;
        },
        resize(action: { width?: number; height?: number }) {
          resizeAction = action;
          actions?.push(action);
          return this;
        },
        async renderAsync() {
          return {
            width: 2000,
            height: 1000,
            async saveAsync() {
              return {
                uri: `compressed:${uri}`,
                width: resizeAction?.width ?? 2000,
                height: resizeAction?.height ?? 1000,
              };
            },
          };
        },
      };
    },
  },
}));

const reportData: CreateReportDTO = {
  titulo: 'Microbasural en la plaza',
  descripcion: 'Residuos acumulados en la vereda.',
  categoria: 'Microbasural',
  direccion: 'Calle 1 y Calle 2',
  latitud: null,
  longitud: null,
  imagenUrl: 'file:///reporte.jpg',
  ciudadanoId: 'citizen-1',
  municipioId: 'municipality-1',
};

describe('compressImage', () => {
  beforeEach(() => {
    (globalThis as typeof globalThis & { __imageFileSizes?: number[] }).__imageFileSizes = [];
    (globalThis as typeof globalThis & { __resizeActions?: unknown[] }).__resizeActions = [];
  });

  it('redimensiona la imagen al máximo permitido y verifica el tamaño final', async () => {
    const image = await compressImage('file:///original.jpg');

    expect(image.uri).toBe('compressed:file:///original.jpg');
    expect(image.width).toBe(MAX_IMAGE_DIMENSION);
    expect(image.size).toBeLessThan(MAX_IMAGE_SIZE_BYTES);
    expect((globalThis as typeof globalThis & { __resizeActions: Array<{ width: number }> })
      .__resizeActions[0].width).toBe(MAX_IMAGE_DIMENSION);
  });

  it('reintenta con menor calidad cuando el primer resultado excede el límite', async () => {
    (globalThis as typeof globalThis & { __imageFileSizes: number[] }).__imageFileSizes = [
      MAX_IMAGE_SIZE_BYTES,
      900_000,
    ];

    const image = await compressImage('file:///large.jpg');

    expect(image.size).toBe(900_000);
    expect((globalThis as typeof globalThis & { __imageFileSizes: number[] })
      .__imageFileSizes).toHaveLength(0);
  });

  it('rechaza la imagen si nunca queda estrictamente por debajo de 1.2 MB', async () => {
    (globalThis as typeof globalThis & { __imageFileSizes: number[] }).__imageFileSizes =
      Array(20).fill(MAX_IMAGE_SIZE_BYTES);

    await expect(compressImage('file:///too-large.jpg')).rejects.toThrow(
      'La imagen no pudo comprimirse a menos de 1.2 MB.'
    );
    expect((globalThis as typeof globalThis & { __resizeActions: unknown[] })
      .__resizeActions).toHaveLength(15);
  });

  it('convierte la imagen comprimida en contenido compartible por otros dispositivos', async () => {
    await expect(imageUriToDataUri('file:///reporte.jpg')).resolves.toBe(
      'data:image/jpeg;base64,compressed-image-content'
    );
  });
});

describe('LocalReportRepository', () => {
  const repository = new LocalReportRepository();

  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('persiste reportes y devuelve solo los visibles del ciudadano indicado', async () => {
    const created = await repository.createReport(reportData);
    const otherCitizen = await repository.createReport({
      ...reportData,
      ciudadanoId: 'citizen-2',
    });

    const reports = await repository.getCitizenReports('citizen-1');

    expect(created.localOnly).toBe(true);
    expect(created.estado).toBe('PENDIENTE');
    expect(created.puntosOtorgados).toBe(0);
    expect(reports).toEqual([created]);
    expect(otherCitizen.ciudadanoId).not.toBe(reports[0].ciudadanoId);
  });

  it('oculta el reporte del historial sin eliminarlo del almacenamiento local', async () => {
    const created = await repository.createReport(reportData);

    const hidden = await repository.hideReportForCitizen(created.id, 'citizen-1');

    expect(hidden.ocultarUsuario).toBe(true);
    await expect(repository.getCitizenReports('citizen-1')).resolves.toEqual([]);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });
});
