// src/screens/citizen/ReportScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Header } from '../../components/Header';
import { COLORS } from '../../utils/theme';

export const ReportScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.content}>
        <Text style={styles.title}>Generar Reporte</Text>
        <Text style={styles.subtitle}>Captura la foto del basural o problema ambiental para crear la alerta.</Text>
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
    fontSize: 15,
    color: COLORS.textoSecundario,
    textAlign: 'center',
  },
});

export default ReportScreen;
