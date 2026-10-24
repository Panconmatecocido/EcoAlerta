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
      <View style={guestStyles.container}>
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
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.getParent()?.navigate('Login')}
          activeOpacity={0.75}
          style={guestStyles.loginButton}
        >
          <Text style={guestStyles.loginButtonText}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.welcomeCard}>
      <View style={styles.userRow}>
        <View style={styles.avatar}>
          <Text>👤</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.texto_usuario}>¡Bienvenido!</Text>
          <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
            {user.name}
          </Text>
          <Text style={styles.texto_acompañamiento} numberOfLines={2}>
            Juntos hacemos una ciudad más limpia 🌿
          </Text>
        </View>
      </View>

      <View style={styles.pointsSection}>
        <Text style={styles.texto_puntos}>Mis puntos</Text>
        <View style={styles.pointsValue}>
          <Text style={styles.pointsIcon}>🌿</Text>
          <Text style={styles.punto}>{(user.points ?? 0).toLocaleString('es-AR')}</Text>
        </View>
      </View>
    </View>
  );
}

const guestStyles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  registerButton: {
    minHeight: 76,
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
  loginButton: {
    alignSelf: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  loginButtonText: {
    color: COLORS.botonPrincipal,
    fontSize: 14,
    fontWeight: '700',
  },
});