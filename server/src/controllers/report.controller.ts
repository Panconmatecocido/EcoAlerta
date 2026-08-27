import { Request, Response } from 'express';
import { prisma } from '../config/db';

// Obtener todos los reportes
export const getReports = async (req: Request, res: Response) => {
  try {
    const reports = await prisma.report.findMany({
      include: { user: true } // Trae también la info del usuario que hizo el reporte
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los reportes' });
  }
};

// Crear un nuevo reporte
export const createReport = async (req: Request, res: Response) => {
  try {
    const { title, description, location, userId } = req.body;

    const newReport = await prisma.report.create({
      data: {
        title,
        description,
        location,
        userId
      }
    });

    res.status(201).json(newReport);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el reporte' });
  }
};