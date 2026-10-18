// src/screens/citizen/ReportFormScreen.tsx
/**
 * Pantalla del formulario de creación de reporte ambiental.
 *
 * Requisitos: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4,
 *             6.1, 7.1, 7.2, 7.3, 8.1, 8.2, 8.4, 8.5, 8.6,
 *             10.1, 10.2, 10.3
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Header } from '../../components/Header';
import { CustomButton } from '../../components/CustomButton';
import { GravedadSelector } from '../../components/GravedadSelector';
import { LocalidadAutocomplete } from '../../components/LocalidadAutocomplete';
import { useReportForm } from '../../hooks/useReportForm';
import type { ReportFormScreenProps } from '../../navigation/types';
import { COLORS, SPACING, BORDER_RADIUS } from '../../utils/theme';

/**
 * `ReportFormScreen` recibe `fotoUri` como parámetro de ruta
 * desde `ReportCameraScreen` y orquesta el formulario de reporte.
 */
export const ReportFormScreen: React.FC<ReportFormScreenProps> = ({
  navigation,
  route,
}) => {
  const { fotoUri } = route.params;

  // Trackea si el usuario ya intentó enviar al menos una vez.
  // Se usa para decidir si mostrar los mensajes de validación por campo.
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const onSuccess = () => navigation.navigate('ReportConfirmation');

  const {
    state,
    errors,
    isFormValid,
    isSubmitting,
    retryCount,
    lastError,
    setGravedad,
    setCalleAltura,
    setLocalidad,
    clearLocalidad,
    submit,
  } = useReportForm(fotoUri, onSuccess);

  // ── Manejador del botón de envío ──────────────────────────────────────────

  const handleSubmit = async () => {
    setHasAttemptedSubmit(true);
    if (!isFormValid) return;
    await submit();
  };

  // ── Mensaje cuando se alcanzó el límite de reintentos ─────────────────────

  const maxRetriesReached = retryCount >= 3;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Encabezado sin íconos de acción */}
      <Header showActions={false} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Título de la sección ── */}
        <Text style={styles.screenTitle}>Nuevo Reporte</Text>
        <Text style={styles.screenSubtitle}>
          Completá los datos del problema ambiental
        </Text>

        {/* ── 1. Fotografía de evidencia (Req. 3.1, 3.2, 3.3) ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.fieldLabel}>Fotografía de evidencia</Text>

          {fotoUri ? (
            <View style={styles.photoRow}>
              <Image
                source={{ uri: fotoUri }}
                style={styles.photoThumbnail}
                accessibilityLabel="Miniatura de la fotografía capturada"
                resizeMode="cover"
              />
              <Text style={styles.photoCaption}>
                Foto adjunta correctamente
              </Text>
            </View>
          ) : (
            /* Req. 3.3 — sin URI */
            <View style={styles.noPhotoBox}>
              <Text style={styles.noPhotoText}>
                No hay imagen disponible. Volvé a la cámara para capturar una foto.
              </Text>
            </View>
          )}

          {hasAttemptedSubmit && errors.fotoUri ? (
            <Text style={styles.fieldError}>{errors.fotoUri}</Text>
          ) : null}
        </View>

        {/* ── 2. Gravedad (Req. 4.1, 4.2, 4.3) ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.fieldLabel}>
            Gravedad del problema <Text style={styles.required}>*</Text>
          </Text>

          <GravedadSelector
            value={state.gravedad}
            onChange={setGravedad}
          />

          {hasAttemptedSubmit && errors.gravedad ? (
            <Text style={styles.fieldError}>{errors.gravedad}</Text>
          ) : null}
        </View>

        {/* ── 3. Calle y altura (Req. 5.1, 5.2, 5.3, 5.4) ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.fieldLabel}>
            Calle y altura <Text style={styles.required}>*</Text>
          </Text>

          <TextInput
            style={[
              styles.textInput,
              hasAttemptedSubmit && errors.calleAltura
                ? styles.textInputError
                : null,
            ]}
            value={state.calleAltura}
            onChangeText={setCalleAltura}
            placeholder="Ej: Av. Rivadavia 1234"
            placeholderTextColor={COLORS.textoDesactivado}
            maxLength={100}
            autoCorrect={false}
            autoCapitalize="words"
            returnKeyType="next"
            accessibilityLabel="Calle y altura"
            accessibilityHint="Ingresá la calle y número donde ocurre el problema"
          />

          {/* Req. 5.4 — indicador de límite de 100 caracteres */}
          {state.calleAltura.length >= 90 && (
            <Text style={styles.charCountWarning}>
              {state.calleAltura.length === 100
                ? 'Se alcanzó el límite máximo de 100 caracteres'
                : `${state.calleAltura.length}/100 caracteres`}
            </Text>
          )}

          {hasAttemptedSubmit && errors.calleAltura ? (
            <Text style={styles.fieldError}>{errors.calleAltura}</Text>
          ) : null}
        </View>

        {/* ── 4. Localidad (Req. 6.1–6.11) ── */}
        <View style={[styles.sectionCard, styles.localidadCard]}>
          <Text style={styles.fieldLabel}>
            Localidad <Text style={styles.required}>*</Text>
          </Text>

          <LocalidadAutocomplete
            value={state.localidad}
            inputText={state.localidadInputText}
            onSelect={setLocalidad}
            onChangeText={clearLocalidad}
          />

          {hasAttemptedSubmit && errors.localidad ? (
            <Text style={[styles.fieldError, styles.localidadError]}>
              {errors.localidad}
            </Text>
          ) : null}
        </View>

        {/* ── Separador visual para el espacio del dropdown ── */}
        <View style={styles.dropdownSpacer} />

        {/* ── Error de envío (Req. 8.4, 10.2) ── */}
        {lastError ? (
          <View style={styles.submitErrorBox}>
            <Text style={styles.submitErrorText}>{lastError}</Text>
          </View>
        ) : null}

        {/* ── Límite de reintentos alcanzado (Req. 10.3) ── */}
        {maxRetriesReached ? (
          <View style={styles.maxRetriesBox}>
            <Text style={styles.maxRetriesText}>
              No es posible completar el envío en este momento. Intentá más tarde.
            </Text>
          </View>
        ) : null}

        {/* ── Acciones ── */}
        <View style={styles.actionsContainer}>
          {/* Botón principal de creación (Req. 8.1, 8.2) */}
          <CustomButton
            title="Crear"
            onPress={handleSubmit}
            variant="primary"
            disabled={maxRetriesReached || isSubmitting}
            isLoading={isSubmitting}
          />

          {/* Botón de cancelar / volver (Req. 10.1, 10.4) */}
          <CustomButton
            title="Cancelar"
            onPress={() => navigation.goBack()}
            variant="outline"
            disabled={isSubmitting}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.fondoAplicacion,
  },

  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl + SPACING.lg,
  },

  // ── Encabezado de pantalla ──
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textoVerdeOscuro,
    marginBottom: SPACING.xs,
  },
  screenSubtitle: {
    fontSize: 14,
    color: COLORS.textoSecundario,
    marginBottom: SPACING.md,
  },

  // ── Tarjeta de sección ──
  sectionCard: {
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },

  // El dropdown necesita espacio extra por encima del resto del contenido
  localidadCard: {
    zIndex: 20,
    overflow: 'visible',
  },

  // ── Etiqueta de campo ──
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  required: {
    color: COLORS.error,
  },

  // ── Error por campo ──
  fieldError: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },

  // ── Fotografía ──
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.fondoTarjeta,
  },
  photoCaption: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textoVerde,
    fontWeight: '600',
  },
  noPhotoBox: {
    backgroundColor: COLORS.fondoAdvertencia,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
  },
  noPhotoText: {
    fontSize: 13,
    color: COLORS.textoAdvertencia,
    lineHeight: 18,
  },

  // ── Campo de texto ──
  textInput: {
    backgroundColor: COLORS.fondoTarjeta,
    borderWidth: 1,
    borderColor: COLORS.borde,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 15,
    color: COLORS.textoVerdeOscuro,
    height: 48,
  },
  textInputError: {
    borderColor: COLORS.error,
  },
  charCountWarning: {
    fontSize: 11,
    color: COLORS.textoAdvertencia,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },

  // ── Localidad ──
  localidadError: {
    marginTop: SPACING.sm + SPACING.xs, // espacio extra por el dropdown
  },

  // Espacio para que el dropdown no quede tapado por las cards de abajo
  dropdownSpacer: {
    height: SPACING.lg,
  },

  // ── Error de envío ──
  submitErrorBox: {
    backgroundColor: COLORS.fondoPeligro,
    borderWidth: 1,
    borderColor: COLORS.bordePeligro,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  submitErrorText: {
    fontSize: 14,
    color: COLORS.textoPeligro,
    lineHeight: 20,
  },

  // ── Límite de reintentos ──
  maxRetriesBox: {
    backgroundColor: COLORS.fondoAdvertencia,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  maxRetriesText: {
    fontSize: 14,
    color: COLORS.textoAdvertencia,
    lineHeight: 20,
  },

  // ── Acciones ──
  actionsContainer: {
    gap: SPACING.xs,
  },
});

export default ReportFormScreen;
