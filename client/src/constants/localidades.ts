/**
 * Lista de localidades habilitadas del partido de Pilar (Buenos Aires, Argentina).
 * Requisito: 6.11
 *
 * Se usa `as const` para que el compilador infiera una unión de literales
 * en lugar de `string[]`, lo que permite type-checking en toda la app.
 */
export const LOCALIDADES = [
  'Champagnat',
  'Del Viso',
  'Fátima',
  'La Lonja',
  'Luis Lagomarsino',
  'Manuel Alberti',
  'Manzanares',
  'Manzone',
  'Pilar',
  'Pilar Sur',
  'Presidente Derqui',
  'San Francisco',
  'Villa Astolfi',
  'Villa Rosa',
  'Zelaya',
] as const;

/** Unión de literales de todas las localidades permitidas. */
export type Localidad = (typeof LOCALIDADES)[number];
