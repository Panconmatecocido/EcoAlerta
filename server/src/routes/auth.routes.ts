// server/src/routes/auth.routes.ts

import { Router } from 'express';
import {
  AuthDataStore,
  createAuthHandlers,
  login,
  register,
  getMe,
} from '../controllers/auth.controller';

export function createAuthRouter(
  store?: AuthDataStore,
  tokenSecret: string | undefined = process.env.AUTH_TOKEN_SECRET
): Router {
  const router = Router();
  const handlers = store ? createAuthHandlers(store, tokenSecret) : { login, register };

  // POST /api/auth/login
  router.post('/login', handlers.login);

  // POST /api/auth/register
  router.post('/register', handlers.register);

  // GET /api/auth/me & /api/auth/perfil
  router.get('/me', getMe);
  router.get('/perfil', getMe);

  return router;
}

export default createAuthRouter();
