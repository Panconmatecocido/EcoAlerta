// src/screens/citizen/HomeScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, useWindowDimensions, Image } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/Header';
import { CustomButton } from '../../components/CustomButton';
import { COLORS } from '../../utils/theme';

export const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { width: screenWidth } = useWindowDimensions();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir de tu cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: () => {
            void logout().catch((error: unknown) => {
              Alert.alert(
                'No se pudo cerrar sesión',
                error instanceof Error ? error.message : 'Inténtalo nuevamente.'
              );
            });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        onPressNotifications={() => Alert.alert('Notificaciones', 'Tienes 2 notificaciones ambientales')}
        onPressSettings={() => Alert.alert('Ajustes', 'Panel de configuración')}
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { width: Math.min(screenWidth, 720) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta de Bienvenida */}
        <View style={styles.welcomeCard}>
          <View style={styles.userHeaderRow}>
            <View style={styles.avatarCircle}>
              {user?.fotoPerfilUri ? (
                <Image
                  source={{ uri: user.fotoPerfilUri }}
                  style={styles.avatarImage}
                  accessibilityLabel="Foto de perfil"
                />
              ) : (
                <Feather name="user" size={32} color={COLORS.botonPrincipal} />
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.welcomeLabel}>¡Bienvenido!</Text>
              <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
                {user?.name || 'Ciudadano Eco'}
              </Text>
            </View>
          </View>

          <View style={styles.pointsSection}>
            <Text style={styles.pointsTitle}>Mis EcoPuntos</Text>
            <View style={styles.pointsValue}>
              <MaterialCommunityIcons name="leaf-circle" size={28} color={COLORS.botonPrincipal} />
              <Text style={styles.pointsNumber}>{user?.points ?? 0}</Text>
            </View>
          </View>
        </View>

        {/* Tarjeta de Resumen de Impacto */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tu Impacto Ambiental</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="recycle" size={28} color={COLORS.botonPrincipal} />
              <Text style={styles.statValue} numberOfLines={1}>
                12
              </Text>
              <Text style={styles.statLabel}>Reportes hechos</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="tree" size={28} color={COLORS.iconoActivoInferior} />
              <Text style={styles.statValue} numberOfLines={1}>
                5
              </Text>
              <Text style={styles.statLabel}>Áreas limpiadas</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="trophy-award" size={28} color="#f59e0b" />
              <Text style={styles.statValue} numberOfLines={1}>
                Nivel 2
              </Text>
              <Text style={styles.statLabel}>Defensor Eco</Text>
            </View>
          </View>
        </View>

        {/* Botón de Cerrar Sesión */}
        <View style={styles.logoutContainer}>
          <CustomButton
            title="Cerrar Sesión"
            onPress={handleLogout}
            variant="outline"
            leftIcon={<Feather name="log-out" size={20} color={COLORS.textoVerdeOscuro} />}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.fondoAplicacion,
  },
  scrollContent: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  welcomeCard: {
    alignSelf: 'stretch',
    minWidth: 0,
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  userHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 60,
    flexShrink: 0,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.fondoTarjeta,
    borderWidth: 2,
    borderColor: COLORS.borde,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  userInfo: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    flexShrink: 1,
  },
  welcomeLabel: {
    fontSize: 13,
    color: COLORS.textoVerde,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textoVerdeOscuro,
    flexShrink: 1,
  },
  pointsSection: {
    alignSelf: 'stretch',
    minWidth: 0,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borde,
  },
  pointsTitle: {
    fontSize: 14,
    color: COLORS.textoSecundario,
    fontWeight: '600',
    marginBottom: 6,
  },
  pointsValue: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  pointsNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.botonPrincipal,
  },
  card: {
    alignSelf: 'stretch',
    minWidth: 0,
    backgroundColor: COLORS.fondoTarjeta,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.borde,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    minWidth: 80,
    maxWidth: '50%',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textoVerdeOscuro,
    marginTop: 6,
    maxWidth: '100%',
    flexShrink: 1,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    marginTop: 2,
    maxWidth: '100%',
    textAlign: 'center',
    flexShrink: 1,
  },
  logoutContainer: {
    marginTop: 10,
  },
});

export default HomeScreen;