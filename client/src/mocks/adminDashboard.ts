// src/mocks/adminDashboard.ts

export interface MetricasAdmin {
  denunciasPendientes: number;
  denunciasEnProceso: number;
  denunciasResueltas: number;
  totalAgentesActivos: number;
}

export const METRICAS_MOCK: MetricasAdmin = {
  denunciasPendientes: 14,
  denunciasEnProceso: 8,
  denunciasResueltas: 42,
  totalAgentesActivos: 6,
};

export interface AgenteResumen {
  id: string;
  nombre: string;
  email: string;
  casosAsignados: number;
  disponible: boolean;
}

export const AGENTES_MOCK: AgenteResumen[] = [
  { id: '1', nombre: 'Carlos Gómez', email: 'carlos.gomez@municipio.gob.ar', casosAsignados: 3, disponible: true },
  { id: '2', nombre: 'Laura Martínez', email: 'laura.martinez@municipio.gob.ar', casosAsignados: 5, disponible: false },
  { id: '3', nombre: 'Roberto Peña', email: 'roberto.pena@municipio.gob.ar', casosAsignados: 1, disponible: true },
];