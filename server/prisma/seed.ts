// server/prisma/seed.ts

import { PrismaClient, Role, EstadoDenuncia, Prioridad } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando y verificando datos en Supabase...');

  // 1. Crear Municipio Pilar
  const municipio = await prisma.municipio.upsert({
    where: { codigo: 'PILAR-BA' },
    update: {},
    create: {
      nombre: 'Municipio de Pilar',
      codigo: 'PILAR-BA',
    },
  });

  // 2. Usuarios Demo (Ciudadano, Agente, Admin, Colaborador)
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

  await prisma.user.upsert({
    where: { email: 'colaborador@ecoalerta.gob.ar' },
    update: {},
    create: {
      nombre: 'Operador de Entrega Municipal',
      email: 'colaborador@ecoalerta.gob.ar',
      passwordHash: 'colaborador123',
      rol: Role.COLLABORATOR,
      municipioId: municipio.id,
    },
  });

  // 3. Denuncias Demo (incluyendo casos en PENDIENTE para Triaje y APROBADO para Bolsa de Agentes)
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
      latitud: -34.4812,
      longitud: -58.8421,
      ciudadanoId: ciudadano.id,
      municipioId: municipio.id,
    },
  });

  await prisma.denuncia.upsert({
    where: { codigo: 'REP-2026-002' },
    update: {
      estado: EstadoDenuncia.APROBADO,
      agenteId: null,
    },
    create: {
      codigo: 'REP-2026-002',
      titulo: 'Recipientes con agua estancada',
      descripcion: 'Posible foco de reproducción de dengue en terreno baldío.',
      categoria: 'Foco de Dengue',
      estado: EstadoDenuncia.APROBADO,
      prioridad: Prioridad.URGENTE,
      direccion: 'Ruta 25 Km 4, Pilar',
      latitud: -34.4587,
      longitud: -58.9142,
      ciudadanoId: ciudadano.id,
      agenteId: null,
      municipioId: municipio.id,
    },
  });

  await prisma.denuncia.upsert({
    where: { codigo: 'REP-2026-003' },
    update: {},
    create: {
      codigo: 'REP-2026-003',
      titulo: 'Neumáticos acumulados con agua tras lluvia',
      descripcion: 'Foco crítico de dengue aprobado en triaje y disponible en bolsa general.',
      categoria: 'Foco de Dengue',
      estado: EstadoDenuncia.APROBADO,
      prioridad: Prioridad.URGENTE,
      direccion: 'Av. Tratado del Pilar 850, Pilar',
      latitud: -34.4562,
      longitud: -58.9115,
      ciudadanoId: ciudadano.id,
      municipioId: municipio.id,
    },
  });

  await prisma.denuncia.upsert({
    where: { codigo: 'REP-2026-004' },
    update: {},
    create: {
      codigo: 'REP-2026-004',
      titulo: 'Terreno baldío con pastizales y roedores',
      descripcion: 'Predio cerrado que requiere verificación de agente en terreno.',
      categoria: 'Terreno Baldío',
      estado: EstadoDenuncia.APROBADO,
      prioridad: Prioridad.ALTA,
      direccion: 'San Martín 640, Pilar',
      latitud: -34.4551,
      longitud: -58.9188,
      intentosInaccesible: 1,
      observacionesAdmin: 'Visita 1/3 registrada: portón cerrado con candado.',
      ciudadanoId: ciudadano.id,
      municipioId: municipio.id,
    },
  });

  // 4. Productos de Tienda Ecológica (solo si aún no existen)
  const totalProductos = await prisma.producto.count({
    where: { municipioId: municipio.id },
  });

  if (totalProductos === 0) {
    await prisma.producto.createMany({
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
  }

  // 5. Sucursales Municipales de Retiro (solo si aún no existen)
  const totalSucursales = await prisma.sucursal.count({
    where: { municipioId: municipio.id },
  });

  if (totalSucursales === 0) {
    await prisma.sucursal.createMany({
      data: [
        {
          nombre: 'Palacio Municipal de Pilar',
          direccion: 'Rivadavia 660, Pilar Centro',
          horario: 'Lunes a Viernes de 08:00 a 15:00 hs',
          municipioId: municipio.id,
        },
        {
          nombre: 'Delegación Municipal Presidente Derqui',
          direccion: 'Av. De Mayo 450, Derqui',
          horario: 'Lunes a Viernes de 08:00 a 14:00 hs',
          municipioId: municipio.id,
        },
      ],
    });
  }

  console.log('✅ Base de datos verificada y sembrada con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });