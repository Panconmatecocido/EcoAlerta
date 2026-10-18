// src/components/LocalidadAutocomplete.tsx
import React, { useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { filtrarLocalidades } from '../utils/normalizeText';
import { COLORS, SPACING, BORDER_RADIUS } from '../utils/theme';

/**
 * Props del componente LocalidadAutocomplete.
 *
 * Requisitos: 6.1–6.9
 */
interface LocalidadAutocompleteProps {
  /** Localidad actualmente seleccionada (null si ninguna). */
  value: string | null;
  /** Texto visible en el campo de entrada. */
  inputText: string;
  /** Llamado cuando el usuario selecciona una localidad del dropdown. */
  onSelect: (localidad: string) => void;
  /**
   * Llamado cuando el usuario edita el texto después de haber seleccionado,
   * invalidando la selección previa.
   */
  onChangeText: (text: string) => void;
}

/**
 * Campo de texto con dropdown de autocompletado para seleccionar una localidad
 * del partido de Pilar. Muestra sugerencias cuando el texto tiene 3+ caracteres,
 * ignorando mayúsculas/minúsculas y tildes en la búsqueda.
 *
 * Requisitos: 6.1–6.9, 6.11
 */
export const LocalidadAutocomplete: React.FC<LocalidadAutocompleteProps> = ({
  value,
  inputText,
  onSelect,
  onChangeText,
}) => {
  // Calcular sugerencias sólo cuando hay 3+ caracteres y no hay selección activa.
  // Si hay una selección activa (`value !== null`) el dropdown permanece cerrado.
  const sugerencias = value === null && inputText.length >= 3
    ? filtrarLocalidades(inputText)
    : [];

  const mostrarDropdown = value === null && inputText.length >= 3;

  const handleSelect = useCallback(
    (localidad: string) => {
      onSelect(localidad);
    },
    [onSelect],
  );

  const handleChangeText = useCallback(
    (text: string) => {
      onChangeText(text);
    },
    [onChangeText],
  );

  return (
    <View style={styles.wrapper}>
      {/* Campo de entrada */}
      <View style={[styles.inputRow, value !== null && styles.inputRowSelected]}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={handleChangeText}
          placeholder="Escribe tu localidad…"
          placeholderTextColor={COLORS.textoDesactivado}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
          accessibilityLabel="Campo de localidad"
          accessibilityHint="Escribe al menos 3 caracteres para ver sugerencias"
        />

        {/* Indicador visual de selección válida */}
        {value !== null && (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={COLORS.botonPrincipal}
            style={styles.checkIcon}
            accessibilityLabel="Localidad seleccionada"
          />
        )}
      </View>

      {/* Dropdown de sugerencias */}
      {mostrarDropdown && (
        <View style={styles.dropdown}>
          {sugerencias.length === 0 ? (
            // Mensaje cuando no hay coincidencias — Requisito 6.7
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>
                No se encontraron localidades disponibles
              </Text>
            </View>
          ) : (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              style={styles.scrollView}
            >
              {sugerencias.map((localidad) => (
                <TouchableOpacity
                  key={localidad}
                  style={styles.suggestionRow}
                  onPress={() => handleSelect(localidad)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Seleccionar ${localidad}`}
                >
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={COLORS.iconoPrincipal}
                    style={styles.locationIcon}
                  />
                  <Text style={styles.suggestionText}>{localidad}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 10,
  },

  // Campo de texto
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.fondoTarjeta,
    borderWidth: 1,
    borderColor: COLORS.borde,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  inputRowSelected: {
    borderColor: COLORS.botonPrincipal,
    backgroundColor: COLORS.fondoAplicacion,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textoVerdeOscuro,
    paddingVertical: 0, // evita altura extra en Android
  },
  checkIcon: {
    marginLeft: SPACING.sm,
  },

  // Dropdown
  dropdown: {
    position: 'absolute',
    top: 50, // justo debajo del campo (48dp + 2dp gap)
    left: 0,
    right: 0,
    backgroundColor: COLORS.superficieTarjeta,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    borderRadius: BORDER_RADIUS.sm,
    // Sombra iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    // Sombra Android
    elevation: 4,
    overflow: 'hidden',
  },
  scrollView: {
    maxHeight: 200,
  },

  // Fila de sugerencia
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bordeSuave,
  },
  locationIcon: {
    marginRight: SPACING.sm,
  },
  suggestionText: {
    fontSize: 15,
    color: COLORS.textoVerdeOscuro,
  },

  // Mensaje vacío
  emptyRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textoSecundario,
    fontStyle: 'italic',
  },
});

export default LocalidadAutocomplete;
