/**
 * Hook de estado, validación, envío y control de reintentos para el formulario
 * de creación de reporte ambiental.
 *
 * Requisitos: 7.2, 8.1, 8.2, 8.3, 8.5, 8.6, 9.3, 10.1, 10.2, 10.3, 10.4
 *
 * RESTRICCIONES:
 * - No llama a `updateUserPoints` bajo ninguna circunstancia (Req. 9.3).
 * - No modifica `denunciasService.ts`.
 */

import { useState, useCallback } from 'react';
import { denunciaService } from '../services/denunciasService';
import { validateCalleAltura } from '../utils/validateCalleAltura';
import { LOCALIDADES } from '../constants/localidades';
import type { Localidad } from '../constants/localidades';
import { useAuth } from '../context/AuthContext';

// ─── Tipos internos ───────────────────────────────────────────────────────────

type Gravedad = 'LEVE' | 'MODERADA' | 'GRAVE';

/**
 * Estado del formulario.
 * `fotoUri` nunca cambia tras la inicialización (se fija desde el parámetro de ruta).
 */
type FormState = {
  fotoUri: string;
  gravedad: Gravedad | null;
  calleAltura: string;
  localidad: string | null;       // null hasta que se seleccione de la lista
  localidadInputText: string;     // texto visible en el campo de autocompletado
};

/** Estado de envío. */
type SubmitState = {
  isSubmitting: boolean;
  retryCount: number;   // 0..3; al llegar a 3 se bloquea el formulario (Req. 10.3)
  lastError: string | null;
};

// ─── Interfaz pública ─────────────────────────────────────────────────────────

export interface UseReportFormReturn {
  state: FormState;
  errors: Partial<Record<keyof FormState, string>>;
  isFormValid: boolean;
  isSubmitting: boolean;
  retryCount: number;
  lastError: string | null;
  setGravedad: (g: Gravedad) => void;
  setCalleAltura: (text: string) => void;
  /**
   * Registra la localidad seleccionada desde el dropdown.
   * Actualiza tanto `localidad` como `localidadInputText`.
   */
  setLocalidad: (loc: string) => void;
  /**
   * Invalida la selección de localidad y actualiza el texto visible.
   * Debe llamarse cuando el usuario edita el campo después de haber seleccionado.
   */
  clearLocalidad: (text: string) => void;
  submit: () => Promise<void>;
  reset: () => void;
}

// ─── Estado inicial ───────────────────────────────────────────────────────────

const buildInitialFormState = (fotoUri: string): FormState => ({
  fotoUri,
  gravedad: null,
  calleAltura: '',
  localidad: null,
  localidadInputText: '',
});

const INITIAL_SUBMIT_STATE: SubmitState = {
  isSubmitting: false,
  retryCount: 0,
  lastError: null,
};

// ─── Timeout de 30 s ─────────────────────────────────────────────────────────

const SUBMIT_TIMEOUT_MS = 30_000;

/**
 * Devuelve una promesa que rechaza con `AbortError` tras `ms` milisegundos.
 * Se usa como alternativa cuando `clienteApi` no propaga la señal del AbortController.
 */
