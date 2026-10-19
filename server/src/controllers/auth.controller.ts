// server/src/controllers/auth.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response): Promise<void> => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    res.status(400).json({
      success: false,
      message: 'Por favor, proporciona identificador y contraseña',
    });
    return;
  }

  try {
    const trimmedIdentifier = identifier.trim().toLowerCase();

    // Buscar usuario por correo electrónico o por nombre
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: trimmedIdentifier, mode: 'insensitive' } },
          { nombre: { equals: trimmedIdentifier, mode: 'insensitive' } },
        ],
      },
      include: {
        municipio: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario o correo no encontrado',
      });
      return;
    }

    // Validación de contraseña (en producción se compara mediante bcrypt)
    if (user.passwordHash !== password.trim()) {
      res.status(401).json({
        success: false,
        message: 'Contraseña incorrecta',
      });
      return;
    }

    // Mapeo del rol de Prisma al cliente
    const roleMapping: Record<string, string> = {
      CITIZEN: 'citizen',
      AGENT: 'agent',
      ADMIN: 'admin',
      COLLABORATOR: 'collaborator',
    };

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.nombre,
        email: user.email,
        role: roleMapping[user.rol] || 'citizen',
        points: user.puntos,
        municipio: user.municipio.nombre,
        municipioId: user.municipioId,
        createdAt: user.creadoEn,
      },
    });
  } catch (error) {
    console.error('Error durante el inicio de sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al procesar el inicio de sesión',
    });
  }
};

/**
 * POST /api/auth/register
 * Registro de un nuevo usuario ciudadano en la base de datos (PostgreSQL)
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  const { nombre, username, email, password } = req.body;
  const targetNombre = (nombre || username || '').trim();
  const targetEmail = (email || '').trim().toLowerCase();
  const targetPassword = (password || '').trim();

  if (!targetNombre || !targetPassword) {
    res.status(400).json({
      success: false,
      message: 'Nombre y contraseña son obligatorios',
    });
    return;
  }

  try {
    const finalEmail = targetEmail || `${targetNombre.toLowerCase().replace(/\s+/g, '')}@ecoalerta.com`;

    // Verificar si ya existe usuario con ese correo o nombre
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: finalEmail, mode: 'insensitive' } },
          { nombre: { equals: targetNombre, mode: 'insensitive' } },
        ],
      },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'El nombre de usuario o correo electrónico ya se encuentra registrado',
      });
      return;
    }

    // Obtener municipio predeterminado (Pilar o primer municipio activo)
    let municipio = await prisma.municipio.findFirst({
      where: { codigo: 'PILAR-BA' },
    });

    if (!municipio) {
      municipio = await prisma.municipio.findFirst();
    }

    if (!municipio) {
      municipio = await prisma.municipio.create({
        data: {
          nombre: 'Municipio de Pilar',
          codigo: 'PILAR-BA',
        },
      });
    }

    const newUser = await prisma.user.create({
      data: {
        nombre: targetNombre,
        email: finalEmail,
        passwordHash: targetPassword,
        rol: 'CITIZEN',
        puntos: 120, // Saldo inicial para permitir pruebas de canje de inmediato
        municipioId: municipio.id,
      },
      include: {
        municipio: true,
      },
    });

    const roleMapping: Record<string, string> = {
      CITIZEN: 'citizen',
      AGENT: 'agent',
      ADMIN: 'admin',
      COLLABORATOR: 'collaborator',
    };

    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.nombre,
        email: newUser.email,
        role: roleMapping[newUser.rol] || 'citizen',
        points: newUser.puntos,
        municipio: newUser.municipio.nombre,
        municipioId: newUser.municipioId,
        createdAt: newUser.creadoEn,
      },
      message: 'Usuario registrado exitosamente en la base de datos',
    });
  } catch (error) {
    console.error('Error durante el registro de usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al procesar el registro',
    });
  }
};

/**
 * GET /api/auth/me
 * Obtener datos actualizados del usuario autenticado directamente desde PostgreSQL
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id, email } = req.query;

    const queryIdentifier = (id as string) || (email as string) || userId;

    if (!queryIdentifier) {
      res.status(400).json({
        success: false,
        message: 'Identificador de usuario no proporcionado',
      });
      return;
    }

    const trimmedIdentifier = queryIdentifier.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: queryIdentifier },
          { email: { equals: trimmedIdentifier, mode: 'insensitive' } },
          ...(queryIdentifier === 'demo-user-1' ? [{ email: 'ejemplo@email.com' }] : []),
          ...(queryIdentifier === 'agent-user-1' ? [{ email: 'agente@municipio.gob.ar' }] : []),
          ...(queryIdentifier === 'admin-user-1' ? [{ email: 'admin@ecoalerta.gob.ar' }] : []),
        ],
      },
      include: {
        municipio: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado en la base de datos',
      });
      return;
    }

    const roleMapping: Record<string, string> = {
      CITIZEN: 'citizen',
      AGENT: 'agent',
      ADMIN: 'admin',
      COLLABORATOR: 'collaborator',
    };

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.nombre,
        email: user.email,
        role: roleMapping[user.rol] || 'citizen',
        points: user.puntos,
        municipio: user.municipio.nombre,
        municipioId: user.municipioId,
        createdAt: user.creadoEn,
      },
    });
  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener datos del usuario',
    });
  }
};