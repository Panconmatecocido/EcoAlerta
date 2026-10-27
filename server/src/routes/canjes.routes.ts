// server/src/routes/canjes.routes.ts

import { Router } from 'express';
import {
  reservarCanje,
  cancelarReserva,
  confirmarCanje,
  liberarReservasVencidasEndpoint,
  procesarCanjesExpiradosEndpoint,
  getCanjeByCodigo,
  confirmarEntregaCanje,
  getCanjesByCiudadano,
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

// Procesos automáticos / workers
router.post('/liberar-vencidas', liberarReservasVencidasEndpoint);
router.post('/procesar-expirados', procesarCanjesExpiradosEndpoint);

// Módulo 006: Panel Colaborador y Vouchers de Ciudadano
router.get('/codigo/:codigoRetiro', getCanjeByCodigo);
router.patch('/:codigoRetiro/entregar', confirmarEntregaCanje);
router.post('/:codigoRetiro/entregar', confirmarEntregaCanje);

// Consultas
router.get('/ciudadano/:ciudadanoId', getCanjesByCiudadano || obtenerCanjesCiudadano);
router.get('/:id', obtenerCanjePorId);

export default router;
