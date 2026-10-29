import { EstadoDenuncia, PrismaClient, Role } from '@prisma/client';
import { Request, Response } from 'express';
import { hashPassword } from '../utils/password';
import { isValidProfilePhotoDataUri } from '../utils/profilePhoto';

const prisma = new PrismaClient();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface StaffUserStore {
  findUserByEmail(email: string): Promise<{ id: string } | null>;
  findCollaborators(municipioId: string): Promise<CollaboratorRecord[]>;
  deleteStaffAccount(
    id: string,
    municipioId: string
  ): Promise<{ id: string; nombre: string; rol: Role; denunciasLiberadas: number } | null>;
  updateCollaboratorAvailability(
    id: string,
    municipioId: string,
    disponible: boolean
  ): Promise<CollaboratorRecord | null>;
  createUser(data: {
    nombre: string;
    email: string;
    passwordHash: string;
    rol: Extract<Role, 'AGENT' | 'COLLABORATOR'>;
    municipioId: string;
    disponible: boolean;
    fotoPerfilUri: string | null;
  }): Promise<{
    id: string;
    nombre: string;
    email: string;
    rol: Role;
    municipioId: string;
    disponible: boolean;
    creadoEn: Date;
    fotoPerfilUri: string | null;
  }>;
}

export interface CollaboratorRecord {
  id: string;
  nombre: string;
  email: string;
  disponible: boolean;
  fotoPerfilUri: string | null;
  creadoEn: Date;
}

const database: StaffUserStore = {
  findUserByEmail(email) {
    return prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });
  },
  findCollaborators(municipioId) {
    return prisma.user.findMany({
      where: { rol: Role.COLLABORATOR, municipioId },
      select: {
        id: true,
        nombre: true,
        email: true,
        disponible: true,
        fotoPerfilUri: true,
        creadoEn: true,
      },
      orderBy: { nombre: 'asc' },
    });
  },
  deleteStaffAccount(id, municipioId) {
    return prisma.$transaction(async (transaction) => {
      const usuario = await transaction.user.findFirst({
        where: {
          id,
          municipioId,
          rol: { in: [Role.AGENT, Role.COLLABORATOR] },
        },
        select: { id: true, nombre: true, rol: true },
      });
      if (!usuario) return null;

      let denunciasLiberadas = 0;
      if (usuario.rol === Role.AGENT) {
        const casosActivosLiberados = await transaction.denuncia.updateMany({
          where: {
            agenteId: usuario.id,
            estado: {
              in: [
                EstadoDenuncia.PENDIENTE,
                EstadoDenuncia.EN_PROCESO,
                EstadoDenuncia.EN_VERIFICACION,
                EstadoDenuncia.EN_SANEAMIENTO,
              ],
            },
          },
          data: { agenteId: null },
        });
        denunciasLiberadas = casosActivosLiberados.count;

        await transaction.denuncia.updateMany({
          where: { agenteId: usuario.id },
          data: { agenteId: null },
        });
      }

      await transaction.user.deleteMany({
        where: {
          id: usuario.id,
          municipioId,
          rol: { in: [Role.AGENT, Role.COLLABORATOR] },
        },
      });

      return {
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol,
        denunciasLiberadas,
      };
    });
  },
  async updateCollaboratorAvailability(id, municipioId, disponible) {
    const updateResult = await prisma.user.updateMany({
      where: { id, municipioId, rol: Role.COLLABORATOR },
      data: { disponible },
    });
    if (updateResult.count === 0) return null;

    return prisma.user.findFirst({
      where: { id, municipioId, rol: Role.COLLABORATOR },
      select: {
        id: true,
        nombre: true,
        email: true,
        disponible: true,
        fotoPerfilUri: true,
        creadoEn: true,
      },
    });
  },
  createUser(data) {
    return prisma.user.create({
      data,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        municipioId: true,
        disponible: true,
        creadoEn: true,
        fotoPerfilUri: true,
      },
    });
  },
};

const isDuplicateEmailError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 'P2002';

