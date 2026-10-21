// client/src/components/citizen/CitizenVouchersList.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../utils/theme';
import { RedemptionDetail } from '../../repositories/store/IStoreRepository';

export type CitizenVoucherItem = RedemptionDetail;

interface CitizenVouchersListProps {
  vouchers: CitizenVoucherItem[];
  isLoading?: boolean;
}

export const CitizenVouchersList: React.FC<CitizenVouchersListProps> = ({
  vouchers,
  isLoading = false,
}) => {
  const formatearFecha = (fechaStr?: string | null) => {
    if (!fechaStr) return 'No especificada';
    try {
      const f = new Date(fechaStr);
      return f.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return fechaStr;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.botonPrincipal} />
        <Text style={styles.loadingText}>Cargando comprobantes de canje...</Text>
      </View>
    );
  }

  if (!vouchers || vouchers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="ticket-outline" size={56} color={COLORS.textoDesactivado} />
        <Text style={styles.emptyTitle}>No tienes vouchers de canje</Text>
        <Text style={styles.emptySubtitle}>
          Cuando canjees tus puntos por productos ecológicos en la Tienda, tus códigos de retiro aparecerán aquí.
        </Text>
      </View>
    );
  }

  const ahora = new Date();

  return (
    <View style={styles.listContainer}>
      {vouchers.map((voucher) => {
        const fechaExp = voucher.fechaExpiracion ? new Date(voucher.fechaExpiracion) : null;
        const expirado =
          voucher.estado === 'CANCELADO' ||
          (fechaExp ? ahora > fechaExp && voucher.estado === 'PENDIENTE_RETIRO' : false);
        const entregado = voucher.estado === 'ENTREGADO';
        const pendiente = voucher.estado === 'PENDIENTE_RETIRO' && !expirado;

        return (
          <View key={voucher.id} style={styles.voucherCard}>
            {/* Cabecera del Voucher */}
            <View style={styles.voucherHeader}>
              <View style={styles.codigoWrapper}>
                <Text style={styles.voucherLabel}>CÓDIGO DE RETIRO</Text>
                <Text style={styles.voucherCodigo}>{voucher.codigoRetiro}</Text>
              </View>

              {/* Badge de Estado */}
              {entregado ? (
                <View style={[styles.badge, styles.badgeEntregado]}>
                  <MaterialCommunityIcons name="check-circle" size={14} color={COLORS.botonPrincipal} />
                  <Text style={styles.badgeTextoEntregado}>ENTREGADO</Text>
                </View>
              ) : expirado ? (
                <View style={[styles.badge, styles.badgeExpirado]}>
                  <MaterialCommunityIcons name="close-circle" size={14} color={COLORS.textoPeligro} />
                  <Text style={styles.badgeTextoExpirado}>EXPIRADO</Text>
                </View>
              ) : (
                <View style={[styles.badge, styles.badgePendiente]}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.textoVerde} />
                  <Text style={styles.badgeTextoPendiente}>PENDIENTE</Text>
                </View>
              )}
            </View>

            {/* Aviso de 48 hs hábiles para retiros pendientes */}
            {pendiente && (
              <View style={styles.aviso48hs}>
                <Ionicons name="information-circle-outline" size={18} color={COLORS.textoVerdeOscuro} />
                <Text style={styles.aviso48hsTexto}>
                  Disponible para retirar a partir de las 48 hs hábiles de efectuado el canje. Presenta este código en la sede.
                </Text>
              </View>
            )}

            {/* Alerta de Expiración (T007) */}
            {expirado && (
              <View style={styles.alertaExpirado}>
                <MaterialCommunityIcons name="alert-outline" size={18} color={COLORS.textoPeligro} />
                <View style={styles.alertaTextos}>
                  <Text style={styles.alertaTitulo}>Voucher Expirado (superó los 30 días)</Text>
                  <Text style={styles.alertaDescripcion}>
                    Las unidades no retiradas se reintegraron al stock municipal. Los puntos no tienen reembolso según las normas del programa.
                  </Text>
                </View>
              </View>
            )}

            {/* Datos de Sucursal y Retiro */}
            <View style={styles.sucursalBox}>
              <View style={styles.filaIconoTexto}>
                <Ionicons name="location" size={16} color={COLORS.botonPrincipal} />
                <Text style={styles.sucursalNombre}>{voucher.sucursal?.nombre || 'Sede Municipal'}</Text>
              </View>
              <Text style={styles.sucursalDireccion}>
                {voucher.sucursal?.direccion || 'Dirección no especificada'}
              </Text>
              {voucher.sucursal?.horario && (
                <Text style={styles.sucursalHorario}>🕒 {voucher.sucursal.horario}</Text>
              )}
            </View>

            {/* Fechas de Solicitud y Caducidad */}
            <View style={styles.fechasContainer}>
              <View style={styles.fechaColumna}>
                <Text style={styles.fechaEtiqueta}>Solicitado el:</Text>
                <Text style={styles.fechaValor}>{formatearFecha(voucher.creadoEn)}</Text>
              </View>
              <View style={styles.fechaColumna}>
                <Text style={styles.fechaEtiqueta}>Vencimiento (30 días):</Text>
                <Text style={[styles.fechaValor, expirado ? styles.fechaValorExpirada : null]}>
                  {formatearFecha(voucher.fechaExpiracion)}
                </Text>
              </View>
            </View>

            {/* Listado de Ítems */}
            {voucher.items && voucher.items.length > 0 && (
              <View style={styles.itemsSection}>
                <Text style={styles.itemsSectionTitle}>Productos Canjeados:</Text>
                {voucher.items.map((it, idx) => (
                  <View key={it.id || `it-${idx}`} style={styles.itemRow}>
                    <Text style={styles.itemCantidad}>{it.cantidad}x</Text>
                    <Text style={styles.itemNombre}>{it.producto?.titulo || 'Insumo Ecológico'}</Text>
                    <Text style={styles.itemPuntos}>
                      {it.puntosUnit ? `${it.cantidad * it.puntosUnit} PTS` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Footer con Puntos Totales */}
            <View style={styles.footerRow}>
              <Text style={styles.footerLabel}>Total Puntos:</Text>
              <Text style={styles.footerPuntos}>-{voucher.totalPuntos} PTS</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textoVerdeOscuro,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
    marginTop: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textoSecundario,
    textAlign: 'center',
    lineHeight: 18,
  },
  listContainer: {
    paddingBottom: SPACING.lg,
  },
  voucherCard: {
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    elevation: 2,
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bordeSuave,
  },
  codigoWrapper: {
    flex: 1,
  },
  voucherLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textoSecundario,
    letterSpacing: 1,
  },
  voucherCodigo: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textoVerdeOscuro,
    letterSpacing: 1.2,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  badgePendiente: {
    backgroundColor: COLORS.fondoTarjeta,
    borderWidth: 1,
    borderColor: COLORS.botonPrincipal,
  },
  badgeTextoPendiente: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textoVerde,
  },
  badgeEntregado: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: COLORS.botonPrincipal,
  },
  badgeTextoEntregado: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.botonPrincipal,
  },
  badgeExpirado: {
    backgroundColor: COLORS.fondoPeligro,
    borderWidth: 1,
    borderColor: COLORS.textoPeligro,
  },
  badgeTextoExpirado: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textoPeligro,
  },
  aviso48hs: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.fondoEncabezado,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  aviso48hsTexto: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textoVerdeOscuro,
    lineHeight: 15,
  },
  alertaExpirado: {
    flexDirection: 'row',
    backgroundColor: COLORS.fondoPeligro,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.bordePeligro,
    gap: SPACING.xs,
  },
  alertaTextos: {
    flex: 1,
  },
  alertaTitulo: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textoPeligro,
  },
  alertaDescripcion: {
    fontSize: 11,
    color: COLORS.textoPeligro,
    marginTop: 2,
    lineHeight: 14,
  },
  sucursalBox: {
    backgroundColor: COLORS.fondoTarjeta,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
  },
  filaIconoTexto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sucursalNombre: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },
  sucursalDireccion: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    marginTop: 2,
  },
  sucursalHorario: {
    fontSize: 11,
    color: COLORS.textoVerde,
    fontWeight: '600',
    marginTop: 3,
  },
  fechasContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bordeSuave,
  },
  fechaColumna: {
    flex: 1,
  },
  fechaEtiqueta: {
    fontSize: 10,
    color: COLORS.textoSecundario,
    fontWeight: '600',
  },
  fechaValor: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
    marginTop: 2,
  },
  fechaValorExpirada: {
    color: COLORS.textoPeligro,
  },
  itemsSection: {
    paddingVertical: SPACING.xs,
  },
  itemsSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
    marginTop: SPACING.xs,
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  itemCantidad: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textoVerde,
    width: 26,
  },
  itemNombre: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textoVerdeOscuro,
  },
  itemPuntos: {
    fontSize: 11,
    color: COLORS.textoSecundario,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.bordeSuave,
    marginTop: SPACING.xs,
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textoSecundario,
  },
  footerPuntos: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textoPeligro,
  },
});
