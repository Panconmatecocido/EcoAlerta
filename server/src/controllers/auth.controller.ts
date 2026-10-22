import {
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../config/db';

const scryptAsync = promisify(scrypt);
const PASSWORD_KEY_LENGTH = 64;
const DEFAULT_MUNICIPALITY_CODE = 'PILAR-BA';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface AuthUserRecord {
  id: string;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: Role;
  puntos: number;
  municipioId: string;
  creadoEn: Date;
}

export interface AuthDataStore {
  findMunicipalityIdByCode(code: string): Promise<string | null>;
  findUserByEmail(email: string): Promise<AuthUserRecord | null>;
  findUserByIdentifier(identifier: string): Promise<AuthUserRecord | null>;
  createCitizen(data: {
    nombre: string;
    email: string;
    passwordHash: string;
    municipioId: string;
  }): Promise<AuthUserRecord>;
  updatePasswordHash(id: string, passwordHash: string): Promise<void>;
}

export interface AuthIdentity {
  id: string;
  rol: Role;
  municipioId: string;
}

export interface AuthIdentityStore {
  findUserById(id: string): Promise<AuthIdentity | null>;
}

const database: AuthDataStore = {
  async findMunicipalityIdByCode(code) {
    const municipality = await prisma.municipio.findUnique({
      where: { codigo: code },
      select: { id: true },
    });
    return municipality?.id ?? null;
  },
  findUserByEmail(email) {
    return prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
  },
  findUserByIdentifier(identifier) {
    return prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: 'insensitive' } },
          { nombre: { equals: identifier, mode: 'insensitive' } },
        ],
      },
    });
  },
  createCitizen(data) {
    return prisma.user.create({ data });
  },
  async updatePasswordHash(id, passwordHash) {
    await prisma.user.update({ where: { id }, data: { passwordHash } });
  },
};

export const authIdentityStore: AuthIdentityStore = {
  findUserById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, rol: true, municipioId: true },
    });
  },
};

const asString = (value: unknown): string | null =>
  typeof value === 'string' ? value.trim() : null;

const isDuplicateEmailError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 'P2002';

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, salt, storedKey] = storedHash.split('$');
  if (algorithm !== 'scrypt') {
    const actual = Buffer.from(password);
    const expected = Buffer.from(storedHash);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
  if (
    !salt ||
    !storedKey ||
    !/^[a-f\d]{32}$/i.test(salt) ||
    !/^[a-f\d]{128}$/i.test(storedKey)
  ) {
    return false;
  }

  const expectedKey = Buffer.from(storedKey, 'hex');
  const actualKey = (await scryptAsync(password, salt, expectedKey.length)) as Buffer;
  return expectedKey.length === actualKey.length && timingSafeEqual(expectedKey, actualKey);
}

function issueToken(user: AuthUserRecord, secret: string): string {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({
    sub: user.id,
    role: user.rol,
    iat: now,
    exp: now + 60 * 60,
  });
  const unsignedToken = `${header}.${payload}`;
  const signature = createHmac('sha256', secret).update(unsignedToken).digest('base64url');
  return `${unsignedToken}.${signature}`;
}

export interface SessionTokenPayload {
  sub: string;
  exp: number;
}

export function verifySessionToken(
  token: string,
  secret: string | undefined,
  now = Math.floor(Date.now() / 1000)
): SessionTokenPayload | null {
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  try {
    const header = JSON.parse(
      Buffer.from(encodedHeader, 'base64url').toString('utf8')
    ) as { alg?: unknown; typ?: unknown };
    if (header.alg !== 'HS256' || header.typ !== 'JWT') return null;

    const unsignedToken = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = createHmac('sha256', secret)
      .update(unsignedToken)
      .digest();
    const suppliedSignature = Buffer.from(encodedSignature, 'base64url');
    if (
      suppliedSignature.length !== expectedSignature.length ||
      !timingSafeEqual(suppliedSignature, expectedSignature)
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    ) as Partial<SessionTokenPayload>;
    if (
      typeof payload.sub !== 'string' ||
      !payload.sub ||
      typeof payload.exp !== 'number' ||
      !Number.isSafeInteger(payload.exp) ||
      payload.exp <= now
    ) {
      return null;
    }

    return { sub: payload.sub, exp: payload.exp };
  } catch {
    return null;
  }
}

