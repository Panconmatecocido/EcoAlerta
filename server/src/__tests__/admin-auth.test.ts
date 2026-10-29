import { createHmac } from 'node:crypto';
import express, { Request, Response } from 'express';
import request from 'supertest';
import { Role } from '@prisma/client';
import { createAuthMiddleware, requireRole } from '../middleware/auth';
import { AuthIdentityStore } from '../controllers/auth.controller';

jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');
  const mockPrisma = {
    denuncia: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
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
      denuncia: {
        findMany: jest.Mock;
        updateMany: jest.Mock;
        findFirst: jest.Mock;
      };
      user: {
        findUnique: jest.Mock;
        findMany: jest.Mock;
        findFirst: jest.Mock;
        update: jest.Mock;
      };
    };
  }
).__mockPrisma;

const tokenSecret = 'test-only-auth-token-secret-with-more-than-32-characters';

function createToken(payload: Record<string, unknown>): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const tokenPayload = encode(payload);
  const unsignedToken = `${header}.${tokenPayload}`;
  const signature = createHmac('sha256', tokenSecret)
    .update(unsignedToken)
    .digest('base64url');
  return `${unsignedToken}.${signature}`;
}

function createApp(store: AuthIdentityStore) {
  const app = express();
  app.use(createAuthMiddleware(store, tokenSecret));
  app.get('/admin', requireRole(Role.ADMIN), (req: Request, res: Response) => {
    res.json({ principal: req.auth });
  });
  return app;
}

function createAgentsApp() {
  process.env.AUTH_TOKEN_SECRET = tokenSecret;
  const agentesRoutes =
    require('../routes/agentes.routes').default as express.Router;
  const app = express();
  app.use(express.json());
  app.use('/api/agentes', agentesRoutes);
  return app;
}

function createReportsApp() {
  process.env.AUTH_TOKEN_SECRET = tokenSecret;
  const denunciasRoutes =
    require('../routes/denuncias.routes').default as express.Router;
  const app = express();
  app.use(express.json());
  app.use('/api/denuncias', denunciasRoutes);
  return app;
}

function createAuthProfileApp() {
  process.env.AUTH_TOKEN_SECRET = tokenSecret;
  const { createAuthRouter } =
    require('../routes/auth.routes') as typeof import('../routes/auth.routes');
  const app = express();
  app.use(express.json());
  app.use('/api/auth', createAuthRouter(undefined, tokenSecret));
  return app;
}

const admin = {
  id: 'admin-1',
  rol: Role.ADMIN,
  municipioId: 'municipality-1',
};

