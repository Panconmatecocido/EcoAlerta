// server/src/controllers/denuncias.controller.ts

import { Request, Response } from 'express';
import { PrismaClient, EstadoDenuncia, Prioridad } from '@prisma/client';

export const prisma = new PrismaClient();

const PESO_PRIORIDAD: Record<Prioridad, number> = {
  URGENTE: 4,
  ALTA: 3,
  MEDIA: 2,
  BAJA: 1,
};

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
        { codigo: { contains: termino, mode: 'insensitive' } },
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

// 1.1 Obtener denuncias del ciudadano autenticado (para la vista de Perfil y seguimiento)
export const obtenerMisDenuncias = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ciudadanoId } = req.query;
    const paramUserId = req.params.ciudadanoId;
    const headerUserId = req.headers['x-user-id'] as string;
    const targetUserId = ciudadanoId ? String(ciudadanoId) : (paramUserId || headerUserId);

    const whereCondition: any = {
      ocultarUsuario: false,
    };

    if (targetUserId) {
      const usuario = await prisma.user.findFirst({
        where: {
          OR: [
            { id: targetUserId },
            { email: { equals: targetUserId, mode: 'insensitive' } },
            ...(targetUserId === 'demo-user-1' ? [{ email: 'ejemplo@email.com' }] : []),
          ],
        },
      });

      if (usuario) {
        whereCondition.ciudadanoId = usuario.id;
      } else {
        whereCondition.ciudadanoId = targetUserId;
      }
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

    const datosFormateados = denuncias.map((d) => ({
      id: d.id,
      codigo: d.codigo,
      titulo: d.titulo,
      categoria: d.categoria,
      descripcion: d.descripcion,
      ubicacion: d.direccion,
      estado: d.estado,
      fecha: d.creadoEn.toISOString().split('T')[0],
      fotoUrl: d.imagenUrl,
      fotoVerificacionUrl: d.fotoVerificacionUrl,
      fotoSolucionUrl: d.fotoSolucionUrl,
      informeSolucion: d.informeSolucion,
      puntosOtorgados: d.puntosOtorgados ?? 0,
    }));

    res.status(200).json(datosFormateados);
  } catch (error) {
    console.error('Error al obtener mis denuncias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las denuncias del usuario',
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
        where: {
          ...whereMunicipio,
          estado: {
            in: [
              EstadoDenuncia.APROBADO,
              EstadoDenuncia.EN_PROCESO,
              EstadoDenuncia.EN_VERIFICACION,
              EstadoDenuncia.VERIFICADO_PENDIENTE,
              EstadoDenuncia.EN_SANEAMIENTO,
              EstadoDenuncia.RESUELTO_TECNICO,
            ],
          },
        },
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

// 4. Asignar agente de campo a una denuncia (Admin directo)
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

    const denunciaActual = await prisma.denuncia.findUnique({ where: { id } });
    const nuevoEstado =
      denunciaActual?.estado === EstadoDenuncia.EN_SANEAMIENTO
        ? EstadoDenuncia.EN_SANEAMIENTO
        : EstadoDenuncia.EN_VERIFICACION;

    const denunciaActualizada = await prisma.denuncia.update({
      where: { id },
      data: {
        agenteId,
        estado: nuevoEstado,
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
      latitud,
      longitud,
      imagenUrl,
      ciudadanoId,
      municipioId,
    } = req.body;

    if (!titulo || !descripcion || !categoria || !direccion || !ciudadanoId) {
      res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios para registrar la denuncia',
      });
      return;
    }

    // Resolver ciudadanoId contra PostgreSQL
    let finalCiudadanoId = ciudadanoId;
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
      finalCiudadanoId = usuario.id;
    }

    // Resolver municipioId contra PostgreSQL
    let finalMunicipioId = municipioId;
    if (!finalMunicipioId || finalMunicipioId === 'municipio-pilar-1') {
      const muni = await prisma.municipio.findFirst();
      if (muni) finalMunicipioId = muni.id;
    }

    const codigoGenerado = `REP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const nuevaDenuncia = await prisma.denuncia.create({
      data: {
        codigo: codigoGenerado,
        titulo,
        descripcion,
        categoria,
        direccion,
        latitud: latitud ? parseFloat(latitud) : null,
        longitud: longitud ? parseFloat(longitud) : null,
        imagenUrl,
        ciudadanoId: finalCiudadanoId,
        municipioId: finalMunicipioId,
        puntosOtorgados: 0,
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

// 6. Triaje Inicial por Administrador (FR-001 / RF-ADM-01 a 03)
export const triajeDenuncia = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { accion, prioridad, observacionesAdmin } = req.body;

    if (!accion || !['APROBAR', 'RECHAZAR'].includes(accion)) {
      res.status(400).json({
        success: false,
        message: 'La acción de triaje debe ser APROBAR o RECHAZAR',
      });
      return;
    }

    if (accion === 'RECHAZAR') {
      if (!observacionesAdmin || String(observacionesAdmin).trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Debes ingresar un motivo de justificación obligatorio para rechazar el reporte',
        });
        return;
      }

      const rechazada = await prisma.denuncia.update({
        where: { id },
        data: {
          estado: EstadoDenuncia.RECHAZADO,
          observacionesAdmin: String(observacionesAdmin).trim(),
          puntosOtorgados: 0,
          agenteId: null,
        },
      });

      res.status(200).json({
        success: true,
        data: rechazada,
        message: 'Denuncia rechazada con justificación y 0 puntos otorgados',
      });
      return;
    }

    // accion === 'APROBAR'
    const prioridadesValidas = Object.values(Prioridad);
    if (!prioridad || !prioridadesValidas.includes(prioridad as Prioridad)) {
      res.status(400).json({
        success: false,
        message: 'Debes asignar una prioridad válida (BAJA, MEDIA, ALTA o URGENTE) para aprobar a la bolsa',
      });
      return;
    }

    const aprobada = await prisma.denuncia.update({
      where: { id },
      data: {
        estado: EstadoDenuncia.APROBADO,
        prioridad: prioridad as Prioridad,
        observacionesAdmin: observacionesAdmin ? String(observacionesAdmin).trim() : null,
        agenteId: null,
      },
    });

    res.status(200).json({
      success: true,
      data: aprobada,
      message: `Denuncia aprobada a la bolsa general con prioridad ${prioridad}`,
    });
  } catch (error) {
    console.error('Error en triaje de denuncia:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al procesar el triaje de la denuncia',
    });
  }
};

// Helper para resolver el Agente en DB tanto por UUID como por email o ID demo local ('agent-user-1')
const resolverAgenteEnDB = async (dbClient: any, identificador?: string) => {
  if (!identificador) return null;
  const limpio = String(identificador).trim();

  // 1. Buscar por ID exacto (UUID)
  const porId = await dbClient.user.findUnique({
    where: { id: limpio },
  });
  if (porId) return porId;

  // 2. Buscar por email si se envió un correo
  if (limpio.includes('@') && typeof dbClient.user.findUnique === 'function') {
    const porEmail = await dbClient.user.findUnique({
      where: { email: limpio.toLowerCase() },
    });
    if (porEmail) return porEmail;
  }

  // 3. Si el cliente aún usa el ID demo local ('agent-user-1'), vincular al agente de campo registrado en DB
  if (limpio === 'agent-user-1' && typeof dbClient.user.findFirst === 'function') {
    const agenteDemo = await dbClient.user.findFirst({
      where: { rol: 'AGENT' },
      orderBy: { creadoEn: 'asc' },
    });
    if (agenteDemo) return agenteDemo;
  }

  return null;
};

// 7. Obtener Bolsa de Casos para Agentes ordenada por Criticidad (FR-002 / RF-AGE-01 a 02)
export const getBolsaCasos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { municipioId, agenteId } = req.query;

    const whereBolsa: any = {
      agenteId: null,
      estado: {
        in: [EstadoDenuncia.APROBADO, EstadoDenuncia.EN_SANEAMIENTO],
      },
    };

    if (municipioId) {
      whereBolsa.municipioId = String(municipioId);
    }

    const casosBolsa = await prisma.denuncia.findMany({
      where: whereBolsa,
      include: {
        ciudadano: {
          select: { id: true, nombre: true },
        },
      },
      orderBy: { creadoEn: 'asc' },
    });

    // Ordenar por peso de prioridad descendente (URGENTE > ALTA > MEDIA > BAJA) y luego antigüedad
    const casosOrdenados = [...casosBolsa].sort((a, b) => {
      const diffPrioridad = PESO_PRIORIDAD[b.prioridad] - PESO_PRIORIDAD[a.prioridad];
      if (diffPrioridad !== 0) return diffPrioridad;
      return new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime();
    });

    let casoActivo = null;
    if (agenteId) {
      const agenteResuelto = await resolverAgenteEnDB(prisma, String(agenteId));
      const idRealAgente = agenteResuelto ? agenteResuelto.id : String(agenteId);

      casoActivo = await prisma.denuncia.findFirst({
        where: {
          agenteId: idRealAgente,
          estado: {
            in: [
              EstadoDenuncia.EN_VERIFICACION,
              EstadoDenuncia.EN_SANEAMIENTO,
              EstadoDenuncia.EN_PROCESO,
            ],
          },
        },
      });
    }

    res.status(200).json({
      success: true,
      data: casosOrdenados,
      casoActivo,
    });
  } catch (error) {
    console.error('Error al obtener bolsa de casos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al consultar la bolsa general de casos',
    });
  }
};

// 8. Toma de Caso con Bloqueo Transaccional Atómico 1 a 1 (FR-003 / RF-AGE-03 a 04 / RNF-03)
export const tomarCasoAtomico = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { agenteId } = req.body;

    if (!agenteId) {
      res.status(400).json({
        success: false,
        message: 'Se requiere el identificador del agente (agenteId)',
      });
      return;
    }

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Verificar que el agente exista (por UUID, email o mapeo de sesión local 'agent-user-1') y esté en servicio
      const agente = await resolverAgenteEnDB(tx, String(agenteId));

      if (!agente) {
        throw { status: 404, message: 'El agente especificado no existe' };
      }

      const idRealAgente = agente.id;

      if (!agente.disponible) {
        throw {
          status: 409,
          message: 'No puedes tomar casos mientras tu estado sea Fuera de Servicio',
        };
      }

      // 2. Verificar que el agente NO tenga ya otro caso activo en curso (Regla 1 a 1)
      const casoActivoExistente = await tx.denuncia.findFirst({
        where: {
          agenteId: idRealAgente,
          estado: {
            in: [
              EstadoDenuncia.EN_VERIFICACION,
              EstadoDenuncia.EN_SANEAMIENTO,
              EstadoDenuncia.EN_PROCESO,
            ],
          },
        },
      });

      if (casoActivoExistente) {
        throw {
          status: 409,
          message: `Ya posees un caso activo asignado (${casoActivoExistente.codigo}). Debes finalizarlo o liberarlo antes de tomar otro.`,
        };
      }

      // 3. Consultar la denuncia objetivo
      const denunciaObjetivo = await tx.denuncia.findUnique({
        where: { id },
      });

      if (!denunciaObjetivo) {
        throw { status: 404, message: 'El reporte solicitado no existe' };
      }

      const estadosDisponiblesBolsa: EstadoDenuncia[] = [
        EstadoDenuncia.APROBADO,
        EstadoDenuncia.EN_SANEAMIENTO,
      ];

      if (
        denunciaObjetivo.agenteId !== null ||
        !estadosDisponiblesBolsa.includes(denunciaObjetivo.estado)
      ) {
        throw {
          status: 409,
          message: 'Este caso acaba de ser tomado por otro agente o ya no está disponible en la bolsa',
        };
      }

      // Si el caso ya estaba en EN_SANEAMIENTO (fue liberado tras verificarse), conserva EN_SANEAMIENTO.
      // Si estaba en APROBADO, pasa a EN_VERIFICACION.
      const nuevoEstado =
        denunciaObjetivo.estado === EstadoDenuncia.EN_SANEAMIENTO
          ? EstadoDenuncia.EN_SANEAMIENTO
          : EstadoDenuncia.EN_VERIFICACION;

      // 4. Bloqueo atómico condicional con updateMany para evitar condiciones de carrera simultáneas
      const actualizacionAtomica = await tx.denuncia.updateMany({
        where: {
          id,
          agenteId: null,
          estado: denunciaObjetivo.estado,
        },
        data: {
          agenteId: idRealAgente,
          estado: nuevoEstado,
        },
      });

      if (actualizacionAtomica.count === 0) {
        throw {
          status: 409,
          message: 'Este caso acaba de ser asignado a otro inspector en este instante',
        };
      }

      return await tx.denuncia.findUnique({
        where: { id },
        include: {
          agente: { select: { id: true, nombre: true, email: true } },
        },
      });
    });

    res.status(200).json({
      success: true,
      data: resultado,
      message: 'Caso asignado en exclusividad (Bloqueo 1 a 1 confirmado)',
    });
  } catch (error: any) {
    if (error?.status) {
      res.status(error.status).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error('Error en tomarCasoAtomico:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al intentar tomar el caso',
    });
  }
};

// 9. Verificación In Situ y Protocolo de 3 Intentos por Inaccesibilidad (FR-004, FR-005 / RF-AGE-05 a 06)
export const verificarInSitu = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { resultado, fotoVerificacionUrl, observaciones } = req.body;

    if (!resultado || !['REAL', 'FALSO', 'INACCESIBLE'].includes(resultado)) {
      res.status(400).json({
        success: false,
        message: 'El resultado de verificación debe ser REAL, FALSO o INACCESIBLE',
      });
      return;
    }

    if (!fotoVerificacionUrl || String(fotoVerificacionUrl).trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Es obligatorio adjuntar la fotografía de evidencia o acta en terreno',
      });
      return;
    }

    const denuncia = await prisma.denuncia.findUnique({ where: { id } });
    if (!denuncia) {
      res.status(404).json({
        success: false,
        message: 'Denuncia no encontrada',
      });
      return;
    }

    // Caso A: Es Real -> Pasa a VERIFICADO_PENDIENTE para validación del Admin
    if (resultado === 'REAL') {
      const actualizada = await prisma.denuncia.update({
        where: { id },
        data: {
          estado: EstadoDenuncia.VERIFICADO_PENDIENTE,
          fotoVerificacionUrl: String(fotoVerificacionUrl).trim(),
          fechaVerificacion: new Date(),
          observacionesAdmin: observaciones ? String(observaciones).trim() : denuncia.observacionesAdmin,
        },
      });

      res.status(200).json({
        success: true,
        data: actualizada,
        message: 'Verificación enviada (VERIFICADO_PENDIENTE). En espera de validación del Administrador.',
      });
      return;
    }

    // Caso B: Es Falso en terreno -> Se cierra como RECHAZADO con 0 puntos y libera al agente
    if (resultado === 'FALSO') {
      const actualizada = await prisma.denuncia.update({
        where: { id },
        data: {
          estado: EstadoDenuncia.RECHAZADO,
          fotoVerificacionUrl: String(fotoVerificacionUrl).trim(),
          fechaVerificacion: new Date(),
          puntosOtorgados: 0,
          agenteId: null,
          observacionesAdmin: observaciones
            ? String(observaciones).trim()
            : 'Falso reporte constatado en terreno por el Agente de Campo',
        },
      });

      res.status(200).json({
        success: true,
        data: actualizada,
        message: 'Reporte cerrado como Falso en Terreno (0 puntos). Quedas liberado para tomar otro caso.',
      });
      return;
    }

    // Caso C: Es Inaccesible -> Protocolo de hasta 3 intentos
    const nuevosIntentos = (denuncia.intentosInaccesible || 0) + 1;
    const alcanzaTercerIntento = nuevosIntentos >= 3;

    const actualizada = await prisma.denuncia.update({
      where: { id },
      data: {
        intentosInaccesible: nuevosIntentos,
        fotoVerificacionUrl: String(fotoVerificacionUrl).trim(),
        fechaVerificacion: new Date(),
        estado: alcanzaTercerIntento ? EstadoDenuncia.CERRADO_INACCESIBLE : EstadoDenuncia.EN_VERIFICACION,
        agenteId: alcanzaTercerIntento ? null : denuncia.agenteId,
        observacionesAdmin: observaciones
          ? String(observaciones).trim()
          : alcanzaTercerIntento
          ? 'Cerrado automáticamente tras 3 intentos fallidos por inaccesibilidad (pasa a intimación legal)'
          : `Inaccesible en visita ${nuevosIntentos}/3 (aviso municipal dejado en puerta)`,
      },
    });

    res.status(200).json({
      success: true,
      data: actualizada,
      message: alcanzaTercerIntento
        ? 'Se alcanzó el 3.er intento fallido: el caso pasó automáticamente a CERRADO_INACCESIBLE y tu bandeja quedó libre.'
        : `Intento ${nuevosIntentos} de 3 por inaccesibilidad registrado con éxito.`,
    });
  } catch (error) {
    console.error('Error en verificarInSitu:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al registrar la verificación in situ',
    });
  }
};

// 10. Liberación / Abandono de Caso o Desasignación Forzada (FR-006 / RF-AGE-07 y RF-ADM-06)
export const liberarCaso = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { motivo } = req.body || {};

    const denuncia = await prisma.denuncia.findUnique({ where: { id } });
    if (!denuncia) {
      res.status(404).json({
        success: false,
        message: 'Denuncia no encontrada',
      });
      return;
    }

    // Si el caso ya fue validado y está en EN_SANEAMIENTO (o ya otorgó puntos), conserva EN_SANEAMIENTO.
    // Si aún no fue verificado, regresa a APROBADO en la bolsa general conservando intentosInaccesible.
    const yaEstabaEnSaneamiento =
      denuncia.estado === EstadoDenuncia.EN_SANEAMIENTO ||
      (denuncia.puntosOtorgados ?? 0) > 0;

    const estadoRetornoBolsa = yaEstabaEnSaneamiento
      ? EstadoDenuncia.EN_SANEAMIENTO
      : EstadoDenuncia.APROBADO;

    const actualizada = await prisma.denuncia.update({
      where: { id },
      data: {
        agenteId: null,
        estado: estadoRetornoBolsa,
        observacionesAdmin: motivo
          ? `${denuncia.observacionesAdmin ? denuncia.observacionesAdmin + ' | ' : ''}Liberado: ${String(motivo).trim()}`
          : denuncia.observacionesAdmin,
      },
    });

    res.status(200).json({
      success: true,
      data: actualizada,
      message: yaEstabaEnSaneamiento
        ? 'Caso liberado a la bolsa manteniendo estado EN_SANEAMIENTO (no repetirá verificación)'
        : 'Caso liberado y devuelto a la bolsa general en estado APROBADO',
    });
  } catch (error) {
    console.error('Error al liberar caso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al liberar el caso hacia la bolsa',
    });
  }
};

// 11. Validación de Veracidad y Acreditación Atómica de Puntos por el Admin (FR-001, FR-002 / US1)
export const validarVeracidad = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { decision, puntos, observacionesAdmin } = req.body || {};

    if (!decision || !['APROBAR_VERACIDAD', 'RECHAZAR_FALSO'].includes(decision)) {
      res.status(400).json({
        success: false,
        message: "Decisión inválida. Debe ser 'APROBAR_VERACIDAD' o 'RECHAZAR_FALSO'",
      });
      return;
    }

    const denuncia = await prisma.denuncia.findUnique({
      where: { id },
      include: { ciudadano: true },
    });

    if (!denuncia) {
      res.status(404).json({
        success: false,
        message: 'Denuncia no encontrada',
      });
      return;
    }

    if (denuncia.estado !== EstadoDenuncia.VERIFICADO_PENDIENTE) {
      res.status(400).json({
        success: false,
        message: `La denuncia no se encuentra en estado VERIFICADO_PENDIENTE (estado actual: ${denuncia.estado})`,
      });
      return;
    }

    // Caso Rechazar como Falso
    if (decision === 'RECHAZAR_FALSO') {
      const actualizada = await prisma.denuncia.update({
        where: { id },
        data: {
          estado: EstadoDenuncia.RECHAZADO,
          puntosOtorgados: 0,
          agenteId: null,
          observacionesAdmin: observacionesAdmin
            ? String(observacionesAdmin).trim()
            : 'Rechazado por falsedad en auditoría de veracidad por Administrador',
        },
      });

      res.status(200).json({
        success: true,
        data: actualizada,
        message: 'Denuncia rechazada como falsa (0 puntos acreditados).',
      });
      return;
    }

    // Idempotencia: Verificar que no haya otorgado puntos ya
    if ((denuncia.puntosOtorgados ?? 0) > 0) {
      res.status(400).json({
        success: false,
        message: 'Esta denuncia ya tiene puntos acreditados previamente (protección contra doble acreditación)',
      });
      return;
    }

    // Baremo oficial por prioridad
    const BAREMO: Record<Prioridad, { min: number; max: number }> = {
      BAJA: { min: 50, max: 80 },
      MEDIA: { min: 100, max: 150 },
      ALTA: { min: 200, max: 300 },
      URGENTE: { min: 350, max: 500 },
    };

    const rango = BAREMO[denuncia.prioridad];
    const puntosNum = Number(puntos);

    if (
      !rango ||
      isNaN(puntosNum) ||
      !Number.isInteger(puntosNum) ||
      puntosNum < rango.min ||
      puntosNum > rango.max
    ) {
      res.status(400).json({
        success: false,
        message: `Puntaje fuera de baremo para prioridad ${denuncia.prioridad} (Permitido: ${rango.min} a ${rango.max} pts).`,
      });
      return;
    }

    // Transacción atómica: actualiza Denuncia a EN_SANEAMIENTO y suma puntos al Ciudadano
    const [denunciaActualizada, ciudadanoActualizado] = await prisma.$transaction([
      prisma.denuncia.update({
        where: { id },
        data: {
          estado: EstadoDenuncia.EN_SANEAMIENTO,
          puntosOtorgados: puntosNum,
          fechaVerificacion: denuncia.fechaVerificacion || new Date(),
          observacionesAdmin: observacionesAdmin
            ? String(observacionesAdmin).trim()
            : denuncia.observacionesAdmin,
        },
      }),
      prisma.user.update({
        where: { id: denuncia.ciudadanoId },
        data: {
          puntos: {
            increment: puntosNum,
          },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: denunciaActualizada,
      puntosAcreditados: puntosNum,
      nuevoSaldoCiudadano: ciudadanoActualizado.puntos,
      message: `Veracidad aprobada con éxito. Se acreditaron ${puntosNum} puntos al vecino y el caso avanzó a EN_SANEAMIENTO.`,
    });
  } catch (error) {
    console.error('Error en validarVeracidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al validar la veracidad y acreditar puntos',
    });
  }
};

// 12. Cierre Técnico de Saneamiento por el Agente de Campo (FR-003 / US2)
export const registrarCierreTecnico = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { fotoSolucionUrl, informeSolucion, agenteId } = req.body || {};

    if (!fotoSolucionUrl || String(fotoSolucionUrl).trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'La fotografía del "Después" (fotoSolucionUrl) es obligatoria para el cierre técnico.',
      });
      return;
    }

    if (!informeSolucion || String(informeSolucion).trim().length < 10) {
      res.status(400).json({
        success: false,
        message: 'El informe técnico de saneamiento debe contener al menos 10 caracteres.',
      });
      return;
    }

    const denuncia = await prisma.denuncia.findUnique({ where: { id } });
    if (!denuncia) {
      res.status(404).json({
        success: false,
        message: 'Denuncia no encontrada',
      });
      return;
    }

    if (denuncia.estado !== EstadoDenuncia.EN_SANEAMIENTO) {
      res.status(400).json({
        success: false,
        message: `La denuncia debe estar en estado EN_SANEAMIENTO para registrar cierre técnico (estado actual: ${denuncia.estado})`,
      });
      return;
    }

    // Si se envía agenteId, resolverlo y verificar que no pertenezca a otro agente
    if (agenteId && denuncia.agenteId) {
      const agente = await resolverAgenteEnDB(prisma, String(agenteId));
      if (agente && denuncia.agenteId !== agente.id && denuncia.agenteId !== agenteId) {
        res.status(403).json({
          success: false,
          message: 'No tienes asignado este caso de saneamiento.',
        });
        return;
      }
    }

    const actualizada = await prisma.denuncia.update({
      where: { id },
      data: {
        estado: EstadoDenuncia.RESUELTO_TECNICO,
        fotoSolucionUrl: String(fotoSolucionUrl).trim(),
        informeSolucion: String(informeSolucion).trim(),
      },
    });

    res.status(200).json({
      success: true,
      data: actualizada,
      message: 'Cierre técnico registrado con éxito (RESUELTO_TECNICO). En espera de certificación del Administrador.',
    });
  } catch (error) {
    console.error('Error en registrarCierreTecnico:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al registrar el cierre técnico de saneamiento',
    });
  }
};

// 13. Certificación Final "Antes vs. Después" u Observación por el Admin (FR-004, FR-005 / US3)
export const certificarResolucionFinal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { decision, observacionesAdmin } = req.body || {};

    if (!decision || !['CERTIFICAR', 'OBSERVAR_REHACER'].includes(decision)) {
      res.status(400).json({
        success: false,
        message: "Decisión inválida. Debe ser 'CERTIFICAR' u 'OBSERVAR_REHACER'",
      });
      return;
    }

    const denuncia = await prisma.denuncia.findUnique({ where: { id } });
    if (!denuncia) {
      res.status(404).json({
        success: false,
        message: 'Denuncia no encontrada',
      });
      return;
    }

    if (denuncia.estado !== EstadoDenuncia.RESUELTO_TECNICO) {
      res.status(400).json({
        success: false,
        message: `La denuncia debe estar en estado RESUELTO_TECNICO para su certificación (estado actual: ${denuncia.estado})`,
      });
      return;
    }

    if (decision === 'OBSERVAR_REHACER') {
      if (!observacionesAdmin || String(observacionesAdmin).trim().length < 5) {
        res.status(400).json({
          success: false,
          message: 'Debe ingresar una observación técnica explicando qué falta corregir o sanear.',
        });
        return;
      }

      // Edge case: Si el agente original ya tiene otro caso activo o está fuera de servicio,
      // el caso vuelve a la bolsa general (agenteId = null) en EN_SANEAMIENTO.
      let agenteAsignadoFinal = denuncia.agenteId;
      if (denuncia.agenteId) {
        const agenteOcupado = await prisma.denuncia.findFirst({
          where: {
            id: { not: id },
            agenteId: denuncia.agenteId,
            estado: {
              in: [
                EstadoDenuncia.EN_VERIFICACION,
                EstadoDenuncia.EN_SANEAMIENTO,
                EstadoDenuncia.EN_PROCESO,
              ],
            },
          },
        });
        const usuarioAgente = await prisma.user.findUnique({ where: { id: denuncia.agenteId } });
        if (agenteOcupado || (usuarioAgente && !usuarioAgente.disponible)) {
          agenteAsignadoFinal = null;
        }
      }

      const actualizada = await prisma.denuncia.update({
        where: { id },
        data: {
          estado: EstadoDenuncia.EN_SANEAMIENTO,
          agenteId: agenteAsignadoFinal,
          observacionesAdmin: String(observacionesAdmin).trim(),
        },
      });

      res.status(200).json({
        success: true,
        data: actualizada,
        message: 'Saneamiento observado. El caso regresó a EN_SANEAMIENTO con las notas correspondientes.',
      });
      return;
    }

    // decision === 'CERTIFICAR'
    const actualizada = await prisma.denuncia.update({
      where: { id },
      data: {
        estado: EstadoDenuncia.RESUELTO,
        fechaResolucion: new Date(),
        observacionesAdmin: observacionesAdmin
          ? String(observacionesAdmin).trim()
          : (denuncia.observacionesAdmin || 'Saneamiento certificado y cerrado definitivamente por Administrador'),
      },
    });

    res.status(200).json({
      success: true,
      data: actualizada,
      message: 'Caso certificado y cerrado definitivamente (RESUELTO).',
    });
  } catch (error) {
    console.error('Error en certificarResolucionFinal:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al certificar la resolución del caso',
    });
  }
};