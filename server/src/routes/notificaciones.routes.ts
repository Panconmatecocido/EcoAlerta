// server/src/routes/notificaciones.routes.ts

import { Router } from 'express';
import { obtenerNotificacionesCiudadano } from '../controllers/notificaciones.controller';

const router = Router();

router.get('/ciudadano/:ciudadanoId', obtenerNotificacionesCiudadano);

export default router;
