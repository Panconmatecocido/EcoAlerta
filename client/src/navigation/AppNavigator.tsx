// src/navigation/AppNavigator.tsx
import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { MainNavigator } from './MainNavigator';
import { AdminNavigator } from './AdminNavigator';
import { COLORS } from '../utils/theme';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

const Stack = createNativeStackNavigator();

export const AppNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="leaf" size={48} color={COLORS.botonPrincipal} style={styles.leafIcon} />
        <Text style={styles.loadingLogoText}>ECO ALERTA</Text>
        <ActivityIndicator size="large" color={COLORS.botonPrincipal} style={styles.spinner} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {user === null ? (
        // Flujo de Autenticación (No autenticado)
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : user.role === 'admin' ? (
        // Flujo de Administrador
        <Stack.Screen name="AdminApp" component={AdminNavigator} />
      ) : (
        // Flujo de Ciudadano Principal (Home con Tabs)
        <Stack.Screen name="MainApp" component={MainNavigator} />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.fondoAplicacion,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leafIcon: {
    marginBottom: 8,
  },
  loadingLogoText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textoLogo,
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  spinner: {
    marginTop: 12,
  },
});

export default AppNavigator;