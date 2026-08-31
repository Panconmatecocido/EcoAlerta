// src/components/Header.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';

interface HeaderProps {
  showActions?: boolean;
  onPressNotifications?: () => void;
  onPressSettings?: () => void;
  unreadNotifications?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  showActions = true,
  onPressNotifications,
  onPressSettings,
  unreadNotifications = true,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
      <View style={styles.contentRow}>
        {/* Notificaciones (Izquierda) */}
        {showActions ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onPressNotifications}
            activeOpacity={0.7}
          >
            <Feather name="bell" size={26} color={COLORS.textoVerdeOscuro} />
            {unreadNotifications && <View style={styles.notificationDot} />}
          </TouchableOpacity>
        ) : (
          <View style={styles.actionButton} />
        )}

        {/* Logo Central con Hoja */}
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons
            name="leaf"
            size={24}
            color={COLORS.botonPrincipal}
            style={styles.leafIcon}
          />
          <Text style={styles.logoText}>ECO ALERTA</Text>
        </View>

        {/* Ajustes / Configuración (Derecha) */}
        {showActions ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onPressSettings}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={26} color={COLORS.textoVerdeOscuro} />
          </TouchableOpacity>
        ) : (
          <View style={styles.actionButton} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.fondoEncabezado,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  actionButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: COLORS.iconoActivoInferior,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  leafIcon: {
    marginBottom: -4,
    transform: [{ rotate: '-10deg' }],
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: COLORS.textoLogo,
  },
});

export default Header;