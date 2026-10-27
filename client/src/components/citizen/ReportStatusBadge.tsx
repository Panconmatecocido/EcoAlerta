// Inicio de Fase 1 (Setup): insignia semántica para los estados de una denuncia.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING } from '../../utils/theme';

export type EstadoDenuncia =
  | 'PENDIENTE'
  | 'APROBADO'
  | 'EN_PROCESO'
  | 'EN_VERIFICACION'
  | 'VERIFICADO_PENDIENTE'
  | 'EN_SANEAMIENTO'
  | 'RESUELTO_TECNICO'
  | 'RESUELTO'
  | 'RECHAZADO'
  | 'CERRADO_INACCESIBLE';

type StatusStyle = {
  label: string;
  textColor: string;
  backgroundColor: string;
};

const STATUS_STYLES: Record<EstadoDenuncia, StatusStyle> = {
  PENDIENTE: {
    label: 'En revisión',
    textColor: COLORS.textoAdvertencia,
    backgroundColor: COLORS.fondoAdvertencia,
  },
  APROBADO: {
    label: 'Aprobado',
    textColor: COLORS.textoVerde,
    backgroundColor: COLORS.fondoTarjeta,
  },
  EN_PROCESO: {
    label: 'En proceso',
    textColor: COLORS.textoVerde,
    backgroundColor: COLORS.fondoTarjeta,
  },
  EN_VERIFICACION: {
    label: 'En verificación',
    textColor: COLORS.textoVerde,
    backgroundColor: COLORS.fondoTarjeta,
  },
  VERIFICADO_PENDIENTE: {
    label: 'Verificación pendiente',
    textColor: COLORS.textoAdvertencia,
    backgroundColor: COLORS.fondoAdvertencia,
  },
  EN_SANEAMIENTO: {
    label: 'En saneamiento',
    textColor: COLORS.textoVerde,
    backgroundColor: COLORS.fondoTarjeta,
  },
  RESUELTO_TECNICO: {
    label: 'Resuelto técnicamente',
    textColor: COLORS.textoVerde,
    backgroundColor: COLORS.fondoTarjeta,
  },
  RESUELTO: {
    label: 'Resuelto',
    textColor: COLORS.textoVerde,
    backgroundColor: COLORS.fondoTarjeta,
  },
  RECHAZADO: {
    label: 'Rechazado',
    textColor: COLORS.textoPeligro,
    backgroundColor: COLORS.fondoPeligro,
  },
  CERRADO_INACCESIBLE: {
    label: 'Cerrado: sitio inaccesible',
    textColor: COLORS.textoAdvertencia,
    backgroundColor: COLORS.fondoAdvertencia,
  },
};

interface Props {
  estado: EstadoDenuncia;
}

export const ReportStatusBadge: React.FC<Props> = ({ estado }) => {
  const status = STATUS_STYLES[estado];

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Estado del reporte: ${status.label}`}
      style={[styles.badge, { backgroundColor: status.backgroundColor }]}
    >
      <Text style={[styles.label, { color: status.textColor }]}>{status.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