function rejectAfter(ms: number): Promise<never> {
  return new Promise<never>((_, reject) =>
    setTimeout(() => {
      const err = new Error('Request timed out');
      err.name = 'AbortError';
      reject(err);
    }, ms),
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param fotoUri   URI local de la fotografía de evidencia, recibida como
 *                  parámetro de ruta desde `ReportCameraScreen`.
 * @param onSuccess Callback invocado tras un envío exitoso.
 *                  La pantalla lo usa para navegar a `ReportConfirmation`.
 */
export function useReportForm(
  fotoUri: string,
  onSuccess: () => void,
): UseReportFormReturn {
  const [formState, setFormState] = useState<FormState>(() =>
    buildInitialFormState(fotoUri),
  );
  const [submitState, setSubmitState] = useState<SubmitState>(INITIAL_SUBMIT_STATE);
  let user: any = null;
  try {
    const auth = useAuth();
    user = auth?.user ?? null;
  } catch {
    user = null;
  }

  // ── Validación ─────────────────────────────────────────────────────────────

  /**
   * `isFormValid` retorna `true` si y solo si:
   * - `fotoUri` no es nulo ni vacío (Req. 2.2)
   * - `gravedad` es uno de {LEVE, MODERADA, GRAVE} (Req. 4.3)
   * - `calleAltura` pasa `validateCalleAltura` (Req. 5.2)
   * - `localidad` no es nulo y pertenece a `LOCALIDADES` (Req. 6.10, 6.11)
   * - `retryCount < 3` (Req. 10.3)
   */
  const isFormValid = ((): boolean => {
    if (submitState.retryCount >= 3) return false;
    if (!formState.fotoUri || formState.fotoUri.trim().length === 0) return false;
    if (!formState.gravedad) return false;
    if (!validateCalleAltura(formState.calleAltura)) return false;
    if (
      !formState.localidad ||
      !(LOCALIDADES as readonly string[]).includes(formState.localidad)
    ) {
      return false;
    }
    return true;
  })();

  // ── Errores por campo ───────────────────────────────────────────────────────

  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!formState.fotoUri || formState.fotoUri.trim().length === 0) {
    errors.fotoUri = 'Se requiere una fotografía de evidencia.';
  }
  if (!formState.gravedad) {
    errors.gravedad = 'Seleccioná la gravedad del problema.';
  }
  if (!validateCalleAltura(formState.calleAltura)) {
    errors.calleAltura =
      'Ingresá la calle y altura (debe incluir al menos un número).';
  }
  if (
    !formState.localidad ||
    !(LOCALIDADES as readonly string[]).includes(formState.localidad)
  ) {
    errors.localidad = 'Seleccioná una localidad válida de la lista.';
  }

  // ── Setters ─────────────────────────────────────────────────────────────────

  const setGravedad = useCallback((g: Gravedad) => {
    setFormState((prev) => ({ ...prev, gravedad: g }));
  }, []);

  const setCalleAltura = useCallback((text: string) => {
    setFormState((prev) => ({ ...prev, calleAltura: text }));
  }, []);

  /** Registra la localidad elegida desde el dropdown. */
  const setLocalidad = useCallback((loc: string) => {
    setFormState((prev) => ({
      ...prev,
      localidad: loc,
      localidadInputText: loc,
    }));
  }, []);

  /**
   * El usuario editó el campo de autocompletado después de haber seleccionado
   * una localidad → se invalida la selección y se actualiza el texto visible.
   */
  const clearLocalidad = useCallback((text: string) => {
    setFormState((prev) => ({
      ...prev,
      localidad: null,
      localidadInputText: text,
    }));
  }, []);

  // ── reset ───────────────────────────────────────────────────────────────────

  /**
   * Limpia completamente el estado del formulario.
   * Solo debe llamarse en envío exitoso o cancelación explícita (Req. 10.4).
   */
  const reset = useCallback(() => {
    setFormState(buildInitialFormState(fotoUri));
    setSubmitState(INITIAL_SUBMIT_STATE);
  }, [fotoUri]);

  // ── submit ──────────────────────────────────────────────────────────────────

  const submit = useCallback(async () => {
    // No-op si ya hay un envío en curso (Req. 8.2)
    if (submitState.isSubmitting) return;

    // Snapshot del estado actual para preservación en caso de fallo (Req. 10.1)
    const snapshot = { ...formState };

    setSubmitState((prev) => ({ ...prev, isSubmitting: true, lastError: null }));

    // Construir el payload según el mapeo del diseño
    const payload = {
      titulo: `Reporte ambiental - ${snapshot.localidad}`,
      categoria: 'BASURAL' as const,
      descripcion: `${snapshot.gravedad} - ${snapshot.calleAltura}`,
      ubicacion: `${snapshot.calleAltura}, ${snapshot.localidad}`,
      fotoUri: snapshot.fotoUri,
      ciudadanoId: user?.id,
    };

    // AbortController para timeout de 30 s (Req. 8.6)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);

    try {
      // `clienteApi` pasa `RequestInit` a `fetch`, que acepta `signal` de forma nativa.
      // Si por algún motivo el signal no se propaga, `Promise.race` actúa como respaldo.
      await Promise.race([
        denunciaService.crearDenuncia(payload),
        rejectAfter(SUBMIT_TIMEOUT_MS),
      ]);

      clearTimeout(timeoutId);

      // Éxito: limpiar estado y notificar a la pantalla (Req. 8.3, 10.4)
      reset();
      onSuccess();
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      const isTimeout =
        err instanceof Error && err.name === 'AbortError';
      const message = isTimeout
        ? 'El servidor no respondió a tiempo. Tus datos permanecen en el formulario, podés reintentar.'
        : err instanceof Error && err.message && !err.message.includes('Error HTTP')
        ? err.message
        : 'No se pudo completar el registro del reporte. Tus datos permanecen en el formulario para que puedas reintentar.';

      // Preservar datos del formulario e incrementar contador de reintentos (Req. 8.4, 8.5, 10.2, 10.3)
      setFormState(snapshot);
      setSubmitState((prev) => ({
        isSubmitting: false,
        retryCount: Math.min(prev.retryCount + 1, 3),
        lastError: message,
      }));
    }
  }, [formState, submitState.isSubmitting, user, onSuccess, reset]);

  // ── Retorno ─────────────────────────────────────────────────────────────────

  return {
    state: formState,
    errors,
    isFormValid,
    isSubmitting: submitState.isSubmitting,
    retryCount: submitState.retryCount,
    lastError: submitState.lastError,
    setGravedad,
    setCalleAltura,
    setLocalidad,
    clearLocalidad,
    submit,
    reset,
  };
}
