import { createHmac } from 'node:crypto';
import express from 'express';
import request from 'supertest';
import { EstadoDenuncia, Prioridad, Role } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');
  const mockPrisma = {
    denuncia: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  mockPrisma.$transaction.mockImplementation(
    async (operation: (transaction: typeof mockPrisma) => unknown) => operation(mockPrisma)
  );
  return {
    ...actual,
    PrismaClient: jest.fn(() => mockPrisma),
    __mockPrisma: mockPrisma,
  };
});

const prisma = (
  jest.requireMock('@prisma/client') as {
    __mockPrisma: {
      denuncia: { findFirst: jest.Mock; updateMany: jest.Mock; count: jest.Mock };
      user: { findUnique: jest.Mock; findFirst: jest.Mock; count: jest.Mock };
      $transaction: jest.Mock;
    };
  }
).__mockPrisma;

const tokenSecret = 'test-only-auth-token-secret-with-more-than-32-characters';
const admin = { id: 'admin-1', rol: Role.ADMIN, municipioId: 'municipality-1' };
const approvedReport = {
  id: 'report-1',
  estado: EstadoDenuncia.APROBADO,
  agenteId: null,
  municipioId: admin.municipioId,
  latitud: -34.46,
  longitud: -58.91,
};
const eligibleAgent = {
  id: 'agent-1',
  rol: Role.AGENT,
  municipioId: admin.municipioId,
  disponible: true,
  latitudActual: -34.46,
  longitudActual: -58.91,
  ubicacionActualizadaEn: new Date('2026-10-21T11:00:00.000Z'),
};

function createToken(sub: string): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({
    sub,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60,
  });
  const unsignedToken = `${header}.${payload}`;
  const signature = createHmac('sha256', tokenSecret)
    .update(unsignedToken)
    .digest('base64url');
  return `${unsignedToken}.${signature}`;
}

function createApp() {
  process.env.AUTH_TOKEN_SECRET = tokenSecret;
  const routes = require('../routes/denuncias.routes').default as express.Router;
  const app = express();
  app.use(express.json());
  app.use('/api/denuncias', routes);
  return app;
}

