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
      let usuario = await tx.user.findUnique({
        where: { id: ciudadanoId },
      });

      if (!usuario) {
        usuario = await tx.user.findFirst({
          where: {
            OR: [
              { email: { equals: ciudadanoId, mode: 'insensitive' } },
              ...(ciudadanoId === 'demo-user-1' ? [{ email: 'ejemplo@email.com' }] : []),
              ...(ciudadanoId === 'agent-user-1' ? [{ email: 'agente@municipio.gob.ar' }] : []),
              ...(ciudadanoId === 'admin-user-1' ? [{ email: 'admin@ecoalerta.gob.ar' }] : []),
            ],
          },
        });
      }

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
      let usuario = await tx.user.findUnique({
        where: { id: targetUserId },
      });

      if (!usuario) {
        usuario = await tx.user.findFirst({
          where: {
            OR: [
              { email: { equals: targetUserId, mode: 'insensitive' } },
              ...(targetUserId === 'demo-user-1' ? [{ email: 'ejemplo@email.com' }] : []),
              ...(targetUserId === 'agent-user-1' ? [{ email: 'agente@municipio.gob.ar' }] : []),
              ...(targetUserId === 'admin-user-1' ? [{ email: 'admin@ecoalerta.gob.ar' }] : []),
            ],
          },
        });
      }

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
        where: { id: usuario.id },
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
/**
 * Función auxiliar para procesar y cancelar canjes en PENDIENTE_RETIRO que superaron los 30 días corridos.
 * Restituye las unidades al stock de Producto pero NO devuelve puntos a User (Principio VI y RF-COL-03).
 */
export const procesarCanjesExpirados30Dias = async (tx?: Prisma.TransactionClient): Promise<number> => {
  const db = tx || prisma;
  const ahora = new Date();

  // Buscar canjes en PENDIENTE_RETIRO cuya fechaExpiracion ya fue superada
  const canjesVencidos = await db.canje.findMany({
    where: {
      estado: 'PENDIENTE_RETIRO',
      fechaExpiracion: {
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
    // 1. Restituir el stock de cada producto físico al inventario municipal
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

    // 2. Pasar el canje a CANCELADO
    // RF-COL-03: NO SE DEVUELVEN PUNTOS (User.puntos permanece inalterado)
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
 * POST /api/canjes/procesar-expirados
 * Procesa expiraciones de canjes que hayan superado los 30 días
 */
export const procesarCanjesExpiradosEndpoint = async (_req: Request, res: Response): Promise<void> => {
  try {
    const expirados = await prisma.$transaction(async (tx) => {
      return await procesarCanjesExpirados30Dias(tx);
    });

    res.status(200).json({
      success: true,
      expirados,
      message: `Se procesaron y cancelaron ${expirados} canjes vencidos a los 30 días (stock restituido, 0 puntos reembolsados)`,
    });
  } catch (error) {
    console.error('Error al procesar canjes expirados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar canjes expirados a los 30 días',
    });
  }
};

/**
 * GET /api/canjes/codigo/:codigoRetiro
 * Búsqueda de voucher por código de retiro para el Colaborador Municipal
 */
export const getCanjeByCodigo = async (req: Request, res: Response): Promise<void> => {
  try {
    const codigoParam = req.params.codigoRetiro;
    if (!codigoParam || !codigoParam.trim()) {
      res.status(400).json({
        success: false,
        message: 'codigoRetiro es requerido',
      });
      return;
    }

    const codigo = codigoParam.trim().toUpperCase();

    // Ejecutar procesamiento preventivo de expirados
    await prisma.$transaction(async (tx) => {
      await procesarCanjesExpirados30Dias(tx);
    });

    const canje = await prisma.canje.findFirst({
      where: {
        OR: [
          { codigoRetiro: codigo },
          { codigoRetiro: { equals: codigo, mode: 'insensitive' } },
        ],
      },
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
        message: `No se encontró ningún canje con el código ${codigo}`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: canje,
    });
  } catch (error) {
    console.error('Error al buscar canje por código:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar canje por código de retiro',
    });
  }
};

/**
 * PATCH /api/canjes/:codigoRetiro/entregar
 * Confirmación de entrega presencial por parte del Colaborador
 */
export const confirmarEntregaCanje = async (req: Request, res: Response): Promise<void> => {
  try {
    const { codigoRetiro } = req.params;
    if (!codigoRetiro || !codigoRetiro.trim()) {
      res.status(400).json({
        success: false,
        message: 'Código de retiro o ID es requerido',
      });
      return;
    }

    const codigoNormalizado = codigoRetiro.trim().toUpperCase();

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Procesar expirados
      await procesarCanjesExpirados30Dias(tx);

      // 2. Buscar canje
      const canje = await tx.canje.findFirst({
        where: {
          OR: [
            { codigoRetiro: codigoNormalizado },
            { id: codigoRetiro },
          ],
        },
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
        throw { statusCode: 404, message: 'Canje no encontrado' };
      }

      // 3. Validar estado y expiración
      if (canje.estado === 'ENTREGADO') {
        throw {
          statusCode: 409,
          message: 'Este premio ya fue entregado anteriormente',
        };
      }

      const ahora = new Date();
      if (
        canje.estado === 'CANCELADO' ||
        (canje.fechaExpiracion && ahora > canje.fechaExpiracion)
      ) {
        throw {
          statusCode: 409,
          message: 'El código de retiro ha expirado (plazo de 30 días vencido)',
        };
      }

      if (canje.estado !== 'PENDIENTE_RETIRO') {
        throw {
          statusCode: 400,
          message: `El canje no puede entregarse en estado ${canje.estado}`,
        };
      }

      // 4. Actualizar estado a ENTREGADO con fechaEntrega
      const fechaEntrega = new Date();
      const canjeEntregado = await tx.canje.update({
        where: { id: canje.id },
        data: {
          estado: 'ENTREGADO',
          fechaEntrega,
        },
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

      return canjeEntregado;
    });

    res.status(200).json({
      success: true,
      data: resultado,
      message: 'Entrega de premio confirmada exitosamente',
    });
  } catch (error: any) {
    console.error('Error al confirmar entrega de canje:', error);
    const statusCode = error?.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error?.message || 'Error al confirmar entrega de canje',
    });
  }
};

/**
 * GET /api/canjes/ciudadano/:ciudadanoId
 * Obtener todos los canjes y vouchers de un ciudadano
 */
export const getCanjesByCiudadano = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ciudadanoId } = req.params;

    // Procesar expiraciones antes de listar
    await prisma.$transaction(async (tx) => {
      await procesarCanjesExpirados30Dias(tx);
    });

    let targetUserId = ciudadanoId;
    const usuario = await prisma.user.findFirst({
      where: {
        OR: [
          { id: ciudadanoId },
          { email: { equals: ciudadanoId, mode: 'insensitive' } },
          ...(ciudadanoId === 'demo-user-1' ? [{ email: 'ejemplo@email.com' }] : []),
        ],
      },
    });

    if (usuario) {
      targetUserId = usuario.id;
    }

    const canjes = await prisma.canje.findMany({
      where: { ciudadanoId: targetUserId },
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

export const obtenerCanjesCiudadano = getCanjesByCiudadano;

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

