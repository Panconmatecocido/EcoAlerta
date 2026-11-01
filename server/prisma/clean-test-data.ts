// server/prisma/clean-test-data.ts

import { PrismaClient, Role, EstadoDenuncia, Prioridad } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Iniciando limpieza de datos de prueba en la base de datos...');

  // 1. Eliminar ítems de canje y canjes generados en pruebas
  const deletedItems = await prisma.itemCanje.deleteMany({});
  console.log(`  - Items de canje eliminados: ${deletedItems.count}`);

  const deletedCanjes = await prisma.canje.deleteMany({});
  console.log(`  - Canjes/Vouchers de prueba eliminados: ${deletedCanjes.count}`);

  // 2. Eliminar denuncias creadas durante pruebas (todas salvo las semillas oficiales 001, 002, 003)
  const deletedDenuncias = await prisma.denuncia.deleteMany({
    where: {
      codigo: {
        notIn: ['REP-2026-001', 'REP-2026-002', 'REP-2026-003'],
      },
    },
  });
  console.log(`  - Denuncias de prueba eliminadas: ${deletedDenuncias.count}`);

  // 3. Restaurar estado inicial de denuncias semilla
  await prisma.denuncia.updateMany({
    where: { codigo: 'REP-2026-001' },
    data: {
      estado: EstadoDenuncia.PENDIENTE,
      agenteId: null,
      puntosOtorgados: 0,
      prioridad: Prioridad.ALTA,
      ocultarUsuario: false,
    },
  });

  await prisma.denuncia.updateMany({
    where: { codigo: 'REP-2026-002' },
    data: {
      estado: EstadoDenuncia.APROBADO,
      agenteId: null,
      puntosOtorgados: 0,
      prioridad: Prioridad.URGENTE,
      ocultarUsuario: false,
    },
  });

  await prisma.denuncia.updateMany({
    where: { codigo: 'REP-2026-003' },
    data: {
      estado: EstadoDenuncia.APROBADO,
      agenteId: null,
      puntosOtorgados: 0,
      prioridad: Prioridad.URGENTE,
      ocultarUsuario: false,
    },
  });
  console.log('  - Denuncias semilla (REP-001, REP-002, REP-003) restauradas a sus estados originales.');

  // 4. Eliminar usuarios de prueba generados en tests (Postman y E2E)
  const testEmails = [
    'carlos.gomez@ecoalerta.test',
    'marcos.ramos@pilar.gob.ar',
    'contacto@comercioverde.com',
    'sinfoto@pilar.gob.ar',
  ];

  // Eliminar denuncias asociadas a estos correos por si alguna quedó vinculada
  const testUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { in: testEmails } },
        { email: { contains: 'carlos.gomez' } },
        { email: { contains: 'test' } },
      ],
    },
    select: { id: true, email: true },
  });

  const testUserIds = testUsers
    .filter((u) => !u.email.includes('ecoalerta.com') && !u.email.includes('gob.ar'))
    .map((u) => u.id);

  if (testUserIds.length > 0) {
    await prisma.denuncia.deleteMany({
      where: {
        OR: [
          { ciudadanoId: { in: testUserIds } },
          { agenteId: { in: testUserIds } },
        ],
      },
    });
  }

  const deletedUsers = await prisma.user.deleteMany({
    where: {
      email: {
        in: testEmails,
      },
    },
  });
  console.log(`  - Cuentas de usuario de prueba eliminadas: ${deletedUsers.count} (${testEmails.join(', ')})`);

  // 5. Restaurar stock y activación de todos los productos
  const updatedProductos = await prisma.producto.updateMany({
    data: {
      stock: 30,
      activo: true,
    },
  });
  console.log(`  - Catálogo de productos restaurado: ${updatedProductos.count} productos con stock = 30 y activo = true`);

  // 6. Restaurar saldos de puntos y disponibilidad de usuarios demo
  await prisma.user.updateMany({
    where: { email: 'ciudadano@ecoalerta.com' },
    data: {
      puntos: 500, // Puntos suficientes para probar canjes y compras sin restricciones
      disponible: true,
    },
  });

  await prisma.user.updateMany({
    where: { email: 'ejemplo@email.com' },
    data: {
      puntos: 500,
      disponible: true,
    },
  });

  await prisma.user.updateMany({
    where: { email: 'agente1@ecoalerta.com' },
    data: {
      disponible: true,
    },
  });

  await prisma.user.updateMany({
    where: { email: 'agente@municipio.gob.ar' },
    data: {
      disponible: true,
    },
  });

  console.log('  - Usuarios demo reiniciados: ciudadano@ecoalerta.com con 500 puntos, agentes disponibles.');
  console.log('\n✨ ¡Base de datos limpia y lista para volver a ejecutar la suite completa de Postman!');
}

main()
  .catch((e) => {
    console.error('❌ Error al limpiar datos de prueba:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
