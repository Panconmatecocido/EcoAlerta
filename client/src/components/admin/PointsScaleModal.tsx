import React, { useState, useEffect } from 'react';
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
import {
  BAREMO_PUNTOS_POR_PRIORIDAD,
  isValidPointsForPriority,
  getPuntosSugeridos,
  PrioridadCaso,
} from '../../utils/pointsScale';
import { PrioritySemaphoreBadge } from '../agent/PrioritySemaphoreBadge';

interface PointsScaleModalProps {
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
    observacionesAdmin?: string;
    ciudadanoNombre?: string;
  } | null;
  procesando?: boolean;
  onClose: () => void;
  onSubmit: (decision: {
    decision: 'APROBAR_VERACIDAD' | 'RECHAZAR_FALSO';
    puntos?: number;
    observacionesAdmin?: string;
  }) => Promise<void>;
}

export const PointsScaleModal: React.FC<PointsScaleModalProps> = ({
  visible,
  denuncia,
  procesando = false,
  onClose,
  onSubmit,
}) => {
  const prioridad: PrioridadCaso = denuncia?.prioridad || 'MEDIA';
  const baremo = BAREMO_PUNTOS_POR_PRIORIDAD[prioridad] || BAREMO_PUNTOS_POR_PRIORIDAD.MEDIA;

  const [puntos, setPuntos] = useState<number>(baremo.sugerido);
  const [observaciones, setObservaciones] = useState<string>('');
  const [modoRechazo, setModoRechazo] = useState<boolean>(false);

  useEffect(() => {
    if (denuncia?.prioridad) {
      const p = denuncia.prioridad;
      const sugerido = getPuntosSugeridos(p);
      setPuntos(sugerido);
      setObservaciones('');
      setModoRechazo(false);
    }
  }, [denuncia]);

  if (!denuncia) return null;

  const esValido = isValidPointsForPriority(prioridad, puntos);

  const manejarAprobar = async () => {
    if (!esValido) {
      Alert.alert(
        'Puntaje inválido',
        `El puntaje para prioridad ${prioridad} debe encontrarse entre ${baremo.min} y ${baremo.max} puntos.`
      );
      return;
    }
    await onSubmit({
      decision: 'APROBAR_VERACIDAD',
      puntos,
      observacionesAdmin: observaciones.trim() || undefined,
    });
  };

  const manejarRechazar = async () => {
    if (observaciones.trim().length < 5) {
      Alert.alert(
        'Motivo obligatorio',
        'Por favor indica el motivo por el cual se rechaza el reporte como falso (mínimo 5 caracteres).'
      );
      return;
    }
    await onSubmit({
      decision: 'RECHAZAR_FALSO',
      puntos: 0,
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
                name="shield-check"
                size={ICON_SIZE.md}
                color={COLORS.botonPrincipal}
              />
              <Text style={styles.headerTitle}>Validación de Veracidad</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              disabled={procesando}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={ICON_SIZE.md} color={COLORS.textoSecundario} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Información del Caso */}
            <View style={styles.casoCard}>
              <View style={styles.casoCardHeader}>
                <Text style={styles.codigoText}>{denuncia.codigo || 'REP'}</Text>
                <PrioritySemaphoreBadge prioridad={prioridad} />
              </View>
              <Text style={styles.tituloText}>{denuncia.titulo}</Text>
              <View style={styles.ubicacionRow}>
                <Ionicons name="location-outline" size={ICON_SIZE.sm} color={COLORS.textoSecundario} />
                <Text style={styles.ubicacionText}>{denuncia.ubicacion}</Text>
              </View>
              {denuncia.ciudadanoNombre ? (
                <View style={styles.vecinoRow}>
                  <Ionicons name="person-outline" size={ICON_SIZE.sm} color={COLORS.textoSecundario} />
                  <Text style={styles.vecinoText}>Vecino: {denuncia.ciudadanoNombre}</Text>
                </View>
              ) : null}
            </View>

            {/* Evidencia Fotográfica Comparativa */}
            <Text style={styles.sectionTitle}>Evidencia Fotográfica de Verificación</Text>
            <View style={styles.fotosContainer}>
              {/* Foto Inicial */}
              <View style={styles.fotoBox}>
                <Text style={styles.fotoLabel}>1. Foto del Vecino</Text>
                {denuncia.imagenUrl ? (
                  <Image source={{ uri: denuncia.imagenUrl }} style={styles.foto} />
                ) : (
                  <View style={styles.fotoPlaceholder}>
                    <Ionicons name="image-outline" size={32} color={COLORS.textoSecundario} />
                    <Text style={styles.fotoPlaceholderText}>Sin foto inicial</Text>
                  </View>
                )}
              </View>

              {/* Foto Verificación Agente */}
              <View style={styles.fotoBox}>
                <Text style={styles.fotoLabel}>2. Constatación In Situ (Agente)</Text>
                {denuncia.fotoVerificacionUrl ? (
                  <Image source={{ uri: denuncia.fotoVerificacionUrl }} style={styles.foto} />
                ) : (
                  <View style={styles.fotoPlaceholder}>
                    <Ionicons name="shield-outline" size={32} color={COLORS.textoSecundario} />
                    <Text style={styles.fotoPlaceholderText}>Sin foto agente</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Selector de Modo: Aprobación de Veracidad vs Rechazo como Falso */}
            <View style={styles.tabModoContainer}>
              <TouchableOpacity
                style={[styles.tabModo, !modoRechazo && styles.tabModoActivoVerde]}
                onPress={() => setModoRechazo(false)}
                disabled={procesando}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={ICON_SIZE.sm}
                  color={!modoRechazo ? COLORS.blanco : COLORS.botonPrincipal}
                />
                <Text
                  style={[styles.tabModoTexto, !modoRechazo && styles.tabModoTextoActivo]}
                >
                  Aprobar Veracidad
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabModo, modoRechazo && styles.tabModoActivoRojo]}
                onPress={() => setModoRechazo(true)}
                disabled={procesando}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={ICON_SIZE.sm}
                  color={modoRechazo ? COLORS.blanco : COLORS.textoPeligro}
                />
                <Text
                  style={[styles.tabModoTexto, modoRechazo && styles.tabModoTextoActivo]}
                >
                  Declarar Falso (0 pts)
                </Text>
              </TouchableOpacity>
            </View>

            {!modoRechazo ? (
              /* Sección Asignación de Puntos */
              <View style={styles.baremoContainer}>
                <View style={styles.baremoHeader}>
                  <Text style={styles.baremoTitulo}>Baremo Oficial por Prioridad {prioridad}</Text>
                  <Text style={styles.baremoRangoTexto}>
                    Rango permitido: {baremo.min} a {baremo.max} pts
                  </Text>
                </View>

                {/* Botones de sugerencia rápida */}
                <View style={styles.sugerenciasRow}>
                  <TouchableOpacity
                    style={[styles.chipPuntos, puntos === baremo.min && styles.chipPuntosActivo]}
                    onPress={() => setPuntos(baremo.min)}
                  >
                    <Text style={[styles.chipTexto, puntos === baremo.min && styles.chipTextoActivo]}>
                      Mínimo ({baremo.min})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.chipPuntos, puntos === baremo.sugerido && styles.chipPuntosActivo]}
                    onPress={() => setPuntos(baremo.sugerido)}
                  >
                    <Text style={[styles.chipTexto, puntos === baremo.sugerido && styles.chipTextoActivo]}>
                      Sugerido ({baremo.sugerido})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.chipPuntos, puntos === baremo.max && styles.chipPuntosActivo]}
                    onPress={() => setPuntos(baremo.max)}
                  >
                    <Text style={[styles.chipTexto, puntos === baremo.max && styles.chipTextoActivo]}>
                      Máximo ({baremo.max})
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Input Manual de Puntos con Stepper */}
                <View style={styles.puntosInputRow}>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => setPuntos((prev) => Math.max(baremo.min, prev - 10))}
                  >
                    <Ionicons name="remove" size={ICON_SIZE.md} color={COLORS.textoVerdeOscuro} />
                  </TouchableOpacity>

                  <View style={styles.puntosDisplay}>
                    <Text style={styles.puntosValorText}>{puntos}</Text>
                    <Text style={styles.puntosSubtexto}>puntos ecológicos</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => setPuntos((prev) => Math.min(baremo.max, prev + 10))}
                  >
                    <Ionicons name="add" size={ICON_SIZE.md} color={COLORS.textoVerdeOscuro} />
                  </TouchableOpacity>
                </View>

                {!esValido && (
                  <Text style={styles.errorBaremoText}>
                    ⚠️ El puntaje debe estar entre {baremo.min} y {baremo.max} pts.
                  </Text>
                )}

                <Text style={styles.infoAcreditacion}>
                  ℹ️ Los puntos se acreditarán atómicamente a la cuenta del vecino y el caso pasará a la etapa de Saneamiento.
                </Text>
              </View>
            ) : (
              /* Sección Declarar Falso */
              <View style={styles.rechazoContainer}>
                <Ionicons name="alert-circle" size={ICON_SIZE.md} color={COLORS.textoPeligro} />
                <Text style={styles.rechazoTitulo}>Atención: Desestimación por Falsedad</Text>
                <Text style={styles.rechazoDescripcion}>
                  El reporte será cerrado definitivamente como RECHAZADO con 0 puntos otorgados al vecino. El agente asignado quedará liberado inmediatamente.
                </Text>
              </View>
            )}

            {/* Observaciones del Administrador */}
            <Text style={styles.sectionTitle}>
              {modoRechazo ? 'Motivo del Rechazo (Obligatorio)' : 'Observaciones Administrativas (Opcional)'}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={
                modoRechazo
                  ? 'Explica por qué se considera falso el reporte...'
                  : 'Instrucciones para la cuadrilla de saneamiento...'
              }
              placeholderTextColor={COLORS.textoSecundario}
              multiline
              numberOfLines={3}
              value={observaciones}
              onChangeText={setObservaciones}
            />
          </ScrollView>

          {/* Botones de Acción */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={procesando}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            {!modoRechazo ? (
              <TouchableOpacity
                style={[styles.submitButton, (!esValido || procesando) && styles.submitButtonDisabled]}
                onPress={manejarAprobar}
                disabled={!esValido || procesando}
              >
                {procesando ? (
                  <ActivityIndicator size="small" color={COLORS.blanco} />
                ) : (
                  <>
                    <Ionicons name="checkmark-sharp" size={ICON_SIZE.sm} color={COLORS.blanco} />
                    <Text style={styles.submitButtonText}>Aprobar y Acreditar ({puntos} pts)</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.submitRejectButton,
                  (observaciones.trim().length < 5 || procesando) && styles.submitButtonDisabled,
                ]}
                onPress={manejarRechazar}
                disabled={observaciones.trim().length < 5 || procesando}
              >
                {procesando ? (
                  <ActivityIndicator size="small" color={COLORS.blanco} />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={ICON_SIZE.sm} color={COLORS.blanco} />
                    <Text style={styles.submitButtonText}>Rechazar Reporte</Text>
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
    maxHeight: '92%',
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
  ubicacionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ubicacionText: {
    fontSize: 12,
    color: COLORS.textoSecundario,
  },
  vecinoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  vecinoText: {
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
  fotosContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  fotoBox: {
    flex: 1,
  },
  fotoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textoSecundario,
    marginBottom: 4,
  },
  foto: {
    width: '100%',
    height: 120,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.bordeSuave,
  },
  fotoPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.superficieTarjeta,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  fotoPlaceholderText: {
    fontSize: 11,
    color: COLORS.textoSecundario,
  },
  tabModoContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tabModo: {
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
  tabModoActivoVerde: {
    backgroundColor: COLORS.botonPrincipal,
    borderColor: COLORS.botonPrincipal,
  },
  tabModoActivoRojo: {
    backgroundColor: COLORS.textoPeligro,
    borderColor: COLORS.textoPeligro,
  },
  tabModoTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textoVerdeOscuro,
  },
  tabModoTextoActivo: {
    color: COLORS.blanco,
  },
  baremoContainer: {
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    marginBottom: SPACING.md,
  },
  baremoHeader: {
    marginBottom: SPACING.sm,
  },
  baremoTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.botonPrincipal,
  },
  baremoRangoTexto: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    marginTop: 2,
  },
  sugerenciasRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  chipPuntos: {
    flex: 1,
    paddingVertical: SPACING.xs,
    paddingHorizontal: 4,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    alignItems: 'center',
    backgroundColor: COLORS.fondoAplicacion,
  },
  chipPuntosActivo: {
    backgroundColor: COLORS.fondoTarjeta,
    borderColor: COLORS.botonPrincipal,
  },
  chipTexto: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textoVerdeOscuro,
  },
  chipTextoActivo: {
    color: COLORS.botonPrincipal,
  },
  puntosInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: SPACING.xs,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.fondoAplicacion,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    justifyContent: 'center',
    alignItems: 'center',
  },
  puntosDisplay: {
    alignItems: 'center',
  },
  puntosValorText: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.botonPrincipal,
  },
  puntosSubtexto: {
    fontSize: 11,
    color: COLORS.textoSecundario,
  },
  errorBaremoText: {
    fontSize: 12,
    color: COLORS.textoPeligro,
    marginTop: SPACING.xs,
  },
  infoAcreditacion: {
    fontSize: 11,
    color: COLORS.textoSecundario,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
  rechazoContainer: {
    backgroundColor: COLORS.fondoPeligro,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.bordePeligro,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  rechazoTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textoPeligro,
    marginTop: SPACING.xs,
    marginBottom: 4,
  },
  rechazoDescripcion: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    textAlign: 'center',
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
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.botonPrincipal,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  submitRejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.textoPeligro,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.blanco,
  },
});
