// src/navigation/AdminNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InicioHome from '../screens/citizen/HomeScreenPrueba/IncioHome';

const Stack = createNativeStackNavigator();

export const AdminNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={InicioHome} />
    </Stack.Navigator>
  );
};

export default AdminNavigator;