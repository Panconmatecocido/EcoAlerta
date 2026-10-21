import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { BORDER_RADIUS, COLORS, ICON_SIZE, SPACING } from '../../utils/theme';

export const CollaboratorHomeScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const confirmLogout = () => {
    Alert.alert('Cerrar sesión', '¿Quieres salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: () => {
          void logout('login').catch((error: unknown) => {
            Alert.alert(
              'No se pudo cerrar sesión',
              error instanceof Error ? error.message : 'Inténtalo nuevamente.'
            );
          });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.brandIcon}>
            <MaterialCommunityIcons name="leaf" size={ICON_SIZE.xl} color={COLORS.botonPrincipal} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>ECO ALERTA MUNICIPAL</Text>
            <Text style={styles.title}>Portal de colaborador</Text>
            <Text style={styles.subtitle}>Bienvenido, {user?.name ?? 'Colaborador'}</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            style={styles.logoutButton}
            onPress={confirmLogout}
          >
            <Feather name="log-out" size={ICON_SIZE.md} color={COLORS.textoPeligro} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <MaterialCommunityIcons
              name="handshake-outline"
              size={ICON_SIZE.xl}
              color={COLORS.botonPrincipal}
            />
          </View>
          <Text style={styles.cardTitle}>Gracias por colaborar</Text>
          <Text style={styles.cardDescription}>
            Desde aquí podrás consultar y gestionar las entregas municipales asignadas a tu organización.
          </Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Cuenta de colaborador activa</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.fondoAplicacion,
  },
  content: {
    flexGrow: 1,
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
  },
  brandIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.fondoEncabezado,
  },
  headerCopy: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  eyebrow: {
    color: COLORS.textoVerde,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: COLORS.textoVerdeOscuro,
    fontSize: 19,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 2,
    color: COLORS.textoSecundario,
    fontSize: 13,
  },
  logoutButton: {
    width: 42,
    height: 42,
    marginLeft: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.fondoPeligro,
  },
  card: {
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    backgroundColor: COLORS.superficieTarjeta,
  },
  cardIcon: {
    width: 64,
    height: 64,
    marginBottom: SPACING.md,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.fondoTarjeta,
  },
  cardTitle: {
    color: COLORS.textoVerdeOscuro,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  cardDescription: {
    marginTop: SPACING.sm,
    color: COLORS.textoSecundario,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.fondoTarjeta,
  },
  statusDot: {
    width: 8,
    height: 8,
    marginRight: SPACING.xs,
    borderRadius: 4,
    backgroundColor: COLORS.botonPrincipal,
  },
  statusText: {
    color: COLORS.textoVerde,
    fontSize: 13,
    fontWeight: '700',
  },
});

export default CollaboratorHomeScreen;
