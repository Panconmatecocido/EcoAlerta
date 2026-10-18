import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

export const prisma = new PrismaClient();

/**
 * Función auxiliar para liberar todas las reservas que superaron los 5 minutos (TTL).
 * Puede ejecutarse internamente antes de operar o mediante un worker/cron.
 */
export const liberarReservasVencidas = async (tx?: Prisma.TransactionClient): Promise<number> => {
  const db = tx || prisma;
  const ahora = new Date();

  // Buscar canjes en RESERVADO_PENDIENTE cuyo bloqueadoHasta ya expiró
  const canjesVencidos = await db.canje.findMany({
    where: {
      estado: 'RESERVADO_PENDIENTE',
      bloqueadoHasta: {
        lt: ahora,
      },
    },
    include: {
      items: true,
    },
  });

  if (canjesVencidos.length === 0) {
    return 0;
  }

  for (const canje of canjesVencidos) {
    // Restaurar el stock de cada producto
    for (const item of canje.items) {
      await db.producto.update({
        where: { id: item.productoId },
        data: {
          stock: {
            increment: item.cantidad,
          },
        },
      });
    }

    // Cancelar la reserva
    await db.canje.update({
      where: { id: canje.id },
      data: {
        estado: 'CANCELADO',
      },
    });
  }

  return canjesVencidos.length;
};

/**
 * POST /api/canjes/liberar-vencidas
 * Endpoint utilitario para forzar la liberación de reservas expiradas
 */
export const liberarReservasVencidasEndpoint = async (_req: Request, res: Response): Promise<void> => {
  try {
    const liberadas = await prisma.$transaction(async (tx) => {
      return await liberarReservasVencidas(tx);
    });

    res.status(200).json({
      success: true,
      liberadas,
      message: `Se liberaron ${liberadas} reservas vencidas`,
    });
  } catch (error) {
    console.error('Error al liberar reservas vencidas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al liberar reservas vencidas',
    });
  }
};

/**
 * POST /api/canjes/reservar
 * Fase 1 del Checkout: Bloqueo temporal de stock por 5 minutos (300 segundos)
 */
