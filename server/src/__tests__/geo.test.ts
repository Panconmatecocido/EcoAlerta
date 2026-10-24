import { distanceBetweenCoordinates, isValidCoordinatePair } from '../utils/geo';

describe('GPS coordinate helpers', () => {
  it('accepts valid latitude and longitude boundaries', () => {
    expect(isValidCoordinatePair(-90, -180)).toBe(true);
    expect(isValidCoordinatePair(90, 180)).toBe(true);
  });

  it('rejects out-of-range, non-numeric, and incomplete coordinates', () => {
    expect(isValidCoordinatePair(-90.01, 0)).toBe(false);
    expect(isValidCoordinatePair(0, 180.01)).toBe(false);
    expect(isValidCoordinatePair('34', -58)).toBe(false);
    expect(isValidCoordinatePair(-34, null)).toBe(false);
  });

  it('calculates zero distance for the same point and positive distance for distinct points', () => {
    expect(distanceBetweenCoordinates(-34.46, -58.91, -34.46, -58.91)).toBe(0);
    expect(distanceBetweenCoordinates(-34.46, -58.91, -34.461, -58.911)).toBeGreaterThan(0);
  });
});
