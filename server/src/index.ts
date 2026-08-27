import express, { Request, Response } from 'express';
import reportRoutes from './routes/report.routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para entender JSON
app.use(express.json());

// Ruta para la dirección raíz (http://localhost:3000/)
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Bienvenido a la API de EcoAlerta' });
});

// Ruta de prueba
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: '¡El backend de EcoAlerta está funcionando correctamente!'
  });
});

// Registrar las rutas de reportes
app.use('/api/reports', reportRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});