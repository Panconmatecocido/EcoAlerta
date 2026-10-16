import { Router } from 'express';
import multer from 'multer';
import { subirImagenSupabase } from '../utils/storage';
import { prisma } from '../lib/prisma'; // Tu cliente de Prisma

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/api/denuncias', upload.single('foto'), async (req, res) => {
  try {
    const { titulo, categoria, descripcion, ubicacion, latitud, longitud, usuarioId } = req.body;

    let fotoUrl: string | undefined = undefined;

    if (req.file) {
      fotoUrl = await subirImagenSupabase(req.file);
    }

    const nuevaDenuncia = await prisma.denuncia.create({
      data: {
        titulo,
        categoria,
        descripcion,
        ubicacion,
        latitud: latitud ? parseFloat(latitud) : null,
        longitud: longitud ? parseFloat(longitud) : null,
        fotoUrl,
        estado: 'PENDIENTE',
        usuarioId, // O extraído del middleware de JWT/Autenticación
      },
    });

    return res.status(201).json(nuevaDenuncia);
  } catch (error: any) {
    console.error('Error al crear denuncia:', error.message);
    return res.status(500).json({ message: 'Error interno al registrar denuncia.' });
  }
});

export default router;