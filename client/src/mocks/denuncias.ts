export interface DenunciaMock {
  id: string;
  titulo: string;
  categoria: string;
  fecha: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  ubicacion: string;
}

export const MOCK_DENUNCIAS: DenunciaMock[] = [
  {
    id: 'den-001',
    titulo: 'Basural a cielo abierto',
    categoria: 'Residuos',
    fecha: '2026-03-01',
    estado: 'APROBADO',
    ubicacion: 'Av. Mayo y Calle 12',
  },
  {
    id: 'den-002',
    titulo: 'Quema de pastizales',
    categoria: 'Contaminación',
    fecha: '2026-03-05',
    estado: 'PENDIENTE',
    ubicacion: 'Ruta 25 Km 4',
  },
  {
    id: 'den-003',
    titulo: 'Vertido de efluentes en arroyo',
    categoria: 'Agua',
    fecha: '2026-02-18',
    estado: 'RECHAZADO',
    ubicacion: 'Arroyo Borde',
  },
];