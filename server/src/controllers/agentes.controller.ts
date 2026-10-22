// server/src/controllers/agentes.controller.ts

import { Request, Response } from 'express';
import { EstadoDenuncia, PrismaClient, Role } from '@prisma/client';
import { distanceBetweenCoordinates, isValidCoordinatePair } from '../utils/geo';

const prisma = new PrismaClient();

// 1. Obtener la lista de agentes de campo con sus casos asignados
export const obtenerAgentes = async (req: Request, res: Response): Promise<void> => {
  try {
    const whereCondition = {
      rol: Role.AGENT,
      municipioId: req.auth!.municipioId,
    };

    const agentes = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        nombre: true,
        email: true,
        disponible: true,
        creadoEn: true,
        _count: {
          select: {
            denunciasAsignadas: {
              where: {
                estado: {
                  in: ['PENDIENTE', 'EN_PROCESO'],
                },
              },
            },
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    // Mapeamos los datos para devolver una estructura limpia
    const respuestaAgentes = agentes.map((agente) => ({
      id: agente.id,
      nombre: agente.nombre,
      email: agente.email,
      disponible: agente.disponible,
      casosAsignados: agente._count.denunciasAsignadas,
    }));

    res.status(200).json({
      success: true,
      data: respuestaAgentes,
    });
  } catch (error) {
    console.error('Error al obtener la lista de agentes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al consultar el personal de campo',
    });
  }
};

// 2. Alternar o modificar disponibilidad de un agente (Disponible vs Franco/Ocupado)
export const cambiarDisponibilidadAgente = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id ?? req.auth!.id;
    const { disponible } = req.body;

    if (id !== req.auth!.id) {
      res.status(403).json({
        success: false,
        message: 'Solo puedes modificar tu propia disponibilidad',
      });
      return;
    }

    if (typeof disponible !== 'boolean') {
      res.status(400).json({
        success: false,
        message: 'El campo "disponible" debe ser un valor booleano',
      });
      return;
    }

    if (disponible && !isValidCoordinatePair(req.body?.latitud, req.body?.longitud)) {
      res.status(400).json({
        success: false,
        message: 'Comparte una ubicación GPS válida para activar tu disponibilidad',
      });
      return;
    }

    if (disponible) {
      const casosActivos = await prisma.denuncia.count({
        where: {
          agenteId: id,
          estado: { in: [EstadoDenuncia.EN_VERIFICACION, EstadoDenuncia.EN_SANEAMIENTO] },
        },
      });
      if (casosActivos > 0) {
        res.status(409).json({
          success: false,
          message: 'No puedes estar disponible mientras tienes un caso activo',
        });
        return;
      }
    }

    const agenteActualizado = await prisma.user.update({
      where: { id },
      data: disponible
        ? {
            disponible,
            latitudActual: req.body.latitud,
            longitudActual: req.body.longitud,
            ubicacionActualizadaEn: new Date(),
          }
        : {
            disponible,
            latitudActual: null,
            longitudActual: null,
            ubicacionActualizadaEn: null,
          },
      select: {
        id: true,
        disponible: true,
        ubicacionActualizadaEn: true,
      },
    });

    res.status(200).json({
      success: true,
      data: agenteActualizado,
      message: `Disponibilidad actualizada correctamente`,
    });
  } catch (error) {
    console.error('Error al cambiar disponibilidad del agente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado del agente',
    });
  }
};