export const reservarCanje = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ciudadanoId, items } = req.body;

    if (!ciudadanoId) {
      res.status(400).json({
        success: false,
        message: 'ciudadanoId es requerido para iniciar la reserva',
      });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Debe incluir al menos un producto en la reserva',
      });
      return;
    }

    // Validar formato de items
    for (const item of items) {
      if (!item.productoId || typeof item.cantidad !== 'number' || item.cantidad <= 0) {
        res.status(400).json({
          success: false,
          message: 'Cada ítem debe contener productoId y cantidad mayor a cero',
        });
        return;
      }
    }

    // Ejecutar primero la limpieza de reservas vencidas
    await prisma.$transaction(async (tx) => {
      await liberarReservasVencidas(tx);
    });

    // Iniciar transacción de reserva de stock
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Verificar existencia y saldo del usuario
      const usuario = await tx.user.findUnique({
        where: { id: ciudadanoId },
      });

      if (!usuario) {
        throw { statusCode: 404, message: 'Usuario ciudadano no encontrado' };
      }

      // 2. Verificar disponibilidad de cada producto y calcular total de puntos
      let totalPuntos = 0;
      const productosDetalle: Array<{ id: string; titulo: string; costoPuntos: number; cantidad: number }> = [];

      for (const item of items) {
        const producto = await tx.producto.findUnique({
          where: { id: item.productoId },
        });

        if (!producto || !producto.activo) {
          throw {
            statusCode: 400,
            message: `El producto ${item.productoId} no existe o no está activo`,
          };
        }

        if (producto.stock < item.cantidad) {
          throw {
            statusCode: 409,
            message: `Stock insuficiente para el producto: ${producto.titulo}. Disponible: ${producto.stock}, Solicitado: ${item.cantidad}`,
          };
        }

        totalPuntos += producto.costoPuntos * item.cantidad;
        productosDetalle.push({
          id: producto.id,
          titulo: producto.titulo,
          costoPuntos: producto.costoPuntos,
          cantidad: item.cantidad,
        });
      }

      // 3. Validar que el usuario tenga puntos suficientes
      if (usuario.puntos < totalPuntos) {
        throw {
          statusCode: 400,
          message: `Puntos insuficientes. Posee ${usuario.puntos} PTS y requiere ${totalPuntos} PTS`,
        };
      }

      // 4. Decrementar preventivamente el stock de cada producto
      for (const prod of productosDetalle) {
        await tx.producto.update({
          where: { id: prod.id },
          data: {
            stock: {
              decrement: prod.cantidad,
            },
          },
        });
      }

      // 5. Crear el registro de canje con TTL de 5 minutos (300.000 ms)
      const ahora = new Date();
      const bloqueadoHasta = new Date(ahora.getTime() + 5 * 60 * 1000);
      const codigoTemporal = `RES-${Date.now().toString().slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;

      const canjeCreado = await tx.canje.create({
        data: {
          codigoRetiro: codigoTemporal,
          totalPuntos,
          estado: 'RESERVADO_PENDIENTE',
          bloqueadoHasta,
          ciudadanoId,
          items: {
            create: productosDetalle.map((p) => ({
              productoId: p.id,
              cantidad: p.cantidad,
              puntosUnit: p.costoPuntos,
            })),
          },
        },
        include: {
          items: {
            include: {
              producto: true,
            },
          },
        },
      });

      return {
        canje: canjeCreado,
        tiempoRestanteSegundos: 300,
        bloqueadoHasta,
      };
    });

    res.status(201).json({
      success: true,
      data: resultado.canje,
      tiempoRestanteSegundos: resultado.tiempoRestanteSegundos,
      bloqueadoHasta: resultado.bloqueadoHasta,
      message: 'Stock reservado exitosamente por 5 minutos',
    });
  } catch (error: any) {
    console.error('Error al reservar canje:', error);
    const statusCode = error?.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error?.message || 'Error al procesar la reserva de stock',
    });
  }
};

/**
 * POST /api/canjes/:id/cancelar-reserva
 * Cancelación manual de la reserva por parte del vecino o al cerrar modal
 */
export const cancelarReserva = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const resultado = await prisma.$transaction(async (tx) => {
      const canje = await tx.canje.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!canje) {
        throw { statusCode: 404, message: 'Reserva no encontrada' };
      }

      if (canje.estado !== 'RESERVADO_PENDIENTE') {
        return {
          canje,
          mensaje: 'La reserva ya no se encontraba en estado pendiente',
        };
      }

      // Devolver el stock a cada producto
      for (const item of canje.items) {
        await tx.producto.update({
          where: { id: item.productoId },
          data: {
            stock: {
              increment: item.cantidad,
            },
          },
        });
      }

      // Marcar como CANCELADO
      const canjeActualizado = await tx.canje.update({
        where: { id },
        data: {
          estado: 'CANCELADO',
          bloqueadoHasta: null,
        },
      });

      return {
        canje: canjeActualizado,
        mensaje: 'Reserva cancelada y stock restituido al catálogo',
      };
    });

    res.status(200).json({
      success: true,
      data: resultado.canje,
      message: resultado.mensaje,
    });
  } catch (error: any) {
    console.error('Error al cancelar reserva:', error);
    const statusCode = error?.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error?.message || 'Error al cancelar la reserva',
    });
  }
};

/**
 * POST /api/canjes/:id/confirmar
 * Fase 2 del Checkout: Descuento atómico de puntos, emisión del voucher ECO-2026-XXXX con 30 días de vigencia
 */
export const confirmarCanje = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { sucursalId, ciudadanoId } = req.body;

    if (!sucursalId) {
      res.status(400).json({
        success: false,
        message: 'Debe seleccionar una sucursal municipal para el retiro de los productos',
      });
      return;
    }

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Obtener el canje con sus ítems
      const canje = await tx.canje.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!canje) {
        throw { statusCode: 404, message: 'Reserva de canje no encontrada' };
      }

      if (canje.estado !== 'RESERVADO_PENDIENTE') {
        throw {
          statusCode: 400,
          message: `El canje no puede confirmarse porque se encuentra en estado: ${canje.estado}`,
        };
      }

      // 2. Validar que la reserva no haya expirado (> 5 minutos)
      const ahora = new Date();
      if (canje.bloqueadoHasta && ahora > canje.bloqueadoHasta) {
        // Liberar el stock preventivo retenido
        for (const item of canje.items) {
          await tx.producto.update({
            where: { id: item.productoId },
            data: {
              stock: {
                increment: item.cantidad,
              },
            },
          });
        }

        // Cancelar el canje
        await tx.canje.update({
          where: { id },
          data: {
            estado: 'CANCELADO',
            bloqueadoHasta: null,
          },
        });

        throw {
          statusCode: 410,
          message: 'El tiempo de reserva de 5 minutos ha expirado. Por favor, reinicia el canje.',
        };
      }

      // 3. Validar existencia y vigencia de la sucursal
      const sucursal = await tx.sucursal.findUnique({
        where: { id: sucursalId },
      });

      if (!sucursal || !sucursal.activa) {
        throw {
          statusCode: 400,
          message: 'La sucursal seleccionada no existe o se encuentra inactiva',
        };
      }

      // 4. Validar saldo del usuario y descontar puntos
      const targetUserId = ciudadanoId || canje.ciudadanoId;
      const usuario = await tx.user.findUnique({
        where: { id: targetUserId },
      });

      if (!usuario) {
        throw { statusCode: 404, message: 'Usuario no encontrado' };
      }

      if (usuario.puntos < canje.totalPuntos) {
        throw {
          statusCode: 400,
          message: `Saldo insuficiente. Posee ${usuario.puntos} PTS y el canje requiere ${canje.totalPuntos} PTS`,
        };
      }

      const usuarioActualizado = await tx.user.update({
        where: { id: targetUserId },
        data: {
          puntos: {
            decrement: canje.totalPuntos,
          },
        },
      });

      // 5. Generar código de retiro oficial único ECO-2026-XXXX
      const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let sufijoAleatorio = '';
      for (let i = 0; i < 4; i++) {
        sufijoAleatorio += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
      }
      const codigoRetiroOficial = `ECO-2026-${sufijoAleatorio}`;

      // 6. Caducidad a 30 días corridos
      const fechaExpiracion = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000);

      const canjeConfirmado = await tx.canje.update({
        where: { id },
        data: {
          codigoRetiro: codigoRetiroOficial,
          estado: 'PENDIENTE_RETIRO',
          sucursalId: sucursal.id,
          bloqueadoHasta: null,
          fechaExpiracion,
        },
        include: {
          sucursal: true,
          items: {
            include: {
              producto: true,
            },
          },
        },
      });

      return {
        canje: canjeConfirmado,
        nuevoSaldoPuntos: usuarioActualizado.puntos,
        codigoRetiro: codigoRetiroOficial,
        fechaExpiracion,
        sucursal: {
          id: sucursal.id,
          nombre: sucursal.nombre,
          direccion: sucursal.direccion,
          horario: sucursal.horario,
        },
        avisoDisponibilidad: 'Disponible para retiro a partir de las 48 hs hábiles',
      };
    });

    res.status(200).json({
      success: true,
      data: resultado.canje,
      nuevoSaldoPuntos: resultado.nuevoSaldoPuntos,
      codigoRetiro: resultado.codigoRetiro,
      fechaExpiracion: resultado.fechaExpiracion,
      sucursal: resultado.sucursal,
      avisoDisponibilidad: resultado.avisoDisponibilidad,
      message: '¡Canje confirmado exitosamente! Tu comprobante y código de retiro han sido generados.',
    });
  } catch (error: any) {
    console.error('Error al confirmar canje:', error);
    const statusCode = error?.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error?.message || 'Error al confirmar el canje',
    });
  }
};

/**
 * GET /api/canjes/ciudadano/:ciudadanoId
 * Obtener todos los canjes y vouchers de un ciudadano
 */
export const obtenerCanjesCiudadano = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ciudadanoId } = req.params;

    const canjes = await prisma.canje.findMany({
      where: { ciudadanoId },
      include: {
        sucursal: true,
        items: {
          include: {
            producto: true,
          },
        },
      },
      orderBy: { creadoEn: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: canjes,
    });
  } catch (error) {
    console.error('Error al obtener canjes del ciudadano:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener canjes del usuario',
    });
  }
};

/**
 * GET /api/canjes/:id
 * Obtener detalle de un canje por ID
 */
export const obtenerCanjePorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const canje = await prisma.canje.findUnique({
      where: { id },
      include: {
        sucursal: true,
        ciudadano: {
          select: { id: true, nombre: true, email: true },
        },
        items: {
          include: {
            producto: true,
          },
        },
      },
    });

    if (!canje) {
      res.status(404).json({
        success: false,
        message: 'Canje no encontrado',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: canje,
    });
  } catch (error) {
    console.error('Error al obtener canje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalle del canje',
    });
  }
};
