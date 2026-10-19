// client/src/screens/collaborator/CollaboratorHomeScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { storeRepository, RedemptionDetail } from '../../repositories/store';
import { VoucherDetailCard } from '../../components/collaborator/VoucherDetailCard';
import { TransactionLoaderModal } from '../../components/common/TransactionLoaderModal';
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../utils/theme';

export const CollaboratorHomeScreen: React.FC = () => {
  const { user, logout } = useAuth();

  // Estados del Buscador
  const [codigoInput, setCodigoInput] = useState<string>('');
  const [buscando, setBuscando] = useState<boolean>(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Voucher seleccionado
  const [voucherActual, setVoucherActual] = useState<RedemptionDetail | null>(null);

  // Estado de mutación RNF-10
  const [confirmandoEntrega, setConfirmandoEntrega] = useState<boolean>(false);

  // Resumen de entregas registradas en la sesión
  const [entregasRecientes, setEntregasRecientes] = useState<RedemptionDetail[]>([]);

  // Búsqueda de código
  const handleBuscarCodigo = async (codigoABuscar?: string) => {
    const rawCode = codigoABuscar || codigoInput;
    const codigoLimpio = rawCode.trim().toUpperCase();

    if (!codigoLimpio) {
      Alert.alert('Atención', 'Por favor ingresa un código de retiro (ej: ECO-2026-XXXX o ECO-7894-K)');
      return;
    }

    Keyboard.dismiss();
    setBuscando(true);
    setMensajeError(null);

    try {
      const voucher = await storeRepository.getRedemptionByCode(codigoLimpio);
      setVoucherActual(voucher);
    } catch (error: any) {
      console.warn('Error al buscar código:', error.message);
      setVoucherActual(null);
      setMensajeError(
        error.message || `No se encontró ningún canje con el código ${codigoLimpio}`
      );
    } finally {
      setBuscando(false);
    }
  };

  // Confirmación de entrega presencial con RNF-10
  const handleConfirmarEntrega = (codigoRetiro: string) => {
    if (!voucherActual) return;

    Alert.alert(
      'Confirmar Entrega de Premio',
      `¿Confirmas la entrega presencial de los productos al ciudadano ${voucherActual.ciudadano?.nombre || 'asociado'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, Confirmar Entrega',
          onPress: async () => {
            setConfirmandoEntrega(true);
            try {
              const voucherEntregado = await storeRepository.confirmDelivery(codigoRetiro);

              // Actualizar el voucher actual a ENTREGADO
              setVoucherActual(voucherEntregado);

              // Añadir al registro de entregas del día
              setEntregasRecientes((prev) => [
                voucherEntregado,
                ...prev.filter((v) => v.codigoRetiro !== voucherEntregado.codigoRetiro),
              ]);

              Alert.alert(
                '¡Entrega Registrada!',
                `El canje con código ${voucherEntregado.codigoRetiro} ha sido marcado como ENTREGADO exitosamente.`,
                [{ text: 'Aceptar' }]
              );
            } catch (error: any) {
              console.error('Error al confirmar entrega:', error);
              Alert.alert(
                'Error al Confirmar Entrega',
                error.message || 'No se pudo registrar la entrega en el servidor. Por favor intenta nuevamente.'
              );
            } finally {
              setConfirmandoEntrega(false);
            }
          },
        },
      ]
    );
  };

  const limpiarBusqueda = () => {
    setCodigoInput('');
    setVoucherActual(null);
    setMensajeError(null);
  };

  const handleCerrarSesion = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Deseas salir del panel operativo de entregas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar backgroundColor={COLORS.fondoEncabezado} barStyle="dark-content" />

      {/* RNF-10: Modal Bloqueante con Spinner en Transacción de Base de Datos */}
      <TransactionLoaderModal
        visible={confirmandoEntrega}
        mensaje="Confirmando Entrega de Premio..."
        submensaje="Registrando entrega presencial y fecha de recepción en la base de datos municipal"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Encabezado Institucional Curvo */}
        <View style={styles.encabezadoCurvo}>
          <View style={styles.encabezadoFilaSuperior}>
            <View style={styles.iconoCampanaPlaceholder}>
              <MaterialCommunityIcons name="clipboard-check" size={24} color={COLORS.textoVerdeOscuro} />
            </View>

            <View style={styles.tituloHeaderRow}>
              <MaterialCommunityIcons name="leaf" size={22} color={COLORS.botonPrincipal} />
              <Text style={styles.tituloHeaderTexto}>ECO ALERTA</Text>
            </View>

            <TouchableOpacity
              style={styles.botonSalir}
              onPress={handleCerrarSesion}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={22} color={COLORS.textoPeligro} />
            </TouchableOpacity>
          </View>

          {/* Tarjeta de Identificación del Colaborador */}
          <View style={styles.tarjetaColaborador}>
            <View style={styles.avatarColaborador}>
              <MaterialCommunityIcons name="badge-account-horizontal" size={28} color={COLORS.textoLogo} />
            </View>
            <View style={styles.infoColaborador}>
              <Text style={styles.nombreColaborador}>{user?.name || 'Operador de Entrega'}</Text>
              <Text style={styles.rolColaborador}>Puesto de Entrega Municipal • PILAR</Text>
            </View>
          </View>
        </View>

        {/* Contenedor Principal */}
        <View style={styles.cuerpo}>
          <Text style={styles.seccionTitulo}>Búsqueda y Verificación de Canje</Text>
          <Text style={styles.seccionSubtitulo}>
            Ingresa el código alfanumérico presentado por el vecino para validar el comprobante.
          </Text>

          {/* Formulario de Búsqueda con Label Externo */}
          <View style={styles.buscadorContenedor}>
            <Text style={styles.labelInput}>CÓDIGO DE RETIRO</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="ticket-confirmation-outline"
                size={22}
                color={COLORS.textoVerde}
                style={styles.iconoInput}
              />
              <TextInput
                style={styles.inputTexto}
                placeholder="Ej: ECO-2026-XXXX o ECO-7894-K"
                placeholderTextColor={COLORS.textoDesactivado}
                value={codigoInput}
                onChangeText={(texto) => {
                  setCodigoInput(texto.toUpperCase());
                  if (mensajeError) setMensajeError(null);
                }}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={() => handleBuscarCodigo()}
              />
              {codigoInput.length > 0 && (
                <TouchableOpacity onPress={limpiarBusqueda} style={styles.botonLimpiar}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textoSecundario} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.botonBuscar, buscando && styles.botonDeshabilitado]}
              onPress={() => handleBuscarCodigo()}
              disabled={buscando}
              activeOpacity={0.85}
            >
              {buscando ? (
                <ActivityIndicator size="small" color={COLORS.superficieTarjeta} />
              ) : (
                <>
                  <Ionicons name="search" size={18} color={COLORS.superficieTarjeta} style={styles.iconoBotonBuscar} />
                  <Text style={styles.textoBotonBuscar}>Buscar Código</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Códigos de Prueba Rápidos para Demostración */}
          <View style={styles.chipsPrueba}>
            <Text style={styles.chipsPruebaTitulo}>Códigos de prueba:</Text>
            <TouchableOpacity
              style={styles.chip}
              onPress={() => {
                setCodigoInput('ECO-7894-K');
                handleBuscarCodigo('ECO-7894-K');
              }}
            >
              <Text style={styles.chipTexto}>ECO-7894-K</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.chip}
              onPress={() => {
                setCodigoInput('ECO-2026-ENTR');
                handleBuscarCodigo('ECO-2026-ENTR');
              }}
            >
              <Text style={styles.chipTexto}>ECO-2026-ENTR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.chip}
              onPress={() => {
                setCodigoInput('ECO-2026-EXPD');
                handleBuscarCodigo('ECO-2026-EXPD');
              }}
            >
              <Text style={styles.chipTexto}>ECO-2026-EXPD</Text>
            </TouchableOpacity>
          </View>

          {/* Mensaje de Error en Búsqueda */}
          {mensajeError && (
            <View style={styles.bannerError}>
              <MaterialCommunityIcons name="alert-circle-outline" size={20} color={COLORS.textoPeligro} />
              <Text style={styles.textoError}>{mensajeError}</Text>
            </View>
          )}

          {/* Resultado: Tarjeta de Detalle del Voucher */}
          {voucherActual && (
            <View style={styles.resultadoContenedor}>
              <Text style={styles.resultadoTitulo}>Detalle de la Orden</Text>
              <VoucherDetailCard
                voucher={voucherActual}
                onConfirmDelivery={handleConfirmarEntrega}
                isConfirming={confirmandoEntrega}
              />
            </View>
          )}

          {/* Resumen de Entregas del Día */}
          <View style={styles.seccionEntregasRecientes}>
            <View style={styles.filaTituloEntregas}>
              <MaterialCommunityIcons name="history" size={20} color={COLORS.textoVerdeOscuro} />
              <Text style={styles.tituloEntregasRecientes}>
                Entregas Confirmadas ({entregasRecientes.length})
              </Text>
            </View>

            {entregasRecientes.length === 0 ? (
              <View style={styles.contenedorSinEntregas}>
                <MaterialCommunityIcons name="package-variant" size={40} color={COLORS.textoDesactivado} />
                <Text style={styles.textoSinEntregas}>
                  Aún no has registrado entregas durante esta sesión.
                </Text>
              </View>
            ) : (
              entregasRecientes.map((ent, idx) => (
                <View key={ent.id || `ent-${idx}`} style={styles.tarjetaEntregaReciente}>
                  <View style={styles.filaEntregaReciente}>
                    <Text style={styles.codigoEntregaReciente}>{ent.codigoRetiro}</Text>
                    <View style={styles.badgeEntregadoMini}>
                      <Text style={styles.badgeTextoMini}>ENTREGADO</Text>
                    </View>
                  </View>
                  <Text style={styles.nombreVecinoEntrega}>
                    👤 {ent.ciudadano?.nombre || 'Vecino'}
                  </Text>
                  <Text style={styles.itemsEntregaReciente}>
                    📦 {ent.items.length} {ent.items.length === 1 ? 'producto' : 'productos'} • {ent.totalPuntos} PTS
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORS.fondoAplicacion,
  },
  scrollContent: {
    paddingBottom: SPACING.xl * 2,
  },
  encabezadoCurvo: {
    backgroundColor: COLORS.fondoEncabezado,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    elevation: 4,
  },
  encabezadoFilaSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconoCampanaPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.superficieTarjeta,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tituloHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tituloHeaderTexto: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textoLogo,
    letterSpacing: 1.2,
  },
  botonSalir: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.superficieTarjeta,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.bordePeligro,
  },
  tarjetaColaborador: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginTop: SPACING.xs,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  avatarColaborador: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.fondoTarjeta,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  infoColaborador: {
    flex: 1,
  },
  nombreColaborador: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },
  rolColaborador: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    marginTop: 1,
  },
  cuerpo: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  seccionTitulo: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textoVerdeOscuro,
  },
  seccionSubtitulo: {
    fontSize: 13,
    color: COLORS.textoSecundario,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  buscadorContenedor: {
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    elevation: 2,
    marginBottom: SPACING.sm,
  },
  labelInput: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.bordeSuave,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.fondoTarjeta,
    paddingHorizontal: SPACING.sm,
    height: 48,
    marginBottom: SPACING.sm,
  },
  iconoInput: {
    marginRight: 8,
  },
  inputTexto: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
    letterSpacing: 1,
  },
  botonLimpiar: {
    padding: 4,
  },
  botonBuscar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.botonPrincipal,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.sm,
    elevation: 2,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  iconoBotonBuscar: {
    marginRight: 6,
  },
  textoBotonBuscar: {
    color: COLORS.superficieTarjeta,
    fontSize: 14,
    fontWeight: '700',
  },
  chipsPrueba: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.md,
  },
  chipsPruebaTitulo: {
    fontSize: 11,
    color: COLORS.textoSecundario,
    fontWeight: '600',
  },
  chip: {
    backgroundColor: COLORS.fondoTarjeta,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textoVerde,
  },
  bannerError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.fondoPeligro,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.bordePeligro,
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  textoError: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textoPeligro,
    fontWeight: '600',
  },
  resultadoContenedor: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  resultadoTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
    marginBottom: SPACING.xs,
  },
  seccionEntregasRecientes: {
    marginTop: SPACING.md,
  },
  filaTituloEntregas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.xs,
  },
  tituloEntregasRecientes: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },
  contenedorSinEntregas: {
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    gap: 6,
  },
  textoSinEntregas: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    textAlign: 'center',
  },
  tarjetaEntregaReciente: {
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  filaEntregaReciente: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codigoEntregaReciente: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textoVerdeOscuro,
    letterSpacing: 1,
  },
  badgeEntregadoMini: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeTextoMini: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.botonPrincipal,
  },
  nombreVecinoEntrega: {
    fontSize: 12,
    color: COLORS.textoVerdeOscuro,
    marginTop: 2,
    fontWeight: '600',
  },
  itemsEntregaReciente: {
    fontSize: 11,
    color: COLORS.textoSecundario,
    marginTop: 2,
  },
});
