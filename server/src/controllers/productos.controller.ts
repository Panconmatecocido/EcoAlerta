// server/src/controllers/productos.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const obtenerProductos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { busqueda, municipioId } = req.query;

    const whereCondition: any = {
      activo: true,
    };

    if (municipioId) {
      whereCondition.municipioId = String(municipioId);
    }

    if (busqueda && String(busqueda).trim() !== '') {
      const termino = String(busqueda).trim();
      whereCondition.OR = [
        { titulo: { contains: termino, mode: 'insensitive' } },
        { descripcion: { contains: termino, mode: 'insensitive' } },
      ];
    }

    const productos = await prisma.producto.findMany({
      where: whereCondition,
      orderBy: { creadoEn: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: productos,
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el catálogo de productos',
    });
  }
};
