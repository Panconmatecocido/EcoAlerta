import { createHmac } from 'node:crypto';
import express from 'express';
import request from 'supertest';
import { Role } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');
  const mockPrisma = {
    denuncia: {
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  return {
    ...actual,
    PrismaClient: jest.fn(() => mockPrisma),
    __mockPrisma: mockPrisma,
  };
});

const prisma = (
  jest.requireMock('@prisma/client') as {
    __mockPrisma: { denuncia: { findMany: jest.Mock }; user: { findUnique: jest.Mock } };
  }
).__mockPrisma;

const tokenSecret = 'test-only-auth-token-secret-with-more-than-32-characters';
const admin = { id: 'admin-1', rol: Role.ADMIN, municipioId: 'municipality-1' };

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
  app.use('/api/denuncias', routes);
  return app;
}

describe('GET /api/denuncias for administrators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue(admin);
    prisma.denuncia.findMany.mockResolvedValue([]);
  });

  it('returns persisted report fields filtered to the administrator municipality', async () => {
    const report = {
      id: 'report-1',
      codigo: 'REP-2026-001',
      titulo: 'Microbasural en la plaza',
      descripcion: 'Residuos acumulados en la vereda.',
      categoria: 'Microbasural',
      direccion: 'Calle 1 y Calle 2',
      latitud: -34.46,
      longitud: -58.91,
      estado: 'PENDIENTE',
      prioridad: 'ALTA',
      creadoEn: '2026-10-20T10:00:00.000Z',
      municipioId: 'municipality-1',
      agente: { id: 'agent-1', nombre: 'Agente Uno', email: 'agent@example.com' },
    };
    prisma.denuncia.findMany.mockResolvedValue([report]);

    const response = await request(createApp())
      .get('/api/denuncias?estado=PENDIENTE')
      .set('Authorization', `Bearer ${createToken(admin.id)}`)
      .expect(200);

    expect(prisma.denuncia.findMany).toHaveBeenCalledWith({
      where: { municipioId: admin.municipioId, estado: 'PENDIENTE' },
      include: {
        ciudadano: { select: { id: true, nombre: true, email: true } },
        agente: { select: { id: true, nombre: true, email: true } },
      },
      orderBy: { creadoEn: 'desc' },
    });
    expect(response.body).toEqual({ success: true, data: [report] });
  });

  it('preserves text filtering and ignores a client-supplied municipality', async () => {
    await request(createApp())
      .get('/api/denuncias?estado=APROBADO&busqueda=plaza&municipioId=municipality-2')
      .set('Authorization', `Bearer ${createToken(admin.id)}`)
      .expect(200);

    expect(prisma.denuncia.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          municipioId: admin.municipioId,
          estado: 'APROBADO',
          OR: [
            { titulo: { contains: 'plaza', mode: 'insensitive' } },
            { direccion: { contains: 'plaza', mode: 'insensitive' } },
            { categoria: { contains: 'plaza', mode: 'insensitive' } },
          ],
        },
      })
    );
  });

  it('rejects an invalid state filter instead of returning a server error', async () => {
    await request(createApp())
      .get('/api/denuncias?estado=NO_EXISTE')
      .set('Authorization', `Bearer ${createToken(admin.id)}`)
      .expect(400);

    expect(prisma.denuncia.findMany).not.toHaveBeenCalled();
  });
});
