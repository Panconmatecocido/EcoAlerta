// server/src/controllers/denuncias.controller.ts

import { Request, Response } from 'express';
import { Prisma, PrismaClient, EstadoDenuncia, Role } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Obtener todas las denuncias (con filtros opcionales de estado y búsqueda)
export const obtenerDenuncias = async (req: Request, res: Response): Promise<void> => {
  try {
    const { estado, busqueda, municipioId } = req.query;

    const whereCondition: any = {};

    if (municipioId) {
      whereCondition.municipioId = String(municipioId);
    }

    if (estado && estado !== 'TODAS') {
      whereCondition.estado = estado as EstadoDenuncia;
    }

    if (busqueda) {
      const termino = String(busqueda).toLowerCase();
      whereCondition.OR = [
        { titulo: { contains: termino, mode: 'insensitive' } },
        { direccion: { contains: termino, mode: 'insensitive' } },
        { categoria: { contains: termino, mode: 'insensitive' } },
      ];
    }

    const denuncias = await prisma.denuncia.findMany({
      where: whereCondition,
      include: {
        ciudadano: {
          select: { id: true, nombre: true, email: true },
        },
        agente: {
          select: { id: true, nombre: true, email: true },
        },
      },
      orderBy: { creadoEn: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: denuncias,
    });
  } catch (error) {
    console.error('Error al obtener denuncias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de denuncias',
    });
  }
};

// 2. Obtener métricas/resumen para el Dashboard del Administrador
export const obtenerMetricasAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { municipioId } = req.query;

    const whereMunicipio = municipioId ? { municipioId: String(municipioId) } : {};

    const [pendientes, enProceso, resueltas, totalAgentes] = await Promise.all([
      prisma.denuncia.count({
        where: { ...whereMunicipio, estado: EstadoDenuncia.PENDIENTE },
      }),
      prisma.denuncia.count({
        where: { ...whereMunicipio, estado: EstadoDenuncia.EN_PROCESO },
      }),
      prisma.denuncia.count({
        where: { ...whereMunicipio, estado: EstadoDenuncia.RESUELTO },
      }),
      prisma.user.count({
        where: {
          ...whereMunicipio,
          rol: 'AGENT',
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        denunciasPendientes: pendientes,
        denunciasEnProceso: enProceso,
        denunciasResueltas: resueltas,
        totalAgentesActivos: totalAgentes,
      },
    });
  } catch (error) {
    console.error('Error al obtener métricas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calcular las métricas de administración',
    });
  }
};

// 3. Cambiar el estado de una denuncia (Aprobar, Rechazar, Pendiente, etc.)
export const cambiarEstadoDenuncia = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado || !Object.values(EstadoDenuncia).includes(estado)) {
      res.status(400).json({
        success: false,
        message: 'Estado no válido',
      });
      return;
    }

    const denunciaActualizada = await prisma.denuncia.update({
      where: { id },
      data: { estado },
    });

    res.status(200).json({
      success: true,
      data: denunciaActualizada,
      message: `Estado de denuncia actualizado a ${estado}`,
    });
  } catch (error) {
    console.error('Error al cambiar estado de denuncia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado de la denuncia',
    });
  }
};

// 4. Asignar agente de campo a una denuncia
export const asignarAgenteDenuncia = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { agenteId } = req.body;

    if (!agenteId) {
      res.status(400).json({
        success: false,
        message: 'Debes proporcionar un ID de agente válido',
      });
      return;
    }

    const denunciaActualizada = await prisma.denuncia.update({
      where: { id },
      data: {
        agenteId,
        estado: EstadoDenuncia.EN_PROCESO,
      },
      include: {
        agente: {
          select: { id: true, nombre: true, email: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: denunciaActualizada,
      message: 'Agente asignado exitosamente',
    });
  } catch (error) {
    console.error('Error al asignar agente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar el agente a la denuncia',
    });
  }
};

// Inicio de Fase 2 (Foundational): endpoints ciudadanos y persistencia inicial sin puntos.
const CATEGORIAS_DENUNCIA: Record<string, string> = {
  Microbasural: 'Microbasural',
  'Foco de Dengue': 'Foco de Dengue',
  'Terreno Baldío': 'Terreno Baldío',
  Otro: 'Otro',
  BASURAL: 'Microbasural',
  FOCO_DENGUE: 'Foco de Dengue',
  TERRENO_BALDIO: 'Terreno Baldío',
  OTRO: 'Otro',
};

const parseCoordinate = (value: unknown, min: number, max: number): number | null | undefined => {
  if (value === undefined || value === null || value === '') return null;
  const coordinate = Number(value);
  return Number.isFinite(coordinate) && coordinate >= min && coordinate <= max
    ? coordinate
    : undefined;
};