describe('PATCH /api/denuncias/:id/asignar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      async (operation: (transaction: typeof prisma) => unknown) => operation(prisma)
    );
    prisma.user.findUnique.mockResolvedValue(admin);
    prisma.denuncia.findFirst.mockImplementation(async (args: { include?: unknown }) =>
      args.include
        ? {
            ...approvedReport,
            agenteId: eligibleAgent.id,
            estado: EstadoDenuncia.EN_VERIFICACION,
            agente: { id: eligibleAgent.id, nombre: 'Agente Uno' },
          }
        : approvedReport
    );
    prisma.user.findFirst.mockResolvedValue(eligibleAgent);
    prisma.denuncia.count.mockResolvedValue(0);
    prisma.denuncia.updateMany.mockResolvedValue({ count: 1 });
  });

  it('assigns an eligible agent only after report approval and moves the report to verification', async () => {
    const response = await request(createApp())
      .patch('/api/denuncias/report-1/asignar')
      .set('Authorization', `Bearer ${createToken(admin.id)}`)
      .send({ agenteId: eligibleAgent.id })
      .expect(200);

    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      { isolationLevel: 'Serializable' }
    );
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        id: eligibleAgent.id,
        municipioId: admin.municipioId,
        rol: Role.AGENT,
      },
      select: {
        id: true,
        municipioId: true,
        disponible: true,
        latitudActual: true,
        longitudActual: true,
        ubicacionActualizadaEn: true,
      },
    });
    expect(prisma.denuncia.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'report-1',
        municipioId: admin.municipioId,
        estado: EstadoDenuncia.APROBADO,
        agenteId: null,
      },
      data: { agenteId: eligibleAgent.id, estado: EstadoDenuncia.EN_VERIFICACION },
    });
    expect(response.body.data).toMatchObject({
      id: 'report-1',
      agenteId: eligibleAgent.id,
      estado: EstadoDenuncia.EN_VERIFICACION,
    });
  });

  it('rejects assigning a report that has not completed triage', async () => {
    prisma.denuncia.findFirst.mockResolvedValue({
      ...approvedReport,
      estado: EstadoDenuncia.PENDIENTE,
    });

    await request(createApp())
      .patch('/api/denuncias/report-1/asignar')
      .set('Authorization', `Bearer ${createToken(admin.id)}`)
      .send({ agenteId: eligibleAgent.id })
      .expect(409);

    expect(prisma.denuncia.updateMany).not.toHaveBeenCalled();
  });

  it('rejects a report without location or an agent without current GPS', async () => {
    prisma.denuncia.findFirst.mockResolvedValueOnce({
      ...approvedReport,
      latitud: null,
      longitud: null,
    });
    await request(createApp())
      .patch('/api/denuncias/report-1/asignar')
      .set('Authorization', `Bearer ${createToken(admin.id)}`)
      .send({ agenteId: eligibleAgent.id })
      .expect(409);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();

    prisma.user.findFirst.mockResolvedValueOnce({
      ...eligibleAgent,
      ubicacionActualizadaEn: null,
    });
    await request(createApp())
      .patch('/api/denuncias/report-1/asignar')
      .set('Authorization', `Bearer ${createToken(admin.id)}`)
      .send({ agenteId: eligibleAgent.id })
      .expect(409);
    expect(prisma.denuncia.updateMany).not.toHaveBeenCalled();
  });

  it('rejects an agent from another municipality or an agent with an active case', async () => {
    prisma.user.findFirst.mockResolvedValueOnce({
      ...eligibleAgent,
      municipioId: 'municipality-2',
    });
    await request(createApp())
      .patch('/api/denuncias/report-1/asignar')
      .set('Authorization', `Bearer ${createToken(admin.id)}`)
      .send({ agenteId: eligibleAgent.id })
      .expect(404);

    prisma.user.findFirst.mockResolvedValueOnce(eligibleAgent);
    prisma.denuncia.count.mockResolvedValueOnce(1);
    await request(createApp())
      .patch('/api/denuncias/report-1/asignar')
      .set('Authorization', `Bearer ${createToken(admin.id)}`)
      .send({ agenteId: eligibleAgent.id })
      .expect(409);
  });

  it('allows only one concurrent assignment of the same report', async () => {
    const transactionFindReport = jest.fn().mockResolvedValue(approvedReport);
    const transactionFindAgent = jest.fn().mockResolvedValue(eligibleAgent);
    const transactionCount = jest.fn().mockResolvedValue(0);
    const transactionUpdate = jest
      .fn()
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    let transactionCalls = 0;
    prisma.$transaction.mockImplementation(
      async (operation: (transaction: typeof prisma) => unknown) => {
        transactionCalls += 1;
        const tx = {
          denuncia: {
            findFirst: transactionFindReport,
            updateMany: transactionUpdate,
            count: transactionCount,
          },
          user: { findFirst: transactionFindAgent, count: transactionCount },
        };
        return operation(tx as unknown as typeof prisma);
      }
    );

    const app = createApp();
    const token = `Bearer ${createToken(admin.id)}`;
    const responses = await Promise.all([
      request(app)
        .patch('/api/denuncias/report-1/asignar')
        .set('Authorization', token)
        .send({ agenteId: eligibleAgent.id }),
      request(app)
        .patch('/api/denuncias/report-1/asignar')
        .set('Authorization', token)
        .send({ agenteId: eligibleAgent.id }),
    ]);

    expect(transactionCalls).toBe(2);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    expect(transactionUpdate).toHaveBeenCalledTimes(2);
  });
});

describe('PATCH /api/denuncias/:id/triaje', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      async (operation: (transaction: typeof prisma) => unknown) => operation(prisma)
    );
  });

  it('approves a pending report with the requested priority', async () => {
    prisma.denuncia.updateMany.mockResolvedValue({ count: 1 });
    prisma.denuncia.findFirst.mockResolvedValueOnce({
      id: 'report-1',
      estado: EstadoDenuncia.APROBADO,
      prioridad: Prioridad.URGENTE,
    });

    const response = await request(createApp())
      .patch('/api/denuncias/report-1/triaje')
      .set('Authorization', `Bearer ${createToken(admin.id)}`)
      .send({ accion: 'APROBAR', prioridad: Prioridad.URGENTE })
      .expect(200);

    expect(response.body.data).toMatchObject({
      estado: EstadoDenuncia.APROBADO,
      prioridad: Prioridad.URGENTE,
    });
  });

  it('requires a reason to reject and records zero citizen points', async () => {
    prisma.denuncia.updateMany.mockResolvedValue({ count: 1 });
    prisma.denuncia.findFirst.mockResolvedValueOnce({
      id: 'report-1',
      estado: EstadoDenuncia.RECHAZADO,
      observacionesAdmin: 'Reporte duplicado',
      puntosOtorgados: 0,
    });

    await request(createApp())
      .patch('/api/denuncias/report-1/triaje')
      .set('Authorization', `Bearer ${createToken(admin.id)}`)
      .send({ accion: 'RECHAZAR', observacionesAdmin: '   ' })
      .expect(400);

    const response = await request(createApp())
      .patch('/api/denuncias/report-1/triaje')
      .set('Authorization', `Bearer ${createToken(admin.id)}`)
      .send({ accion: 'RECHAZAR', observacionesAdmin: 'Reporte duplicado' })
      .expect(200);

    expect(response.body.data).toMatchObject({
      estado: EstadoDenuncia.RECHAZADO,
      observacionesAdmin: 'Reporte duplicado',
      puntosOtorgados: 0,
    });
  });
});
