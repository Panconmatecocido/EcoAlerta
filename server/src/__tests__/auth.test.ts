import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer, Server } from 'node:http';
import express from 'express';
import test from 'node:test';
import { Role } from '@prisma/client';
import {
  AuthDataStore,
  AuthUserRecord,
} from '../controllers/auth.controller';
import { createAuthRouter } from '../routes/auth.routes';

const tokenSecret = 'test-only-auth-token-secret-with-more-than-32-characters';

interface AuthApiResponse {
  success: boolean;
  token?: string;
  message?: string;
  user?: {
    id: string;
    nombre: string;
    email: string;
    rol: Role;
    puntos: number;
    municipioId: string;
  };
}

const parseResponse = async (response: Response): Promise<AuthApiResponse> =>
  (await response.json()) as AuthApiResponse;

function makeUser(
  role: Role,
  overrides: Partial<AuthUserRecord> = {}
): AuthUserRecord {
  return {
    id: `user-${role.toLowerCase()}`,
    nombre: `Demo ${role}`,
    email: `${role.toLowerCase()}@example.com`,
    passwordHash: 'password123',
    rol: role,
    puntos: role === Role.CITIZEN ? 0 : 10,
    municipioId: 'municipality-1',
    creadoEn: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function makeStore(initialUsers: AuthUserRecord[] = []) {
  const users = [...initialUsers];
  const store: AuthDataStore = {
    async findMunicipalityIdByCode(code) {
      return code === 'PILAR-BA' ? 'municipality-1' : null;
    },
    async findUserByEmail(email) {
      return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
    },
    async findUserByIdentifier(identifier) {
      return (
        users.find(
          (user) =>
            user.email.toLowerCase() === identifier.toLowerCase() ||
            user.nombre.toLowerCase() === identifier.toLowerCase()
        ) ?? null
      );
    },
    async createCitizen(data) {
      if (users.some((user) => user.email.toLowerCase() === data.email.toLowerCase())) {
        throw { code: 'P2002' };
      }
      const user = makeUser(Role.CITIZEN, {
        ...data,
        id: `user-${users.length + 1}`,
        puntos: 0,
      });
      users.push(user);
      return user;
    },
    async updatePasswordHash(id, passwordHash) {
      const user = users.find((account) => account.id === id);
      assert.ok(user, 'expected user to exist when upgrading a legacy password');
      user.passwordHash = passwordHash;
    },
  };

  return { store, users };
}

async function startTestServer(store: AuthDataStore): Promise<{
  baseUrl: string;
  close: () => Promise<void>;
}> {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', createAuthRouter(store, tokenSecret));
  const server: Server = createServer(app);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Test server did not bind to a TCP port');
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}/api/auth`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    }),
  };
}

test('register creates a citizen with zero points and a hashed password', async () => {
  const { store, users } = makeStore();
  const server = await startTestServer(store);

  try {
    const response = await fetch(`${server.baseUrl}/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nombre: '  Ana Pérez ',
        email: ' ANA@example.com ',
        password: 'secure123',
      }),
    });
    const body = await parseResponse(response);
    assert.ok(body.user);

    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.user.nombre, 'Ana Pérez');
    assert.equal(body.user.email, 'ana@example.com');
    assert.equal(body.user.rol, Role.CITIZEN);
    assert.equal(body.user.puntos, 0);
    assert.equal(body.user.municipioId, 'municipality-1');
    assert.equal(typeof body.token, 'string');
    assert.match(users[0].passwordHash, /^scrypt\$/);
    assert.equal(JSON.stringify(body).includes(users[0].passwordHash), false);
  } finally {
    await server.close();
  }
});

test('register rejects invalid input and duplicate emails', async () => {
  const { store } = makeStore([makeUser(Role.CITIZEN)]);
  const server = await startTestServer(store);

  try {
    const invalidResponse = await fetch(`${server.baseUrl}/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Ana',
        email: 'ana@example.com',
        password: '12345',
      }),
    });
    assert.equal(invalidResponse.status, 400);

    const duplicateResponse = await fetch(`${server.baseUrl}/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Otra Ana',
        email: 'CITIZEN@example.com',
        password: 'secure123',
      }),
    });
    assert.equal(duplicateResponse.status, 409);
  } finally {
    await server.close();
  }
});

test('login supports all four roles and upgrades legacy seed passwords', async () => {
  const roles = [Role.CITIZEN, Role.AGENT, Role.ADMIN, Role.COLLABORATOR];
  const { store, users } = makeStore(roles.map((role) => makeUser(role)));
  const server = await startTestServer(store);

  try {
    for (const role of roles) {
      const response = await fetch(`${server.baseUrl}/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: `${role.toLowerCase()}@example.com`,
          password: 'password123',
        }),
      });
      const body = await parseResponse(response);

      assert.equal(response.status, 200);
      assert.equal(body.user?.rol, role);
      assert.equal(typeof body.token, 'string');
      const account = users.find((user) => user.rol === role);
      assert.ok(account);
      assert.match(account.passwordHash, /^scrypt\$/);
    }
  } finally {
    await server.close();
  }
});

test('login rejects invalid credentials without exposing whether the account exists', async () => {
  const { store } = makeStore([makeUser(Role.CITIZEN)]);
  const server = await startTestServer(store);

  try {
    const response = await fetch(`${server.baseUrl}/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifier: 'missing@example.com', password: 'wrongpass' }),
    });

    assert.equal(response.status, 401);
    assert.equal((await parseResponse(response)).message, 'Correo electrónico o contraseña incorrectos');
  } finally {
    await server.close();
  }
});
