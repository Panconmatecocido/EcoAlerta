// server/src/controllers/notificaciones.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/notificaciones/ciudadano/:ciudadanoId
 * Avisos persistentes del ciudadano, del más reciente al más antiguo
 */
export const obtenerNotificacionesCiudadano = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ciudadanoId } = req.params;

    const notificaciones = await prisma.notificacion.findMany({
      where: { usuarioId: ciudadanoId },
      orderBy: { creadoEn: 'desc' },
      take: 50,
    });

    res.status(200).json({ success: true, data: notificaciones });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ success: false, message: 'Error al obtener las notificaciones' });
  }
};
