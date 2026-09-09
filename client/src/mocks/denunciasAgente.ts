export interface DenunciaAgenteMock {
  id: string;
  codigo: string;
  titulo: string;
  categoria: string;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  distanciaKm: number;
  direccion: string;
  fechaAsignacion: string;
  descripcion: string;
  estado: 'PENDIENTE' | 'EN_CAMINO' | 'RESUELTO';
}

export const MOCK_DENUNCIAS_AGENTE: DenunciaAgenteMock[] = [
  {
    id: 'insp-001',
    codigo: 'REP-2026-891',
    titulo: 'Vertido de residuos industriales',
    categoria: 'Contaminación',
    prioridad: 'ALTA',
    distanciaKm: 0.8,
    direccion: 'Av. De Mayo 1420',
    fechaAsignacion: 'Hace 15 min',
    descripcion: 'Se observa vertido de efluentes no identificados cerca del arroyo.',
    estado: 'EN_CAMINO',
  },
  {
    id: 'insp-002',
    codigo: 'REP-2026-895',
    titulo: 'Basural clandestino acumulado',
    categoria: 'Residuos',
    prioridad: 'MEDIA',
    distanciaKm: 2.3,
    direccion: 'Calle 12 y Ruta 25',
    fechaAsignacion: 'Hace 45 min',
    descripcion: 'Acumulación de plásticos y escombros bloqueando vereda.',
    estado: 'PENDIENTE',
  },
  {
    id: 'insp-003',
    codigo: 'REP-2026-880',
    titulo: 'Quema no autorizada de restos vegetales',
    categoria: 'Aire',
    prioridad: 'BAJA',
    distanciaKm: 4.1,
    direccion: 'Barrio El Roble - Lote 14',
    fechaAsignacion: 'Hace 2 horas',
    descripcion: 'Vecinos reportan humo denso continuo.',
    estado: 'PENDIENTE',
  },
];