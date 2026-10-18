// src/screens/citizen/ReportConfirmationScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { CustomButton } from '../../components/CustomButton';
import { COLORS, SPACING, BORDER_RADIUS } from '../../utils/theme';
import type { ReportConfirmationScreenProps } from '../../navigation/types';

/**
 * Pantalla de confirmación post-envío exitoso del reporte ambiental.
 * Requisitos: 9.1, 9.2, 9.3, 9.4
 */
export const ReportConfirmationScreen: React.FC<ReportConfirmationScreenProps> = ({
  navigation,
}) => {
  const handleContinuar = () => {
    navigation.getParent()?.navigate('Inicio');
  };

  return (
    <View style={styles.container}>
      <Header showActions={false} />

      <View style={styles.content}>
        {/* Ícono de éxito */}
        <View style={styles.iconWrapper}>
          <MaterialCommunityIcons
            name="check-circle"
            size={96}
            color={COLORS.botonPrincipal}
          />
        </View>

        {/* Título */}
        <Text style={styles.title}>¡Reporte enviado!</Text>

        {/* Mensaje de éxito — texto exacto requerido */}
        <Text style={styles.message}>
          ¡Muchas gracias por tu reporte! Si el mismo es correcto, recibirás
          600 Eco Points
        </Text>

        {/* Puntos a ganar */}
        <View style={styles.pointsBadge}>
          <MaterialCommunityIcons
            name="leaf-circle"
            size={22}
            color={COLORS.botonPrincipal}
          />
          <Text style={styles.pointsBadgeText}>+600 Eco Points pendientes</Text>
        </View>

        {/* Botón continuar */}
        <View style={styles.buttonContainer}>
          <CustomButton title="Continuar" onPress={handleContinuar} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.fondoAplicacion,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  iconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.fondoTarjeta,
    borderWidth: 2,
    borderColor: COLORS.bordeSuave,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textoVerdeOscuro,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: COLORS.textoSecundario,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.fondoTarjeta,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    marginBottom: SPACING.xl,
  },
  pointsBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textoVerde,
    marginLeft: SPACING.sm,
  },
  buttonContainer: {
    width: '100%',
  },
});

export default ReportConfirmationScreen;
