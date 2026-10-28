import { createHmac } from 'node:crypto';
import express from 'express';
import request from 'supertest';
import { Role } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    denuncia: {
      count: jest.fn(),
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
      user: {
        findUnique: jest.Mock;
        update: jest.Mock;
        findFirst: jest.Mock;
      };
      denuncia: { count: jest.Mock };
    };
  }
).__mockPrisma;

const tokenSecret = 'test-only-auth-token-secret-with-more-than-32-characters';
const agent = {
  id: 'agent-municipality-1',
  rol: Role.AGENT,
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
  const routes = require('../routes/agentes.routes').default as express.Router;
  const app = express();
  app.use(express.json());
  app.use('/api/agentes', routes);
  return app;
}

describe('agent current location endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue(agent);
    prisma.denuncia.count.mockResolvedValue(0);
  });

  it('returns the authenticated agent connection state', async () => {
    prisma.user.findFirst.mockResolvedValue({ disponible: true });

    const response = await request(createApp())
      .get('/api/agentes/me/estado')
      .set('Authorization', `Bearer ${createToken(agent.id)}`)
      .expect(200);

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { id: agent.id, rol: Role.AGENT },
      select: { disponible: true },
    });
    expect(response.body.data).toEqual({ disponible: true });
  });

  it('requires a valid coordinate pair before enabling availability', async () => {
    const token = createToken(agent.id);

    await request(createApp())
      .patch('/api/agentes/me/disponibilidad')
      .set('Authorization', `Bearer ${token}`)
      .send({ disponible: true })
      .expect(400);

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects coordinates outside valid GPS ranges', async () => {
    await request(createApp())
      .patch('/api/agentes/me/disponibilidad')
      .set('Authorization', `Bearer ${createToken(agent.id)}`)
      .send({ disponible: true, latitud: 91, longitud: -58.91 })
      .expect(400);

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('saves only the latest valid location when the authenticated agent becomes available', async () => {
    const timestamp = new Date('2026-10-21T10:00:00.000Z');
    prisma.user.update.mockResolvedValue({
      id: agent.id,
      disponible: true,
      ubicacionActualizadaEn: timestamp,
    });

    const response = await request(createApp())
      .patch('/api/agentes/me/disponibilidad')
      .set('Authorization', `Bearer ${createToken(agent.id)}`)
      .send({ disponible: true, latitud: -34.46, longitud: -58.91 })
      .expect(200);

    expect(prisma.denuncia.count).not.toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: agent.id },
      data: {
        disponible: true,
        latitudActual: -34.46,
        longitudActual: -58.91,
        ubicacionActualizadaEn: expect.any(Date),
      },
      select: { id: true, disponible: true, ubicacionActualizadaEn: true },
    });
    expect(response.body.data).toEqual({
      id: agent.id,
      disponible: true,
      ubicacionActualizadaEn: timestamp.toISOString(),
    });
    expect(JSON.stringify(response.body)).not.toContain('-34.46');
  });

  it('keeps the agent connected and updates GPS while the agent has an active case', async () => {
    prisma.denuncia.count.mockResolvedValue(1);
    prisma.user.update.mockResolvedValue({
      id: agent.id,
      disponible: true,
      ubicacionActualizadaEn: new Date('2026-10-21T10:00:00.000Z'),
    });

    await request(createApp())
      .patch('/api/agentes/me/disponibilidad')
      .set('Authorization', `Bearer ${createToken(agent.id)}`)
      .send({ disponible: true, latitud: -34.46, longitud: -58.91 })
      .expect(200);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          disponible: true,
          latitudActual: -34.46,
          longitudActual: -58.91,
        }),
      })
    );
  });

  it('replaces the current GPS pair when location is refreshed while available', async () => {
    const updatedAt = new Date('2026-10-21T11:00:00.000Z');
    prisma.user.findUnique
      .mockResolvedValueOnce(agent)
      .mockResolvedValueOnce({ ...agent, disponible: true });
    prisma.user.update.mockResolvedValue({ ubicacionActualizadaEn: updatedAt });

    const response = await request(createApp())
      .patch('/api/agentes/me/ubicacion')
      .set('Authorization', `Bearer ${createToken(agent.id)}`)
      .send({ latitud: -34.5, longitud: -58.8 })
      .expect(200);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: agent.id },
      data: {
        latitudActual: -34.5,
        longitudActual: -58.8,
        ubicacionActualizadaEn: expect.any(Date),
      },
      select: { ubicacionActualizadaEn: true },
    });
    expect(response.body.data).toEqual({ ubicacionActualizadaEn: updatedAt.toISOString() });
  });

  it('clears coordinates and the timestamp when availability is disabled', async () => {
    prisma.user.update.mockResolvedValue({ id: agent.id, disponible: false });

    await request(createApp())
      .patch('/api/agentes/me/disponibilidad')
      .set('Authorization', `Bearer ${createToken(agent.id)}`)
      .send({ disponible: false })
      .expect(200);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          disponible: false,
          latitudActual: null,
          longitudActual: null,
          ubicacionActualizadaEn: null,
        },
      })
    );
  });
});
