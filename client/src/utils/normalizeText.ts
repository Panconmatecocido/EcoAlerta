import { LOCALIDADES } from '../constants/localidades';

/**
 * Normaliza un texto aplicando descomposición NFD, eliminando diacríticos
 * (tildes y marcas combinantes) y convirtiendo a minúsculas.
 *
 * Requisitos: 6.2, 6.3
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Filtra la lista de localidades habilitadas según una cadena de búsqueda.
 * Retorna un array vacío si `query` tiene menos de 3 caracteres.
 * La comparación es insensible a mayúsculas/minúsculas y diacríticos.
 *
 * Requisitos: 6.2, 6.3, 6.6
 */
export function filtrarLocalidades(query: string): string[] {
  if (query.length < 3) {
    return [];
  }

  const normalizedQuery = normalizeText(query);

  return LOCALIDADES.filter((localidad) =>
    normalizeText(localidad).includes(normalizedQuery),
  );
}
