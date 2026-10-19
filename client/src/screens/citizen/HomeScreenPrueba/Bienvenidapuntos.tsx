import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import { styles } from '../../../components/HomeStyle/Bienvenida-puntosStyle';
import { BORDER_RADIUS, COLORS, SPACING } from '../../../utils/theme';

export default function Bienvenidapuntos () {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  if (!user) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => navigation.getParent()?.navigate('Register')}
        activeOpacity={0.85}
        style={guestStyles.registerButton}
      >
        <Feather name="user-plus" size={22} color={COLORS.blanco} />
        <Text style={guestStyles.registerButtonText}>
          Regístrate para empezar a usar la app
        </Text>
        <Feather name="arrow-right" size={20} color={COLORS.blanco} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.welcomeCard}>
      <View style={styles.avatar}>
        <Text>👤</Text>
      </View>

      <View>
        <Text style={styles.texto_usuario}>¡Bienvenido, {user.name}!</Text>
        <Text style={styles.texto_acompañamiento}>
          Juntos hacemos una ciudad más limpia 🌿
        </Text>
      </View>

      <View style={styles.divisor} />

      <View>
        <Text style={styles.texto_puntos}>🏅 Mis puntos</Text>
        <Text style={styles.punto}>{user.points.toLocaleString('es-AR')}</Text>
        <Text style={styles.historial}>Ver historial</Text>
      </View>
    </View>
  );
}

const guestStyles = StyleSheet.create({
  registerButton: {
    minHeight: 76,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.botonPrincipal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  registerButtonText: {
    flex: 1,
    color: COLORS.blanco,
    fontSize: 16,
    fontWeight: '700',
  },
});