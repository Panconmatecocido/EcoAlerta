// server/src/routes/productos.routes.ts

import { Router } from 'express';
import { obtenerProductos } from '../controllers/productos.controller';

const router = Router();

router.get('/', obtenerProductos);

export default router;
