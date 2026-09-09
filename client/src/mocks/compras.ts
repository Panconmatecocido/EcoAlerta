export interface CompraMock {
  id: string;
  nombreProducto: string;
  puntosUsados: number;
  fecha: string;
  estado: 'Entregado' | 'En proceso';
}

export const MOCK_COMPRAS: CompraMock[] = [
  {
    id: 'com-101',
    nombreProducto: 'Botella Térmica Eco',
    puntosUsados: 80,
    fecha: '2026-02-20',
    estado: 'Entregado',
  },
  {
    id: 'com-102',
    nombreProducto: 'Bolsa de Tela Orgánica',
    puntosUsados: 30,
    fecha: '2026-02-28',
    estado: 'Entregado',
  },
];