// src/screens/citizen/ProfileScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Header } from '../../components/Header';
import { CustomButton } from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../utils/theme';

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.content}>
        <Text style={styles.title}>Mi Perfil</Text>
        <Text style={styles.subtitle}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.buttonContainer}>
          <CustomButton title="Cerrar Sesión" onPress={logout} variant="outline" />
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
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textoVerdeOscuro,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.textoVerde,
    fontWeight: '600',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: COLORS.textoSecundario,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 280,
  },
});

export default ProfileScreen;