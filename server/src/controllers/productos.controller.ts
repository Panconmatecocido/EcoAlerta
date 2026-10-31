// server/src/controllers/productos.controller.ts

import { Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { ErrorAlmacenamiento, subirImagenProducto } from '../utils/supabaseStorage';

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

    const whereCondition: Prisma.ProductoWhereInput = {
      activo: true,
    };

    if (municipioId) {
      whereCondition.municipioId = String(municipioId);
    }

    if (categoria && String(categoria).trim() !== '' && String(categoria) !== 'Todos') {
      whereCondition.categoria = {
        equals: String(categoria).trim(),
        mode: 'insensitive',
      };
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
const CATEGORIAS_VALIDAS = ['Hogar', 'Limpieza', 'Cuidado Personal', 'Papelería', 'Otros'];

/**
 * POST /api/productos/imagen
 * Recibe { imagen: dataUri } y devuelve la URL pública en Supabase Storage.
 */
export const subirImagen = async (req: Request, res: Response): Promise<void> => {
  try {
    const { imagen } = req.body ?? {};
    if (typeof imagen !== 'string' || !imagen) {
      res.status(400).json({ success: false, message: 'Se requiere la imagen' });
      return;
    }
    const url = await subirImagenProducto(imagen);
    res.status(201).json({ success: true, data: { url } });
  } catch (error) {
    if (error instanceof ErrorAlmacenamiento) {
      res.status(error.estado).json({ success: false, message: error.message });
      return;
    }
    console.error('Error al subir imagen de producto:', error);
    res.status(500).json({ success: false, message: 'Error al subir la imagen' });
  }
};

export const crearProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { titulo, descripcion, costoPuntos, stock, imagenUrl, municipioId, categoria } = req.body;

    const categoriaFinal = categoria === undefined || categoria === null || categoria === '' ? 'Otros' : String(categoria).trim();
    if (!CATEGORIAS_VALIDAS.includes(categoriaFinal)) {
      res.status(400).json({
        success: false,
        message: `categoria inválida. Valores permitidos: ${CATEGORIAS_VALIDAS.join(', ')}`,
      });
      return;
    }

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
        categoria: categoriaFinal,
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
    const { titulo, descripcion, costoPuntos, stock, imagenUrl, activo, categoria } = req.body;

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
    if (categoria !== undefined) {
      const cat = String(categoria).trim();
      if (!CATEGORIAS_VALIDAS.includes(cat)) {
        res.status(400).json({ success: false, message: 'categoria inválida' });
        return;
      }
      updateData.categoria = cat;
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
 * DELETE /api/productos/:id/permanente
 * Eliminación del producto. Devuelve los puntos de los canjes pendientes y notifica a los ciudadanos.
 * Si el producto conserva historial de canjes, queda con baja lógica en lugar de borrarse.
 */
export const eliminarProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const producto = await prisma.producto.findUnique({ where: { id } });
    if (!producto) {
      res.status(404).json({ success: false, message: 'Producto no encontrado' });
      return;
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const itemsAfectados = await tx.itemCanje.findMany({
        where: {
          productoId: id,
          canje: { estado: { in: ['PENDIENTE_RETIRO', 'RESERVADO_PENDIENTE'] } },
        },
        include: { canje: true },
      });

      let canjesReembolsados = 0;
      let puntosDevueltos = 0;

      for (const item of itemsAfectados) {
        const { canje } = item;
        const puntosItem = item.puntosUnit * item.cantidad;
        const itemsRestantes = await tx.itemCanje.count({
          where: { canjeId: canje.id, id: { not: item.id } },
        });

        await tx.itemCanje.delete({ where: { id: item.id } });
        await tx.canje.update({
          where: { id: canje.id },
          data: {
            totalPuntos: { decrement: puntosItem },
            ...(itemsRestantes === 0 ? { estado: 'CANCELADO', bloqueadoHasta: null } : {}),
          },
        });

        // Solo los canjes confirmados tienen los puntos ya descontados; las reservas (5 min) no.
        if (canje.estado !== 'PENDIENTE_RETIRO') continue;

        await tx.user.update({
          where: { id: canje.ciudadanoId },
          data: { puntos: { increment: puntosItem } },
        });

        const detalle =
          itemsRestantes === 0
            ? `tu canje ${canje.codigoRetiro} fue cancelado`
            : `lo quitamos de tu canje ${canje.codigoRetiro} (el resto de tus productos sigue disponible para retirar)`;
        await tx.notificacion.create({
          data: {
            usuarioId: canje.ciudadanoId,
            titulo: 'Tu canje fue modificado',
            mensaje:
              `Lamentamos informarte que el producto "${producto.titulo}" dejó de estar disponible en la tienda, ` +
              `por lo que ${detalle}. Te devolvimos ${puntosItem} puntos a tu saldo. ` +
              'Te pedimos disculpas por las molestias ocasionadas.',
          },
        });

        canjesReembolsados += 1;
        puntosDevueltos += puntosItem;
      }

      // Si queda historial (entregados o cancelados) no se puede borrar físicamente: baja lógica.
      const historial = await tx.itemCanje.count({ where: { productoId: id } });
      if (historial > 0) {
        await tx.producto.update({ where: { id }, data: { activo: false } });
      } else {
        await tx.producto.delete({ where: { id } });
      }

      return { eliminado: historial === 0, canjesReembolsados, puntosDevueltos };
    });

    const partes = [
      resultado.eliminado
        ? 'Producto eliminado definitivamente.'
        : 'El producto tiene historial de canjes, por lo que se dio de baja (oculto en la tienda) en lugar de borrarse.',
    ];
    if (resultado.canjesReembolsados > 0) {
      partes.push(
        `Se devolvieron ${resultado.puntosDevueltos} puntos en ${resultado.canjesReembolsados} canje(s) pendiente(s) y se notificó a los usuarios.`
      );
    }

    res.status(200).json({
      success: true,
      data: resultado,
      message: partes.join(' '),
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar el producto' });
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
