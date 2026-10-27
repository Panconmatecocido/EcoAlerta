import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Request, Response } from 'express';
import {
  prisma,
  triajeDenuncia,
  getBolsaCasos,
  tomarCasoAtomico,
  verificarInSitu,
  liberarCaso,
} from '../controllers/denuncias.controller';

interface MockResponse {
  statusCode: number;
  body: any;
  status: (code: number) => Response;
  json: (payload: any) => Response;
}

const createMockResponse = (): MockResponse => {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.body = payload;
      return this;
    },
  };
  return res;
};

describe('Módulo 003: Triaje Admin, Toma 1 a 1, Verificación (3 Intentos) y Liberación', () => {
  let mockUsers: Record<string, any> = {};
  let mockDenuncias: Record<string, any> = {};

  beforeEach(() => {
    mockUsers = {
      'agent-1': { id: 'agent-1', nombre: 'Inspector Uno', rol: 'AGENT', disponible: true },
      'agent-2': { id: 'agent-2', nombre: 'Inspector Dos', rol: 'AGENT', disponible: true },
      'agent-off': { id: 'agent-off', nombre: 'Inspector Franco', rol: 'AGENT', disponible: false },
    };

    mockDenuncias = {
      'den-pendiente': {
        id: 'den-pendiente',
        codigo: 'REP-2026-001',
        titulo: 'Microbasural en esquina',
        estado: 'PENDIENTE',
        prioridad: 'MEDIA',
        agenteId: null,
        intentosInaccesible: 0,
        puntosOtorgados: 0,
        observacionesAdmin: null,
        creadoEn: new Date('2026-04-10T10:00:00Z'),
      },
      'den-baja': {
        id: 'den-baja',
        codigo: 'REP-2026-002',
        titulo: 'Ramas en vereda',
        estado: 'APROBADO',
        prioridad: 'BAJA',
        agenteId: null,
        intentosInaccesible: 0,
        puntosOtorgados: 0,
        observacionesAdmin: null,
        creadoEn: new Date('2026-04-10T08:00:00Z'),
      },
      'den-urgente': {
        id: 'den-urgente',
        codigo: 'REP-2026-003',
        titulo: 'Foco de Dengue frente a escuela',
        estado: 'APROBADO',
        prioridad: 'URGENTE',
        agenteId: null,
        intentosInaccesible: 0,
        puntosOtorgados: 0,
        observacionesAdmin: null,
        creadoEn: new Date('2026-04-10T09:00:00Z'),
      },
      'den-saneamiento': {
        id: 'den-saneamiento',
        codigo: 'REP-2026-004',
        titulo: 'Basural verificado en limpieza',
        estado: 'EN_SANEAMIENTO',
        prioridad: 'ALTA',
        agenteId: 'agent-2',
        intentosInaccesible: 0,
        puntosOtorgados: 250,
        observacionesAdmin: 'Verificado real',
        creadoEn: new Date('2026-04-09T12:00:00Z'),
      },
    };

    // Mock de métodos Prisma sobre la instancia exportada
    (prisma.user as any).findUnique = async ({ where }: any) => mockUsers[where.id] || null;

    (prisma.denuncia as any).findUnique = async ({ where }: any) =>
      mockDenuncias[where.id] || null;

    (prisma.denuncia as any).findFirst = async ({ where }: any) => {
      const lista = Object.values(mockDenuncias);
      return (
        lista.find(
          (d) =>
            d.agenteId === where.agenteId &&
            where.estado.in.includes(d.estado)
        ) || null
      );
    };

    (prisma.denuncia as any).findMany = async ({ where }: any) => {
      return Object.values(mockDenuncias).filter(
        (d) =>
          d.agenteId === where.agenteId &&
          where.estado.in.includes(d.estado)
      );
    };

    (prisma.denuncia as any).update = async ({ where, data }: any) => {
      const actual = mockDenuncias[where.id];
      const actualizado = { ...actual, ...data };
      mockDenuncias[where.id] = actualizado;
      return actualizado;
    };

    (prisma.denuncia as any).updateMany = async ({ where, data }: any) => {
      const actual = mockDenuncias[where.id];
      if (
        !actual ||
        actual.agenteId !== where.agenteId ||
        actual.estado !== where.estado
      ) {
        return { count: 0 };
      }
      mockDenuncias[where.id] = { ...actual, ...data };
      return { count: 1 };
    };

    (prisma as any).$transaction = async (fn: any) => {
      return await fn(prisma);
    };
  });

  it('US1: exige motivo obligatorio al rechazar en triaje y aprueba con prioridad hacia APROBADO', async () => {
    // 1. Intento de rechazo sin motivo -> 400
    const reqSinMotivo = {
      params: { id: 'den-pendiente' },
      body: { accion: 'RECHAZAR', observacionesAdmin: '   ' },
    } as unknown as Request;
    const resSinMotivo = createMockResponse();

    await triajeDenuncia(reqSinMotivo, resSinMotivo as unknown as Response);
    assert.equal(resSinMotivo.statusCode, 400);

    // 2. Aprobación con prioridad URGENTE -> 200 APROBADO
    const reqAprobar = {
      params: { id: 'den-pendiente' },
      body: { accion: 'APROBAR', prioridad: 'URGENTE', observacionesAdmin: 'Prioridad sanitaria' },
    } as unknown as Request;
    const resAprobar = createMockResponse();

    await triajeDenuncia(reqAprobar, resAprobar as unknown as Response);
    assert.equal(resAprobar.statusCode, 200);
    assert.equal(resAprobar.body.data.estado, 'APROBADO');
    assert.equal(resAprobar.body.data.prioridad, 'URGENTE');
  });

  it('US2: ordena la bolsa por prioridad (URGENTE primero) y aplica bloqueo atómico 1 a 1', async () => {
    // 1. Consultar bolsa ordenada
    const reqBolsa = { query: {} } as unknown as Request;
    const resBolsa = createMockResponse();
    await getBolsaCasos(reqBolsa, resBolsa as unknown as Response);

    assert.equal(resBolsa.statusCode, 200);
    assert.equal(resBolsa.body.data[0].id, 'den-urgente');
    assert.equal(resBolsa.body.data[1].id, 'den-baja');

    // 2. Agente 1 toma el caso urgente -> pasa a EN_VERIFICACION
    const reqTomar1 = {
      params: { id: 'den-urgente' },
      body: { agenteId: 'agent-1' },
    } as unknown as Request;
    const resTomar1 = createMockResponse();
    await tomarCasoAtomico(reqTomar1, resTomar1 as unknown as Response);

    assert.equal(resTomar1.statusCode, 200);
    assert.equal(resTomar1.body.data.estado, 'EN_VERIFICACION');
    assert.equal(resTomar1.body.data.agenteId, 'agent-1');

    // 3. Agente 1 intenta tomar un segundo caso en paralelo -> 409 Conflict
    const reqSegundoCaso = {
      params: { id: 'den-baja' },
      body: { agenteId: 'agent-1' },
    } as unknown as Request;
    const resSegundoCaso = createMockResponse();
    await tomarCasoAtomico(reqSegundoCaso, resSegundoCaso as unknown as Response);

    assert.equal(resSegundoCaso.statusCode, 409);

    // 4. Otro agente intenta tomar el caso que ya tomó el Agente 1 -> 409 Conflict
    mockDenuncias['den-saneamiento'].agenteId = null; // liberar agent-2 para probar colisión
    const reqColision = {
      params: { id: 'den-urgente' },
      body: { agenteId: 'agent-2' },
    } as unknown as Request;
    const resColision = createMockResponse();
    await tomarCasoAtomico(reqColision, resColision as unknown as Response);

    assert.equal(resColision.statusCode, 409);
  });

  it('US3: aplica protocolo de 3 intentos por inaccesibilidad pasando automáticamente a CERRADO_INACCESIBLE', async () => {
    mockDenuncias['den-urgente'].agenteId = 'agent-1';
    mockDenuncias['den-urgente'].estado = 'EN_VERIFICACION';

    // Intento 1 de 3
    const res1 = createMockResponse();
    await verificarInSitu(
      {
        params: { id: 'den-urgente' },
        body: { resultado: 'INACCESIBLE', fotoVerificacionUrl: 'https://img/aviso1.jpg' },
      } as unknown as Request,
      res1 as unknown as Response
    );
    assert.equal(res1.body.data.intentosInaccesible, 1);
    assert.equal(res1.body.data.estado, 'EN_VERIFICACION');

    // Intento 2 de 3
    const res2 = createMockResponse();
    await verificarInSitu(
      {
        params: { id: 'den-urgente' },
        body: { resultado: 'INACCESIBLE', fotoVerificacionUrl: 'https://img/aviso2.jpg' },
      } as unknown as Request,
      res2 as unknown as Response
    );
    assert.equal(res2.body.data.intentosInaccesible, 2);
    assert.equal(res2.body.data.estado, 'EN_VERIFICACION');

    // Intento 3 de 3 -> Transición automática a CERRADO_INACCESIBLE y agenteId = null
    const res3 = createMockResponse();
    await verificarInSitu(
      {
        params: { id: 'den-urgente' },
        body: { resultado: 'INACCESIBLE', fotoVerificacionUrl: 'https://img/aviso3.jpg' },
      } as unknown as Request,
      res3 as unknown as Response
    );
    assert.equal(res3.body.data.intentosInaccesible, 3);
    assert.equal(res3.body.data.estado, 'CERRADO_INACCESIBLE');
    assert.equal(res3.body.data.agenteId, null);
  });

  it('US4: al liberar un caso devuelve a APROBADO si no fue verificado, o mantiene EN_SANEAMIENTO si ya fue validado', async () => {
    // 1. Caso en EN_VERIFICACION -> vuelve a APROBADO
    mockDenuncias['den-urgente'].agenteId = 'agent-1';
    mockDenuncias['den-urgente'].estado = 'EN_VERIFICACION';

    const resLib1 = createMockResponse();
    await liberarCaso(
      { params: { id: 'den-urgente' }, body: { motivo: 'Fin de turno' } } as unknown as Request,
      resLib1 as unknown as Response
    );
    assert.equal(resLib1.statusCode, 200);
    assert.equal(resLib1.body.data.estado, 'APROBADO');
    assert.equal(resLib1.body.data.agenteId, null);

    // 2. Caso en EN_SANEAMIENTO -> conserva EN_SANEAMIENTO y limpia agenteId
    const resLib2 = createMockResponse();
    await liberarCaso(
      {
        params: { id: 'den-saneamiento' },
        body: { motivo: 'Desperfecto de camión recolector' },
      } as unknown as Request,
      resLib2 as unknown as Response
    );
    assert.equal(resLib2.statusCode, 200);
    assert.equal(resLib2.body.data.estado, 'EN_SANEAMIENTO');
    assert.equal(resLib2.body.data.agenteId, null);
  });
});