export function createStaffAccountHandler(
  store: StaffUserStore = database
) {
  return async (req: Request, res: Response): Promise<void> => {
    const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const rol = req.body?.rol;
    const fotoPerfilUri = req.body?.fotoPerfilUri;

    if (nombre.length < 2 || nombre.length > 80) {
      res.status(400).json({
        success: false,
        message: 'El nombre debe tener entre 2 y 80 caracteres',
      });
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      res.status(400).json({ success: false, message: 'El correo electrónico no es válido' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres',
      });
      return;
    }

    if (
      typeof rol !== 'string' ||
      (rol !== Role.AGENT && rol !== Role.COLLABORATOR)
    ) {
      res.status(400).json({
        success: false,
        message: 'El rol debe ser AGENT o COLLABORATOR',
      });
      return;
    }

    if (!isValidProfilePhotoDataUri(fotoPerfilUri)) {
      res.status(400).json({
        success: false,
        message: 'Toma una foto válida del personal para completar el alta',
      });
      return;
    }

    try {
      if (await store.findUserByEmail(email)) {
        res.status(409).json({
          success: false,
          message: 'Ya existe una cuenta registrada con ese correo electrónico',
        });
        return;
      }

      const usuario = await store.createUser({
        nombre,
        email,
        passwordHash: await hashPassword(password),
        rol,
        municipioId: req.auth!.municipioId,
        disponible: rol === Role.AGENT ? false : true,
        fotoPerfilUri,
      });

      res.status(201).json({
        success: true,
        data: usuario,
        message: 'La cuenta se creó correctamente',
      });
    } catch (error) {
      if (isDuplicateEmailError(error)) {
        res.status(409).json({
          success: false,
          message: 'Ya existe una cuenta registrada con ese correo electrónico',
        });
        return;
      }

      console.error('Error al crear una cuenta de personal:', error);
      res.status(500).json({
        success: false,
        message: 'No se pudo crear la cuenta. Inténtalo nuevamente.',
      });
    }
  };
}

export const crearCuentaPersonal = createStaffAccountHandler();

export async function obtenerColaboradores(req: Request, res: Response): Promise<void> {
  try {
    const colaboradores = await database.findCollaborators(req.auth!.municipioId);
    res.status(200).json({ success: true, data: colaboradores });
  } catch (error) {
    console.error('Error al obtener colaboradores:', error);
    res.status(500).json({
      success: false,
      message: 'No se pudo consultar la lista de colaboradores',
    });
  }
}

export async function cambiarDisponibilidadColaborador(
  req: Request,
  res: Response
): Promise<void> {
  if (typeof req.body?.disponible !== 'boolean') {
    res.status(400).json({
      success: false,
      message: 'El campo "disponible" debe ser un valor booleano',
    });
    return;
  }

  try {
    const colaborador = await database.updateCollaboratorAvailability(
      req.params.id,
      req.auth!.municipioId,
      req.body.disponible
    );
    if (!colaborador) {
      res.status(404).json({
        success: false,
        message: 'No se encontró el colaborador en el municipio del administrador',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: colaborador,
      message: 'Estado de servicio actualizado correctamente',
    });
  } catch (error) {
    console.error('Error al cambiar el estado de servicio del colaborador:', error);
    res.status(500).json({
      success: false,
      message: 'No se pudo actualizar el estado de servicio del colaborador',
    });
  }
}

export async function eliminarCuentaPersonal(req: Request, res: Response): Promise<void> {
  try {
    const usuario = await database.deleteStaffAccount(req.params.id, req.auth!.municipioId);
    if (!usuario) {
      res.status(404).json({
        success: false,
        message: 'No se encontró la cuenta de personal en el municipio del administrador',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: usuario,
      message: 'La cuenta de personal se eliminó correctamente',
    });
  } catch (error) {
    console.error('Error al eliminar una cuenta de personal:', error);
    res.status(500).json({
      success: false,
      message: 'No se pudo eliminar la cuenta de personal',
    });
  }
}
