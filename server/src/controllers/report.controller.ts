import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { generateReportCode } from '../utils/reportCode';

/**
 * Get all reports for the authenticated citizen (excluding hidden ones).
 */
export const getReports = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id; // auth middleware sets req.user
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });
    const reports = await prisma.denuncia.findMany({
      where: { ciudadanoId: userId, ocultarUsuario: false },
      orderBy: { creadoEn: 'desc' },
    });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Error al obtener los reportes' });
  }
};

/**
 * Create a new report (Denuncia) from the citizen.
 */
export const createReport = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });

    const {
      titulo,
      descripcion,
      categoria,
      direccion,
      latitud,
      longitud,
      fotoUri,
      municipioId, // el frontend debe enviar el municipioId del ciudadano
    } = req.body;

    if (!municipioId) {
      return res.status(400).json({ error: 'municipioId es requerido' });
    }

    const codigo = await generateReportCode();
    const newReport = await prisma.denuncia.create({
      data: {
        titulo,
        descripcion,
        categoria,
        direccion: direccion ?? '',
        latitud,
        longitud,
        imagenUrl: fotoUri,
        codigo,
        estado: 'PENDIENTE',
        ocultarUsuario: false,
        ciudadanoId: userId,
        municipioId, // ← campo requerido por el schema
      },
    });
    res.status(201).json(newReport);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Error al crear el reporte' });
  }
};

/**
 * Soft‑delete a report (sets ocultarUsuario = true).
 * id es String (UUID) en Prisma, no Number.
 */
export const softDeleteReport = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });
    const { id } = req.params; // id es String (UUID)
    const report = await prisma.denuncia.update({
      where: { id }, // ← sin Number(), es string UUID
      data: { ocultarUsuario: true },
    });
    res.json(report);
  } catch (error) {
    console.error('Error soft‑deleting report:', error);
    res.status(500).json({ error: 'Error al eliminar el reporte' });
  }
};