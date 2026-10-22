// server/src/controllers/denuncias.controller.ts

import { Request, Response } from 'express';
import {
  Prisma,
  PrismaClient,
  EstadoDenuncia,
  Prioridad,
  Role,
} from '@prisma/client';

const prisma = new PrismaClient();

// 1. Obtener todas las denuncias (con filtros opcionales de estado y búsqueda)
export const obtenerDenuncias = async (req: Request, res: Response): Promise<void> => {
  try {
    const { estado, busqueda } = req.query;

    const whereCondition: Prisma.DenunciaWhereInput = {
      municipioId: req.auth!.municipioId,
    };

    if (estado !== undefined && estado !== 'TODAS') {
      if (typeof estado !== 'string' || !Object.values(EstadoDenuncia).includes(estado as EstadoDenuncia)) {
        res.status(400).json({ success: false, message: 'El filtro de estado no es válido' });
        return;
      }
      whereCondition.estado = estado as EstadoDenuncia;
    }

    if (busqueda) {
      if (typeof busqueda !== 'string') {
        res.status(400).json({ success: false, message: 'El filtro de búsqueda no es válido' });
        return;
      }
      const termino = busqueda.trim();
      if (!termino) {
        res.status(400).json({ success: false, message: 'El filtro de búsqueda no es válido' });
        return;
      }
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
    const whereMunicipio = { municipioId: req.auth!.municipioId };

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

export const triajeDenuncia = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { accion, prioridad, observacionesAdmin } = req.body as {
      accion?: unknown;
      prioridad?: unknown;
      observacionesAdmin?: unknown;
    };
    if (accion !== 'APROBAR' && accion !== 'RECHAZAR') {
      res.status(400).json({ success: false, message: 'La acción de triaje no es válida' });
      return;
    }

    let data: Prisma.DenunciaUncheckedUpdateManyInput;
    if (accion === 'APROBAR') {
      if (typeof prioridad !== 'string' || !Object.values(Prioridad).includes(prioridad as Prioridad)) {
        res.status(400).json({ success: false, message: 'Debes seleccionar una prioridad válida' });
        return;
      }
      data = {
        estado: EstadoDenuncia.APROBADO,
        prioridad: prioridad as Prioridad,
        agenteId: null,
      };
    } else {
      if (typeof observacionesAdmin !== 'string' || !observacionesAdmin.trim()) {
        res.status(400).json({
          success: false,
          message: 'Debes indicar el motivo para rechazar el reporte',
        });
        return;
      }
      data = {
        estado: EstadoDenuncia.RECHAZADO,
        observacionesAdmin: observacionesAdmin.trim(),
        puntosOtorgados: 0,
      };
    }

    const resultado = await prisma.denuncia.updateMany({
      where: {
        id,
        municipioId: req.auth!.municipioId,
        estado: EstadoDenuncia.PENDIENTE,
      },
      data,
    });
    if (resultado.count === 0) {
      const actual = await prisma.denuncia.findFirst({
        where: { id, municipioId: req.auth!.municipioId },
        select: { id: true },
      });
      res.status(actual ? 409 : 404).json({
        success: false,
        message: actual
          ? 'El reporte ya no está pendiente de triaje'
          : 'Denuncia no encontrada',
      });
      return;
    }

    const denunciaActualizada = await prisma.denuncia.findFirst({
      where: { id, municipioId: req.auth!.municipioId },
    });
    res.status(200).json({
      success: true,
      data: denunciaActualizada,
      message: accion === 'APROBAR' ? 'Reporte aprobado' : 'Reporte rechazado',
    });
  } catch (error) {
    console.error('Error al realizar el triaje de la denuncia:', error);
    res.status(500).json({ success: false, message: 'No se pudo realizar el triaje' });
  }
};

export const asignarAgenteDenuncia = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { agenteId } = req.body as { agenteId?: unknown };
    if (typeof agenteId !== 'string' || !agenteId.trim()) {
      res.status(400).json({ success: false, message: 'Debes proporcionar un ID de agente válido' });
      return;
    }

    const result = await prisma.$transaction(
      async (transaction) => {
        const report = await transaction.denuncia.findFirst({
          where: { id, municipioId: req.auth!.municipioId },
          select: { id: true, estado: true, agenteId: true, latitud: true, longitud: true },
        });
        if (!report) return { status: 404 as const, message: 'Denuncia no encontrada' };
        if (report.estado !== EstadoDenuncia.APROBADO || report.agenteId !== null) {
          return { status: 409 as const, message: 'El reporte ya no está disponible para asignación' };
        }
        if (
          typeof report.latitud !== 'number' ||
          !Number.isFinite(report.latitud) ||
          report.latitud < -90 ||
          report.latitud > 90 ||
          typeof report.longitud !== 'number' ||
          !Number.isFinite(report.longitud) ||
          report.longitud < -180 ||
          report.longitud > 180
        ) {
          return { status: 409 as const, message: 'El reporte no tiene una ubicación GPS válida' };
        }

        const agent = await transaction.user.findFirst({
          where: {
            id: agenteId,
            municipioId: req.auth!.municipioId,
            rol: Role.AGENT,
          },
          select: {
            id: true,
            municipioId: true,
            disponible: true,
            latitudActual: true,
            longitudActual: true,
            ubicacionActualizadaEn: true,
          },
        });
        if (!agent || agent.municipioId !== req.auth!.municipioId) {
          return { status: 404 as const, message: 'Agente no encontrado en el municipio' };
        }
        if (
          !agent.disponible ||
          typeof agent.latitudActual !== 'number' ||
          !Number.isFinite(agent.latitudActual) ||
          agent.latitudActual < -90 ||
          agent.latitudActual > 90 ||
          typeof agent.longitudActual !== 'number' ||
          !Number.isFinite(agent.longitudActual) ||
          agent.longitudActual < -180 ||
          agent.longitudActual > 180 ||
          !(agent.ubicacionActualizadaEn instanceof Date) ||
          Number.isNaN(agent.ubicacionActualizadaEn.getTime())
        ) {
          return { status: 409 as const, message: 'El agente no está disponible con una ubicación actual' };
        }

        const activeCases = await transaction.denuncia.count({
          where: {
            agenteId: agent.id,
            estado: {
              in: [EstadoDenuncia.EN_VERIFICACION, EstadoDenuncia.EN_SANEAMIENTO],
            },
          },
        });
        if (activeCases > 0) {
          return { status: 409 as const, message: 'El agente ya tiene un caso activo' };
        }

        const updated = await transaction.denuncia.updateMany({
          where: {
            id,
            municipioId: req.auth!.municipioId,
            estado: EstadoDenuncia.APROBADO,
            agenteId: null,
          },
          data: {
            agenteId: agent.id,
            estado: EstadoDenuncia.EN_VERIFICACION,
          },
        });
        if (updated.count === 0) {
          return { status: 409 as const, message: 'El reporte acaba de ser asignado a otro agente' };
        }

        const persisted = await transaction.denuncia.findFirst({
          where: { id, municipioId: req.auth!.municipioId },
          include: { agente: { select: { id: true, nombre: true } } },
        });
        return { status: 200 as const, data: persisted };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    if (result.status !== 200) {
      res.status(result.status).json({ success: false, message: result.message });
      return;
    }
    res.status(200).json({
      success: true,
      data: result.data,
      message: 'Agente asignado y reporte reservado para verificación',
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2034'
    ) {
      res.status(409).json({
        success: false,
        message: 'El reporte o el agente cambiaron durante la asignación; vuelve a intentarlo',
      });
      return;
    }
    console.error('Error al asignar agente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar el agente a la denuncia',
    });
  }
};

export const getBolsaCasos = async (req: Request, res: Response): Promise<void> => {
  try {
    const reports = await prisma.denuncia.findMany({
      where: {
        municipioId: req.auth!.municipioId,
        agenteId: null,
        estado: { in: [EstadoDenuncia.APROBADO, EstadoDenuncia.EN_SANEAMIENTO] },
      },
      orderBy: { creadoEn: 'asc' },
    });
    const priorityOrder: Record<Prioridad, number> = {
      [Prioridad.URGENTE]: 0,
      [Prioridad.ALTA]: 1,
      [Prioridad.MEDIA]: 2,
      [Prioridad.BAJA]: 3,
    };
    reports.sort(
      (left, right) =>
        priorityOrder[left.prioridad] - priorityOrder[right.prioridad] ||
        left.creadoEn.getTime() - right.creadoEn.getTime()
    );
    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    console.error('Error al obtener la bolsa de casos:', error);
    res.status(500).json({ success: false, message: 'No se pudo obtener la bolsa de casos' });
  }
};

export const tomarCasoAtomico = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const agentId = req.auth!.id;
    const result = await prisma.$transaction(
      async (transaction) => {
        const agent = await transaction.user.findFirst({
          where: {
            id: agentId,
            municipioId: req.auth!.municipioId,
            rol: Role.AGENT,
            disponible: true,
          },
          select: { id: true },
        });
        if (!agent) return { status: 409 as const, message: 'Debes estar disponible para tomar un caso' };

        const activeCases = await transaction.denuncia.count({
          where: {
            agenteId: agent.id,
            estado: { in: [EstadoDenuncia.EN_VERIFICACION, EstadoDenuncia.EN_SANEAMIENTO] },
          },
        });
        if (activeCases > 0) {
          return { status: 409 as const, message: 'Ya tienes un caso activo asignado' };
        }

        const reportToTake = await transaction.denuncia.findFirst({
          where: { id, municipioId: req.auth!.municipioId },
          select: { id: true, estado: true, agenteId: true },
        });
        if (!reportToTake) return { status: 404 as const, message: 'Caso no encontrado en el municipio' };
        if (
          reportToTake.agenteId !== null ||
          (reportToTake.estado !== EstadoDenuncia.APROBADO &&
            reportToTake.estado !== EstadoDenuncia.EN_SANEAMIENTO)
        ) {
          return { status: 409 as const, message: 'Este caso ya no está disponible para tomar' };
        }

        const updated = await transaction.denuncia.updateMany({
          where: {
            id,
            municipioId: req.auth!.municipioId,
            agenteId: null,
            estado: reportToTake.estado,
          },
          data: {
            agenteId: agent.id,
            estado:
              reportToTake.estado === EstadoDenuncia.APROBADO
                ? EstadoDenuncia.EN_VERIFICACION
                : EstadoDenuncia.EN_SANEAMIENTO,
          },
        });
        if (updated.count === 0) {
          return { status: 409 as const, message: 'Este caso acaba de ser tomado por otro agente' };
        }
        const persistedReport = await transaction.denuncia.findFirst({
          where: { id, municipioId: req.auth!.municipioId },
        });
        return { status: 200 as const, data: persistedReport };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
    if (result.status !== 200) {
      res.status(result.status).json({ success: false, message: result.message });
      return;
    }
    res.status(200).json({ success: true, data: result.data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      res.status(409).json({ success: false, message: 'Ya tienes un caso activo asignado' });
      return;
    }
    console.error('Error al tomar el caso:', error);
    res.status(500).json({ success: false, message: 'No se pudo tomar el caso' });
  }
};

export const verificarInSitu = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { resultado, fotoVerificacionUrl, observaciones } = req.body as {
      resultado?: unknown;
      fotoVerificacionUrl?: unknown;
      observaciones?: unknown;
    };
    if (
      !['REAL', 'FALSO', 'INACCESIBLE'].includes(String(resultado)) ||
      typeof fotoVerificacionUrl !== 'string' ||
      !fotoVerificacionUrl.trim()
    ) {
      res.status(400).json({
        success: false,
        message: 'Debes indicar un resultado válido y adjuntar la foto de verificación',
      });
      return;
    }
    if (observaciones !== undefined && typeof observaciones !== 'string') {
      res.status(400).json({ success: false, message: 'Las observaciones no son válidas' });
      return;
    }

    const result = await prisma.$transaction(
      async (transaction) => {
        const report = await transaction.denuncia.findFirst({
          where: {
            id,
            municipioId: req.auth!.municipioId,
            agenteId: req.auth!.id,
            estado: EstadoDenuncia.EN_VERIFICACION,
          },
          select: { id: true, intentosInaccesible: true },
        });
        if (!report) return { status: 409 as const, message: 'No tienes asignada una verificación pendiente' };

        let data: Prisma.DenunciaUncheckedUpdateManyInput;
        let intentosInaccesible: number | undefined;
        if (resultado === 'REAL') {
          data = {
            estado: EstadoDenuncia.VERIFICADO_PENDIENTE,
            fotoVerificacionUrl: fotoVerificacionUrl.trim(),
            fechaVerificacion: new Date(),
          };
        } else if (resultado === 'FALSO') {
          data = {
            estado: EstadoDenuncia.RECHAZADO,
            fotoVerificacionUrl: fotoVerificacionUrl.trim(),
            observacionesAdmin:
              typeof observaciones === 'string' && observaciones.trim()
                ? observaciones.trim()
                : 'Falso reporte verificado en terreno',
            puntosOtorgados: 0,
            agenteId: null,
          };
        } else {
          intentosInaccesible = report.intentosInaccesible + 1;
          data = {
            intentosInaccesible,
            fotoVerificacionUrl: fotoVerificacionUrl.trim(),
            ...(intentosInaccesible >= 3
              ? { estado: EstadoDenuncia.CERRADO_INACCESIBLE, agenteId: null }
              : { estado: EstadoDenuncia.EN_VERIFICACION }),
          };
        }

        const updated = await transaction.denuncia.updateMany({
          where: {
            id,
            municipioId: req.auth!.municipioId,
            agenteId: req.auth!.id,
            estado: EstadoDenuncia.EN_VERIFICACION,
            ...(resultado === 'INACCESIBLE'
              ? { intentosInaccesible: report.intentosInaccesible }
              : {}),
          },
          data,
        });
        if (updated.count === 0) {
          return { status: 409 as const, message: 'El caso cambió; vuelve a cargarlo' };
        }
        const persisted = await transaction.denuncia.findFirst({
          where: { id, municipioId: req.auth!.municipioId },
        });
        return {
          status: 200 as const,
          data: persisted,
          message:
            intentosInaccesible === undefined
              ? 'Verificación registrada'
              : intentosInaccesible >= 3
                ? 'Caso cerrado tras el tercer intento inaccesible'
                : `Intento ${intentosInaccesible} de 3 registrado`,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
    if (result.status !== 200) {
      res.status(result.status).json({ success: false, message: result.message });
      return;
    }
    res.status(200).json({ success: true, data: result.data, message: result.message });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      res.status(409).json({ success: false, message: 'El caso cambió; vuelve a cargarlo' });
      return;
    }
    console.error('Error al verificar el caso en terreno:', error);
    res.status(500).json({ success: false, message: 'No se pudo registrar la verificación' });
  }
};

export const liberarCaso = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const isAdmin = req.auth!.rol === Role.ADMIN;
    const report = await prisma.denuncia.findFirst({
      where: {
        id,
        municipioId: req.auth!.municipioId,
        ...(isAdmin ? {} : { agenteId: req.auth!.id }),
        estado: { in: [EstadoDenuncia.EN_VERIFICACION, EstadoDenuncia.EN_SANEAMIENTO] },
      },
      select: { estado: true },
    });
    if (!report) {
      res.status(404).json({ success: false, message: 'No se encontró un caso asignado para liberar' });
      return;
    }

    const updated = await prisma.denuncia.updateMany({
      where: {
        id,
        municipioId: req.auth!.municipioId,
        agenteId: isAdmin ? { not: null } : req.auth!.id,
        estado: report.estado,
      },
      data: {
        estado:
          report.estado === EstadoDenuncia.EN_VERIFICACION
            ? EstadoDenuncia.APROBADO
            : EstadoDenuncia.EN_SANEAMIENTO,
        agenteId: null,
      },
    });
    if (updated.count === 0) {
      res.status(409).json({ success: false, message: 'El caso cambió y no se pudo liberar' });
      return;
    }
    const persisted = await prisma.denuncia.findFirst({
      where: { id, municipioId: req.auth!.municipioId },
    });
    res.status(200).json({ success: true, data: persisted, message: 'Caso liberado a la bolsa' });
  } catch (error) {
    console.error('Error al liberar el caso:', error);
    res.status(500).json({ success: false, message: 'No se pudo liberar el caso' });
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