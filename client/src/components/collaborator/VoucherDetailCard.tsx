// client/src/components/collaborator/VoucherDetailCard.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../utils/theme';

export interface VoucherItemDetail {
  id?: string;
  cantidad: number;
  puntosUnit?: number;
  producto?: {
    id?: string;
    titulo?: string;
    descripcion?: string;
    costoPuntos?: number;
    imagenUrl?: string | null;
  };
}

export interface VoucherDetailData {
  id: string;
  codigoRetiro: string;
  totalPuntos: number;
  estado: 'PENDIENTE_RETIRO' | 'ENTREGADO' | 'CANCELADO' | 'RESERVADO_PENDIENTE' | string;
  fechaExpiracion?: string | null;
  fechaEntrega?: string | null;
  creadoEn?: string | null;
  ciudadano?: {
    id?: string;
    nombre?: string;
    email?: string;
  };
  sucursal?: {
    id?: string;
    nombre?: string;
    direccion?: string;
    horario?: string | null;
  };
  items: VoucherItemDetail[];
}

interface VoucherDetailCardProps {
  voucher: VoucherDetailData;
  onConfirmDelivery?: (codigoRetiro: string) => void;
  isConfirming?: boolean;
}

export const VoucherDetailCard: React.FC<VoucherDetailCardProps> = ({
  voucher,
  onConfirmDelivery,
  isConfirming = false,
}) => {
  const ahora = new Date();
  const fechaExp = voucher.fechaExpiracion ? new Date(voucher.fechaExpiracion) : null;
  const expirado = voucher.estado === 'CANCELADO' || (fechaExp ? ahora > fechaExp && voucher.estado === 'PENDIENTE_RETIRO' : false);
  const entregado = voucher.estado === 'ENTREGADO';
  const pendiente = voucher.estado === 'PENDIENTE_RETIRO' && !expirado;

  const formatearFecha = (fechaStr?: string | null) => {
    if (!fechaStr) return 'No especificada';
    try {
      const f = new Date(fechaStr);
      return f.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return fechaStr;
    }
  };

  return (
    <View style={styles.card}>
      {/* Encabezado con Código y Estado */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.codigoLabel}>CÓDIGO DE RETIRO</Text>
          <Text style={styles.codigoValor}>{voucher.codigoRetiro}</Text>
        </View>

        {/* Badge de Estado */}
        {entregado ? (
          <View style={[styles.badge, styles.badgeEntregado]}>
            <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.botonPrincipal} />
            <Text style={styles.textoBadgeEntregado}>ENTREGADO</Text>
          </View>
        ) : expirado ? (
          <View style={[styles.badge, styles.badgeExpirado]}>
            <MaterialCommunityIcons name="close-circle" size={16} color={COLORS.textoPeligro} />
            <Text style={styles.textoBadgeExpirado}>EXPIRADO</Text>
          </View>
        ) : (
          <View style={[styles.badge, styles.badgePendiente]}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.textoVerde} />
            <Text style={styles.textoBadgePendiente}>PENDIENTE</Text>
          </View>
        )}
      </View>

      {/* Alerta explícita de Expiración a los 30 días (T007) */}
      {expirado && (
        <View style={styles.alertaExpirado}>
          <MaterialCommunityIcons name="alert-circle" size={20} color={COLORS.textoPeligro} />
          <View style={styles.alertaTextos}>
            <Text style={styles.alertaTitulo}>Canje Expirado (+30 días corridos)</Text>
            <Text style={styles.alertaDescripcion}>
              El plazo para retirar este premio ha vencido. Las unidades han sido restituidas al stock
              municipal y los EcoPuntos no tienen reembolso. La entrega está bloqueada.
            </Text>
          </View>
        </View>
      )}

      {/* Alerta de Entrega Previa */}
      {entregado && (
        <View style={styles.alertaEntregado}>
          <MaterialCommunityIcons name="shield-check" size={20} color={COLORS.botonPrincipal} />
          <View style={styles.alertaTextos}>
            <Text style={styles.alertaTituloEntregado}>Premio ya entregado</Text>
            <Text style={styles.alertaDescripcionEntregado}>
              Este comprobante fue canjeado el {formatearFecha(voucher.fechaEntrega)}. No puede entregarse nuevamente.
            </Text>
          </View>
        </View>
      )}

      {/* Datos del Ciudadano */}
      <View style={styles.seccion}>
        <View style={styles.seccionTituloFila}>
          <Ionicons name="person-circle-outline" size={ICON_SIZE.sm} color={COLORS.textoVerdeOscuro} />
          <Text style={styles.seccionTitulo}>Datos del Ciudadano</Text>
        </View>
        <Text style={styles.itemTextoPrincipal}>{voucher.ciudadano?.nombre || 'Ciudadano Municipal'}</Text>
        <Text style={styles.itemTextoSecundario}>{voucher.ciudadano?.email || 'Sin correo asociado'}</Text>
      </View>

      {/* Sucursal de Retiro */}
      <View style={styles.seccion}>
        <View style={styles.seccionTituloFila}>
          <Ionicons name="location-outline" size={ICON_SIZE.sm} color={COLORS.textoVerdeOscuro} />
          <Text style={styles.seccionTitulo}>Sucursal Asignada</Text>
        </View>
        <Text style={styles.itemTextoPrincipal}>{voucher.sucursal?.nombre || 'Sede Central'}</Text>
        <Text style={styles.itemTextoSecundario}>{voucher.sucursal?.direccion || 'Dirección de sede'}</Text>
        {voucher.sucursal?.horario && (
          <Text style={styles.itemTextoHorario}>🕒 {voucher.sucursal.horario}</Text>
        )}
      </View>

      {/* Fechas de Creación y Vencimiento */}
      <View style={styles.filaFechas}>
        <View style={styles.columnaFecha}>
          <Text style={styles.etiquetaFecha}>Fecha de Canje:</Text>
          <Text style={styles.valorFecha}>{formatearFecha(voucher.creadoEn)}</Text>
        </View>
        <View style={styles.columnaFecha}>
          <Text style={styles.etiquetaFecha}>Vence (30 días):</Text>
          <Text style={[styles.valorFecha, expirado ? styles.valorFechaExpirada : null]}>
            {formatearFecha(voucher.fechaExpiracion)}
          </Text>
        </View>
      </View>

      {/* Detalle de Productos a Entregar */}
      <View style={styles.seccion}>
        <View style={styles.seccionTituloFila}>
          <MaterialCommunityIcons name="package-variant-closed" size={ICON_SIZE.sm} color={COLORS.textoVerdeOscuro} />
          <Text style={styles.seccionTitulo}>Productos a Entregar ({voucher.items.length})</Text>
        </View>

        {voucher.items.map((item, index) => (
          <View key={item.id || `item-${index}`} style={styles.itemFila}>
            <View style={styles.itemBadgeCantidad}>
              <Text style={styles.itemCantidadTexto}>{item.cantidad}x</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitulo}>{item.producto?.titulo || 'Insumo Ecológico'}</Text>
              {item.producto?.costoPuntos ? (
                <Text style={styles.itemPuntosUnit}>
                  {item.producto.costoPuntos} EcoPuntos c/u • Total: {item.cantidad * item.producto.costoPuntos} EcoPuntos
                </Text>
              ) : null}
            </View>
          </View>
        ))}

        <View style={styles.totalPuntosFila}>
          <Text style={styles.totalPuntosLabel}>Total EcoPuntos canjeados:</Text>
          <Text style={styles.totalPuntosValor}>{voucher.totalPuntos} EcoPuntos</Text>
        </View>
      </View>

      {/* Botón de Confirmación de Entrega */}
      {pendiente && (
        <TouchableOpacity
          style={[styles.botonConfirmar, isConfirming && styles.botonDeshabilitado]}
          onPress={() => onConfirmDelivery?.(voucher.codigoRetiro)}
          disabled={isConfirming}
          activeOpacity={0.85}
        >
          {isConfirming ? (
            <ActivityIndicator size="small" color={COLORS.superficieTarjeta} />
          ) : (
            <>
              <MaterialCommunityIcons name="check-all" size={20} color={COLORS.superficieTarjeta} style={styles.iconoBoton} />
              <Text style={styles.textoBotonConfirmar}>Confirmar Entrega de Premio</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {entregado && (
        <View style={[styles.botonBloqueado, styles.botonBloqueadoVerde]}>
          <MaterialCommunityIcons name="check-bold" size={18} color={COLORS.botonPrincipal} />
          <Text style={styles.textoBotonBloqueadoVerde}>Entrega Realizada Exitosamente</Text>
        </View>
      )}

      {expirado && (
        <View style={[styles.botonBloqueado, styles.botonBloqueadoRojo]}>
          <MaterialCommunityIcons name="cancel" size={18} color={COLORS.textoPeligro} />
          <Text style={styles.textoBotonBloqueadoRojo}>Entrega Bloqueada por Expiración</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    elevation: 3,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bordeSuave,
    marginBottom: SPACING.sm,
  },
  headerLeft: {
    flex: 1,
  },
  codigoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textoSecundario,
    letterSpacing: 1,
  },
  codigoValor: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textoVerdeOscuro,
    marginTop: 2,
    letterSpacing: 1.2,
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
  textoBadgePendiente: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textoVerde,
  },
  badgeEntregado: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: COLORS.botonPrincipal,
  },
  textoBadgeEntregado: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.botonPrincipal,
  },
  badgeExpirado: {
    backgroundColor: COLORS.fondoPeligro,
    borderWidth: 1,
    borderColor: COLORS.textoPeligro,
  },
  textoBadgeExpirado: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textoPeligro,
  },
  alertaExpirado: {
    flexDirection: 'row',
    backgroundColor: COLORS.fondoPeligro,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.bordePeligro,
    gap: SPACING.xs,
  },
  alertaEntregado: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    gap: SPACING.xs,
  },
  alertaTextos: {
    flex: 1,
  },
  alertaTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textoPeligro,
  },
  alertaDescripcion: {
    fontSize: 11,
    color: COLORS.textoPeligro,
    marginTop: 2,
    lineHeight: 15,
  },
  alertaTituloEntregado: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },
  alertaDescripcionEntregado: {
    fontSize: 11,
    color: COLORS.textoVerdeOscuro,
    marginTop: 2,
    lineHeight: 15,
  },
  seccion: {
    marginBottom: SPACING.sm,
  },
  seccionTituloFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  seccionTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },
  itemTextoPrincipal: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textoVerdeOscuro,
  },
  itemTextoSecundario: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    marginTop: 1,
  },
  itemTextoHorario: {
    fontSize: 11,
    color: COLORS.textoVerde,
    fontWeight: '600',
    marginTop: 2,
  },
  filaFechas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.fondoTarjeta,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  columnaFecha: {
    flex: 1,
  },
  etiquetaFecha: {
    fontSize: 10,
    color: COLORS.textoSecundario,
    fontWeight: '600',
  },
  valorFecha: {
    fontSize: 12,
    color: COLORS.textoVerdeOscuro,
    fontWeight: '700',
    marginTop: 2,
  },
  valorFechaExpirada: {
    color: COLORS.textoPeligro,
  },
  itemFila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bordeSuave,
    gap: SPACING.sm,
  },
  itemBadgeCantidad: {
    backgroundColor: COLORS.fondoEncabezado,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  itemCantidadTexto: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textoLogo,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitulo: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textoVerdeOscuro,
  },
  itemPuntosUnit: {
    fontSize: 11,
    color: COLORS.textoSecundario,
    marginTop: 1,
  },
  totalPuntosFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
  },
  totalPuntosLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },
  totalPuntosValor: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textoVerde,
  },
  botonConfirmar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.botonPrincipal,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
    elevation: 2,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  iconoBoton: {
    marginRight: 6,
  },
  textoBotonConfirmar: {
    color: COLORS.superficieTarjeta,
    fontSize: 14,
    fontWeight: '700',
  },
  botonBloqueado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
    gap: 6,
  },
  botonBloqueadoVerde: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  textoBotonBloqueadoVerde: {
    color: COLORS.botonPrincipal,
    fontSize: 13,
    fontWeight: '700',
  },
  botonBloqueadoRojo: {
    backgroundColor: COLORS.fondoPeligro,
    borderWidth: 1,
    borderColor: COLORS.bordePeligro,
  },
  textoBotonBloqueadoRojo: {
    color: COLORS.textoPeligro,
    fontSize: 13,
    fontWeight: '700',
  },
});
