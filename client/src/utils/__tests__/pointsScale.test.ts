import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BAREMO_PUNTOS_POR_PRIORIDAD,
  isValidPointsForPriority,
  getPuntosSugeridos,
} from '../pointsScale';

describe('pointsScale - Baremo Oficial y Validaciones de Puntos por Prioridad', () => {
  it('define los rangos oficiales estipulados para cada prioridad', () => {
    assert.deepEqual(BAREMO_PUNTOS_POR_PRIORIDAD.BAJA, {
      min: 50,
      max: 80,
      sugerido: 50,
      descripcion: '50 a 80 pts (Limpieza menor / poda)',
    });

    assert.deepEqual(BAREMO_PUNTOS_POR_PRIORIDAD.MEDIA, {
      min: 100,
      max: 150,
      sugerido: 100,
      descripcion: '100 a 150 pts (Terreno baldío / residuos)',
    });

    assert.deepEqual(BAREMO_PUNTOS_POR_PRIORIDAD.ALTA, {
      min: 200,
      max: 300,
      sugerido: 250,
      descripcion: '200 a 300 pts (Microbasural clandestino)',
    });

    assert.deepEqual(BAREMO_PUNTOS_POR_PRIORIDAD.URGENTE, {
      min: 350,
      max: 500,
      sugerido: 400,
      descripcion: '350 a 500 pts (Foco de dengue / riesgo crítico)',
    });
  });

  it('valida correctamente los límites exactos de Prioridad BAJA (50 a 80)', () => {
    assert.equal(isValidPointsForPriority('BAJA', 50), true);
    assert.equal(isValidPointsForPriority('BAJA', 65), true);
    assert.equal(isValidPointsForPriority('BAJA', 80), true);

    // Fuera de límites
    assert.equal(isValidPointsForPriority('BAJA', 49), false);
    assert.equal(isValidPointsForPriority('BAJA', 81), false);
    assert.equal(isValidPointsForPriority('BAJA', 0), false);
    assert.equal(isValidPointsForPriority('BAJA', -10), false);
  });

  it('valida correctamente los límites exactos de Prioridad MEDIA (100 a 150)', () => {
    assert.equal(isValidPointsForPriority('MEDIA', 100), true);
    assert.equal(isValidPointsForPriority('MEDIA', 125), true);
    assert.equal(isValidPointsForPriority('MEDIA', 150), true);

    assert.equal(isValidPointsForPriority('MEDIA', 99), false);
    assert.equal(isValidPointsForPriority('MEDIA', 151), false);
  });

  it('valida correctamente los límites exactos de Prioridad ALTA (200 a 300)', () => {
    assert.equal(isValidPointsForPriority('ALTA', 200), true);
    assert.equal(isValidPointsForPriority('ALTA', 250), true);
    assert.equal(isValidPointsForPriority('ALTA', 300), true);

    assert.equal(isValidPointsForPriority('ALTA', 199), false);
    assert.equal(isValidPointsForPriority('ALTA', 301), false);
  });

  it('valida correctamente los límites exactos de Prioridad URGENTE (350 a 500)', () => {
    assert.equal(isValidPointsForPriority('URGENTE', 350), true);
    assert.equal(isValidPointsForPriority('URGENTE', 400), true);
    assert.equal(isValidPointsForPriority('URGENTE', 500), true);

    assert.equal(isValidPointsForPriority('URGENTE', 349), false);
    assert.equal(isValidPointsForPriority('URGENTE', 501), false);
  });

  it('rechaza decimales y prioridades desconocidas', () => {
    assert.equal(isValidPointsForPriority('MEDIA', 120.5), false);
    assert.equal(isValidPointsForPriority('DESCONOCIDA', 100), false);
  });

  it('retorna los puntos sugeridos por defecto para cada prioridad', () => {
    assert.equal(getPuntosSugeridos('BAJA'), 50);
    assert.equal(getPuntosSugeridos('MEDIA'), 100);
    assert.equal(getPuntosSugeridos('ALTA'), 250);
    assert.equal(getPuntosSugeridos('URGENTE'), 400);
    assert.equal(getPuntosSugeridos('OTRA'), 100);
  });
});
