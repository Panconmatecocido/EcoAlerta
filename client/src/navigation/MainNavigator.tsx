// src/navigation/MainNavigator.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // 👈 Importante

import { HomeScreen } from '../screens/citizen/HomeScreen';
import { ProfileScreen } from '../screens/citizen/ProfileScreen';
import { ReportScreen } from '../screens/citizen/ReportScreen';
import { StoreScreen } from '../screens/citizen/StoreScreen';
import { CartScreen } from '../screens/citizen/CartScreen';
import { MasScreen } from '../screens/citizen/MasScreen';
import { COLORS, SPACING, ICON_SIZE } from '../utils/theme';

const Tab = createBottomTabNavigator();
const StoreStack = createNativeStackNavigator();

// Sub-navegador para la pestaña Tienda
const StoreNavigator = () => (
  <StoreStack.Navigator screenOptions={{ headerShown: false }}>
    <StoreStack.Screen name="StoreCatalog" component={StoreScreen} />
    <StoreStack.Screen name="Cart" component={CartScreen} />
  </StoreStack.Navigator>
);

// Botón de Cámara Central Flotante
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
  // Obtenemos los márgenes seguros del dispositivo (superior, inferior, laterales)
  const insets = useSafeAreaInsets();

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
          // Sumamos el espacio de gestos/botones inferiores del sistema a la altura base
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : SPACING.xs,
          paddingTop: SPACING.xs,
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
        component={StoreNavigator}
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