// src/mocks/productos.ts

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: 'Hogar' | 'Cuidado Personal' | 'Jardín' | 'Reciclado';
  imagen: string; // URL o require local
  puntosEcologicos: number; // Puntos otorgados o canjeables
  stock: number;
}

export const MOCK_PRODUCTOS: Producto[] = [
  {
    id: 'prod-1',
    nombre: 'Cepillo de Dientes de Bambú',
    descripcion: 'Biodegradable con cerdas de fibra de bambú libre de BPA.',
    precio: 1500,
    categoria: 'Cuidado Personal',
    imagen: 'https://farmacityar.vtexassets.com/arquivos/ids/289064-800-auto?v=639077118645070000&width=800&height=auto&aspect=true',
    puntosEcologicos: 15,
    stock: 25,
  },
  {
    id: 'prod-2',
    nombre: 'Bolsa Ecológica Reutilizable',
    descripcion: 'Algodón orgánico 100% lavable y de alta resistencia.',
    precio: 2200,
    categoria: 'Hogar',
    imagen: 'https://img.magnific.com/foto-gratis/bolsa-ecologica_23-2148576640.jpg',
    puntosEcologicos: 20,
    stock: 40,
  },
  {
    id: 'prod-3',
    nombre: 'Compostera Urbana 10L',
    descripcion: 'Diseño compacto para departamento con filtro anti-olores.',
    precio: 18500,
    categoria: 'Jardín',
    imagen: 'https://http2.mlstatic.com/D_NQ_NP_611439-MLA43205301980_082020-O.webp',
    puntosEcologicos: 150,
    stock: 8,
  },
];