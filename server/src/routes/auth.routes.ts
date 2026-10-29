// server/src/routes/auth.routes.ts

import { Router } from 'express';
import {
  AuthDataStore,
  createAuthHandlers,
  login,
  register,
  getMe,
  actualizarNombrePerfil,
} from '../controllers/auth.controller';
import { createAuthMiddleware } from '../middleware/auth';

export function createAuthRouter(
  store?: AuthDataStore,
  tokenSecret: string | undefined = process.env.AUTH_TOKEN_SECRET
): Router {
  const router = Router();
  const handlers = store ? createAuthHandlers(store, tokenSecret) : { login, register };
  const authenticate = createAuthMiddleware(undefined, tokenSecret);

  // POST /api/auth/login
  router.post('/login', handlers.login);

  // POST /api/auth/register
  router.post('/register', handlers.register);

  // GET /api/auth/me & /api/auth/perfil
  router.get('/me', getMe);
  router.get('/perfil', getMe);

  // PATCH /api/auth/profile
  router.patch('/profile', authenticate, actualizarNombrePerfil);

  return router;
}

export default createAuthRouter();
