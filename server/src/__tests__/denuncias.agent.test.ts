import { createHmac } from 'node:crypto';
import express from 'express';
import request from 'supertest';
import { EstadoDenuncia, Prioridad, Role } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');
  const mockPrisma = {
    denuncia: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
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
      denuncia: {
        findMany: jest.Mock;
        findFirst: jest.Mock;
        updateMany: jest.Mock;
        count: jest.Mock;
      };
      user: { findUnique: jest.Mock; findFirst: jest.Mock };
      $transaction: jest.Mock;
    };
  }
).__mockPrisma;

const tokenSecret = 'test-only-auth-token-secret-with-more-than-32-characters';
const agent = {
  id: 'agent-1',
  rol: Role.AGENT,
  municipioId: 'municipality-1',
};
const admin = {
  id: 'admin-1',
  rol: Role.ADMIN,
  municipioId: 'municipality-1',
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

describe('field agent report lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      async (operation: (transaction: typeof prisma) => unknown) => operation(prisma)
    );
    prisma.user.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) =>
      where.id === admin.id ? admin : agent
    );
    prisma.user.findFirst.mockResolvedValue({ id: agent.id });
    prisma.denuncia.count.mockResolvedValue(0);
    prisma.denuncia.updateMany.mockResolvedValue({ count: 1 });
    prisma.denuncia.findFirst.mockResolvedValue({
      id: 'report-1',
      estado: EstadoDenuncia.APROBADO,
      agenteId: null,
    });
  });

  it('returns the municipality field-agent case bag in priority then age order', async () => {
    prisma.denuncia.findMany.mockResolvedValue([
      { id: 'low', prioridad: Prioridad.BAJA, creadoEn: new Date('2026-01-01') },
      { id: 'urgent-old', prioridad: Prioridad.URGENTE, creadoEn: new Date('2026-01-01') },
      { id: 'urgent-new', prioridad: Prioridad.URGENTE, creadoEn: new Date('2026-02-01') },
    ]);

    const response = await request(createApp())
      .get('/api/denuncias/bolsa')
      .set('Authorization', `Bearer ${createToken(agent.id)}`)
      .expect(200);

    expect(prisma.denuncia.findMany).toHaveBeenCalledWith({
      where: {
        municipioId: agent.municipioId,
        agenteId: null,
        estado: { in: [EstadoDenuncia.APROBADO, EstadoDenuncia.EN_SANEAMIENTO] },
      },
      orderBy: { creadoEn: 'asc' },
    });
    expect(response.body.data.map((report: { id: string }) => report.id)).toEqual([
      'urgent-old',
      'urgent-new',
      'low',
    ]);
  });

  it('rejects taking a case when the agent already owns an active case', async () => {
    prisma.denuncia.count.mockResolvedValue(1);

    await request(createApp())
      .patch('/api/denuncias/report-1/tomar')
      .set('Authorization', `Bearer ${createToken(agent.id)}`)
      .expect(409);

    expect(prisma.denuncia.updateMany).not.toHaveBeenCalled();
  });

  it('serializes concurrent attempts by the same agent to take different cases', async () => {
    prisma.denuncia.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);

    const app = createApp();
    const token = `Bearer ${createToken(agent.id)}`;
    const responses = await Promise.all([
      request(app)
        .patch('/api/denuncias/report-1/tomar')
        .set('Authorization', token),
      request(app)
        .patch('/api/denuncias/report-2/tomar')
        .set('Authorization', token),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      { isolationLevel: 'Serializable' }
    );
    expect(prisma.denuncia.updateMany).toHaveBeenCalledTimes(1);
  });

  it('keeps a released cleanup case in EN_SANEAMIENTO when another agent takes it', async () => {
    prisma.denuncia.findFirst
      .mockResolvedValueOnce({
        id: 'cleanup-report',
        estado: EstadoDenuncia.EN_SANEAMIENTO,
        agenteId: null,
      })
      .mockResolvedValueOnce({
        id: 'cleanup-report',
        estado: EstadoDenuncia.EN_SANEAMIENTO,
        agenteId: agent.id,
      });

    const response = await request(createApp())
      .patch('/api/denuncias/cleanup-report/tomar')
      .set('Authorization', `Bearer ${createToken(agent.id)}`)
      .expect(200);

    expect(prisma.denuncia.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'cleanup-report',
        municipioId: agent.municipioId,
        agenteId: null,
        estado: EstadoDenuncia.EN_SANEAMIENTO,
      },
      data: { agenteId: agent.id, estado: EstadoDenuncia.EN_SANEAMIENTO },
    });
    expect(response.body.data.estado).toBe(EstadoDenuncia.EN_SANEAMIENTO);
  });

  it('closes an inaccessible report on the third attempt and releases the agent', async () => {
    prisma.denuncia.findFirst
      .mockResolvedValueOnce({ id: 'report-1', intentosInaccesible: 2 })
      .mockResolvedValueOnce({
        id: 'report-1',
        estado: EstadoDenuncia.CERRADO_INACCESIBLE,
        intentosInaccesible: 3,
        agenteId: null,
      });

    const response = await request(createApp())
      .patch('/api/denuncias/report-1/verificar')
      .set('Authorization', `Bearer ${createToken(agent.id)}`)
      .send({ resultado: 'INACCESIBLE', fotoVerificacionUrl: 'https://example.test/photo.jpg' })
      .expect(200);

    expect(prisma.denuncia.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'report-1',
        municipioId: agent.municipioId,
        agenteId: agent.id,
        estado: EstadoDenuncia.EN_VERIFICACION,
        intentosInaccesible: 2,
      },
      data: {
        intentosInaccesible: 3,
        fotoVerificacionUrl: 'https://example.test/photo.jpg',
        estado: EstadoDenuncia.CERRADO_INACCESIBLE,
        agenteId: null,
      },
    });
    expect(response.body).toMatchObject({
      success: true,
      message: 'Caso cerrado tras el tercer intento inaccesible',
      data: {
        estado: EstadoDenuncia.CERRADO_INACCESIBLE,
        intentosInaccesible: 3,
        agenteId: null,
      },
    });
  });

  it('records a real verification without releasing the agent or granting points early', async () => {
    prisma.denuncia.findFirst
      .mockResolvedValueOnce({ id: 'report-1', intentosInaccesible: 0 })
      .mockResolvedValueOnce({
        id: 'report-1',
        estado: EstadoDenuncia.VERIFICADO_PENDIENTE,
        agenteId: agent.id,
        puntosOtorgados: 0,
      });

    const response = await request(createApp())
      .patch('/api/denuncias/report-1/verificar')
      .set('Authorization', `Bearer ${createToken(agent.id)}`)
      .send({ resultado: 'REAL', fotoVerificacionUrl: 'https://example.test/real.jpg' })
      .expect(200);

    expect(prisma.denuncia.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'report-1',
        municipioId: agent.municipioId,
        agenteId: agent.id,
        estado: EstadoDenuncia.EN_VERIFICACION,
      },
      data: {
        estado: EstadoDenuncia.VERIFICADO_PENDIENTE,
        fotoVerificacionUrl: 'https://example.test/real.jpg',
        fechaVerificacion: expect.any(Date),
      },
    });
    expect(response.body.data).toMatchObject({
      estado: EstadoDenuncia.VERIFICADO_PENDIENTE,
      agenteId: agent.id,
      puntosOtorgados: 0,
    });
  });

  it('rejects a false field report, awards zero points, and releases the agent', async () => {
    prisma.denuncia.findFirst
      .mockResolvedValueOnce({ id: 'report-1', intentosInaccesible: 0 })
      .mockResolvedValueOnce({
        id: 'report-1',
        estado: EstadoDenuncia.RECHAZADO,
        observacionesAdmin: 'Falso reporte verificado en terreno',
        agenteId: null,
        puntosOtorgados: 0,
      });

    const response = await request(createApp())
      .patch('/api/denuncias/report-1/verificar')
      .set('Authorization', `Bearer ${createToken(agent.id)}`)
      .send({ resultado: 'FALSO', fotoVerificacionUrl: 'https://example.test/false.jpg' })
      .expect(200);

    expect(prisma.denuncia.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'report-1',
        municipioId: agent.municipioId,
        agenteId: agent.id,
        estado: EstadoDenuncia.EN_VERIFICACION,
      },
      data: {
        estado: EstadoDenuncia.RECHAZADO,
        fotoVerificacionUrl: 'https://example.test/false.jpg',
        observacionesAdmin: 'Falso reporte verificado en terreno',
        puntosOtorgados: 0,
        agenteId: null,
      },
    });
    expect(response.body.data.agenteId).toBeNull();
  });

  it('requires verification evidence and lets only the assigned agent verify', async () => {
    await request(createApp())
      .patch('/api/denuncias/report-1/verificar')
      .set('Authorization', `Bearer ${createToken(agent.id)}`)
      .send({ resultado: 'REAL' })
      .expect(400);

    prisma.denuncia.findFirst.mockResolvedValue(null);
    await request(createApp())
      .patch('/api/denuncias/report-1/verificar')
      .set('Authorization', `Bearer ${createToken(agent.id)}`)
      .send({ resultado: 'REAL', fotoVerificacionUrl: 'https://example.test/photo.jpg' })
      .expect(409);
  });

  it('releases an unverified case back to approved and preserves the cleanup stage', async () => {
    prisma.denuncia.findFirst.mockResolvedValueOnce({
      estado: EstadoDenuncia.EN_VERIFICACION,
    });
    await request(createApp())
      .patch('/api/denuncias/report-1/liberar')
      .set('Authorization', `Bearer ${createToken(agent.id)}`)
      .expect(200);
    expect(prisma.denuncia.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: {
          id: 'report-1',
          municipioId: agent.municipioId,
          agenteId: agent.id,
          estado: EstadoDenuncia.EN_VERIFICACION,
        },
        data: { estado: EstadoDenuncia.APROBADO, agenteId: null },
      })
    );

    prisma.denuncia.findFirst.mockResolvedValueOnce({
      estado: EstadoDenuncia.EN_SANEAMIENTO,
    });
    await request(createApp())
      .patch('/api/denuncias/report-2/liberar')
      .set('Authorization', `Bearer ${createToken(admin.id)}`)
      .expect(200);
    expect(prisma.denuncia.updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          id: 'report-2',
          municipioId: admin.municipioId,
          agenteId: { not: null },
          estado: EstadoDenuncia.EN_SANEAMIENTO,
        },
        data: { estado: EstadoDenuncia.EN_SANEAMIENTO, agenteId: null },
      })
    );
  });
});
