// server/src/routes/productos.routes.ts

import { Router } from 'express';
import {
  obtenerProductos,
  obtenerProductosAdmin,
  crearProducto,
  actualizarProducto,
  desactivarProducto,
} from '../controllers/productos.controller';

const router = Router();

// Rutas de Catálogo de Productos
router.get('/', obtenerProductos);
router.get('/admin', obtenerProductosAdmin);
router.post('/', crearProducto);
router.put('/:id', actualizarProducto);
router.patch('/:id', actualizarProducto);
router.delete('/:id', desactivarProducto);

export default router;
