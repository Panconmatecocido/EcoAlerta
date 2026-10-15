// server/src/routes/agentes.routes.ts

import { Router } from 'express';
import {
  obtenerAgentes,
  cambiarDisponibilidadAgente,
  crearAgente,
} from '../controllers/agentes.controller';

const router = Router();

// GET /api/agentes -> Obtener lista de agentes con su número de casos activos
router.get('/', obtenerAgentes);

// POST /api/agentes -> Alta de un nuevo agente de campo
router.post('/', crearAgente);

// PATCH /api/agentes/:id/disponibilidad -> Alternar estado (Disponible / Ocupado)
router.patch('/:id/disponibilidad', cambiarDisponibilidadAgente);

export default router;