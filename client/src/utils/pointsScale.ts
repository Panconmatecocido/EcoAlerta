export type PrioridadCaso = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export interface RangoPuntos {
  min: number;
  max: number;
  sugerido: number;
  descripcion: string;
}

export const BAREMO_PUNTOS_POR_PRIORIDAD: Record<PrioridadCaso, RangoPuntos> = {
  BAJA: {
    min: 50,
    max: 80,
    sugerido: 50,
    descripcion: '50 a 80 pts (Limpieza menor / poda)',
  },
  MEDIA: {
    min: 100,
    max: 150,
    sugerido: 100,
    descripcion: '100 a 150 pts (Terreno baldío / residuos)',
  },
  ALTA: {
    min: 200,
    max: 300,
    sugerido: 250,
    descripcion: '200 a 300 pts (Microbasural clandestino)',
  },
  URGENTE: {
    min: 350,
    max: 500,
    sugerido: 400,
    descripcion: '350 a 500 pts (Foco de dengue / riesgo crítico)',
  },
};

export const isValidPointsForPriority = (
  prioridad: PrioridadCaso | string,
  puntos: number
): boolean => {
  const p = prioridad as PrioridadCaso;
  const rango = BAREMO_PUNTOS_POR_PRIORIDAD[p];
  if (!rango) return false;
  return Number.isInteger(puntos) && puntos >= rango.min && puntos <= rango.max;
};

export const getPuntosSugeridos = (prioridad: PrioridadCaso | string): number => {
  const p = prioridad as PrioridadCaso;
  return BAREMO_PUNTOS_POR_PRIORIDAD[p]?.sugerido ?? 100;
};
