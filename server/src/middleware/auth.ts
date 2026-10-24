import { NextFunction, Request, RequestHandler, Response } from 'express';
import { Role } from '@prisma/client';
import {
  AuthIdentity,
  AuthIdentityStore,
  authIdentityStore,
  verifySessionToken,
} from '../controllers/auth.controller';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthIdentity;
    }
  }
}

export function createAuthMiddleware(
  store: AuthIdentityStore = authIdentityStore,
  tokenSecret: string | undefined = process.env.AUTH_TOKEN_SECRET
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authorization = req.get('authorization');
    const match = authorization?.match(/^Bearer\s+(\S+)$/i);
    if (!match) {
      res.status(401).json({ success: false, message: 'Se requiere una sesión válida' });
      return;
    }

    const token = verifySessionToken(match[1], tokenSecret);
    if (!token) {
      res.status(401).json({ success: false, message: 'La sesión no es válida o expiró' });
      return;
    }

    try {
      const identity = await store.findUserById(token.sub);
      if (!identity || !Object.values(Role).includes(identity.rol)) {
        res.status(401).json({ success: false, message: 'La sesión no es válida o expiró' });
        return;
      }

      req.auth = identity;
      next();
    } catch (error) {
      console.error('Error al verificar la identidad de la sesión:', error);
      res.status(500).json({
        success: false,
        message: 'No se pudo verificar la sesión',
      });
    }
  };
}

export function requireRole(...roles: Role[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ success: false, message: 'Se requiere una sesión válida' });
      return;
    }
    if (!roles.includes(req.auth.rol)) {
      res.status(403).json({ success: false, message: 'No tienes permisos para esta operación' });
      return;
    }
    next();
  };
}
