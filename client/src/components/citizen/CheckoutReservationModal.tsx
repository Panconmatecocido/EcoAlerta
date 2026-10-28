// client/src/components/citizen/CheckoutReservationModal.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../utils/theme';
import { ConfirmRedemptionResponse, StoreBranch } from '../../repositories/store/IStoreRepository';

interface CheckoutReservationModalProps {
  visible: boolean;
  onClose: () => void;
  canjeId: string;
  totalPuntos: number;
  tiempoRestanteInicial?: number; // en segundos (por defecto 300 = 5 minutos)
  sucursales: StoreBranch[];
  sucursalSeleccionadaId: string;
  onSeleccionarSucursal: (id: string) => void;
  onConfirmarCanje: () => void;
  confirmando: boolean;
  comprobante: ConfirmRedemptionResponse | null;
  onFinalizarComprobante: () => void;
  onExpirarReserva?: () => void;
}

export const CheckoutReservationModal: React.FC<CheckoutReservationModalProps> = ({
  visible,
  onClose,
  canjeId,
  totalPuntos,
  tiempoRestanteInicial = 300,
  sucursales,
  sucursalSeleccionadaId,
  onSeleccionarSucursal,
  onConfirmarCanje,
  confirmando,
  comprobante,
  onFinalizarComprobante,
  onExpirarReserva,
}) => {
  const [segundosRestantes, setSegundosRestantes] = useState<number>(tiempoRestanteInicial);

  // Reiniciar contador al abrir o cambiar canjeId
  useEffect(() => {
    if (visible && !comprobante) {
      setSegundosRestantes(tiempoRestanteInicial);
    }
  }, [visible, canjeId, comprobante, tiempoRestanteInicial]);

  // Temporizador regresivo de 5 minutos (TTL)
  useEffect(() => {
    if (!visible || comprobante || segundosRestantes <= 0) return;

    const timer = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onExpirarReserva) {
            onExpirarReserva();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, comprobante, segundosRestantes, onExpirarReserva]);

  const formatearTiempo = (segundos: number): string => {
    const minutos = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
  };

  const formatearFecha = (fechaIso?: string): string => {
    if (!fechaIso) return '';
    try {
      const d = new Date(fechaIso);
      return d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return fechaIso;
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="slide" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.contenedorModal}>
          {comprobante ? (
            // ==========================================
            // VISTA: VOUCHER / COMPROBANTE CONFIRMADO
            // ==========================================
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollComprobante}>
              <View style={styles.iconoExito}>
                <MaterialCommunityIcons name="check-decagram" size={64} color={COLORS.botonPrincipal} />
              </View>

              <Text style={styles.tituloExito}>¡Canje Confirmado!</Text>
              <Text style={styles.subtituloExito}>
                Tu reserva ha sido procesada con éxito. Presentá este código en la sucursal para retirar tus productos.
              </Text>

              {/* Caja del Código de Retiro */}
              <View style={styles.cajaVoucher}>
                <Text style={styles.etiquetaVoucher}>CÓDIGO DE RETIRO OFICIAL</Text>
                <Text style={styles.codigoVoucher}>{comprobante.codigoRetiro}</Text>
                <Text style={styles.vencimientoVoucher}>
                  📅 Válido hasta: {formatearFecha(comprobante.fechaExpiracion)} (30 días)
                </Text>
              </View>

              {/* Información de Sucursal y Retiro */}
              <View style={styles.tarjetaDetalle}>
                <View style={styles.filaDetalle}>
                  <MaterialCommunityIcons name="store-outline" size={20} color={COLORS.textoVerde} />
                  <View style={{ flex: 1, marginLeft: SPACING.xs }}>
                    <Text style={styles.nombreSucursalDetalle}>{comprobante.sucursal.nombre}</Text>
                    <Text style={styles.direccionDetalle}>{comprobante.sucursal.direccion}</Text>
                    {comprobante.sucursal.horario && (
                      <Text style={styles.horarioDetalle}>🕒 {comprobante.sucursal.horario}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.cajaAviso48hs}>
                  <MaterialCommunityIcons name="clock-outline" size={18} color={COLORS.textoVerdeOscuro} />
                  <Text style={styles.textoAviso48hs}>
                    {comprobante.avisoDisponibilidad || 'Disponible a partir de las 48 hs hábiles.'}
                  </Text>
                </View>

                <View style={styles.filaBalancePuntos}>
                  <Text style={styles.puntosDescontados}>-{totalPuntos.toLocaleString()} EcoPuntos</Text>
                  <Text style={styles.nuevoSaldoTexto}>
                    Nuevo saldo: {comprobante.nuevoSaldoPuntos.toLocaleString()} EcoPuntos
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.botonFinalizar}
                onPress={onFinalizarComprobante}
                activeOpacity={0.8}
              >
                <Text style={styles.textoBotonFinalizar}>VOLVER A LA TIENDA</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            // ==========================================
            // VISTA: RESERVA ACTIVA (TTL 5 MIN) + SUCURSAL
            // ==========================================
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollReserva}>
              <View style={styles.cabeceraModal}>
                <Text style={styles.tituloModal}>Punto de Retiro y Confirmación</Text>
                <TouchableOpacity onPress={onClose} style={styles.botonCerrarModal}>
                  <MaterialCommunityIcons name="close" size={22} color={COLORS.textoSecundario} />
                </TouchableOpacity>
              </View>

              {/* Reloj Temporizador Regresivo (TTL 5 Minutos) */}
              <View
                style={[
                  styles.tarjetaTemporizador,
                  segundosRestantes < 60 && styles.tarjetaTemporizadorAlerta,
                ]}
              >
                <View style={styles.filaReloj}>
                  <MaterialCommunityIcons
                    name="timer-sand"
                    size={28}
                    color={segundosRestantes < 60 ? COLORS.textoPeligro : COLORS.botonPrincipal}
                  />
                  <Text
                    style={[
                      styles.relojTexto,
                      segundosRestantes < 60 && styles.relojTextoAlerta,
                    ]}
                  >
                    {formatearTiempo(segundosRestantes)}
                  </Text>
                </View>
                <Text style={styles.descripcionReloj}>
                  {segundosRestantes > 0
                    ? 'Stock reservado exclusivamente para vos. Completá el retiro antes de que expire.'
                    : 'La reserva temporal ha expirado y el stock ha sido liberado.'}
                </Text>
              </View>

              {/* Selector de Sucursal Municipal */}
              <Text style={styles.tituloSeccion}>Seleccioná la Sucursal de Retiro</Text>
              <View style={styles.listaSucursales}>
                {sucursales.length === 0 ? (
                  <Text style={styles.sinSucursales}>Cargando puntos de entrega...</Text>
                ) : (
                  sucursales.map((suc) => {
                    const seleccionada = sucursalSeleccionadaId === suc.id;
                    return (
                      <TouchableOpacity
                        key={suc.id}
                        style={[
                          styles.itemSucursal,
                          seleccionada && styles.itemSucursalSeleccionada,
                        ]}
                        onPress={() => onSeleccionarSucursal(suc.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.radioSucursal}>
                          {seleccionada && <View style={styles.radioDot} />}
                        </View>
                        <View style={styles.textosSucursal}>
                          <Text
                            style={[
                              styles.nombreSucursal,
                              seleccionada && styles.nombreSucursalActiva,
                            ]}
                          >
                            {suc.nombre}
                          </Text>
                          <Text style={styles.direccionSucursal}>{suc.direccion}</Text>
                          {suc.horario && (
                            <Text style={styles.horarioSucursal}>🕒 {suc.horario}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>

              {/* Aviso Obligatorio de 48 hs hábiles */}
              <View style={styles.cajaAvisoInformativo}>
                <MaterialCommunityIcons name="information" size={20} color={COLORS.botonPrincipal} />
                <Text style={styles.textoAvisoInformativo}>
                  <Text style={{ fontWeight: 'bold' }}>Aviso de Disponibilidad:</Text> Los insumos estarán listos para ser retirados a partir de las{' '}
                  <Text style={{ fontWeight: 'bold' }}>48 hs hábiles</Text> posteriores a la confirmación del canje.
                </Text>
              </View>

              {/* Resumen de Total */}
              <View style={styles.filaResumen}>
                <Text style={styles.etiquetaResumen}>Total a descontar:</Text>
                <Text style={styles.valorResumen}>{totalPuntos.toLocaleString()} EcoPuntos</Text>
              </View>

              {/* Botón de Confirmación */}
              <TouchableOpacity
                style={[
                  styles.botonConfirmar,
                  (!sucursalSeleccionadaId || confirmando || segundosRestantes <= 0) &&
                    styles.botonConfirmarDisabled,
                ]}
                onPress={onConfirmarCanje}
                disabled={!sucursalSeleccionadaId || confirmando || segundosRestantes <= 0}
                activeOpacity={0.8}
              >
                {confirmando ? (
                  <ActivityIndicator size="small" color={COLORS.superficieTarjeta} />
                ) : (
                  <Text style={styles.textoBotonConfirmar}>
                    {segundosRestantes <= 0 ? 'RESERVA EXPIRADA' : 'CONFIRMAR CANJE DEFINITIVO 🍃'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botonCancelar}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.textoBotonCancelar}>Cancelar y liberar reserva</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.superposicionOscura,
    justifyContent: 'flex-end',
  },
  contenedorModal: {
    backgroundColor: COLORS.fondoAplicacion,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    maxHeight: '90%',
    padding: SPACING.md,
  },
  scrollReserva: {
    paddingBottom: SPACING.lg,
  },
  scrollComprobante: {
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  cabeceraModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  tituloModal: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  botonCerrarModal: {
    padding: 4,
  },
  tarjetaTemporizador: {
    backgroundColor: COLORS.fondoTarjeta,
    borderColor: COLORS.bordeSuave,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    marginVertical: SPACING.xs,
  },
  tarjetaTemporizadorAlerta: {
    backgroundColor: COLORS.fondoPeligro,
    borderColor: COLORS.bordePeligro,
  },
  filaReloj: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  relojTexto: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.botonPrincipal,
    letterSpacing: 1,
  },
  relojTextoAlerta: {
    color: COLORS.textoPeligro,
  },
  descripcionReloj: {
    fontSize: 11,
    color: COLORS.textoSecundario,
    textAlign: 'center',
    marginTop: 2,
  },
  tituloSeccion: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  listaSucursales: {
    gap: SPACING.xs,
  },
  itemSucursal: {
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    padding: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemSucursalSeleccionada: {
    borderColor: COLORS.botonPrincipal,
    backgroundColor: COLORS.fondoTarjeta,
  },
  radioSucursal: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.botonPrincipal,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.botonPrincipal,
  },
  textosSucursal: {
    flex: 1,
  },
  nombreSucursal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  nombreSucursalActiva: {
    color: COLORS.botonPrincipal,
  },
  direccionSucursal: {
    fontSize: 11,
    color: COLORS.textoSecundario,
    marginTop: 1,
  },
  horarioSucursal: {
    fontSize: 10,
    color: COLORS.textoVerde,
    marginTop: 2,
  },
  sinSucursales: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    paddingVertical: SPACING.sm,
  },
  cajaAvisoInformativo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.superficieTarjeta,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.botonPrincipal,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginVertical: SPACING.sm,
  },
  textoAvisoInformativo: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textoVerdeOscuro,
    lineHeight: 16,
  },
  filaResumen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.superficieTarjeta,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginVertical: SPACING.xs,
  },
  etiquetaResumen: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textoSecundario,
  },
  valorResumen: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.botonPrincipal,
  },
  botonConfirmar: {
    backgroundColor: COLORS.botonPrincipal,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  botonConfirmarDisabled: {
    opacity: 0.5,
  },
  textoBotonConfirmar: {
    color: COLORS.superficieTarjeta,
    fontWeight: 'bold',
    fontSize: 13,
  },
  botonCancelar: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginTop: 2,
  },
  textoBotonCancelar: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    textDecorationLine: 'underline',
  },
  // Estilos del Comprobante / Voucher
  iconoExito: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  tituloExito: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  subtituloExito: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    textAlign: 'center',
    marginVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  cajaVoucher: {
    backgroundColor: COLORS.superficieTarjeta,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.botonPrincipal,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    width: '100%',
    marginVertical: SPACING.sm,
  },
  etiquetaVoucher: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textoSecundario,
    letterSpacing: 1,
  },
  codigoVoucher: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.botonPrincipal,
    letterSpacing: 3,
    marginVertical: 4,
  },
  vencimientoVoucher: {
    fontSize: 11,
    color: COLORS.textoVerde,
    fontWeight: '600',
  },
  tarjetaDetalle: {
    backgroundColor: COLORS.superficieTarjeta,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    width: '100%',
    marginVertical: SPACING.xs,
  },
  filaDetalle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nombreSucursalDetalle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  direccionDetalle: {
    fontSize: 11,
    color: COLORS.textoSecundario,
    marginTop: 1,
  },
  horarioDetalle: {
    fontSize: 10,
    color: COLORS.textoVerde,
    marginTop: 2,
  },
  cajaAviso48hs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.fondoTarjeta,
    padding: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
  },
  textoAviso48hs: {
    fontSize: 11,
    color: COLORS.textoVerdeOscuro,
    fontWeight: '600',
  },
  filaBalancePuntos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.bordeSuave,
  },
  puntosDescontados: {
    fontSize: 12,
    color: COLORS.textoPeligro,
    fontWeight: 'bold',
  },
  nuevoSaldoTexto: {
    fontSize: 12,
    color: COLORS.textoVerdeOscuro,
    fontWeight: '600',
  },
  botonFinalizar: {
    backgroundColor: COLORS.botonPrincipal,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    width: '100%',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  textoBotonFinalizar: {
    color: COLORS.superficieTarjeta,
    fontSize: 13,
    fontWeight: 'bold',
  },
});
