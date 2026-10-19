// server/src/routes/denuncias.routes.ts

import { Router } from 'express';
import {
  obtenerDenuncias,
  obtenerMetricasAdmin,
  cambiarEstadoDenuncia,
  asignarAgenteDenuncia,
  crearDenuncia,
  obtenerMisDenuncias,
} from '../controllers/denuncias.controller';

const router = Router();

// GET /api/denuncias/mis-denuncias -> Denuncias del ciudadano autenticado
router.get('/mis-denuncias', obtenerMisDenuncias);

// GET /api/denuncias -> Obtener lista de denuncias
router.get('/', obtenerDenuncias);

// GET /api/denuncias/metricas -> Métricas para Dashboard Admin
router.get('/metricas', obtenerMetricasAdmin);

// POST /api/denuncias -> Crear nueva denuncia (Ciudadano)
router.post('/', crearDenuncia);

// PATCH /api/denuncias/:id/estado -> Cambiar estado de una denuncia
router.patch('/:id/estado', cambiarEstadoDenuncia);

// PATCH /api/denuncias/:id/asignar -> Asignar agente a denuncia
router.patch('/:id/asignar', asignarAgenteDenuncia);

export default router;