// src/components/GravedadSelector.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../utils/theme';

export type Gravedad = 'LEVE' | 'MODERADA' | 'GRAVE';

interface GravedadSelectorProps {
  value: Gravedad | null;
  onChange: (gravedad: Gravedad) => void;
}

interface GravedadConfig {
  label: string;
  selectedBackground: string;
  selectedText: string;
}

const GRAVEDAD_CONFIG: Record<Gravedad, GravedadConfig> = {
  LEVE: {
    label: 'Leve',
    selectedBackground: COLORS.botonPrincipal,
    selectedText: COLORS.blanco,
  },
  MODERADA: {
    label: 'Moderada',
    selectedBackground: COLORS.textoAdvertencia,
    selectedText: COLORS.blanco,
  },
  GRAVE: {
    label: 'Grave',
    selectedBackground: COLORS.error,
    selectedText: COLORS.blanco,
  },
};

const OPCIONES: Gravedad[] = ['LEVE', 'MODERADA', 'GRAVE'];

export const GravedadSelector: React.FC<GravedadSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <View style={styles.container} accessibilityRole="radiogroup">
      {OPCIONES.map((opcion) => {
        const config = GRAVEDAD_CONFIG[opcion];
        const isSelected = value === opcion;

        return (
          <TouchableOpacity
            key={opcion}
            onPress={() => onChange(opcion)}
            style={[
              styles.chip,
              isSelected
                ? { backgroundColor: config.selectedBackground }
                : styles.chipUnselected,
            ]}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={config.label}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.chipText,
                isSelected
                  ? { color: config.selectedText }
                  : styles.chipTextUnselected,
              ]}
            >
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  chip: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipUnselected: {
    backgroundColor: COLORS.fondoTarjeta,
    borderWidth: 1,
    borderColor: COLORS.borde,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipTextUnselected: {
    color: COLORS.textoSecundario,
  },
});

export default GravedadSelector;
