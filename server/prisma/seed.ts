// server/prisma/seed.ts

import { PrismaClient, Role, EstadoDenuncia, Prioridad } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando datos en Supabase...');

  // 1. Crear Municipio Pilar
  const municipio = await prisma.municipio.upsert({
    where: { codigo: 'PILAR-BA' },
    update: {},
    create: {
      nombre: 'Municipio de Pilar',
      codigo: 'PILAR-BA',
    },
  });

  // 2. Usuarios Demo (Ciudadano, Agente, Admin)
  const ciudadano = await prisma.user.upsert({
    where: { email: 'ejemplo@email.com' },
    update: {},
    create: {
      nombre: 'EcoUsuario',
      email: 'ejemplo@email.com',
      passwordHash: 'password123',
      rol: Role.CITIZEN,
      puntos: 120,
      municipioId: municipio.id,
    },
  });

  const agente = await prisma.user.upsert({
    where: { email: 'agente@municipio.gob.ar' },
    update: {},
    create: {
      nombre: 'Inspector Perez',
      email: 'agente@municipio.gob.ar',
      passwordHash: 'agente123',
      rol: Role.AGENT,
      disponible: true,
      municipioId: municipio.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@ecoalerta.gob.ar' },
    update: {},
    create: {
      nombre: 'Administrador General',
      email: 'admin@ecoalerta.gob.ar',
      passwordHash: 'admin123',
      rol: Role.ADMIN,
      municipioId: municipio.id,
    },
  });

  // 3. Denuncias Demo
  await prisma.denuncia.upsert({
    where: { codigo: 'REP-2026-001' },
    update: {},
    create: {
      codigo: 'REP-2026-001',
      titulo: 'Microbasural a cielo abierto',
      descripcion: 'Acumulación de escombros y restos plásticos en vereda.',
      categoria: 'Microbasural',
      estado: EstadoDenuncia.PENDIENTE,
      prioridad: Prioridad.ALTA,
      direccion: 'Av. De Mayo y Calle 12, Presidente Derqui',
      ciudadanoId: ciudadano.id,
      municipioId: municipio.id,
    },
  });

  await prisma.denuncia.upsert({
    where: { codigo: 'REP-2026-002' },
    update: {},
    create: {
      codigo: 'REP-2026-002',
      titulo: 'Recipientes con agua estancada',
      descripcion: 'Posible foco de reproducción de dengue en terreno baldío.',
      categoria: 'Foco Dengue',
      estado: EstadoDenuncia.EN_PROCESO,
      prioridad: Prioridad.URGENTE,
      direccion: 'Ruta 25 Km 4',
      ciudadanoId: ciudadano.id,
      agenteId: agente.id,
      municipioId: municipio.id,
    },
  });

// 4. Productos de Tienda Ecológica
  await prisma.producto.createMany({
    skipDuplicates: true,
    data: [
      {
        titulo: 'Bolsa de Tela Reutilizable',
        descripcion: 'Bolsa ecológica de algodón orgánico.',
        costoPuntos: 40,
        stock: 50,
        municipioId: municipio.id,
      },
      {
        titulo: 'Botella Térmica EcoAlerta',
        descripcion: 'Botella de acero inoxidable 500ml.',
        costoPuntos: 100,
        stock: 20,
        municipioId: municipio.id,
      },
      {
        titulo: 'Gorra Oficial EcoAlerta',
        descripcion: 'Gorra de material reciclado.',
        costoPuntos: 80,
        stock: 15,
        municipioId: municipio.id,
      },
    ],
  });

  console.log('✅ Base de datos sembrada con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });