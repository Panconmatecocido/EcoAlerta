/**
 * Valida que un texto de dirección (calle + altura) sea aceptable
 * para el formulario de reporte ciudadano.
 *
 * Reglas (RF-003 / Requisito 5.2):
 *  - Retorna `false` si el string está vacío o sólo contiene whitespace.
 *  - Retorna `false` si no contiene al menos un dígito [0-9]
 *    (exige que la dirección incluya una altura numérica).
 *  - Retorna `true` en cualquier otro caso.
 *
 * @param text - Texto de dirección ingresado por el usuario.
 * @returns `true` si la dirección es válida, `false` en caso contrario.
 *
 * @example
 * validateCalleAltura('Av. Rivadavia 1234')  // true
 * validateCalleAltura('Rivadavia')            // false — sin número de altura
 * validateCalleAltura('')                     // false — vacío
 * validateCalleAltura('   ')                  // false — solo whitespace
 */
export function validateCalleAltura(text: string): boolean {
  if (text.trim().length === 0) {
    return false;
  }

  return /[0-9]/.test(text);
}
