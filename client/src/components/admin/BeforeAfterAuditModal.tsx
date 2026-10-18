import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../utils/theme';
import { PrioritySemaphoreBadge, PrioridadCaso } from '../agent/PrioritySemaphoreBadge';

interface BeforeAfterAuditModalProps {
  visible: boolean;
  denuncia: {
    id: string;
    codigo?: string;
    titulo: string;
    descripcion?: string;
    categoria: string;
    ubicacion: string;
    prioridad?: PrioridadCaso;
    imagenUrl?: string;
    fotoVerificacionUrl?: string;
    fotoSolucionUrl?: string;
    informeSolucion?: string;
    observacionesAdmin?: string;
    agenteAsignadoNombre?: string;
    puntosOtorgados?: number;
  } | null;
  procesando?: boolean;
  onClose: () => void;
  onSubmit: (decision: {
    decision: 'CERTIFICAR' | 'OBSERVAR_REHACER';
    observacionesAdmin?: string;
  }) => Promise<void>;
}

export const BeforeAfterAuditModal: React.FC<BeforeAfterAuditModalProps> = ({
  visible,
  denuncia,
  procesando = false,
  onClose,
  onSubmit,
}) => {
  const [modoObservacion, setModoObservacion] = useState<boolean>(false);
  const [observaciones, setObservaciones] = useState<string>('');

  if (!denuncia) return null;

  const prioridad: PrioridadCaso = denuncia.prioridad || 'MEDIA';
  const fotoAntes = denuncia.imagenUrl || denuncia.fotoVerificacionUrl;
  const fotoDespues = denuncia.fotoSolucionUrl;

  const manejarCertificar = async () => {
    await onSubmit({
      decision: 'CERTIFICAR',
      observacionesAdmin: observaciones.trim() || undefined,
    });
  };

  const manejarObservar = async () => {
    if (observaciones.trim().length < 5) {
      Alert.alert(
        'Observación requerida',
        'Por favor indica qué aspectos de la limpieza o saneamiento deben ser corregidos o completados (mínimo 5 caracteres).'
      );
      return;
    }
    await onSubmit({
      decision: 'OBSERVAR_REHACER',
      observacionesAdmin: observaciones.trim(),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <MaterialCommunityIcons
                name="compare"
                size={ICON_SIZE.md}
                color={COLORS.botonPrincipal}
              />
              <Text style={styles.headerTitle}>Auditoría Antes vs. Después</Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={procesando} style={styles.closeButton}>
              <Ionicons name="close" size={ICON_SIZE.md} color={COLORS.textoSecundario} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Info Caso */}
            <View style={styles.casoCard}>
              <View style={styles.casoCardHeader}>
                <Text style={styles.codigoText}>{denuncia.codigo || 'REP'}</Text>
                <PrioritySemaphoreBadge prioridad={prioridad} />
              </View>
              <Text style={styles.tituloText}>{denuncia.titulo}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={ICON_SIZE.sm} color={COLORS.textoSecundario} />
                <Text style={styles.metaText}>{denuncia.ubicacion}</Text>
              </View>
              {denuncia.agenteAsignadoNombre ? (
                <View style={styles.metaRow}>
                  <Ionicons name="shield-checkmark-outline" size={ICON_SIZE.sm} color={COLORS.textoVerde} />
                  <Text style={styles.metaText}>Inspector actuante: {denuncia.agenteAsignadoNombre}</Text>
                </View>
              ) : null}
              {typeof denuncia.puntosOtorgados === 'number' && denuncia.puntosOtorgados > 0 ? (
                <View style={styles.metaRow}>
                  <Ionicons name="gift-outline" size={ICON_SIZE.sm} color={COLORS.iconoPrincipal} />
                  <Text style={styles.metaText}>Puntos ya acreditados al vecino: {denuncia.puntosOtorgados} pts</Text>
                </View>
              ) : null}
            </View>

            {/* Comparativa Visual Antes vs. Después */}
            <Text style={styles.sectionTitle}>Comparativa Visual de Saneamiento</Text>
            <View style={styles.comparativaRow}>
              {/* Foto Antes */}
              <View style={styles.fotoCard}>
                <View style={styles.fotoBadgeAntes}>
                  <Text style={styles.fotoBadgeText}>ANTES</Text>
                </View>
                {fotoAntes ? (
                  <Image source={{ uri: fotoAntes }} style={styles.foto} />
                ) : (
                  <View style={styles.fotoPlaceholder}>
                    <Ionicons name="image-outline" size={32} color={COLORS.textoSecundario} />
                    <Text style={styles.fotoPlaceholderText}>Sin foto inicial</Text>
                  </View>
                )}
                <Text style={styles.fotoSublabel}>Alerta reportada</Text>
              </View>

              {/* Foto Después */}
              <View style={styles.fotoCard}>
                <View style={styles.fotoBadgeDespues}>
                  <Text style={styles.fotoBadgeText}>DESPUÉS</Text>
                </View>
                {fotoDespues ? (
                  <Image source={{ uri: fotoDespues }} style={styles.foto} />
                ) : (
                  <View style={styles.fotoPlaceholder}>
                    <Ionicons name="checkmark-done" size={32} color={COLORS.botonPrincipal} />
                    <Text style={styles.fotoPlaceholderText}>Sin foto de solución</Text>
                  </View>
                )}
                <Text style={styles.fotoSublabel}>Lugar saneado</Text>
              </View>
            </View>

            {/* Informe Técnico del Agente */}
            <Text style={styles.sectionTitle}>Informe Técnico de Saneamiento</Text>
            <View style={styles.informeCard}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={ICON_SIZE.sm}
                color={COLORS.botonPrincipal}
              />
              <Text style={styles.informeTexto}>
                {denuncia.informeSolucion || 'El inspector no detalló un informe escrito.'}
              </Text>
            </View>

            {/* Selector de Dictamen: Certificar Cierre vs Observar y Devolver */}
            <View style={styles.tabDictamenContainer}>
              <TouchableOpacity
                style={[styles.tabDictamen, !modoObservacion && styles.tabDictamenActivoVerde]}
                onPress={() => setModoObservacion(false)}
                disabled={procesando}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={ICON_SIZE.sm}
                  color={!modoObservacion ? COLORS.blanco : COLORS.botonPrincipal}
                />
                <Text
                  style={[
                    styles.tabDictamenTexto,
                    !modoObservacion && styles.tabDictamenTextoActivo,
                  ]}
                >
                  Certificar Conforme
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabDictamen, modoObservacion && styles.tabDictamenActivoAmbar]}
                onPress={() => setModoObservacion(true)}
                disabled={procesando}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={ICON_SIZE.sm}
                  color={modoObservacion ? COLORS.blanco : COLORS.textoAdvertencia}
                />
                <Text
                  style={[
                    styles.tabDictamenTexto,
                    modoObservacion && styles.tabDictamenTextoActivo,
                  ]}
                >
                  Observar / Rehacer
                </Text>
              </TouchableOpacity>
            </View>

            {modoObservacion ? (
              <View style={styles.observarInfoCard}>
                <Ionicons name="information-circle-outline" size={ICON_SIZE.sm} color={COLORS.textoAdvertencia} />
                <Text style={styles.observarInfoTexto}>
                  El caso regresará a la etapa de EN_SANEAMIENTO con tus notas técnicas para que la cuadrilla repase la limpieza. No se descuentan los puntos al vecino.
                </Text>
              </View>
            ) : null}

            {/* Notas del Dictamen */}
            <Text style={styles.sectionTitle}>
              {modoObservacion ? 'Notas de Observación (Obligatorio)' : 'Observaciones Finales (Opcional)'}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={
                modoObservacion
                  ? 'Describe qué faltó sanear o por qué se rechaza la solución...'
                  : 'Comentarios de cierre o felicitaciones a la cuadrilla...'
              }
              placeholderTextColor={COLORS.textoSecundario}
              multiline
              numberOfLines={3}
              value={observaciones}
              onChangeText={setObservaciones}
            />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={procesando}>
              <Text style={styles.cancelButtonText}>Cerrar</Text>
            </TouchableOpacity>

            {!modoObservacion ? (
              <TouchableOpacity
                style={[styles.certificarButton, procesando && styles.buttonDisabled]}
                onPress={manejarCertificar}
                disabled={procesando}
              >
                {procesando ? (
                  <ActivityIndicator size="small" color={COLORS.blanco} />
                ) : (
                  <>
                    <Ionicons name="checkmark-done-circle" size={ICON_SIZE.sm} color={COLORS.blanco} />
                    <Text style={styles.certificarButtonText}>Certificar Cierre Definitivo</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.observarButton,
                  (observaciones.trim().length < 5 || procesando) && styles.buttonDisabled,
                ]}
                onPress={manejarObservar}
                disabled={observaciones.trim().length < 5 || procesando}
              >
                {procesando ? (
                  <ActivityIndicator size="small" color={COLORS.blanco} />
                ) : (
                  <>
                    <Ionicons name="arrow-undo" size={ICON_SIZE.sm} color={COLORS.blanco} />
                    <Text style={styles.observarButtonText}>Devolver a Saneamiento</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.superposicionOscura,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalContainer: {
    backgroundColor: COLORS.fondoAplicacion,
    borderRadius: BORDER_RADIUS.lg,
    width: '100%',
    maxHeight: '94%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bordeSuave,
    backgroundColor: COLORS.superficieTarjeta,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  casoCard: {
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    marginBottom: SPACING.md,
  },
  casoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  codigoText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.botonPrincipal,
  },
  tituloText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textoVerdeOscuro,
    marginBottom: SPACING.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textoSecundario,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  comparativaRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  fotoCard: {
    flex: 1,
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: SPACING.xs,
  },
  fotoBadgeAntes: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.textoPeligro,
    paddingVertical: 3,
    alignItems: 'center',
  },
  fotoBadgeDespues: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.botonPrincipal,
    paddingVertical: 3,
    alignItems: 'center',
  },
  fotoBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.blanco,
    letterSpacing: 0.5,
  },
  foto: {
    width: '100%',
    height: 130,
    backgroundColor: COLORS.bordeSuave,
  },
  fotoPlaceholder: {
    width: '100%',
    height: 130,
    backgroundColor: COLORS.fondoAplicacion,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  fotoPlaceholderText: {
    fontSize: 11,
    color: COLORS.textoSecundario,
  },
  fotoSublabel: {
    fontSize: 11,
    color: COLORS.textoSecundario,
    marginTop: 4,
  },
  informeCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  informeTexto: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textoVerdeOscuro,
    lineHeight: 18,
  },
  tabDictamenContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tabDictamen: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    gap: 6,
    backgroundColor: COLORS.superficieTarjeta,
  },
  tabDictamenActivoVerde: {
    backgroundColor: COLORS.botonPrincipal,
    borderColor: COLORS.botonPrincipal,
  },
  tabDictamenActivoAmbar: {
    backgroundColor: COLORS.textoAdvertencia,
    borderColor: COLORS.textoAdvertencia,
  },
  tabDictamenTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textoVerdeOscuro,
  },
  tabDictamenTextoActivo: {
    color: COLORS.blanco,
  },
  observarInfoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.fondoAdvertencia,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 6,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  observarInfoTexto: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textoAdvertencia,
  },
  textInput: {
    backgroundColor: COLORS.superficieTarjeta,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    fontSize: 13,
    color: COLORS.textoVerdeOscuro,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.bordeSuave,
    gap: SPACING.sm,
    backgroundColor: COLORS.superficieTarjeta,
  },
  cancelButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textoSecundario,
  },
  certificarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.botonPrincipal,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  observarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.textoAdvertencia,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  certificarButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.blanco,
  },
  observarButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.blanco,
  },
});