const crearDenunciaConCodigo = async (
  data: Omit<Prisma.DenunciaCreateInput, 'codigo'>,
  year: number
) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (transaction) => {
          const prefix = `REP-${year}-`;
          const latestReport = await transaction.denuncia.findFirst({
            where: { codigo: { startsWith: prefix } },
            orderBy: { codigo: 'desc' },
            select: { codigo: true },
          });
          const lastSequence = latestReport
            ? Number(latestReport.codigo.slice(prefix.length))
            : 0;

          if (!Number.isInteger(lastSequence) || lastSequence >= 999) {
            throw new Error(`Se agotaron los códigos de reporte para ${year}.`);
          }

          const codigo = `${prefix}${String(lastSequence + 1).padStart(3, '0')}`;
          return transaction.denuncia.create({
            data: { ...data, codigo },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (error) {
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2034' || error.code === 'P2002');
      if (!retryable || attempt === 4) throw error;
    }
  }

  throw new Error('No se pudo reservar un código único para el reporte.');
};

// 5. Crear una nueva denuncia (Ciudadano)
export const crearDenuncia = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      titulo,
      descripcion,
      categoria,
      direccion,
      latitud,
      longitud,
      imagenUrl,
      ciudadanoId,
      municipioId,
    } = req.body;

    const categoriaNormalizada =
      typeof categoria === 'string' ? CATEGORIAS_DENUNCIA[categoria.trim()] : undefined;
    const latitudValidada = parseCoordinate(latitud, -90, 90);
    const longitudValidada = parseCoordinate(longitud, -180, 180);
    if (
      typeof titulo !== 'string' ||
      !titulo.trim() ||
      typeof descripcion !== 'string' ||
      !descripcion.trim() ||
      !categoriaNormalizada ||
      typeof direccion !== 'string' ||
      !direccion.trim() ||
      typeof imagenUrl !== 'string' ||
      !imagenUrl.trim() ||
      typeof ciudadanoId !== 'string' ||
      !ciudadanoId.trim() ||
      typeof municipioId !== 'string' ||
      !municipioId.trim() ||
      latitudValidada === undefined ||
      longitudValidada === undefined ||
      ((latitudValidada === null) !== (longitudValidada === null))
    ) {
      res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios o hay datos inválidos para registrar la denuncia',
      });
      return;
    }

    const ciudadano = await prisma.user.findFirst({
      where: {
        id: String(ciudadanoId),
        municipioId: String(municipioId),
        rol: Role.CITIZEN,
      },
      select: { id: true },
    });

    if (!ciudadano) {
      res.status(404).json({
        success: false,
        message: 'No se encontró un ciudadano válido en el municipio indicado',
      });
      return;
    }

    const nuevaDenuncia = await crearDenunciaConCodigo(
      {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        categoria: categoriaNormalizada,
        direccion: direccion.trim(),
        latitud: latitudValidada,
        longitud: longitudValidada,
        imagenUrl: imagenUrl.trim(),
        ciudadano: { connect: { id: ciudadano.id } },
        municipio: { connect: { id: municipioId } },
        estado: EstadoDenuncia.PENDIENTE,
        puntosOtorgados: 0,
        ocultarUsuario: false,
      },
      new Date().getFullYear()
    );

    res.status(201).json({
      success: true,
      data: nuevaDenuncia,
      message: 'Denuncia registrada exitosamente',
    });
  } catch (error) {
    console.error('Error al crear denuncia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar la nueva denuncia',
    });
  }
};

export const getDenunciasByCiudadano = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ciudadanoId } = req.params;
    const denuncias = await prisma.denuncia.findMany({
      where: { ciudadanoId, ocultarUsuario: false },
      orderBy: { creadoEn: 'desc' },
    });

    res.status(200).json({ success: true, data: denuncias });
  } catch (error) {
    console.error('Error al obtener los reportes del ciudadano:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los reportes del ciudadano',
    });
  }
};

export const hideDenunciaForCitizen = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { ciudadanoId } = req.body as { ciudadanoId?: unknown };

    if (typeof ciudadanoId !== 'string' || !ciudadanoId.trim()) {
      res.status(400).json({
        success: false,
        message: 'Debes proporcionar el ID del ciudadano propietario del reporte',
      });
      return;
    }

    const actualizacion = await prisma.denuncia.updateMany({
      where: { id, ciudadanoId, ocultarUsuario: false },
      data: { ocultarUsuario: true },
    });

    if (actualizacion.count === 0) {
      res.status(404).json({
        success: false,
        message: 'No se encontró un reporte visible perteneciente a ese ciudadano',
      });
      return;
    }

    const denuncia = await prisma.denuncia.findUnique({ where: { id } });
    res.status(200).json({
      success: true,
      data: denuncia,
      message: 'Reporte ocultado del historial del ciudadano',
    });
  } catch (error) {
    console.error('Error al ocultar el reporte del ciudadano:', error);
    res.status(500).json({
      success: false,
      message: 'Error al ocultar el reporte del ciudadano',
    });
  }
};