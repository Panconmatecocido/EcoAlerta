// server/src/routes/sucursales.routes.ts

import { Router } from 'express';
import {
  obtenerSucursales,
  crearSucursal,
  actualizarSucursal,
} from '../controllers/productos.controller';

const router = Router();

router.get('/', obtenerSucursales);
router.post('/', crearSucursal);
router.put('/:id', actualizarSucursal);
router.patch('/:id', actualizarSucursal);

export default router;
