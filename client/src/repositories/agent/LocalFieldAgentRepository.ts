import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CasoCampo,
  DatosVerificacionInSitu,
  IFieldAgentRepository,
  RespuestaBolsaCasos,
} from './IFieldAgentRepository';
import { PrioridadCaso } from '../../components/agent/PrioritySemaphoreBadge';

const STORAGE_KEY_CASOS_AGENTE = '@ecoalerta_field_cases_v1';

const PESO_PRIORIDAD: Record<PrioridadCaso, number> = {
  URGENTE: 4,
  ALTA: 3,
  MEDIA: 2,
  BAJA: 1,
};

const CASOS_INICIALES_SEMILLA: CasoCampo[] = [
  {
    id: 'insp-001',
    codigo: 'REP-2026-891',
    titulo: 'Foco de Dengue y Agua Estancada en Neumáticos',
    descripcion: 'Acumulación crítica de neumáticos con agua de lluvia frente a centro de salud.',
    categoria: 'Foco de Dengue',
    prioridad: 'URGENTE',
    estado: 'APROBADO',
    direccion: 'Av. De Mayo 1420, Pilar',
    latitud: -34.4587,
    longitud: -58.9142,
    distanciaKm: 0.8,
    intentosInaccesible: 0,
    puntosOtorgados: 0,
    agenteId: null,
    creadoEn: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'insp-002',
    codigo: 'REP-2026-895',
    titulo: 'Microbasural Clandestino en Esquina',
    descripcion: 'Bolsas rotas, escombros y residuos domiciliarios obstruyendo la vereda.',
    categoria: 'Microbasural',
    prioridad: 'ALTA',
    estado: 'APROBADO',
    direccion: 'Calle 12 y Ruta 25, Pilar',
    latitud: -34.4621,
    longitud: -58.9085,
    distanciaKm: 1.9,
    intentosInaccesible: 1,
    observacionesAdmin: 'Intento 1/3 registrado previamente: portón lateral con candado.',
    puntosOtorgados: 0,
    agenteId: null,
    creadoEn: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'insp-003',
    codigo: 'REP-2026-880',
    titulo: 'Terreno Baldío con Pastizales Altos',
    descripcion: 'Predio sin desmalezar con presencia de roedores reportado por vecinos.',
    categoria: 'Terreno Baldío',
    prioridad: 'MEDIA',
    estado: 'EN_SANEAMIENTO',
    direccion: 'Barrio El Roble - Lote 14, Derqui',
    latitud: -34.4812,
    longitud: -58.8421,
    distanciaKm: 3.4,
    intentosInaccesible: 0,
    puntosOtorgados: 120,
    observacionesAdmin: 'Veracidad ya validada por Admin (liberado en etapa de saneamiento).',
    agenteId: null,
    creadoEn: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'insp-004',
    codigo: 'REP-2026-872',
    titulo: 'Ramas y Restos de Poda en Vía Pública',
    descripcion: 'Montículo de ramas secas sobre el cordón.',
    categoria: 'Otro',
    prioridad: 'BAJA',
    estado: 'APROBADO',
    direccion: 'San Martín 640, Pilar',
    latitud: -34.4551,
    longitud: -58.9188,
    distanciaKm: 4.1,
    intentosInaccesible: 0,
    puntosOtorgados: 0,
    agenteId: null,
    creadoEn: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
];

export class LocalFieldAgentRepository implements IFieldAgentRepository {
  private async cargarCasos(): Promise<CasoCampo[]> {
    try {
      const guardado = await AsyncStorage.getItem(STORAGE_KEY_CASOS_AGENTE);
      if (guardado) {
        return JSON.parse(guardado) as CasoCampo[];
      }
      await AsyncStorage.setItem(STORAGE_KEY_CASOS_AGENTE, JSON.stringify(CASOS_INICIALES_SEMILLA));
      return [...CASOS_INICIALES_SEMILLA];
    } catch {
      return [...CASOS_INICIALES_SEMILLA];
    }
  }

  private async guardarCasos(casos: CasoCampo[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_CASOS_AGENTE, JSON.stringify(casos));
    } catch {
      // Ignorar fallo de almacenamiento en memoria efímera
    }
  }

  async getBolsaYCasoActivo(agenteId: string, _municipioId?: string): Promise<RespuestaBolsaCasos> {
    const casos = await this.cargarCasos();

    const casoActivo =
      casos.find(
        (c) =>
          c.agenteId === agenteId &&
          ['EN_VERIFICACION', 'EN_SANEAMIENTO', 'EN_PROCESO'].includes(c.estado)
      ) || null;

    const bolsa = casos
      .filter(
        (c) =>
          !c.agenteId &&
          ['APROBADO', 'EN_SANEAMIENTO'].includes(c.estado)
      )
      .sort((a, b) => {
        const diff = PESO_PRIORIDAD[b.prioridad] - PESO_PRIORIDAD[a.prioridad];
        if (diff !== 0) return diff;
        return new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime();
      });

    return { bolsa, casoActivo };
  }

  async getBolsaCasos(_municipioId?: string): Promise<CasoCampo[]> {
    const { bolsa } = await this.getBolsaYCasoActivo('');
    return bolsa;
  }

  async getMiCasoActivo(agenteId: string): Promise<CasoCampo | null> {
    const { casoActivo } = await this.getBolsaYCasoActivo(agenteId);
    return casoActivo;
  }

  async tomarCaso(casoId: string, agenteId: string): Promise<{ caso: CasoCampo; message: string }> {
    const casos = await this.cargarCasos();

    const yaTieneActivo = casos.find(
      (c) =>
        c.agenteId === agenteId &&
        ['EN_VERIFICACION', 'EN_SANEAMIENTO', 'EN_PROCESO'].includes(c.estado)
    );

    if (yaTieneActivo) {
      throw new Error(
        `Ya posees un caso activo asignado (${yaTieneActivo.codigo}). Debes finalizarlo o liberarlo antes de tomar otro.`
      );
    }

    const idx = casos.findIndex((c) => c.id === casoId);
    if (idx === -1) {
      throw new Error('El caso solicitado no existe.');
    }

    const objetivo = casos[idx];
    if (objetivo.agenteId || !['APROBADO', 'EN_SANEAMIENTO'].includes(objetivo.estado)) {
      throw new Error('Este caso ya fue tomado por otro agente de campo.');
    }

    const nuevoEstado =
      objetivo.estado === 'EN_SANEAMIENTO' ? 'EN_SANEAMIENTO' : 'EN_VERIFICACION';

    const actualizado: CasoCampo = {
      ...objetivo,
      agenteId,
      estado: nuevoEstado,
    };

    casos[idx] = actualizado;
    await this.guardarCasos(casos);

    return {
      caso: actualizado,
      message:
        nuevoEstado === 'EN_SANEAMIENTO'
          ? 'Caso tomado en etapa de Saneamiento (verificación previa ya validada).'
          : 'Caso asignado en exclusividad (Bloqueo 1 a 1 activo).',
    };
  }

  async enviarVerificacion(
    casoId: string,
    _agenteId: string,
    datos: DatosVerificacionInSitu
  ): Promise<{ caso: CasoCampo; message: string }> {
    const casos = await this.cargarCasos();
    const idx = casos.findIndex((c) => c.id === casoId);
    if (idx === -1) {
      throw new Error('Caso no encontrado');
    }

    const actual = casos[idx];
    let actualizado: CasoCampo;
    let message = '';

    if (datos.resultado === 'REAL') {
      actualizado = {
        ...actual,
        estado: 'VERIFICADO_PENDIENTE',
        fotoVerificacionUrl: datos.fotoVerificacionUrl,
        observacionesAdmin: datos.observaciones || actual.observacionesAdmin,
      };
      message =
        'Verificación enviada (VERIFICADO_PENDIENTE). El Administrador validará la veracidad para acreditar los puntos.';
    } else if (datos.resultado === 'FALSO') {
      actualizado = {
        ...actual,
        estado: 'RECHAZADO',
        fotoVerificacionUrl: datos.fotoVerificacionUrl,
        puntosOtorgados: 0,
        agenteId: null,
        observacionesAdmin:
          datos.observaciones || 'Falso reporte constatado en terreno por el Agente.',
      };
      message =
        'Reporte cerrado como Falso en Terreno (0 puntos). Quedas libre para tomar otro caso.';
    } else {
      const nuevosIntentos = (actual.intentosInaccesible || 0) + 1;
      const tercerIntento = nuevosIntentos >= 3;
      actualizado = {
        ...actual,
        intentosInaccesible: nuevosIntentos,
        fotoVerificacionUrl: datos.fotoVerificacionUrl,
        estado: tercerIntento ? 'CERRADO_INACCESIBLE' : 'EN_VERIFICACION',
        agenteId: tercerIntento ? null : actual.agenteId,
        observacionesAdmin:
          datos.observaciones ||
          (tercerIntento
            ? 'Cerrado automáticamente al 3.er intento fallido por inaccesibilidad.'
            : `Visita ${nuevosIntentos}/3: Lugar inaccesible (aviso en puerta).`),
      };
      message = tercerIntento
        ? 'Se cumplió el 3.er intento fallido: el caso pasó automáticamente a CERRADO_INACCESIBLE y quedas liberado.'
        : `Intento ${nuevosIntentos} de 3 registrado con foto de aviso municipal.`;
    }

    casos[idx] = actualizado;
    await this.guardarCasos(casos);

    return { caso: actualizado, message };
  }

  async liberarCaso(casoId: string, motivo?: string): Promise<{ caso: CasoCampo; message: string }> {
    const casos = await this.cargarCasos();
    const idx = casos.findIndex((c) => c.id === casoId);
    if (idx === -1) {
      throw new Error('Caso no encontrado');
    }

    const actual = casos[idx];
    const conservarSaneamiento =
      actual.estado === 'EN_SANEAMIENTO' || (actual.puntosOtorgados ?? 0) > 0;
    const estadoRetorno = conservarSaneamiento ? 'EN_SANEAMIENTO' : 'APROBADO';

    const actualizado: CasoCampo = {
      ...actual,
      agenteId: null,
      estado: estadoRetorno,
      observacionesAdmin: motivo
        ? `${actual.observacionesAdmin ? actual.observacionesAdmin + ' | ' : ''}Liberado: ${motivo}`
        : actual.observacionesAdmin,
    };

    casos[idx] = actualizado;
    await this.guardarCasos(casos);

    return {
      caso: actualizado,
      message: conservarSaneamiento
        ? 'Caso devuelto a la bolsa conservando el estado EN_SANEAMIENTO.'
        : 'Caso liberado y devuelto a la bolsa general en estado APROBADO.',
    };
  }
}
