// server/src/index.ts

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import denunciasRoutes from './routes/denuncias.routes';
import agentesRoutes from './routes/agentes.routes';
import productosRoutes from './routes/productos.routes';
import reportRoutes from './routes/report.routes';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Registro de Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/denuncias', denunciasRoutes);
app.use('/api/agentes', agentesRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/reports', reportRoutes);

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Servidor EcoAlerta corriendo en http://localhost:${PORT} (Red local: http://192.168.1.62:${PORT})`);
});