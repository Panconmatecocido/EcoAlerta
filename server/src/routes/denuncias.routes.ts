// server/src/routes/denuncias.routes.ts

import { Router } from 'express';
import {
  obtenerDenuncias,
  obtenerMisDenuncias,
  obtenerMetricasAdmin,
  cambiarEstadoDenuncia,
  asignarAgenteDenuncia,
  crearDenuncia,
  triajeDenuncia,
  getBolsaCasos,
  tomarCasoAtomico,
  verificarInSitu,
  liberarCaso,
  validarVeracidad,
  registrarCierreTecnico,
  certificarResolucionFinal,
} from '../controllers/denuncias.controller';

const router = Router();

// GET /api/denuncias -> Obtener lista de denuncias
router.get('/', obtenerDenuncias);

// GET /api/denuncias/mis-denuncias -> Obtener denuncias del ciudadano autenticado
router.get('/mis-denuncias', obtenerMisDenuncias);
router.get('/ciudadano/:ciudadanoId', obtenerMisDenuncias);

// GET /api/denuncias/metricas -> Métricas para Dashboard Admin
router.get('/metricas', obtenerMetricasAdmin);

// GET /api/denuncias/bolsa -> Bolsa general de casos ordenada por prioridad (Agentes)
router.get('/bolsa', getBolsaCasos);

// POST /api/denuncias -> Crear nueva denuncia (Ciudadano)
router.post('/', crearDenuncia);

// PATCH /api/denuncias/:id/triaje -> Triaje inicial por Admin (Aprobar con Prioridad o Rechazar con motivo)
router.patch('/:id/triaje', triajeDenuncia);

// PATCH /api/denuncias/:id/validar-veracidad -> Validación de veracidad y acreditación de puntos (Admin)
router.patch('/:id/validar-veracidad', validarVeracidad);

// PATCH /api/denuncias/:id/tomar -> Toma de caso con bloqueo atómico 1 a 1 (Agente)
router.patch('/:id/tomar', tomarCasoAtomico);

// PATCH /api/denuncias/:id/verificar -> Verificación in situ Casos A/B/C y regla de 3 intentos (Agente)
router.patch('/:id/verificar', verificarInSitu);

// PATCH /api/denuncias/:id/cierre-tecnico -> Cierre técnico de saneamiento con foto e informe (Agente)
router.patch('/:id/cierre-tecnico', registrarCierreTecnico);

// PATCH /api/denuncias/:id/certificar -> Certificación final Antes vs. Después u observación (Admin)
router.patch('/:id/certificar', certificarResolucionFinal);

// PATCH /api/denuncias/:id/liberar -> Liberación / desasignación inteligente a la bolsa (Agente o Admin)
router.patch('/:id/liberar', liberarCaso);

// PATCH /api/denuncias/:id/estado -> Cambiar estado de una denuncia
router.patch('/:id/estado', cambiarEstadoDenuncia);

// PATCH /api/denuncias/:id/asignar -> Asignar agente a denuncia
router.patch('/:id/asignar', asignarAgenteDenuncia);

export default router;