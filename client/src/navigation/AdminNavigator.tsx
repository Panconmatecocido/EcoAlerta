// src/navigation/AdminNavigator.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';

// Importaciones nombradas exactas desde la carpeta screens/admin
import { AdminHomeScreen } from '../screens/admin/AdminHomeScreen';
import { AdminDenunciasScreen } from '../screens/admin/AdminDenunciasScreen';
import { AdminAgenteScreen } from '../screens/admin/AdminAgentesScreen';

export type AdminTabParamList = {
  InicioAdmin: undefined;
  DenunciasAdmin: undefined;
  AgentesAdmin: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();

export const AdminNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.iconoActivoInferior,
        tabBarInactiveTintColor: COLORS.textoSecundario,
        tabBarStyle: {
          backgroundColor: COLORS.superficieTarjeta,
          borderTopColor: COLORS.bordeSuave,
          // Calculamos la altura total sumando el margen dinámico del sistema operativo
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="InicioAdmin"
        component={AdminHomeScreen}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DenunciasAdmin"
        component={AdminDenunciasScreen}
        options={{
          tabBarLabel: 'Denuncias',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-document-multiple-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AgentesAdmin"
        component={AdminAgenteScreen}
        options={{
          tabBarLabel: 'Agentes',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};