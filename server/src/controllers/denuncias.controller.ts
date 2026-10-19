// server/src/controllers/denuncias.controller.ts

import { Request, Response } from 'express';
import { PrismaClient, EstadoDenuncia } from '@prisma/client';

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

// 5. Crear una nueva denuncia (Ciudadano)
export const crearDenuncia = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      titulo,
      descripcion,
      categoria,
      direccion,
      ubicacion,
      latitud,
      longitud,
      imagenUrl,
      fotoUri,
      ciudadanoId,
      municipioId,
    } = req.body;

    const direccionFinal = (direccion || ubicacion || '').trim();
    const imagenFinal = imagenUrl || fotoUri || null;
    const mapeoCategorias: Record<string, string> = {
      BASURAL: 'Microbasural',
      FOCO_DENGUE: 'Foco Dengue',
      TERRENO_BALDIO: 'Terreno Baldío',
      OTRO: 'Otro',
    };
    const categoriaFinal = mapeoCategorias[categoria] || categoria || 'Microbasural';

    if (!titulo || !descripcion || !direccionFinal) {
      res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios para registrar la denuncia (título, descripción o dirección/ubicación)',
      });
      return;
    }

    // Resolver Ciudadano y Municipio en la base de datos
    let finalCiudadanoId = ciudadanoId;
    let finalMunicipioId = municipioId;

    if (finalCiudadanoId) {
      const existe = await prisma.user.findUnique({ where: { id: String(finalCiudadanoId) } });
      if (!existe) {
        finalCiudadanoId = null;
      } else {
        if (!finalMunicipioId) finalMunicipioId = existe.municipioId;
      }
    }

    if (!finalCiudadanoId) {
      let ciudadano = await prisma.user.findFirst({
        where: { email: 'ejemplo@email.com' },
      });
      if (!ciudadano) {
        ciudadano = await prisma.user.findFirst({
          where: { rol: 'CITIZEN' },
        });
      }
      if (!ciudadano) {
        ciudadano = await prisma.user.findFirst();
      }
      if (ciudadano) {
        finalCiudadanoId = ciudadano.id;
        if (!finalMunicipioId) finalMunicipioId = ciudadano.municipioId;
      }
    }

    if (!finalMunicipioId) {
      const muni = await prisma.municipio.findFirst();
      if (muni) {
        finalMunicipioId = muni.id;
      }
    }

    // Si aún no existen usuario o municipio (BD vacía sin seed), crearlos para no romper
    if (!finalMunicipioId) {
      const nuevoMuni = await prisma.municipio.create({
        data: {
          nombre: 'Municipio de Pilar',
          codigo: 'PILAR-BA',
        },
      });
      finalMunicipioId = nuevoMuni.id;
    }

    if (!finalCiudadanoId) {
      const nuevoUser = await prisma.user.create({
        data: {
          nombre: 'EcoUsuario',
          email: 'ejemplo@email.com',
          passwordHash: 'password123',
          rol: 'CITIZEN',
          puntos: 120,
          municipioId: finalMunicipioId,
        },
      });
      finalCiudadanoId = nuevoUser.id;
    }

    const codigoGenerado = `REP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;

    const nuevaDenuncia = await prisma.denuncia.create({
      data: {
        codigo: codigoGenerado,
        titulo: String(titulo).trim(),
        descripcion: String(descripcion).trim(),
        categoria: categoriaFinal,
        direccion: direccionFinal,
        latitud: latitud ? parseFloat(String(latitud)) : null,
        longitud: longitud ? parseFloat(String(longitud)) : null,
        imagenUrl: imagenFinal,
        ciudadanoId: finalCiudadanoId,
        municipioId: finalMunicipioId,
      },
      include: {
        ciudadano: {
          select: { id: true, nombre: true, email: true },
        },
      },
    });

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

// 6. Obtener denuncias del ciudadano autenticado
export const obtenerMisDenuncias = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ciudadanoId } = req.query;
    const whereCondition: any = { ocultarUsuario: false };

    if (ciudadanoId) {
      whereCondition.ciudadanoId = String(ciudadanoId);
    }

    const denuncias = await prisma.denuncia.findMany({
      where: whereCondition,
      include: {
        ciudadano: {
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
    console.error('Error al obtener mis denuncias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las denuncias del ciudadano',
    });
  }
};