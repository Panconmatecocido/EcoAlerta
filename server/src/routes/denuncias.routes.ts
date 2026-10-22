// server/src/routes/denuncias.routes.ts

import { Router } from 'express';
import { Role } from '@prisma/client';
import { createAuthMiddleware, requireRole } from '../middleware/auth';
import {
  obtenerDenuncias,
  obtenerMetricasAdmin,
  asignarAgenteDenuncia,
  triajeDenuncia,
  getBolsaCasos,
  tomarCasoAtomico,
  verificarInSitu,
  liberarCaso,
  crearDenuncia,
  getDenunciasByCiudadano,
  hideDenunciaForCitizen,
} from '../controllers/denuncias.controller';
import { obtenerAgentesDisponiblesParaDenuncia } from '../controllers/agentes.controller';

const router = Router();
const authenticate = createAuthMiddleware();
const requireAdmin = requireRole(Role.ADMIN);
const requireAgent = requireRole(Role.AGENT);

// GET /api/denuncias -> Obtener lista de denuncias
router.get('/', authenticate, requireAdmin, obtenerDenuncias);

// GET /api/denuncias/metricas -> Métricas para Dashboard Admin
router.get('/metricas', authenticate, requireAdmin, obtenerMetricasAdmin);

// POST /api/denuncias -> Crear nueva denuncia (Ciudadano)
router.post('/', crearDenuncia);

// Inicio de Fase 2 (Foundational): rutas de historial y ocultamiento ciudadano.
router.get('/ciudadano/:ciudadanoId', getDenunciasByCiudadano);
router.patch('/:id/ocultar', hideDenunciaForCitizen);

router.patch('/:id/triaje', authenticate, requireAdmin, triajeDenuncia);
router.get('/bolsa', authenticate, requireAgent, getBolsaCasos);
router.patch('/:id/tomar', authenticate, requireAgent, tomarCasoAtomico);
router.patch('/:id/verificar', authenticate, requireAgent, verificarInSitu);
router.patch(
  '/:id/liberar',
  authenticate,
  requireRole(Role.ADMIN, Role.AGENT),
  liberarCaso
);

// GET /api/denuncias/:id/agentes-disponibles -> Candidatos GPS del municipio del reporte
router.get(
  '/:id/agentes-disponibles',
  authenticate,
  requireAdmin,
  obtenerAgentesDisponiblesParaDenuncia
);

// PATCH /api/denuncias/:id/asignar -> Asignar agente a denuncia
router.patch('/:id/asignar', authenticate, requireAdmin, asignarAgenteDenuncia);

export default router;