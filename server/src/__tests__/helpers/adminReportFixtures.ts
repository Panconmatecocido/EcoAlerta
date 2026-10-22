import {
  Denuncia,
  EstadoDenuncia,
  Prioridad,
  Role,
  User,
} from '@prisma/client';

export type AdminReportUserFixture = Pick<
  User,
  'id' | 'nombre' | 'rol' | 'municipioId' | 'disponible'
>;

export type AdminReportRecordFixture = Pick<
  Denuncia,
  | 'id'
  | 'codigo'
  | 'titulo'
  | 'descripcion'
  | 'categoria'
  | 'estado'
  | 'prioridad'
  | 'direccion'
  | 'latitud'
  | 'longitud'
  | 'municipioId'
  | 'creadoEn'
>;

export const adminReportUsers = {
  adminMunicipalityOne: {
    id: 'admin-municipality-1',
    nombre: 'Administradora Municipio 1',
    rol: Role.ADMIN,
    municipioId: 'municipality-1',
    disponible: true,
  },
  agentMunicipalityOne: {
    id: 'agent-municipality-1',
    nombre: 'Agente Municipio 1',
    rol: Role.AGENT,
    municipioId: 'municipality-1',
    disponible: true,
  },
  adminMunicipalityTwo: {
    id: 'admin-municipality-2',
    nombre: 'Administrador Municipio 2',
    rol: Role.ADMIN,
    municipioId: 'municipality-2',
    disponible: true,
  },
  agentMunicipalityTwo: {
    id: 'agent-municipality-2',
    nombre: 'Agente Municipio 2',
    rol: Role.AGENT,
    municipioId: 'municipality-2',
    disponible: true,
  },
} satisfies Record<string, AdminReportUserFixture>;

export const adminReportRecords = {
  withCoordinates: {
    id: 'report-with-coordinates',
    codigo: 'REP-2026-001',
    titulo: 'Microbasural en la plaza',
    descripcion: 'Residuos acumulados en la vereda.',
    categoria: 'Microbasural',
    estado: EstadoDenuncia.PENDIENTE,
    prioridad: Prioridad.MEDIA,
    direccion: 'Calle 1 y Calle 2',
    latitud: -34.46,
    longitud: -58.91,
    municipioId: 'municipality-1',
    creadoEn: new Date('2026-01-01T00:00:00.000Z'),
  },
  withoutCoordinates: {
    id: 'report-without-coordinates',
    codigo: 'REP-2026-002',
    titulo: 'Residuos en la vía pública',
    descripcion: 'Hay residuos acumulados en la esquina.',
    categoria: 'Microbasural',
    estado: EstadoDenuncia.PENDIENTE,
    prioridad: Prioridad.MEDIA,
    direccion: 'Calle 3 y Calle 4',
    latitud: null,
    longitud: null,
    municipioId: 'municipality-2',
    creadoEn: new Date('2026-01-02T00:00:00.000Z'),
  },
} satisfies Record<string, AdminReportRecordFixture>;
