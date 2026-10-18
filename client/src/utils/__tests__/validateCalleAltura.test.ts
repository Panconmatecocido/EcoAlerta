/**
 * Tests unitarios para validateCalleAltura
 *
 * Cubre Requisito 5.2 / FR-003: la dirección manual debe incluir
 * al menos un dígito numérico (número de altura) y no puede estar vacía.
 */
import { validateCalleAltura } from '../validateCalleAltura';

describe('validateCalleAltura', () => {
  // ── Casos que deben retornar true ────────────────────────────────────────

  describe('retorna true (dirección válida)', () => {
    it('acepta calle con número de altura', () => {
      expect(validateCalleAltura('Av. Rivadavia 1234')).toBe(true);
    });

    it('acepta dirección con dígito al inicio', () => {
      expect(validateCalleAltura('1234 Av. Rivadavia')).toBe(true);
    });

    it('acepta dirección con un solo dígito', () => {
      expect(validateCalleAltura('Calle 5')).toBe(true);
    });

    it('acepta dirección con espacios alrededor y dígito', () => {
      expect(validateCalleAltura('  San Martín 200  ')).toBe(true);
    });

    it('acepta dirección con múltiples números', () => {
      expect(validateCalleAltura('Ruta 9 km 54')).toBe(true);
    });

    it('acepta dirección con número pegado a letras', () => {
      expect(validateCalleAltura('Manzana A2 Lote 3')).toBe(true);
    });
  });

  // ── Casos que deben retornar false ───────────────────────────────────────

  describe('retorna false (dirección inválida)', () => {
    it('rechaza string vacío', () => {
      expect(validateCalleAltura('')).toBe(false);
    });

    it('rechaza string con solo espacios', () => {
      expect(validateCalleAltura('   ')).toBe(false);
    });

    it('rechaza string con solo tabulaciones y saltos de línea', () => {
      expect(validateCalleAltura('\t\n\r')).toBe(false);
    });

    it('rechaza nombre de calle sin número de altura', () => {
      expect(validateCalleAltura('Rivadavia')).toBe(false);
    });

    it('rechaza descripción textual sin dígitos', () => {
      expect(validateCalleAltura('Av. del Libertador')).toBe(false);
    });

    it('rechaza string con solo letras y puntuación, sin dígitos', () => {
      expect(validateCalleAltura('Esquina San Martín y Belgrano')).toBe(false);
    });
  });
});
