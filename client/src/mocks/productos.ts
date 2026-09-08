// src/mocks/productos.ts
import { Producto } from '../interfaces/product';

export const MOCK_PRODUCTOS: Producto[] = [
  {
    id: 'prod-1',
    nombre: 'Cepillo de Bambú',
    descripcion: 'Biodegradable con cerdas suave libre de BPA.',
    precio: 150,
    categoria: 'Cuidado Personal',
    urlImagen: 'https://farmacityar.vtexassets.com/arquivos/ids/289064-800-auto?v=639077118645070000&width=800&height=auto&aspect=true',
    stock: 25,
  },
  {
    id: 'prod-2',
    nombre: 'Bolsa Ecológica',
    descripcion: '100% algodón orgánico reutilizable.',
    precio: 220,
    categoria: 'Hogar',
    urlImagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLQSZ7BpLEBmZm_Tr2_BSiNJvv9LVTznW0eDXBFh5a3cSUSRMVwrgdsnk&s=10',
    stock: 40,
  },
  {
    id: 'prod-3',
    nombre: 'Detergente Biodegradable',
    descripcion: 'Insumo ecológico para limpieza del hogar.',
    precio: 350,
    categoria: 'Limpieza',
    urlImagen: 'https://www.cif.com.ar/images/h0nadbhvm6m4/2ukXACIbNQ9DeGusHgEIJm/fd81da9639b920800b763e5a24847c67/Q0lmX0RldGVyZ2VudGVfTGltYV9Gcm9udC5wbmc/1200w-1200h/cif-active-gel-detergente-lavavajilla-concentrado-lim%C3%B3n-verde.jpg',
    stock: 15,
  },
  {
    id: 'prod-4',
    nombre: 'Cuaderno Reciclado',
    descripcion: 'Hojas de papel 100% reciclado sin blanquear.',
    precio: 180,
    categoria: 'Papelería',
    urlImagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRyl42usS8PDhcAit4u3lFGOjVgP-6ovD4EZuypXCBgRzo5iJoXevjPqck&s=10',
    stock: 30,
  },
];