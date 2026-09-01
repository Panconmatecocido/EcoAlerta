// server/prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando carga de productos de prueba...');

  await prisma.product.deleteMany({});

  const productos = [
    {
      name: 'Kit Cepillos Bambú x4',
      description: 'Juego de 4 cepillos biodegradables de bambú.',
      price: 500,
      category: 'Cuidado Personal',
      imageUrl: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=500',
      stock: 15,
    },
    {
      name: 'Bolsa Tela Grande',
      description: 'Bolsa reutilizable de algodón orgánico para compras.',
      price: 500,
      category: 'Hogar',
      imageUrl: 'https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?w=500',
      stock: 30,
    },
    {
      name: 'Botella Térmica',
      description: 'Botella de acero inoxidable de 750ml reutilizable.',
      price: 1000,
      category: 'Hogar',
      imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500',
      stock: 10,
    },
    {
      name: 'Maceta Ecológica',
      description: 'Maceta biodegradable hecha de fibras vegetales.',
      price: 300,
      category: 'Hogar',
      imageUrl: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500',
      stock: 25,
    },
    {
      name: 'Cepillo de Bambú',
      description: 'Cepillo individual con cerdas de fibra vegetal.',
      price: 300,
      category: 'Cuidado Personal',
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500',
      stock: 50,
    },
  ];

  for (const producto of productos) {
    await prisma.product.create({
      data: producto,
    });
  }

  console.log('¡Productos agregados exitosamente!');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });