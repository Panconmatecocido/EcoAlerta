// src/components/BarraEstadoDenuncia.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../utils/theme';

export type EstadoDenunciaTipo =
  | 'PENDIENTE'
  | 'APROBADO'
  | 'EN_PROCESO'
  | 'EN_VERIFICACION'
  | 'VERIFICADO_PENDIENTE'
  | 'EN_SANEAMIENTO'
  | 'RESUELTO_TECNICO'
  | 'RESUELTO'
  | 'RECHAZADO'
  | 'CERRADO_INACCESIBLE'
  | string;

interface Props {
  estado: EstadoDenunciaTipo;
  puntosOtorgados?: number;
}

export const BarraEstadoDenuncia: React.FC<Props> = ({ estado, puntosOtorgados = 0 }) => {
  if (estado === 'RECHAZADO') {
    return (
      <View style={styles.cajaRechazado}>
        <MaterialCommunityIcons name="close-circle" size={16} color={COLORS.textoPeligro} />
        <Text style={styles.textoRechazado}>Reporte Desestimado / Rechazado en Triaje</Text>
      </View>
    );
  }

  if (estado === 'CERRADO_INACCESIBLE') {
    return (
      <View style={styles.cajaInaccesible}>
        <MaterialCommunityIcons name="alert-circle-outline" size={16} color={COLORS.textoAdvertencia} />
        <Text style={styles.textoInaccesible}>Cerrado por Inaccesibilidad (3 intentos fallidos)</Text>
      </View>
    );
  }

  // 4 Etapas del ciclo de vida ciudadano
  const pasos = [
    { clave: 'RECIBIDO', etiqueta: 'Recibido' },
    { clave: 'VERIFICACION', etiqueta: 'Verificación' },
    { clave: 'SANEAMIENTO', etiqueta: 'Limpieza' },
    { clave: 'RESUELTO', etiqueta: 'Saneado' },
  ];

  const obtenerInfoEstado = () => {
    switch (estado) {
      case 'PENDIENTE':
        return { indice: 0, subtexto: 'En Revisión Inicial por el Municipio' };
      case 'APROBADO':
        return { indice: 1, subtexto: 'Aprobado en Triaje (En Bolsa de Casos)' };
      case 'EN_PROCESO':
      case 'EN_VERIFICACION':
        return { indice: 1, subtexto: 'Agente de Campo en Camino / Inspección' };
      case 'VERIFICADO_PENDIENTE':
        return { indice: 1, subtexto: 'Evidencia Verificada en Terreno' };
      case 'EN_SANEAMIENTO':
        return { indice: 2, subtexto: 'Cuadrilla Municipal en Saneamiento (+EcoPuntos)' };
      case 'RESUELTO_TECNICO':
        return { indice: 2, subtexto: 'Cierre Técnico Registrado (Por Certificar)' };
      case 'RESUELTO':
        return {
          indice: 3,
          subtexto: puntosOtorgados > 0
            ? `¡Saneado y Certificado! (+${puntosOtorgados} EcoPuntos acreditados)`
            : 'Saneado y Certificado por el Municipio',
        };
      default:
        return { indice: 0, subtexto: 'Estado: ' + estado };
    }
  };

  const { indice: indiceActual, subtexto } = obtenerInfoEstado();

  return (
    <View style={styles.contenedorPrincipal}>
      {/* Etiqueta descriptiva del estado actual */}
      <View style={styles.cajaEstadoActivo}>
        <MaterialCommunityIcons
          name={indiceActual === 3 ? 'check-decagram' : 'clock-outline'}
          size={14}
          color={indiceActual === 3 ? COLORS.textoVerdeOscuro : COLORS.textoSecundario}
        />
        <Text style={[styles.textoEstadoActivo, indiceActual === 3 && styles.textoEstadoResuelto]}>
          {subtexto}
        </Text>
      </View>

      {/* Barra de progreso de 4 pasos */}
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
                    name={completado ? 'check' : 'circle-small'}
                    size={completado ? 12 : 16}
                    color={completado ? COLORS.superficieTarjeta : COLORS.textoDesactivado}
                  />
                </View>
                <Text
                  style={[
                    styles.etiquetaPaso,
                    completado && styles.etiquetaCompletada,
                    esActual && styles.etiquetaActual,
                  ]}
                >
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
    </View>
  );
};

const styles = StyleSheet.create({
  contenedorPrincipal: {
    marginVertical: SPACING.xs,
  },
  cajaEstadoActivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.fondoAplicacion,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: 6,
  },
  textoEstadoActivo: {
    fontSize: 11,
    color: COLORS.textoSecundario,
    fontWeight: '600',
  },
  textoEstadoResuelto: {
    color: COLORS.textoVerdeOscuro,
    fontWeight: '700',
  },
  contenedorLinea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xs,
  },
  nodoContenedor: {
    alignItems: 'center',
    zIndex: 1,
  },
  circuloPaso: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
    backgroundColor: COLORS.botonPrincipal,
  },
  etiquetaPaso: {
    fontSize: 10,
    color: COLORS.textoSecundario,
    marginTop: 2,
    fontWeight: '500',
  },
  etiquetaCompletada: {
    color: COLORS.textoVerdeOscuro,
    fontWeight: '600',
  },
  etiquetaActual: {
    fontWeight: '700',
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
  cajaInaccesible: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.fondoAdvertencia,
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  textoInaccesible: {
    fontSize: 11,
    color: COLORS.textoAdvertencia,
    fontWeight: 'bold',
  },
});