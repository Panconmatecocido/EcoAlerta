// server/src/controllers/agentes.controller.ts

import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Obtener la lista de agentes de campo con sus casos asignados
export const obtenerAgentes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { municipioId } = req.query;

    const whereCondition: any = {
      rol: Role.AGENT,
    };

    if (municipioId) {
      whereCondition.municipioId = String(municipioId);
    }

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
    const { id } = req.params;
    const { disponible } = req.body;

    if (typeof disponible !== 'boolean') {
      res.status(400).json({
        success: false,
        message: 'El campo "disponible" debe ser un valor booleano',
      });
      return;
    }

    const agenteActualizado = await prisma.user.update({
      where: { id },
      data: { disponible },
      select: {
        id: true,
        nombre: true,
        email: true,
        disponible: true,
      },
    });

    res.status(200).json({
      success: true,
      data: agenteActualizado,
      message: `Disponibilidad de ${agenteActualizado.nombre} actualizada correctamente`,
    });
  } catch (error) {
    console.error('Error al cambiar disponibilidad del agente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado del agente',
    });
  }
};

// 3. Registrar un nuevo agente de campo para el municipio
export const crearAgente = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, email, password, municipioId } = req.body;

    if (!nombre || !email || !password || !municipioId) {
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
        disponible: true,
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