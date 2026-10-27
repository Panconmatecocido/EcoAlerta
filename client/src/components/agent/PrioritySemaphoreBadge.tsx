import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../utils/theme';

export type PrioridadCaso = 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAJA';

interface PrioritySemaphoreBadgeProps {
  prioridad: PrioridadCaso;
}

export const PrioritySemaphoreBadge: React.FC<PrioritySemaphoreBadgeProps> = ({ prioridad }) => {
  const obtenerConfiguracionSemafaro = (nivel: PrioridadCaso) => {
    switch (nivel) {
      case 'URGENTE':
        return {
          etiqueta: 'URGENTE',
          fondo: COLORS.fondoPeligro,
          borde: COLORS.bordePeligro,
          texto: COLORS.textoPeligro,
          punto: COLORS.textoPeligro,
        };
      case 'ALTA':
        return {
          etiqueta: 'ALTA',
          fondo: COLORS.fondoAdvertencia,
          borde: COLORS.textoAdvertencia,
          texto: COLORS.textoAdvertencia,
          punto: COLORS.textoAdvertencia,
        };
      case 'MEDIA':
        return {
          etiqueta: 'MEDIA',
          fondo: COLORS.fondoEncabezado,
          borde: COLORS.bordeSuave,
          texto: COLORS.textoVerdeOscuro,
          punto: COLORS.botonPrincipal,
        };
      case 'BAJA':
      default:
        return {
          etiqueta: 'BAJA',
          fondo: COLORS.fondoTarjeta,
          borde: COLORS.bordeSuave,
          texto: COLORS.textoVerde,
          punto: COLORS.iconoActivoInferior,
        };
    }
  };

  const config = obtenerConfiguracionSemafaro(prioridad);

  return (
    <View
      style={[
        styles.insignia,
        {
          backgroundColor: config.fondo,
          borderColor: config.borde,
        },
      ]}
    >
      <View style={[styles.puntoSemaforo, { backgroundColor: config.punto }]} />
      <Text style={[styles.textoInsignia, { color: config.texto }]}>{config.etiqueta}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  insignia: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  puntoSemaforo: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  textoInsignia: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
