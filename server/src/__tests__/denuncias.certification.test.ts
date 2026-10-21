import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Request, Response } from 'express';
import {
  prisma,
  validarVeracidad,
  registrarCierreTecnico,
  certificarResolucionFinal,
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

describe('Módulo 004: Acreditación Atómica de Puntos, Cierre Técnico y Certificación Antes vs. Después', () => {
  let mockUsers: Record<string, any> = {};
  let mockDenuncias: Record<string, any> = {};

  beforeEach(() => {
    mockUsers = {
      'user-ciudadano-1': {
        id: 'user-ciudadano-1',
        nombre: 'Vecino Maria',
        email: 'vecino@mail.com',
        rol: 'CITIZEN',
        puntos: 100,
      },
      'agent-1': {
        id: 'agent-1',
        nombre: 'Inspector Gomez',
        rol: 'AGENT',
        disponible: true,
      },
    };

    mockDenuncias = {
      'den-verificado-alta': {
        id: 'den-verificado-alta',
        codigo: 'REP-2026-401',
        titulo: 'Microbasural constatado',
        estado: 'VERIFICADO_PENDIENTE',
        prioridad: 'ALTA', // Baremo ALTA: 200 a 300 pts
        ciudadanoId: 'user-ciudadano-1',
        agenteId: 'agent-1',
        puntosOtorgados: 0,
        fotoVerificacionUrl: 'https://cdn.ecoalerta.gob/foto-insitu-1.jpg',
        observacionesAdmin: 'Constatado en terreno',
      },
      'den-verificado-media': {
        id: 'den-verificado-media',
        codigo: 'REP-2026-402',
        titulo: 'Terreno con malezas',
        estado: 'VERIFICADO_PENDIENTE',
        prioridad: 'MEDIA', // Baremo MEDIA: 100 a 150 pts
        ciudadanoId: 'user-ciudadano-1',
        agenteId: 'agent-1',
        puntosOtorgados: 0,
        fotoVerificacionUrl: 'https://cdn.ecoalerta.gob/foto-insitu-2.jpg',
      },
      'den-ya-acreditada': {
        id: 'den-ya-acreditada',
        codigo: 'REP-2026-403',
        titulo: 'Basural que ya cobró puntos',
        estado: 'VERIFICADO_PENDIENTE',
        prioridad: 'ALTA',
        ciudadanoId: 'user-ciudadano-1',
        agenteId: 'agent-1',
        puntosOtorgados: 250, // Ya otorgados previamente
      },
      'den-en-saneamiento': {
        id: 'den-en-saneamiento',
        codigo: 'REP-2026-404',
        titulo: 'Saneamiento activo por cuadrilla',
        estado: 'EN_SANEAMIENTO',
        prioridad: 'ALTA',
        ciudadanoId: 'user-ciudadano-1',
        agenteId: 'agent-1',
        puntosOtorgados: 250,
      },
      'den-resuelto-tecnico': {
        id: 'den-resuelto-tecnico',
        codigo: 'REP-2026-405',
        titulo: 'Limpieza finalizada con informe',
        estado: 'RESUELTO_TECNICO',
        prioridad: 'ALTA',
        ciudadanoId: 'user-ciudadano-1',
        agenteId: 'agent-1',
        puntosOtorgados: 250,
        fotoSolucionUrl: 'https://cdn.ecoalerta.gob/foto-despues.jpg',
        informeSolucion: 'Se retiraron 3 camionadas de escombros y se desratizó.',
      },
    };

    // Mock Prisma User
    (prisma.user as any).findUnique = async ({ where }: any) => mockUsers[where.id] || null;
    (prisma.user as any).update = async ({ where, data }: any) => {
      const user = mockUsers[where.id];
      if (!user) throw new Error('Usuario no encontrado');
      if (data.puntos?.increment) {
        user.puntos = (user.puntos || 0) + data.puntos.increment;
      }
      return user;
    };

    // Mock Prisma Denuncia
    (prisma.denuncia as any).findUnique = async ({ where }: any) => {
      const d = mockDenuncias[where.id];
      if (!d) return null;
      return {
        ...d,
        ciudadano: mockUsers[d.ciudadanoId] || null,
        agente: mockUsers[d.agenteId] || null,
      };
    };

    (prisma.denuncia as any).findFirst = async () => null;

    (prisma.denuncia as any).update = async ({ where, data }: any) => {
      const actual = mockDenuncias[where.id];
      if (!actual) throw new Error('Denuncia no encontrada');
      const actualizado = { ...actual, ...data };
      mockDenuncias[where.id] = actualizado;
      return actualizado;
    };

    // Mock $transaction para array de operaciones o callback
    (prisma as any).$transaction = async (arg: any) => {
      if (Array.isArray(arg)) {
        return await Promise.all(arg);
      }
      return await arg(prisma);
    };
  });

  it('US1: Acredita puntos atómicamente respetando el baremo de prioridad ALTA (200-300 pts) y pasa a EN_SANEAMIENTO', async () => {
    const req = {
      params: { id: 'den-verificado-alta' },
      body: {
        decision: 'APROBAR_VERACIDAD',
        puntos: 250,
        observacionesAdmin: 'Verificado correctamente in situ.',
      },
    } as unknown as Request;

    const res = createMockResponse();
    await validarVeracidad(req, res as unknown as Response);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.puntosAcreditados, 250);
    assert.equal(res.body.data.estado, 'EN_SANEAMIENTO');
    assert.equal(res.body.data.puntosOtorgados, 250);

    // Saldo inicial era 100 + 250 = 350
    assert.equal(mockUsers['user-ciudadano-1'].puntos, 350);
  });

  it('US1: Rechaza asignación de puntos fuera del baremo oficial por prioridad', async () => {
    // Caso Prioridad ALTA (rango 200 a 300) intentando asignar 150 (por debajo)
    const reqBajo = {
      params: { id: 'den-verificado-alta' },
      body: {
        decision: 'APROBAR_VERACIDAD',
        puntos: 150,
      },
    } as unknown as Request;

    const resBajo = createMockResponse();
    await validarVeracidad(reqBajo, resBajo as unknown as Response);

    assert.equal(resBajo.statusCode, 400);
    assert.match(resBajo.body.message, /fuera de baremo/i);

    // Caso Prioridad ALTA intentando asignar 350 (por encima)
    const reqAlto = {
      params: { id: 'den-verificado-alta' },
      body: {
        decision: 'APROBAR_VERACIDAD',
        puntos: 350,
      },
    } as unknown as Request;

    const resAlto = createMockResponse();
    await validarVeracidad(reqAlto, resAlto as unknown as Response);

    assert.equal(resAlto.statusCode, 400);
    assert.match(resAlto.body.message, /fuera de baremo/i);
  });

  it('US1: Idempotencia - Bloquea e impide doble acreditación de puntos si el caso ya otorgó puntos', async () => {
    const reqDoble = {
      params: { id: 'den-ya-acreditada' },
      body: {
        decision: 'APROBAR_VERACIDAD',
        puntos: 250,
      },
    } as unknown as Request;

    const resDoble = createMockResponse();
    await validarVeracidad(reqDoble, resDoble as unknown as Response);

    assert.equal(resDoble.statusCode, 400);
    assert.match(resDoble.body.message, /ya tiene puntos acreditados/i);
  });

  it('US1: Rechazo por falsedad cierra caso con 0 puntos y libera agente', async () => {
    const reqRechazo = {
      params: { id: 'den-verificado-media' },
      body: {
        decision: 'RECHAZAR_FALSO',
        observacionesAdmin: 'Comprobado en fotos que era un predio privado cercado',
      },
    } as unknown as Request;

    const resRechazo = createMockResponse();
    await validarVeracidad(reqRechazo, resRechazo as unknown as Response);

    assert.equal(resRechazo.statusCode, 200);
    assert.equal(resRechazo.body.data.estado, 'RECHAZADO');
    assert.equal(resRechazo.body.data.puntosOtorgados, 0);
    assert.equal(resRechazo.body.data.agenteId, null);
  });

  it('US2: Exige fotografía obligatoria e informe técnico no menor a 10 caracteres para el cierre técnico', async () => {
    // 1. Sin foto -> 400
    const reqSinFoto = {
      params: { id: 'den-en-saneamiento' },
      body: {
        fotoSolucionUrl: '',
        informeSolucion: 'Limpieza completa de residuos.',
        agenteId: 'agent-1',
      },
    } as unknown as Request;

    const resSinFoto = createMockResponse();
    await registrarCierreTecnico(reqSinFoto, resSinFoto as unknown as Response);

    assert.equal(resSinFoto.statusCode, 400);
    assert.match(resSinFoto.body.message, /fotografía del "Después"/i);

    // 2. Informe muy corto -> 400
    const reqInformeCorto = {
      params: { id: 'den-en-saneamiento' },
      body: {
        fotoSolucionUrl: 'https://cdn.ecoalerta.gob/foto.jpg',
        informeSolucion: 'Listo',
        agenteId: 'agent-1',
      },
    } as unknown as Request;

    const resInformeCorto = createMockResponse();
    await registrarCierreTecnico(reqInformeCorto, resInformeCorto as unknown as Response);

    assert.equal(resInformeCorto.statusCode, 400);
    assert.match(resInformeCorto.body.message, /al menos 10 caracteres/i);

    // 3. Completo y válido -> pasa a RESUELTO_TECNICO
    const reqValido = {
      params: { id: 'den-en-saneamiento' },
      body: {
        fotoSolucionUrl: 'https://cdn.ecoalerta.gob/limpio-final.jpg',
        informeSolucion: 'Se recogieron residuos y se clausuró el vuelco clandestino.',
        agenteId: 'agent-1',
      },
    } as unknown as Request;

    const resValido = createMockResponse();
    await registrarCierreTecnico(reqValido, resValido as unknown as Response);

    assert.equal(resValido.statusCode, 200);
    assert.equal(resValido.body.data.estado, 'RESUELTO_TECNICO');
  });

  it('US3: Certificación final "Antes vs. Después" cierra definitivamente en RESUELTO con marca de tiempo', async () => {
    const reqCert = {
      params: { id: 'den-resuelto-tecnico' },
      body: {
        decision: 'CERTIFICAR',
        observacionesAdmin: 'Limpieza impecable y certificada según protocolo.',
      },
    } as unknown as Request;

    const resCert = createMockResponse();
    await certificarResolucionFinal(reqCert, resCert as unknown as Response);

    assert.equal(resCert.statusCode, 200);
    assert.equal(resCert.body.data.estado, 'RESUELTO');
    assert.ok(resCert.body.data.fechaResolucion);
  });

  it('US3: Observar saneamiento exige observaciones técnicas y regresa a EN_SANEAMIENTO sin descontar puntos', async () => {
    // 1. Sin observaciones -> 400
    const reqSinObs = {
      params: { id: 'den-resuelto-tecnico' },
      body: {
        decision: 'OBSERVAR_REHACER',
        observacionesAdmin: '',
      },
    } as unknown as Request;

    const resSinObs = createMockResponse();
    await certificarResolucionFinal(reqSinObs, resSinObs as unknown as Response);

    assert.equal(resSinObs.statusCode, 400);

    // 2. Con observaciones -> regresa a EN_SANEAMIENTO
    const reqConObs = {
      params: { id: 'den-resuelto-tecnico' },
      body: {
        decision: 'OBSERVAR_REHACER',
        observacionesAdmin: 'Restan neumáticos con agua en el fondo del lote, se requiere cuadrilla con pala.',
      },
    } as unknown as Request;

    const resConObs = createMockResponse();
    await certificarResolucionFinal(reqConObs, resConObs as unknown as Response);

    assert.equal(resConObs.statusCode, 200);
    assert.equal(resConObs.body.data.estado, 'EN_SANEAMIENTO');
    assert.equal(resConObs.body.data.puntosOtorgados, 250); // Puntos intactos
  });
});
