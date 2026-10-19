import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CollaboratorHomeScreen } from '../screens/collaborator/CollaboratorHomeScreen';
import { COLORS } from '../utils/theme';

export type CollaboratorTabParamList = {
  InicioColaborador: undefined;
};

const Tab = createBottomTabNavigator<CollaboratorTabParamList>();

export const CollaboratorNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: COLORS.iconoActivoInferior,
      tabBarInactiveTintColor: COLORS.textoSecundario,
      tabBarStyle: {
        backgroundColor: COLORS.superficieTarjeta,
        borderTopWidth: 1,
        borderTopColor: COLORS.bordeSuave,
        height: 64,
        paddingBottom: 8,
        paddingTop: 8,
      },
    }}
  >
    <Tab.Screen
      name="InicioColaborador"
      component={CollaboratorHomeScreen}
      options={{
        tabBarLabel: 'Inicio',
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="handshake-outline" size={size} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
);

export default CollaboratorNavigator;
