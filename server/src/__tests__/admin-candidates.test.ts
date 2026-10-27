import { createHmac } from 'node:crypto';
import express from 'express';
import request from 'supertest';
import { Role } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');
  const mockPrisma = {
    denuncia: {
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
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
    __mockPrisma: {
      denuncia: { findFirst: jest.Mock };
      user: { findUnique: jest.Mock; findMany: jest.Mock };
    };
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

describe('nearby agents for an administrator report', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue(admin);
    prisma.denuncia.findFirst.mockResolvedValue({
      id: 'report-1',
      municipioId: admin.municipioId,
      latitud: -34.46,
      longitud: -58.91,
    });
    prisma.user.findMany.mockResolvedValue([]);
  });

  it('orders eligible same-municipality agents by distance without exposing coordinates', async () => {
    prisma.user.findMany.mockResolvedValue([
      {
        id: 'agent-far',
        nombre: 'Agente Lejano',
        disponible: true,
        latitudActual: -34.5,
        longitudActual: -58.95,
        ubicacionActualizadaEn: new Date('2026-10-21T10:00:00.000Z'),
        _count: { denunciasAsignadas: 0 },
      },
      {
        id: 'agent-near',
        nombre: 'Agente Cercano',
        disponible: true,
        latitudActual: -34.461,
        longitudActual: -58.911,
        ubicacionActualizadaEn: new Date('2026-10-21T11:00:00.000Z'),
        _count: { denunciasAsignadas: 0 },
      },
      {
        id: 'agent-busy',
        nombre: 'Agente Ocupado',
        disponible: true,
        latitudActual: -34.46,
        longitudActual: -58.91,
        ubicacionActualizadaEn: new Date('2026-10-21T11:00:00.000Z'),
        _count: { denunciasAsignadas: 1 },
      },
    ]);

    const response = await request(createApp())
      .get('/api/denuncias/report-1/agentes-disponibles')
      .set('Authorization', `Bearer ${createToken(admin.id)}`)
      .expect(200);

    expect(prisma.denuncia.findFirst).toHaveBeenCalledWith({
      where: { id: 'report-1', municipioId: admin.municipioId },
      select: { id: true, municipioId: true, latitud: true, longitud: true },
    });
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        rol: Role.AGENT,
        municipioId: admin.municipioId,
        disponible: true,
        latitudActual: { not: null },
        longitudActual: { not: null },
        ubicacionActualizadaEn: { not: null },
      },
      select: {
        id: true,
        nombre: true,
        disponible: true,
        latitudActual: true,
        longitudActual: true,
        ubicacionActualizadaEn: true,
        _count: {
          select: {
            denunciasAsignadas: {
              where: { estado: { in: ['EN_VERIFICACION', 'EN_SANEAMIENTO'] } },
            },
          },
        },
      },
    });
    expect(response.body.data.map((candidate: { id: string }) => candidate.id)).toEqual([
      'agent-near',
      'agent-far',
    ]);
    expect(response.body.data[0]).toMatchObject({
      disponible: true,
      casosActivos: 0,
      ubicacionActualizadaEn: '2026-10-21T11:00:00.000Z',
    });
    expect(response.body.data[0].distanciaMetros).toBeLessThan(
      response.body.data[1].distanciaMetros
    );
    expect(JSON.stringify(response.body)).not.toContain('latitud');
    expect(JSON.stringify(response.body)).not.toContain('longitud');
    expect(JSON.stringify(response.body)).not.toContain('-34.461');
  });

  it('returns no candidates when there are no eligible agents', async () => {
    const response = await request(createApp())
      .get('/api/denuncias/report-1/agentes-disponibles')
      .set('Authorization', `Bearer ${createToken(admin.id)}`)
      .expect(200);

    expect(response.body).toEqual({ success: true, data: [] });
  });

  it('rejects a report without coordinates', async () => {
    prisma.denuncia.findFirst.mockResolvedValue({
      id: 'report-1',
      municipioId: admin.municipioId,
      latitud: null,
      longitud: null,
    });

    await request(createApp())
      .get('/api/denuncias/report-1/agentes-disponibles')
      .set('Authorization', `Bearer ${createToken(admin.id)}`)
      .expect(422);

    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('does not reveal reports from another municipality', async () => {
    prisma.denuncia.findFirst.mockResolvedValue(null);

    await request(createApp())
      .get('/api/denuncias/foreign-report/agentes-disponibles')
      .set('Authorization', `Bearer ${createToken(admin.id)}`)
      .expect(404);

    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });
});
