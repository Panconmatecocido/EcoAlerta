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