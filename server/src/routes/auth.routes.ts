import { Router } from 'express';
import { login, register, getMe } from '../controllers/auth.controller';

const router = Router();

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/register
router.post('/register', register);

// GET /api/auth/me & /api/auth/perfil
router.get('/me', getMe);
router.get('/perfil', getMe);

export default router;