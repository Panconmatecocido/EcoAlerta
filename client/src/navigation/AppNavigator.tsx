// src/navigation/AppNavigator.tsx
import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { MainNavigator } from './MainNavigator';
import { AdminNavigator } from './AdminNavigator';
import { AgentNavigator } from './AgentNavigator';
import { CollaboratorNavigator } from './CollaboratorNavigator';
import { navigationRef } from './navigationRef';
import { COLORS } from '../utils/theme';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

const Stack = createNativeStackNavigator();

export const AppNavigator: React.FC = () => {
  const { user, isLoading, logoutDestination } = useAuth();
  const previousUser = useRef(user);

  useEffect(() => {
    const wasAuthenticated = previousUser.current !== null;
    previousUser.current = user;

    if (wasAuthenticated && user === null && navigationRef.isReady()) {
      navigationRef.resetRoot({
        index: 0,
        routes: [{ name: logoutDestination }],
      });
    }
  }, [logoutDestination, user]);

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
    <Stack.Navigator
      key={user ? `${user.role}:${user.id}` : 'guest'}
      initialRouteName={user === null ? 'MainApp' : undefined}
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      {user === null ? (
        // Inicio público como invitado; las pantallas de autenticación se abren bajo demanda.
        <>
          <Stack.Screen name="MainApp" component={MainNavigator} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : user.role === 'agent' ? (
        // Flujo de Agente de Campo (Nuevo)
        <Stack.Screen name="AgentApp" component={AgentNavigator} />
      ) : user.role === 'admin' ? (
        // Flujo de Administrador
        <Stack.Screen name="AdminApp" component={AdminNavigator} />
      ) : user.role === 'collaborator' ? (
        <Stack.Screen name="CollaboratorApp" component={CollaboratorNavigator} />
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