function publicUser(user: AuthUserRecord) {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    puntos: user.puntos,
    municipioId: user.municipioId,
  };
}

export function createAuthHandlers(
  store: AuthDataStore,
  tokenSecret: string | undefined
) {
  const register = async (req: Request, res: Response): Promise<void> => {
    const nombre = asString(req.body?.nombre);
    const emailInput = asString(req.body?.email);
    const password = asString(req.body?.password);

    if (!nombre || !emailInput || !password) {
      res.status(400).json({
        success: false,
        message: 'Nombre, correo electrónico y contraseña son obligatorios',
      });
      return;
    }

    const email = emailInput.toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      res.status(400).json({ success: false, message: 'El correo electrónico no es válido' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres',
      });
      return;
    }

    if (!tokenSecret || Buffer.byteLength(tokenSecret, 'utf8') < 32) {
      res.status(500).json({
        success: false,
        message: 'AUTH_TOKEN_SECRET debe contener al menos 32 caracteres',
      });
      return;
    }

    try {
      if (await store.findUserByEmail(email)) {
        res.status(409).json({
          success: false,
          message: 'Ya existe una cuenta registrada con ese correo electrónico',
        });
        return;
      }

      const municipioId = await store.findMunicipalityIdByCode(DEFAULT_MUNICIPALITY_CODE);
      if (!municipioId) {
        console.error(`No se encontró el municipio predeterminado ${DEFAULT_MUNICIPALITY_CODE}`);
        res.status(500).json({
          success: false,
          message: 'No se pudo determinar el municipio para crear la cuenta',
        });
        return;
      }

      const user = await store.createCitizen({
        nombre,
        email,
        passwordHash: await hashPassword(password),
        municipioId,
      });

      res.status(201).json({
        success: true,
        token: issueToken(user, tokenSecret),
        user: publicUser(user),
      });
    } catch (error) {
      if (isDuplicateEmailError(error)) {
        res.status(409).json({
          success: false,
          message: 'Ya existe una cuenta registrada con ese correo electrónico',
        });
        return;
      }

      console.error('Error durante el registro:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al registrar la cuenta',
      });
    }
  };

  const login = async (req: Request, res: Response): Promise<void> => {
    const identifier = asString(req.body?.identifier) ?? asString(req.body?.email);
    const password = asString(req.body?.password);

    if (!identifier || !password) {
      res.status(400).json({
        success: false,
        message: 'Por favor, proporciona correo electrónico y contraseña',
      });
      return;
    }

    if (!tokenSecret || Buffer.byteLength(tokenSecret, 'utf8') < 32) {
      res.status(500).json({
        success: false,
        message: 'AUTH_TOKEN_SECRET debe contener al menos 32 caracteres',
      });
      return;
    }

    try {
      const normalizedIdentifier = identifier.toLowerCase();
      const user = await store.findUserByIdentifier(normalizedIdentifier);
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        res.status(401).json({
          success: false,
          message: 'Correo electrónico o contraseña incorrectos',
        });
        return;
      }

      if (!Object.values(Role).includes(user.rol)) {
        res.status(403).json({ success: false, message: 'El rol de la cuenta no es válido' });
        return;
      }

      if (!user.passwordHash.startsWith('scrypt$')) {
        await store.updatePasswordHash(user.id, await hashPassword(password));
      }

      res.status(200).json({
        success: true,
        token: issueToken(user, tokenSecret),
        user: publicUser(user),
      });
    } catch (error) {
      console.error('Error durante el inicio de sesión:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al procesar el inicio de sesión',
      });
    }
  };

  return { login, register };
}

const authHandlers = createAuthHandlers(database, process.env.AUTH_TOKEN_SECRET);

export const login = authHandlers.login;
export const register = authHandlers.register;
