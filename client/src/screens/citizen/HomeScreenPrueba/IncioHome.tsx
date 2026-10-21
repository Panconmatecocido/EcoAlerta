import Bienvenidapuntos from './Bienvenidapuntos';

import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Header from '../../../components/Header';
import { CarruselTienda } from './CarruselPrueba';
import { FotosPuntos } from './FotosPuntos';
import { useAuth } from '../../../context/AuthContext';
import { BORDER_RADIUS, COLORS, SPACING } from '../../../utils/theme';

const GUEST_STEPS = [
  {
    number: '1',
    title: 'Reporta focos ambientales',
    description: 'Ayúdanos a identificar problemas ambientales en tu barrio.',
  },
  {
    number: '2',
    title: 'El municipio verifica y sanea',
    description: 'El equipo municipal revisa cada reporte y trabaja en una solución.',
  },
  {
    number: '3',
    title: 'Suma puntos y canjea premios ecológicos',
    description: 'Cuando tu reporte se resuelve, ganas puntos para canjear en la tienda.',
  },
];

export default function InicioHome() {
  const { user } = useAuth();

  return (
    <View style={screenStyles.container}>
      <Header />
      <ScrollView
        contentContainerStyle={screenStyles.content}
        showsVerticalScrollIndicator={false}
      >
        <Bienvenidapuntos />
        {user === null && (
          <View style={screenStyles.explainerCard}>
            <Text style={screenStyles.explainerTitle}>¿Cómo funciona Eco Alerta?</Text>
            {GUEST_STEPS.map((step) => (
              <View key={step.number} style={screenStyles.step}>
                <View style={screenStyles.stepNumber}>
                  <Text style={screenStyles.stepNumberText}>{step.number}</Text>
                </View>
                <View style={screenStyles.stepCopy}>
                  <Text style={screenStyles.stepTitle}>{step.title}</Text>
                  <Text style={screenStyles.stepDescription}>{step.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <CarruselTienda />
        <FotosPuntos />
      </ScrollView>
    </View>
  );
}

const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.fondoAplicacion,
  },
  content: {
    paddingBottom: SPACING.xl,
  },
  explainerCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  explainerTitle: {
    marginBottom: SPACING.md,
    color: COLORS.textoVerdeOscuro,
    fontSize: 18,
    fontWeight: '800',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.fondoEncabezado,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: COLORS.textoLogo,
    fontWeight: '800',
  },
  stepCopy: {
    flex: 1,
  },
  stepTitle: {
    color: COLORS.textoVerdeOscuro,
    fontSize: 14,
    fontWeight: '700',
  },
  stepDescription: {
    marginTop: 2,
    color: COLORS.textoSecundario,
    fontSize: 13,
    lineHeight: 18,
  },
});