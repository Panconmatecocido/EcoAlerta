// server/src/routes/denuncias.routes.ts

import { Router } from 'express';
import { Role } from '@prisma/client';
import { createAuthMiddleware, requireRole } from '../middleware/auth';
import {
  obtenerDenuncias,
  obtenerMisDenuncias,
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
  validarVeracidad,
  registrarCierreTecnico,
  certificarResolucionFinal,
  cambiarEstadoDenuncia,
} from '../controllers/denuncias.controller';
import { obtenerAgentesDisponiblesParaDenuncia } from '../controllers/agentes.controller';

const router = Router();
const authenticate = createAuthMiddleware();
const requireAdmin = requireRole(Role.ADMIN);
const requireAgent = requireRole(Role.AGENT);

// GET /api/denuncias -> Obtener lista de denuncias
router.get('/', authenticate, requireAdmin, obtenerDenuncias);

// GET /api/denuncias/mis-denuncias -> Obtener denuncias del ciudadano autenticado
router.get('/mis-denuncias', obtenerMisDenuncias);
router.get('/ciudadano/:ciudadanoId', getDenunciasByCiudadano);

// GET /api/denuncias/metricas -> Métricas para Dashboard Admin
router.get('/metricas', authenticate, requireAdmin, obtenerMetricasAdmin);

// GET /api/denuncias/bolsa -> Bolsa general de casos ordenada por prioridad (Agentes)
router.get('/bolsa', authenticate, requireAgent, getBolsaCasos);

// POST /api/denuncias -> Crear nueva denuncia (Ciudadano)
router.post('/', crearDenuncia);

// PATCH /api/denuncias/:id/ocultar -> Ocultar reporte de historial ciudadano
router.patch('/:id/ocultar', hideDenunciaForCitizen);

// PATCH /api/denuncias/:id/triaje -> Triaje inicial por Admin (Aprobar con Prioridad o Rechazar con motivo)
router.patch('/:id/triaje', authenticate, requireAdmin, triajeDenuncia);

// PATCH /api/denuncias/:id/asignar -> Asignar agente a denuncia
router.patch('/:id/asignar', authenticate, requireAdmin, asignarAgenteDenuncia);

// GET /api/denuncias/:id/agentes-disponibles -> Candidatos GPS del municipio del reporte
router.get(
  '/:id/agentes-disponibles',
  authenticate,
  requireAdmin,
  obtenerAgentesDisponiblesParaDenuncia
);

// PATCH /api/denuncias/:id/validar-veracidad -> Validación de veracidad y acreditación de puntos (Admin)
router.patch('/:id/validar-veracidad', authenticate, requireAdmin, validarVeracidad);

// PATCH /api/denuncias/:id/tomar -> Toma de caso con bloqueo atómico 1 a 1 (Agente)
router.patch('/:id/tomar', authenticate, requireAgent, tomarCasoAtomico);

// PATCH /api/denuncias/:id/verificar -> Verificación in situ Casos A/B/C y regla de 3 intentos (Agente)
router.patch('/:id/verificar', authenticate, requireAgent, verificarInSitu);

// PATCH /api/denuncias/:id/cierre-tecnico -> Cierre técnico de saneamiento con foto e informe (Agente)
router.patch('/:id/cierre-tecnico', authenticate, requireAgent, registrarCierreTecnico);

// PATCH /api/denuncias/:id/certificar -> Certificación final Antes vs. Después u observación (Admin)
router.patch('/:id/certificar', authenticate, requireAdmin, certificarResolucionFinal);

// PATCH /api/denuncias/:id/liberar -> Liberación / desasignación inteligente a la bolsa (Agente o Admin)
router.patch(
  '/:id/liberar',
  authenticate,
  requireRole(Role.ADMIN, Role.AGENT),
  liberarCaso
);

// PATCH /api/denuncias/:id/estado -> Cambiar estado de una denuncia
router.patch('/:id/estado', authenticate, requireAdmin, cambiarEstadoDenuncia);

export default router;
