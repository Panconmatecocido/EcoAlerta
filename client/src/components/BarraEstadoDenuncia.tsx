// src/components/BarraEstadoDenuncia.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../utils/theme';

type Estado = 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO' | 'RECHAZADO';

interface Props {
  estado: Estado;
}

export const BarraEstadoDenuncia: React.FC<Props> = ({ estado }) => {
  if (estado === 'RECHAZADO') {
    return (
      <View style={styles.cajaRechazado}>
        <MaterialCommunityIcons name="close-circle" size={16} color={COLORS.textoPeligro} />
        <Text style={styles.textoRechazado}>Reporte Desestimado / Rechazado</Text>
      </View>
    );
  }

  const pasos: { clave: Estado; etiqueta: string }[] = [
    { clave: 'PENDIENTE', etiqueta: 'Recibido' },
    { clave: 'EN_PROCESO', etiqueta: 'En Inspección' },
    { clave: 'RESUELTO', etiqueta: 'Saneado' },
  ];

  const obtenerIndiceActual = () => {
    switch (estado) {
      case 'PENDIENTE':
        return 0;
      case 'EN_PROCESO':
        return 1;
      case 'RESUELTO':
        return 2;
      default:
        return 0;
    }
  };

  const indiceActual = obtenerIndiceActual();

  return (
    <View style={styles.contenedorLinea}>
      {pasos.map((paso, idx) => {
        const completado = idx <= indiceActual;
        const esActual = idx === indiceActual;

        return (
          <React.Fragment key={paso.clave}>
            <View style={styles.nodoContenedor}>
              <View
                style={[
                  styles.circuloPaso,
                  completado && styles.circuloCompletado,
                  esActual && styles.circuloActual,
                ]}
              >
                <MaterialCommunityIcons
                  name={completado ? 'check' : 'numeric-1'}
                  size={12}
                  color={completado ? COLORS.superficieTarjeta : COLORS.textoDesactivado}
                />
              </View>
              <Text style={[styles.etiquetaPaso, completado && styles.etiquetaCompletada]}>
                {paso.etiqueta}
              </Text>
            </View>

            {idx < pasos.length - 1 && (
              <View
                style={[
                  styles.lineaConectora,
                  idx < indiceActual && styles.lineaCompletada,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  contenedorLinea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  nodoContenedor: {
    alignItems: 'center',
    zIndex: 1,
  },
  circuloPaso: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.fondoAplicacion,
    borderWidth: 1.5,
    borderColor: COLORS.bordeSuave,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circuloCompletado: {
    backgroundColor: COLORS.botonPrincipal,
    borderColor: COLORS.botonPrincipal,
  },
  circuloActual: {
    borderWidth: 2,
    borderColor: COLORS.textoVerdeOscuro,
  },
  etiquetaPaso: {
    fontSize: 10,
    color: COLORS.textoSecundario,
    marginTop: 2,
    fontWeight: '500',
  },
  etiquetaCompletada: {
    color: COLORS.textoVerdeOscuro,
    fontWeight: 'bold',
  },
  lineaConectora: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.bordeSuave,
    marginTop: -12,
  },
  lineaCompletada: {
    backgroundColor: COLORS.botonPrincipal,
  },
  cajaRechazado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.fondoPeligro,
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  textoRechazado: {
    fontSize: 11,
    color: COLORS.textoPeligro,
    fontWeight: 'bold',
  },
});