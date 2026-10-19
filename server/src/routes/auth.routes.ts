// server/src/routes/auth.routes.ts

import { Router } from 'express';
import {
  AuthDataStore,
  createAuthHandlers,
  login,
  register,
} from '../controllers/auth.controller';

export function createAuthRouter(
  store?: AuthDataStore,
  tokenSecret: string | undefined = process.env.AUTH_TOKEN_SECRET
): Router {
  const router = Router();
  const handlers = store ? createAuthHandlers(store, tokenSecret) : { login, register };

  router.post('/login', handlers.login);
  router.post('/register', handlers.register);

  return router;
}

export default createAuthRouter();