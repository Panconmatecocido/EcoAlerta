// server/src/routes/canjes.routes.ts

import { Router } from 'express';
import {
  reservarCanje,
  cancelarReserva,
  confirmarCanje,
  liberarReservasVencidasEndpoint,
  obtenerCanjesCiudadano,
  obtenerCanjePorId,
} from '../controllers/canjes.controller';

const router = Router();

// Fase 1: Reserva con TTL de 5 minutos
router.post('/reservar', reservarCanje);

// Cancelación de reserva
router.post('/:id/cancelar-reserva', cancelarReserva);
router.patch('/:id/cancelar-reserva', cancelarReserva);

// Fase 2: Confirmación con sucursal y generación de voucher
router.post('/:id/confirmar', confirmarCanje);
router.patch('/:id/confirmar', confirmarCanje);

// Liberación manual o por worker de vencidas
router.post('/liberar-vencidas', liberarReservasVencidasEndpoint);

// Consultas
router.get('/ciudadano/:ciudadanoId', obtenerCanjesCiudadano);
router.get('/:id', obtenerCanjePorId);

export default router;
