// server/src/controllers/productos.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Obtener municipio por defecto o desde query
 */
const getMunicipioId = async (queryMunicipioId?: any): Promise<string> => {
  if (queryMunicipioId && String(queryMunicipioId).trim() !== '') {
    return String(queryMunicipioId);
  }
  const defaultMun = await prisma.municipio.findFirst({
    orderBy: { creadoEn: 'asc' },
  });
  return defaultMun?.id || '';
};

/**
 * GET /api/productos
 * Listado público de productos activos para Ciudadano e Invitado
 */
export const obtenerProductos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { busqueda, categoria, municipioId } = req.query;

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

/**
 * GET /api/productos/admin
 * Listado completo de productos (activos e inactivos) para Administrador
 */
export const obtenerProductosAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { busqueda, municipioId } = req.query;

    const whereCondition: any = {};

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
    console.error('Error al obtener productos admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos en panel admin',
    });
  }
};

/**
 * POST /api/productos
 * Crear producto nuevo
 */
export const crearProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { titulo, descripcion, costoPuntos, stock, imagenUrl, municipioId } = req.body;

    if (!titulo || !descripcion || costoPuntos === undefined || stock === undefined) {
      res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios: titulo, descripcion, costoPuntos y stock son requeridos',
      });
      return;
    }

    const puntos = Number(costoPuntos);
    const stockNum = Number(stock);

    if (isNaN(puntos) || puntos < 0 || isNaN(stockNum) || stockNum < 0) {
      res.status(400).json({
        success: false,
        message: 'costoPuntos y stock deben ser números positivos o cero',
      });
      return;
    }

    const resolvedMunicipioId = await getMunicipioId(municipioId);

    const nuevoProducto = await prisma.producto.create({
      data: {
        titulo: String(titulo).trim(),
        descripcion: String(descripcion).trim(),
        costoPuntos: puntos,
        stock: stockNum,
        imagenUrl: imagenUrl ? String(imagenUrl).trim() : null,
        activo: true,
        municipioId: resolvedMunicipioId,
      },
    });

    res.status(201).json({
      success: true,
      data: nuevoProducto,
      message: 'Producto creado exitosamente',
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el producto',
    });
  }
};

/**
 * PUT/PATCH /api/productos/:id
 * Actualizar producto existente (título, descripción, puntos, stock, imagen, activo)
 */
export const actualizarProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, costoPuntos, stock, imagenUrl, activo } = req.body;

    const productoExistente = await prisma.producto.findUnique({
      where: { id },
    });

    if (!productoExistente) {
      res.status(404).json({
        success: false,
        message: 'Producto no encontrado',
      });
      return;
    }

    const updateData: any = {};
    if (titulo !== undefined) updateData.titulo = String(titulo).trim();
    if (descripcion !== undefined) updateData.descripcion = String(descripcion).trim();
    if (costoPuntos !== undefined) {
      const p = Number(costoPuntos);
      if (isNaN(p) || p < 0) {
        res.status(400).json({ success: false, message: 'costoPuntos inválido' });
        return;
      }
      updateData.costoPuntos = p;
    }
    if (stock !== undefined) {
      const s = Number(stock);
      if (isNaN(s) || s < 0) {
        res.status(400).json({ success: false, message: 'stock inválido' });
        return;
      }
      updateData.stock = s;
    }
    if (imagenUrl !== undefined) updateData.imagenUrl = imagenUrl ? String(imagenUrl).trim() : null;
    if (activo !== undefined) updateData.activo = Boolean(activo);

    const productoActualizado = await prisma.producto.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      data: productoActualizado,
      message: 'Producto actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el producto',
    });
  }
};

/**
 * DELETE /api/productos/:id
 * Baja lógica estricta: activo = false (RNF-08 / Principio VI)
 */
export const desactivarProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const producto = await prisma.producto.findUnique({
      where: { id },
    });

    if (!producto) {
      res.status(404).json({
        success: false,
        message: 'Producto no encontrado',
      });
      return;
    }

    const productoDesactivado = await prisma.producto.update({
      where: { id },
      data: { activo: false },
    });

    res.status(200).json({
      success: true,
      data: productoDesactivado,
      message: 'Producto dado de baja lógicamente (activo = false)',
    });
  } catch (error) {
    console.error('Error al desactivar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desactivar el producto',
    });
  }
};

/**
 * GET /api/sucursales
 * Listado de sucursales municipales
 */
export const obtenerSucursales = async (req: Request, res: Response): Promise<void> => {
  try {
    const { municipioId, todas } = req.query;

    const whereCondition: any = {};
    if (todas !== 'true') {
      whereCondition.activa = true;
    }
    if (municipioId) {
      whereCondition.municipioId = String(municipioId);
    }

    const sucursales = await prisma.sucursal.findMany({
      where: whereCondition,
      orderBy: { nombre: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: sucursales,
    });
  } catch (error) {
    console.error('Error al obtener sucursales:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener sucursales',
    });
  }
};

/**
 * POST /api/sucursales
 * Crear sucursal municipal
 */
export const crearSucursal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, direccion, horario, municipioId } = req.body;

    if (!nombre || !direccion) {
      res.status(400).json({
        success: false,
        message: 'nombre y direccion son obligatorios',
      });
      return;
    }

    const resolvedMunicipioId = await getMunicipioId(municipioId);

    const nuevaSucursal = await prisma.sucursal.create({
      data: {
        nombre: String(nombre).trim(),
        direccion: String(direccion).trim(),
        horario: horario ? String(horario).trim() : null,
        activa: true,
        municipioId: resolvedMunicipioId,
      },
    });

    res.status(201).json({
      success: true,
      data: nuevaSucursal,
      message: 'Sucursal creada exitosamente',
    });
  } catch (error) {
    console.error('Error al crear sucursal:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la sucursal',
    });
  }
};

/**
 * PUT/PATCH /api/sucursales/:id
 * Actualizar sucursal municipal
 */
export const actualizarSucursal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombre, direccion, horario, activa } = req.body;

    const sucursalExistente = await prisma.sucursal.findUnique({
      where: { id },
    });

    if (!sucursalExistente) {
      res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada',
      });
      return;
    }

    const updateData: any = {};
    if (nombre !== undefined) updateData.nombre = String(nombre).trim();
    if (direccion !== undefined) updateData.direccion = String(direccion).trim();
    if (horario !== undefined) updateData.horario = horario ? String(horario).trim() : null;
    if (activa !== undefined) updateData.activa = Boolean(activa);

    const sucursalActualizada = await prisma.sucursal.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      data: sucursalActualizada,
      message: 'Sucursal actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error al actualizar sucursal:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la sucursal',
    });
  }
};
