// src/navigation/MainNavigator.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/citizen/HomeScreen';
import { ProfileScreen } from '../screens/citizen/ProfileScreen';
import { ReportScreen } from '../screens/citizen/ReportScreen';
import { StoreScreen } from '../screens/citizen/StoreScreen';
import { MasScreen } from '../screens/citizen/MasScreen';
import { COLORS, SPACING, ICON_SIZE } from '../utils/theme';

const Tab = createBottomTabNavigator();

// Botón de Cámara Central Flotante idéntico al boceto
const CustomTabBarCameraButton = ({ onPress }: any) => (
  <TouchableOpacity
    style={styles.cameraButtonWrapper}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={styles.cameraButtonInner}>
      <Feather name="camera" size={26} color={COLORS.superficieTarjeta} />
    </View>
  </TouchableOpacity>
);

export const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.iconoActivoInferior,
        tabBarInactiveTintColor: COLORS.textoSecundario,
        tabBarStyle: {
          backgroundColor: COLORS.superficieTarjeta,
          borderTopWidth: 1,
          borderTopColor: COLORS.bordeSuave,
          height: 68,
          paddingBottom: SPACING.sm,
          paddingTop: SPACING.sm,
          position: 'relative',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={ICON_SIZE.lg}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person-circle' : 'person-circle-outline'}
              size={25}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Camara"
        component={ReportScreen}
        options={{
          tabBarLabel: () => null,
          tabBarButton: (props) => <CustomTabBarCameraButton {...props} />,
        }}
      />

      <Tab.Screen
        name="Tienda"
        component={StoreScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'store' : 'store-outline'}
              size={ICON_SIZE.lg}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Más"
        component={MasScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="menu" size={ICON_SIZE.lg} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  cameraButtonWrapper: {
    top: -18,
    justifyContent: 'center',
    alignItems: 'center',
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: COLORS.fondoEncabezado,
    padding: SPACING.xs,
  },
  cameraButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.camaraInferior,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.camaraInferior,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
});

export default MainNavigator;