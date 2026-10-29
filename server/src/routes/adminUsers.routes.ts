import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  cambiarDisponibilidadColaborador,
  crearCuentaPersonal,
  eliminarCuentaPersonal,
  obtenerColaboradores,
} from '../controllers/adminUsers.controller';
import { createAuthMiddleware, requireRole } from '../middleware/auth';

const router = Router();
const authenticate = createAuthMiddleware();
const requireAdmin = requireRole(Role.ADMIN);

router.get('/colaboradores', authenticate, requireAdmin, obtenerColaboradores);
router.patch(
  '/colaboradores/:id/disponibilidad',
  authenticate,
  requireAdmin,
  cambiarDisponibilidadColaborador
);
router.delete('/:id', authenticate, requireAdmin, eliminarCuentaPersonal);
router.post('/', authenticate, requireAdmin, crearCuentaPersonal);

export default router;
