// src/screens/citizen/HomeScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/Header';
import { CustomButton } from '../../components/CustomButton';
import { COLORS } from '../../utils/theme';

export const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir de tu cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Tarjeta de Bienvenida */}
        <View style={styles.welcomeCard}>
          <View style={styles.userHeaderRow}>
            <View style={styles.avatarCircle}>
              <Feather name="user" size={32} color={COLORS.botonPrincipal} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.welcomeLabel}>¡Hola de nuevo!</Text>
              <Text style={styles.userName}>{user?.name || 'Ciudadano Eco'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'ecoalerta@ciudad.com'}</Text>
            </View>
          </View>

          {/* Puntos Verdes */}
          <View style={styles.pointsBadge}>
            <MaterialCommunityIcons name="leaf-circle" size={24} color={COLORS.botonPrincipal} />
            <Text style={styles.pointsText}>
              <Text style={styles.pointsNumber}>{user?.points || 0}</Text> Puntos Verdes acumulados
            </Text>
          </View>
        </View>

        {/* Tarjeta de Resumen de Impacto */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tu Impacto Ambiental</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="recycle" size={28} color={COLORS.botonPrincipal} />
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Reportes hechos</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="tree" size={28} color={COLORS.iconoActivoInferior} />
              <Text style={styles.statValue}>5</Text>
              <Text style={styles.statLabel}>Áreas limpiadas</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="trophy-award" size={28} color="#f59e0b" />
              <Text style={styles.statValue}>Nivel 2</Text>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  welcomeCard: {
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  userHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.fondoTarjeta,
    borderWidth: 2,
    borderColor: COLORS.borde,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
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
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textoSecundario,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.fondoTarjeta,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.borde,
  },
  pointsText: {
    fontSize: 14,
    color: COLORS.textoVerdeOscuro,
    marginLeft: 8,
    fontWeight: '500',
  },
  pointsNumber: {
    fontWeight: '800',
    color: COLORS.botonPrincipal,
  },
  card: {
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
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textoVerdeOscuro,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    marginTop: 2,
  },
  logoutContainer: {
    marginTop: 10,
  },
});

export default HomeScreen;
