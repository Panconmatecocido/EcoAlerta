// server/src/index.ts

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import denunciasRoutes from './routes/denuncias.routes';
import agentesRoutes from './routes/agentes.routes';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Registro de Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/denuncias', denunciasRoutes);
app.use('/api/agentes', agentesRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor EcoAlerta corriendo en http://localhost:${PORT}`);
});