// server/src/routes/agentes.routes.ts

import { Router } from 'express';
import { Role } from '@prisma/client';
import { createAuthMiddleware, requireRole } from '../middleware/auth';
import {
  obtenerAgentes,
  cambiarDisponibilidadAgente,
  actualizarUbicacionAgente,
  crearAgente,
} from '../controllers/agentes.controller';

const router = Router();
const authenticate = createAuthMiddleware();
const requireAdmin = requireRole(Role.ADMIN);
const requireAgent = requireRole(Role.AGENT);

// GET /api/agentes -> Obtener lista de agentes con su número de casos activos
router.get('/', authenticate, requireAdmin, obtenerAgentes);

// POST /api/agentes -> Alta de un nuevo agente de campo
router.post('/', authenticate, requireAdmin, crearAgente);

// PATCH /api/agentes/me/disponibilidad -> Publicar disponibilidad y ubicación GPS actual
router.patch('/me/disponibilidad', authenticate, requireAgent, cambiarDisponibilidadAgente);

// PATCH /api/agentes/me/ubicacion -> Reemplazar ubicación GPS actual
router.patch('/me/ubicacion', authenticate, requireAgent, actualizarUbicacionAgente);

// PATCH /api/agentes/:id/disponibilidad -> Alternar estado (Disponible / Ocupado) por Admin o Agente
router.patch(
  '/:id/disponibilidad',
  authenticate,
  requireRole(Role.ADMIN, Role.AGENT),
  cambiarDisponibilidadAgente
);

export default router;