export const actualizarUbicacionAgente = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { latitud, longitud } = req.body ?? {};
    if (!isValidCoordinatePair(latitud, longitud)) {
      res.status(400).json({
        success: false,
        message: 'La ubicación GPS debe incluir latitud y longitud válidas',
      });
      return;
    }

    const agente = await prisma.user.findUnique({
      where: { id: req.auth!.id },
      select: { disponible: true },
    });
    if (!agente?.disponible) {
      res.status(409).json({
        success: false,
        message: 'Debes estar disponible para actualizar tu ubicación',
      });
      return;
    }

    const actualizado = await prisma.user.update({
      where: { id: req.auth!.id },
      data: {
        latitudActual: latitud,
        longitudActual: longitud,
        ubicacionActualizadaEn: new Date(),
      },
      select: { ubicacionActualizadaEn: true },
    });

    res.status(200).json({ success: true, data: actualizado });
  } catch (error) {
    console.error('Error al actualizar la ubicación actual del agente:', error);
    res.status(500).json({
      success: false,
      message: 'No se pudo actualizar la ubicación del agente',
    });
  }
};

export const obtenerAgentesDisponiblesParaDenuncia = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const denuncia = await prisma.denuncia.findFirst({
      where: { id: req.params.id, municipioId: req.auth!.municipioId },
      select: { id: true, municipioId: true, latitud: true, longitud: true },
    });
    if (!denuncia) {
      res.status(404).json({ success: false, message: 'Reporte no encontrado' });
      return;
    }
    if (!isValidCoordinatePair(denuncia.latitud, denuncia.longitud)) {
      res.status(422).json({
        success: false,
        message: 'El reporte no tiene coordenadas GPS para calcular cercanía',
      });
      return;
    }

    const agentes = await prisma.user.findMany({
      where: {
        rol: Role.AGENT,
        municipioId: denuncia.municipioId,
        disponible: true,
        latitudActual: { not: null },
        longitudActual: { not: null },
        ubicacionActualizadaEn: { not: null },
      },
      select: {
        id: true,
        nombre: true,
        disponible: true,
        latitudActual: true,
        longitudActual: true,
        ubicacionActualizadaEn: true,
        _count: {
          select: {
            denunciasAsignadas: {
              where: {
                estado: {
                  in: [EstadoDenuncia.EN_VERIFICACION, EstadoDenuncia.EN_SANEAMIENTO],
                },
              },
            },
          },
        },
      },
    });

    const candidatos = agentes
      .filter(
        (agente) =>
          agente._count.denunciasAsignadas === 0 &&
          isValidCoordinatePair(agente.latitudActual, agente.longitudActual) &&
          agente.ubicacionActualizadaEn !== null
      )
      .map((agente) => ({
        id: agente.id,
        nombre: agente.nombre,
        disponible: agente.disponible,
        casosActivos: agente._count.denunciasAsignadas,
        distanciaMetros: distanceBetweenCoordinates(
          denuncia.latitud!,
          denuncia.longitud!,
          agente.latitudActual!,
          agente.longitudActual!
        ),
        ubicacionActualizadaEn: agente.ubicacionActualizadaEn,
      }))
      .sort((first, second) => first.distanciaMetros - second.distanciaMetros);

    res.status(200).json({ success: true, data: candidatos });
  } catch (error) {
    console.error('Error al consultar agentes disponibles para el reporte:', error);
    res.status(500).json({
      success: false,
      message: 'No se pudieron consultar los agentes disponibles',
    });
  }
};

// 3. Registrar un nuevo agente de campo para el municipio
export const crearAgente = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, email, password } = req.body;
    const municipioId = req.auth!.municipioId;

    if (!nombre || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Faltan datos obligatorios para registrar al agente',
      });
      return;
    }

    // Verificar si el correo ya está registrado
    const existeUsuario = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existeUsuario) {
      res.status(400).json({
        success: false,
        message: 'Ya existe un usuario o agente registrado con ese correo electrónico',
      });
      return;
    }

    const nuevoAgente = await prisma.user.create({
      data: {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        passwordHash: password.trim(),
        rol: Role.AGENT,
        disponible: false,
        municipioId,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        disponible: true,
      },
    });

    res.status(201).json({
      success: true,
      data: nuevoAgente,
      message: 'Agente registrado exitosamente',
    });
  } catch (error) {
    console.error('Error al crear agente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al dar de alta al nuevo agente',
    });
  }
};