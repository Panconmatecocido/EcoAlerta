import { createHmac } from 'node:crypto';
import express from 'express';
import request from 'supertest';
import { Role } from '@prisma/client';
import { verifyPassword } from '../utils/password';

jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    denuncia: { updateMany: jest.fn() },
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
      user: {
        findUnique: jest.Mock;
        findFirst: jest.Mock;
        findMany: jest.Mock;
        create: jest.Mock;
        updateMany: jest.Mock;
        deleteMany: jest.Mock;
      };
      denuncia: { updateMany: jest.Mock };
      $transaction: jest.Mock;
    };
  }
).__mockPrisma;

const tokenSecret = 'test-only-auth-token-secret-with-more-than-32-characters';
const adminId = 'admin-municipality-1';
const municipalityId = 'municipality-1';
const validProfilePhoto = 'data:image/jpeg;base64,/9j/2Q==';

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
  const routes = require('../routes/adminUsers.routes').default as express.Router;
  const app = express();
  app.use(express.json());
  app.use('/api/admin/usuarios', routes);
  return app;
}

describe('admin staff account provisioning', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockImplementation(({ where }: { where: { id: string } }) =>
      Promise.resolve({
        id: where.id,
        rol: where.id === adminId ? Role.ADMIN : Role.AGENT,
        municipioId: municipalityId,
      })
    );
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.findMany.mockResolvedValue([]);
    prisma.user.updateMany.mockResolvedValue({ count: 1 });
    prisma.user.deleteMany.mockResolvedValue({ count: 1 });
    prisma.denuncia.updateMany.mockResolvedValue({ count: 0 });
    prisma.$transaction.mockImplementation(
      async (operation: (transaction: typeof prisma) => Promise<unknown>) => operation(prisma)
    );
    prisma.user.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({
        id: 'new-user-1',
        nombre: data.nombre,
        email: data.email,
        rol: data.rol,
        municipioId: data.municipioId,
        disponible: data.disponible,
        creadoEn: new Date('2026-10-28T12:00:00.000Z'),
        fotoPerfilUri: data.fotoPerfilUri,
      })
    );
  });

  it.each([
    [Role.AGENT, 'Agente Nuevo'],
    [Role.COLLABORATOR, 'Colaborador Nuevo'],
  ])('creates a %s account associated with the authenticated admin municipality', async (rol, nombre) => {
    const response = await request(createApp())
      .post('/api/admin/usuarios')
      .set('Authorization', `Bearer ${createToken(adminId)}`)
      .send({
        nombre,
        email: '  NUEVO@MUNICIPIO.GOB.AR ',
        password: 'clave-segura-123',
        rol,
        fotoPerfilUri: validProfilePhoto,
      })
      .expect(201);

    expect(prisma.user.create).toHaveBeenCalledTimes(1);
    const createArgument = prisma.user.create.mock.calls[0][0];
    expect(createArgument.data).toMatchObject({
      nombre,
      email: 'nuevo@municipio.gob.ar',
      rol,
      municipioId: municipalityId,
      disponible: rol === Role.AGENT ? false : true,
      fotoPerfilUri: validProfilePhoto,
    });
    expect(createArgument.data.passwordHash).not.toBe('clave-segura-123');
    expect(await verifyPassword('clave-segura-123', createArgument.data.passwordHash)).toBe(true);
    expect(response.body.data).not.toHaveProperty('passwordHash');
    expect(response.body.data).toMatchObject({ nombre, email: 'nuevo@municipio.gob.ar', rol });
    expect(response.body.data.fotoPerfilUri).toBe(validProfilePhoto);
  });

  it('rejects a non-administrator and unauthenticated requests', async () => {
    const app = createApp();

    await request(app)
      .post('/api/admin/usuarios')
      .set('Authorization', `Bearer ${createToken('agent-1')}`)
      .send({ nombre: 'Nuevo Personal', email: 'nuevo@test.com', password: 'clave-segura', rol: Role.AGENT })
      .expect(403);

    await request(app)
      .post('/api/admin/usuarios')
      .send({ nombre: 'Nuevo Personal', email: 'nuevo@test.com', password: 'clave-segura', rol: Role.AGENT })
      .expect(401);

    await request(app)
      .delete('/api/admin/usuarios/agent-1')
      .set('Authorization', `Bearer ${createToken('agent-1')}`)
      .expect(403);

    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.user.deleteMany).not.toHaveBeenCalled();
  });

  it.each([
    [{ nombre: 'N', email: 'nuevo@test.com', password: 'clave-segura', rol: Role.AGENT }],
    [{ nombre: 'Nombre Válido', email: 'incorrecto', password: 'clave-segura', rol: Role.AGENT }],
    [{ nombre: 'Nombre Válido', email: 'nuevo@test.com', password: 'corta', rol: Role.AGENT }],
    [{ nombre: 'Nombre Válido', email: 'nuevo@test.com', password: 'clave-segura', rol: Role.ADMIN }],
  ])('rejects invalid account data before creating a user', async (body) => {
    await request(createApp())
      .post('/api/admin/usuarios')
      .set('Authorization', `Bearer ${createToken(adminId)}`)
      .send(body)
      .expect(400);

    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('rejects an email already registered in any role', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'existing-user' });

    await request(createApp())
      .post('/api/admin/usuarios')
      .set('Authorization', `Bearer ${createToken(adminId)}`)
      .send({
        nombre: 'Nombre Válido',
        email: 'existente@test.com',
        password: 'clave-segura',
        rol: Role.COLLABORATOR,
        fotoPerfilUri: validProfilePhoto,
      })
      .expect(409);

    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it.each([
    [Role.AGENT, undefined],
    [Role.AGENT, 'https://example.com/profile.jpg'],
    [Role.AGENT, 'data:image/jpeg;base64,YWJj'],
    [Role.COLLABORATOR, undefined],
    [Role.COLLABORATOR, 'https://example.com/profile.jpg'],
    [Role.COLLABORATOR, 'data:image/jpeg;base64,YWJj'],
  ])('rejects a %s account without a valid camera photo', async (rol, fotoPerfilUri) => {
    await request(createApp())
      .post('/api/admin/usuarios')
      .set('Authorization', `Bearer ${createToken(adminId)}`)
      .send({
        nombre: 'Personal Nuevo',
        email: 'personal@test.com',
        password: 'clave-segura',
        rol,
        ...(fotoPerfilUri === undefined ? {} : { fotoPerfilUri }),
      })
      .expect(400);

    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('lists collaborators from the authenticated administrator municipality', async () => {
    prisma.user.findMany.mockResolvedValue([
      {
        id: 'collaborator-1',
        nombre: 'Colaborador Uno',
        email: 'colaborador@example.com',
        disponible: true,
        fotoPerfilUri: validProfilePhoto,
        creadoEn: new Date('2026-10-28T12:00:00.000Z'),
      },
    ]);

    const response = await request(createApp())
      .get('/api/admin/usuarios/colaboradores')
      .set('Authorization', `Bearer ${createToken(adminId)}`)
      .expect(200);

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { rol: Role.COLLABORATOR, municipioId: municipalityId },
      select: {
        id: true,
        nombre: true,
        email: true,
        disponible: true,
        fotoPerfilUri: true,
        creadoEn: true,
      },
      orderBy: { nombre: 'asc' },
    });
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      id: 'collaborator-1',
      disponible: true,
      fotoPerfilUri: validProfilePhoto,
    });
  });

  it('allows the administrator to change collaborator service status only within their municipality', async () => {
    prisma.user.updateMany.mockResolvedValue({ count: 1 });
    prisma.user.findFirst.mockResolvedValue({
      id: 'collaborator-1',
      nombre: 'Colaborador Uno',
      email: 'colaborador@example.com',
      disponible: false,
      fotoPerfilUri: validProfilePhoto,
      creadoEn: new Date('2026-10-28T12:00:00.000Z'),
    });

    const response = await request(createApp())
      .patch('/api/admin/usuarios/colaboradores/collaborator-1/disponibilidad')
      .set('Authorization', `Bearer ${createToken(adminId)}`)
      .send({ disponible: false })
      .expect(200);

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'collaborator-1',
        municipioId: municipalityId,
        rol: Role.COLLABORATOR,
      },
      data: { disponible: false },
    });
    expect(response.body.data.disponible).toBe(false);
  });

  it('rejects invalid collaborator status and unknown or cross-municipality collaborators', async () => {
    await request(createApp())
      .patch('/api/admin/usuarios/colaboradores/collaborator-1/disponibilidad')
      .set('Authorization', `Bearer ${createToken(adminId)}`)
      .send({ disponible: 'false' })
      .expect(400);

    prisma.user.updateMany.mockResolvedValue({ count: 0 });
    await request(createApp())
      .patch('/api/admin/usuarios/colaboradores/collaborator-2/disponibilidad')
      .set('Authorization', `Bearer ${createToken(adminId)}`)
      .send({ disponible: true })
      .expect(404);
  });

  it('deletes an agent within the admin municipality and releases assigned reports transactionally', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'agent-1',
      nombre: 'Agente Uno',
      rol: Role.AGENT,
    });
    prisma.denuncia.updateMany
      .mockResolvedValueOnce({ count: 2 })
      .mockResolvedValueOnce({ count: 3 });

    const response = await request(createApp())
      .delete('/api/admin/usuarios/agent-1')
      .set('Authorization', `Bearer ${createToken(adminId)}`)
      .expect(200);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'agent-1',
        municipioId: municipalityId,
        rol: { in: [Role.AGENT, Role.COLLABORATOR] },
      },
      select: { id: true, nombre: true, rol: true },
    });
    expect(prisma.denuncia.updateMany).toHaveBeenNthCalledWith(1, {
      where: {
        agenteId: 'agent-1',
        estado: {
          in: [
            'PENDIENTE',
            'EN_PROCESO',
            'EN_VERIFICACION',
            'EN_SANEAMIENTO',
          ],
        },
      },
      data: { agenteId: null },
    });
    expect(prisma.denuncia.updateMany).toHaveBeenNthCalledWith(2, {
      where: { agenteId: 'agent-1' },
      data: { agenteId: null },
    });
    expect(prisma.user.deleteMany).toHaveBeenCalledWith({
      where: {
        id: 'agent-1',
        municipioId: municipalityId,
        rol: { in: [Role.AGENT, Role.COLLABORATOR] },
      },
    });
    expect(response.body).toMatchObject({
      success: true,
      data: { id: 'agent-1', nombre: 'Agente Uno', rol: Role.AGENT, denunciasLiberadas: 2 },
    });
  });

  it('deletes a collaborator account without touching reports', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'collaborator-1',
      nombre: 'Colaborador Uno',
      rol: Role.COLLABORATOR,
    });

    await request(createApp())
      .delete('/api/admin/usuarios/collaborator-1')
      .set('Authorization', `Bearer ${createToken(adminId)}`)
      .expect(200);

    expect(prisma.denuncia.updateMany).not.toHaveBeenCalled();
    expect(prisma.user.deleteMany).toHaveBeenCalled();
  });

  it('does not delete unknown, unsupported, or cross-municipality accounts', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await request(createApp())
      .delete('/api/admin/usuarios/citizen-1')
      .set('Authorization', `Bearer ${createToken(adminId)}`)
      .expect(404);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.user.deleteMany).not.toHaveBeenCalled();
    expect(prisma.denuncia.updateMany).not.toHaveBeenCalled();
  });
});
