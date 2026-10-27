// server/prisma/seed.ts

import { PrismaClient, Role, EstadoDenuncia, Prioridad, EstadoCanje } from '@prisma/client';

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

  // 3. Cuentas de autenticación demo para los cuatro roles (Módulo 001)
  await prisma.user.upsert({
    where: { email: 'ciudadano@ecoalerta.com' },
    update: {
      nombre: 'Ciudadano Demo',
      passwordHash: 'ciudadano123',
      rol: Role.CITIZEN,
      puntos: 0,
      municipioId: municipio.id,
    },
    create: {
      nombre: 'Ciudadano Demo',
      email: 'ciudadano@ecoalerta.com',
      passwordHash: 'ciudadano123',
      rol: Role.CITIZEN,
      puntos: 0,
      municipioId: municipio.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'agente1@ecoalerta.com' },
    update: {
      nombre: 'Agente Demo',
      passwordHash: 'agente123',
      rol: Role.AGENT,
      disponible: true,
      municipioId: municipio.id,
    },
    create: {
      nombre: 'Agente Demo',
      email: 'agente1@ecoalerta.com',
      passwordHash: 'agente123',
      rol: Role.AGENT,
      disponible: true,
      municipioId: municipio.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@ecoalerta.com' },
    update: {
      nombre: 'Administrador Demo',
      passwordHash: 'admin123',
      rol: Role.ADMIN,
      municipioId: municipio.id,
    },
    create: {
      nombre: 'Administrador Demo',
      email: 'admin@ecoalerta.com',
      passwordHash: 'admin123',
      rol: Role.ADMIN,
      municipioId: municipio.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'colaborador@ecoalerta.com' },
    update: {
      nombre: 'Colaborador Demo',
      passwordHash: 'colaborador123',
      rol: Role.COLLABORATOR,
      municipioId: municipio.id,
    },
    create: {
      nombre: 'Colaborador Demo',
      email: 'colaborador@ecoalerta.com',
      passwordHash: 'colaborador123',
      rol: Role.COLLABORATOR,
      municipioId: municipio.id,
    },
  });

  // 4. Denuncias Demo (incluyendo casos en PENDIENTE para Triaje y APROBADO para Bolsa de Agentes)
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

  // 5. Asegurar Municipio MUN-001
  const municipioMun = await prisma.municipio.upsert({
    where: { codigo: 'MUN-001' },
    update: {},
    create: {
      nombre: 'Municipio de Pilar',
      codigo: 'MUN-001',
    },
  });

  const targetMunicipios = [municipio, municipioMun];

  for (const mun of targetMunicipios) {
    // Productos de Tienda Ecológica (al menos 4)
    const totalProductos = await prisma.producto.count({
      where: { municipioId: mun.id },
    });

    if (totalProductos === 0) {
      await prisma.producto.createMany({
        data: [
          {
            titulo: 'Bolsa de Tela Reutilizable',
            descripcion: 'Bolsa ecológica de algodón orgánico para compras sin residuos.',
            costoPuntos: 40,
            stock: 50,
            activo: true,
            imagenUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300&q=80',
            municipioId: mun.id,
          },
          {
            titulo: 'Botella Térmica EcoAlerta 500ml',
            descripcion: 'Botella de acero inoxidable reutilizable libre de BPA.',
            costoPuntos: 100,
            stock: 25,
            activo: true,
            imagenUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=300&q=80',
            municipioId: mun.id,
          },
          {
            titulo: 'Gorra Oficial EcoAlerta',
            descripcion: 'Gorra confeccionada con hilo de plástico reciclado.',
            costoPuntos: 80,
            stock: 15,
            activo: true,
            imagenUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=300&q=80',
            municipioId: mun.id,
          },
          {
            titulo: 'Compostera Domiciliaria 20L',
            descripcion: 'Compostera compacta aireada para tratamiento de residuos orgánicos.',
            costoPuntos: 250,
            stock: 10,
            activo: true,
            imagenUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=300&q=80',
            municipioId: mun.id,
          },
        ],
      });
    }

    // Sucursales Municipales de Retiro (al menos 2)
    const totalSucursales = await prisma.sucursal.count({
      where: { municipioId: mun.id },
    });

    if (totalSucursales === 0) {
      await prisma.sucursal.createMany({
        data: [
          {
            nombre: 'Palacio Municipal de Pilar',
            direccion: 'Rivadavia 660, Pilar Centro',
            horario: 'Lunes a Viernes de 08:00 a 15:00 hs',
            activa: true,
            municipioId: mun.id,
          },
          {
            nombre: 'Delegación Municipal Presidente Derqui',
            direccion: 'Av. De Mayo 450, Derqui',
            horario: 'Lunes a Viernes de 08:00 a 14:00 hs',
            activa: true,
            municipioId: mun.id,
          },
        ],
      });
    }
  }

  // 6. Sembrar Canjes de Prueba para Validación de Entrega y Expiración (Módulo 006)
  const sucursalPilar = await prisma.sucursal.findFirst({
    where: { municipioId: municipio.id },
  });

  const botellaProd = await prisma.producto.findFirst({
    where: { municipioId: municipio.id, titulo: { contains: 'Botella' } },
  });

  const bolsaProd = await prisma.producto.findFirst({
    where: { municipioId: municipio.id, titulo: { contains: 'Bolsa' } },
  });

  const ahora = new Date();

  if (sucursalPilar && botellaProd && bolsaProd) {
    // Canje Vigente para Retiro: ECO-7894-K
    await prisma.canje.upsert({
      where: { codigoRetiro: 'ECO-7894-K' },
      update: {
        estado: EstadoCanje.PENDIENTE_RETIRO,
        sucursalId: sucursalPilar.id,
        fechaExpiracion: new Date(ahora.getTime() + 25 * 24 * 60 * 60 * 1000),
      },
      create: {
        codigoRetiro: 'ECO-7894-K',
        totalPuntos: 100,
        estado: EstadoCanje.PENDIENTE_RETIRO,
        ciudadanoId: ciudadano.id,
        sucursalId: sucursalPilar.id,
        fechaExpiracion: new Date(ahora.getTime() + 25 * 24 * 60 * 60 * 1000),
        creadoEn: new Date(ahora.getTime() - 5 * 24 * 60 * 60 * 1000),
        items: {
          create: [
            {
              productoId: botellaProd.id,
              cantidad: 1,
              puntosUnit: 100,
            },
          ],
        },
      },
    });

    // Canje Ya Entregado para Prueba de Doble Entrega (409 Conflict): ECO-2026-ENTR
    await prisma.canje.upsert({
      where: { codigoRetiro: 'ECO-2026-ENTR' },
      update: {
        estado: EstadoCanje.ENTREGADO,
        sucursalId: sucursalPilar.id,
        fechaEntrega: new Date(ahora.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      create: {
        codigoRetiro: 'ECO-2026-ENTR',
        totalPuntos: 40,
        estado: EstadoCanje.ENTREGADO,
        ciudadanoId: ciudadano.id,
        sucursalId: sucursalPilar.id,
        fechaExpiracion: new Date(ahora.getTime() + 10 * 24 * 60 * 60 * 1000),
        fechaEntrega: new Date(ahora.getTime() - 2 * 24 * 60 * 60 * 1000),
        creadoEn: new Date(ahora.getTime() - 10 * 24 * 60 * 60 * 1000),
        items: {
          create: [
            {
              productoId: bolsaProd.id,
              cantidad: 1,
              puntosUnit: 40,
            },
          ],
        },
      },
    });

    // Canje Vencido (>30 días) para Prueba de Expiración Automática: ECO-2026-EXPD
    await prisma.canje.upsert({
      where: { codigoRetiro: 'ECO-2026-EXPD' },
      update: {
        estado: EstadoCanje.PENDIENTE_RETIRO,
        sucursalId: sucursalPilar.id,
        fechaExpiracion: new Date(ahora.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      create: {
        codigoRetiro: 'ECO-2026-EXPD',
        totalPuntos: 80,
        estado: EstadoCanje.PENDIENTE_RETIRO,
        ciudadanoId: ciudadano.id,
        sucursalId: sucursalPilar.id,
        fechaExpiracion: new Date(ahora.getTime() - 2 * 24 * 60 * 60 * 1000),
        creadoEn: new Date(ahora.getTime() - 32 * 24 * 60 * 60 * 1000),
        items: {
          create: [
            {
              productoId: bolsaProd.id,
              cantidad: 2,
              puntosUnit: 40,
            },
          ],
        },
      },
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