describe('admin and agent authentication middleware', () => {
  it('loads role and municipality from the authenticated user record', async () => {
    const store: AuthIdentityStore = {
      findUserById: jest.fn().mockResolvedValue(admin),
    };
    const token = createToken({
      sub: admin.id,
      role: Role.AGENT,
      municipioId: 'municipality-2',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60,
    });

    const response = await request(createApp(store))
      .get('/admin')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(store.findUserById).toHaveBeenCalledWith(admin.id);
    expect(response.body.principal).toEqual(admin);
  });

  it('rejects missing, malformed, invalid, and expired tokens', async () => {
    const store: AuthIdentityStore = {
      findUserById: jest.fn().mockResolvedValue(admin),
    };
    const app = createApp(store);
    const expiredToken = createToken({
      sub: admin.id,
      iat: Math.floor(Date.now() / 1000) - 120,
      exp: Math.floor(Date.now() / 1000) - 60,
    });

    await request(app).get('/admin').expect(401);
    await request(app).get('/admin').set('Authorization', 'Bearer local:user-1').expect(401);
    await request(app)
      .get('/admin')
      .set('Authorization', 'Bearer invalid.token.signature')
      .expect(401);
    await request(app)
      .get('/admin')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });

  it('rejects a valid session with the wrong role', async () => {
    const agent = { id: 'agent-1', rol: Role.AGENT, municipioId: 'municipality-1' };
    const store: AuthIdentityStore = {
      findUserById: jest.fn().mockResolvedValue(agent),
    };
    const token = createToken({
      sub: agent.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60,
    });

    await request(createApp(store))
      .get('/admin')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('blocks unauthenticated report reads and writes before reaching the database', async () => {
    const app = createReportsApp();

    await request(app).get('/api/denuncias').expect(401);
    await request(app)
      .patch('/api/denuncias/report-1/triaje')
      .send({ accion: 'APROBAR', prioridad: 'ALTA' })
      .expect(401);

    expect(prisma.denuncia.findMany).not.toHaveBeenCalled();
    expect(prisma.denuncia.updateMany).not.toHaveBeenCalled();
  });

  it('rejects agents from administrative report endpoints without database access', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'agent-1',
      rol: Role.AGENT,
      municipioId: 'municipality-1',
    });
    const token = createToken({
      sub: 'agent-1',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60,
    });

    await request(createReportsApp())
      .get('/api/denuncias')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(prisma.denuncia.findMany).not.toHaveBeenCalled();
  });

  it('uses the authenticated municipality instead of a client-supplied municipality', async () => {
    prisma.user.findUnique.mockResolvedValue(admin);
    prisma.denuncia.findMany.mockResolvedValue([]);
    const token = createToken({
      sub: admin.id,
      municipioId: 'municipality-2',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60,
    });

    await request(createReportsApp())
      .get('/api/denuncias?municipioId=municipality-2')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(prisma.denuncia.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { municipioId: 'municipality-1' },
      })
    );
  });

  it('does not mutate a report outside the authenticated municipality', async () => {
    prisma.user.findUnique.mockResolvedValue(admin);
    prisma.denuncia.updateMany.mockResolvedValue({ count: 0 });
    const token = createToken({
      sub: admin.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60,
    });

    await request(createReportsApp())
      .patch('/api/denuncias/foreign-report/triaje')
      .set('Authorization', `Bearer ${token}`)
      .send({ accion: 'APROBAR', prioridad: 'ALTA' })
      .expect(404);

    expect(prisma.denuncia.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'foreign-report',
        municipioId: 'municipality-1',
        estado: 'PENDIENTE',
      },
      data: {
        estado: 'APROBADO',
        prioridad: 'ALTA',
        agenteId: null,
      },
    });
    expect(prisma.denuncia.findFirst).toHaveBeenCalledWith({
      where: { id: 'foreign-report', municipioId: 'municipality-1' },
      select: { id: true },
    });
  });

  describe('citizen profile update', () => {
    const citizen = {
      id: 'citizen-1',
      rol: Role.CITIZEN,
      municipioId: 'municipality-1',
    };

    beforeEach(() => {
      jest.clearAllMocks();
      prisma.user.findUnique.mockResolvedValue(citizen);
    });

    it('updates only the authenticated user name and returns the saved profile', async () => {
      prisma.user.update.mockResolvedValue({
        id: citizen.id,
        nombre: 'Ana Vecina',
        email: 'ana@example.com',
        rol: Role.CITIZEN,
        puntos: 25,
        municipioId: citizen.municipioId,
        creadoEn: new Date('2026-01-01T00:00:00.000Z'),
      });

      const response = await request(createAuthProfileApp())
        .patch('/api/auth/profile')
        .set(
          'Authorization',
          `Bearer ${createToken({
            sub: citizen.id,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 60,
          })}`
        )
        .send({ nombre: '  Ana Vecina  ' })
        .expect(200);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: citizen.id },
          data: { nombre: 'Ana Vecina' },
        })
      );
      expect(response.body.user.nombre).toBe('Ana Vecina');
      expect(response.body.user.email).toBe('ana@example.com');
    });

    it('rejects invalid names and requests without an authenticated session', async () => {
      const app = createAuthProfileApp();
      const token = createToken({
        sub: citizen.id,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60,
      });

      await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: ' ' })
        .expect(400);

      await request(app)
        .patch('/api/auth/profile')
        .send({ nombre: 'Ana' })
        .expect(401);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  it('clears an agent current position when the agent becomes unavailable', async () => {
    const agent = {
      id: 'agent-1',
      rol: Role.AGENT,
      municipioId: 'municipality-1',
    };
    prisma.user.findUnique.mockResolvedValue(agent);
    prisma.user.update.mockResolvedValue({
      id: agent.id,
      nombre: 'Agente',
      email: 'agent@example.com',
      disponible: false,
    });
    const token = createToken({
      sub: agent.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60,
    });

    await request(createAgentsApp())
      .patch(`/api/agentes/${agent.id}/disponibilidad`)
      .set('Authorization', `Bearer ${token}`)
      .send({ disponible: false })
      .expect(200);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: agent.id },
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
