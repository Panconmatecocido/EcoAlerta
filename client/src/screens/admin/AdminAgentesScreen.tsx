// src/screens/admin/AdminAgentesScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../utils/theme';
import { adminService, Agente } from '../../services/adminService';
import { TransactionLoaderModal } from '../../components/common/TransactionLoaderModal';
import Header from '../../components/Header';

export const AdminAgenteScreen: React.FC = () => {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [refrescando, setRefrescando] = useState<boolean>(false);

  // RNF-10: Bloqueo transaccional con spinner durante escrituras a DB
  const [transaccionEnCurso, setTransaccionEnCurso] = useState<boolean>(false);
  const [mensajeTransaccion, setMensajeTransaccion] = useState<string>('Actualizando en base de datos...');

  const cargarAgentes = useCallback(async () => {
    try {
      const data = await adminService.obtenerAgentes();
      setAgentes(data);
    } catch {
      // Fallback local para operación sin red
      setAgentes([
        {
          id: 'agent-user-1',
          nombre: 'Inspector Perez',
          email: 'agente@municipio.gob.ar',
          disponible: true,
          casosAsignados: 1,
          casoActivoId: 'insp-001',
          casoActivoCodigo: 'REP-2026-891',
          casoActivoTitulo: 'Foco de Dengue y Agua Estancada',
          casoActivoEstado: 'EN_VERIFICACION',
        },
        {
          id: 'agent-user-2',
          nombre: 'Inspectora Gómez',
          email: 'gomez@municipio.gob.ar',
          disponible: true,
          casosAsignados: 0,
        },
      ]);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    cargarAgentes();
  }, [cargarAgentes]);

  useEffect(() => {
    const intervalo = setInterval(() => {
      void cargarAgentes();
    }, 10000);

    return () => clearInterval(intervalo);
  }, [cargarAgentes]);

  const alRefrescar = () => {
    setRefrescando(true);
    cargarAgentes();
  };

  const alternarDisponibilidad = async (id: string, estadoActual: boolean) => {
    if (transaccionEnCurso) return;

    const nuevoEstado = !estadoActual;
    setMensajeTransaccion('Actualizando disponibilidad del inspector...');
    setTransaccionEnCurso(true);

    try {
      await adminService.alternarDisponibilidadAgente(id, nuevoEstado);
      setAgentes((prev) =>
        prev.map((a) => (a.id === id ? { ...a, disponible: nuevoEstado } : a))
      );
      setTransaccionEnCurso(false);
    } catch (error: any) {
      setTransaccionEnCurso(false);
      Alert.alert(
        'Error al actualizar disponibilidad',
        `${error?.message || 'No se pudo guardar el cambio en la base de datos.'}\n\nPor favor, intenta nuevamente.`
      );
    }
  };

  // T013: Liberar / Desasignar caso activo de un agente hacia la bolsa general con Spinner (RNF-10)
  const liberarCasoDeInspector = (agente: Agente) => {
    if (!agente.casoActivoId || transaccionEnCurso) return;

    Alert.alert(
      'Liberar Caso Activo a la Bolsa',
      `¿Deseas desasignar el caso ${agente.casoActivoCodigo || ''} de ${agente.nombre}?\n\nEl caso regresará a la bolsa general conservando su etapa actual.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desasignar y Liberar',
          style: 'destructive',
          onPress: async () => {
            setMensajeTransaccion(`Liberando caso de ${agente.nombre} hacia la bolsa general...`);
            setTransaccionEnCurso(true);
            try {
              await adminService.liberarCasoAgente(
                agente.casoActivoId!,
                `Desasignado desde panel de personal (${agente.nombre})`
              );
              setAgentes((prev) =>
                prev.map((a) =>
                  a.id === agente.id
                    ? {
                        ...a,
                        casosAsignados: 0,
                        casoActivoId: undefined,
                        casoActivoCodigo: undefined,
                        casoActivoTitulo: undefined,
                        casoActivoEstado: undefined,
                      }
                    : a
                )
              );
              setTransaccionEnCurso(false);
              Alert.alert(
                'Caso Liberado',
                `El inspector ${agente.nombre} quedó sin casos activos y el reporte volvió a la bolsa general.`
              );
            } catch (error: any) {
              setTransaccionEnCurso(false);
              Alert.alert(
                'Error al liberar el caso',
                `${error?.message || 'No se pudo completar la operación en la base de datos.'}\n\nPor favor, vuelve a intentarlo.`
              );
            }
          },
        },
      ]
    );
  };

  const nuevoAgente = () => {
    Alert.alert(
      'Nuevo Inspector',
      'Función para dar de alta un nuevo inspector municipal en el sistema.'
    );
  };

  // Acordeón/Desplegable para inspeccionar la ubicación del agente
  const [agenteExpandidoId, setAgenteExpandidoId] = useState<string | null>(null);

  const toggleExpandirUbicacion = (id: string) => {
    setAgenteExpandidoId((prev) => (prev === id ? null : id));
  };

  const abrirEnGoogleMaps = async (latitud?: number | null, longitud?: number | null, nombre?: string) => {
    if (typeof latitud !== 'number' || typeof longitud !== 'number') {
      Alert.alert(
        'Ubicación no disponible',
        `El inspector ${nombre || ''} no tiene coordenadas GPS registradas en este momento.`
      );
      return;
    }

    const url = `https://www.google.com/maps/search/?api=1&query=${latitud},${longitud}`;
    try {
      const soportado = await Linking.canOpenURL(url);
      if (soportado) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Coordenadas GPS', `Lat: ${latitud}, Long: ${longitud}`);
      }
    } catch {
      Alert.alert('Coordenadas GPS', `Lat: ${latitud}, Long: ${longitud}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <Header showActions={false} />
      <TransactionLoaderModal
        visible={transaccionEnCurso}
        mensaje={mensajeTransaccion}
        submensaje="Por favor espera a que finalice la transacción"
      />
      <View style={styles.contenedor}>
        <View style={styles.encabezado}>
          <Text style={styles.tituloEncabezado}>Personal de Campo</Text>
          <TouchableOpacity style={styles.botonAgregar} onPress={nuevoAgente}>
            <MaterialCommunityIcons
              name="account-plus"
              size={ICON_SIZE.sm}
              color={COLORS.superficieTarjeta}
            />
            <Text style={styles.textoBotonAgregar}>Nuevo</Text>
          </TouchableOpacity>
        </View>

        {cargando ? (
          <ActivityIndicator
            size="large"
            color={COLORS.botonPrincipal}
            style={{ marginTop: 40 }}
          />
        ) : (
          <FlatList
            data={agentes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.lista}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refrescando}
                onRefresh={alRefrescar}
                colors={[COLORS.botonPrincipal]}
              />
            }
            renderItem={({ item }) => (
              <View style={styles.tarjetaAgente}>
                <View style={styles.infoAgente}>
                  <MaterialCommunityIcons
                    name="account-hard-hat"
                    size={ICON_SIZE.xl}
                    color={item.disponible ? COLORS.botonPrincipal : COLORS.textoDesactivado}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nombreAgente}>{item.nombre}</Text>
                    <Text style={styles.emailAgente}>{item.email}</Text>
                    <Text style={styles.casosAgente}>
                      Casos activos (máx. 1): {item.casosAsignados}
                    </Text>
                  </View>
                </View>

                {item.casoActivoId ? (
                  <View style={styles.cajaCasoActivo}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tituloCasoActivo}>
                        En curso: {item.casoActivoCodigo || 'Caso asignado'} (
                        {item.casoActivoEstado || 'EN_VERIFICACION'})
                      </Text>
                      {item.casoActivoTitulo ? (
                        <Text style={styles.subtituloCasoActivo}>{item.casoActivoTitulo}</Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      style={styles.botonLiberarCaso}
                      onPress={() => liberarCasoDeInspector(item)}
                    >
                      <MaterialCommunityIcons
                        name="briefcase-remove-outline"
                        size={14}
                        color={COLORS.textoPeligro}
                      />
                      <Text style={styles.textoLiberarCaso}>Liberar Caso</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* Fila de Acciones: Botón de Ubicación Desplegable y Alternar Disponibilidad */}
                <View style={styles.filaAcciones}>
                  {item.disponible ? (
                    <TouchableOpacity
                      style={styles.botonDesplegableUbicacion}
                      onPress={() => toggleExpandirUbicacion(item.id)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name="crosshairs-gps"
                        size={15}
                        color={COLORS.botonPrincipal}
                      />
                      <Text style={styles.textoBotonUbicacion}>
                        {agenteExpandidoId === item.id ? 'Ocultar GPS' : 'Ver Ubicación'}
                      </Text>
                      <MaterialCommunityIcons
                        name={agenteExpandidoId === item.id ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={COLORS.botonPrincipal}
                      />
                    </TouchableOpacity>
                  ) : <View style={{ flex: 1 }} />}

                  <TouchableOpacity
                    style={[
                      styles.botonEstado,
                      {
                        backgroundColor: item.disponible && item.casosAsignados > 0
                          ? COLORS.fondoAdvertencia
                          : item.disponible
                            ? COLORS.fondoTarjeta
                            : COLORS.fondoPeligro,
                      },
                    ]}
                    onPress={() => alternarDisponibilidad(item.id, item.disponible)}
                  >
                    <Text
                      style={[
                        styles.textoEstado,
                        {
                          color: item.disponible && item.casosAsignados > 0
                            ? COLORS.textoAdvertencia
                            : item.disponible
                              ? COLORS.textoVerdeOscuro
                              : COLORS.textoPeligro,
                        },
                      ]}
                    >
                    {item.disponible
                      ? item.casosAsignados > 0
                        ? 'Conectado · Ocupado'
                        : 'Conectado · Disponible'
                      : 'Fuera de servicio'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Desplegable de Ubicación en Tiempo Real con Botón Google Maps */}
                {item.disponible && agenteExpandidoId === item.id ? (
                  <View style={styles.panelDesplegableUbicacion}>
                    <View style={styles.cabeceraPanelUbicacion}>
                      <MaterialCommunityIcons name="map-marker-radius" size={18} color={COLORS.botonPrincipal} />
                      <Text style={styles.tituloPanelUbicacion}>Posición Satelital del Agente</Text>
                    </View>

                    {typeof item.latitudActual === 'number' && typeof item.longitudActual === 'number' ? (
                      <View style={styles.cuerpoPanelUbicacion}>
                        <View style={styles.filaCoordenadas}>
                          <Text style={styles.etiquetaCoord}>Latitud:</Text>
                          <Text style={styles.valorCoord}>{item.latitudActual.toFixed(5)}</Text>
                        </View>
                        <View style={styles.filaCoordenadas}>
                          <Text style={styles.etiquetaCoord}>Longitud:</Text>
                          <Text style={styles.valorCoord}>{item.longitudActual.toFixed(5)}</Text>
                        </View>
                        {item.ubicacionActualizadaEn ? (
                          <Text style={styles.textoHoraUbicacion}>
                            Actualizado: {new Date(item.ubicacionActualizadaEn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
                          </Text>
                        ) : null}

                        <TouchableOpacity
                          style={styles.botonGoogleMaps}
                          onPress={() => abrirEnGoogleMaps(item.latitudActual, item.longitudActual, item.nombre)}
                          activeOpacity={0.8}
                        >
                          <MaterialCommunityIcons name="google-maps" size={18} color={COLORS.superficieTarjeta} />
                          <Text style={styles.textoBotonGoogleMaps}>Abrir en Google Maps</Text>
                          <MaterialCommunityIcons name="open-in-new" size={15} color={COLORS.superficieTarjeta} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.sinCoordenadasContainer}>
                        <MaterialCommunityIcons name="map-marker-off" size={24} color={COLORS.textoDesactivado} />
                        <Text style={styles.textoSinCoordenadas}>
                          El agente está en servicio pero aún no transmitió telemetría GPS o está en modo base.
                        </Text>
                        <TouchableOpacity
                          style={[styles.botonGoogleMaps, { backgroundColor: COLORS.fondoEncabezado, marginTop: 8 }]}
                          onPress={() => abrirEnGoogleMaps(-34.4586, -58.9142, item.nombre)}
                        >
                          <MaterialCommunityIcons name="map-search-outline" size={16} color={COLORS.botonPrincipal} />
                          <Text style={[styles.textoBotonGoogleMaps, { color: COLORS.botonPrincipal }]}>
                            Buscar Municipio en Maps
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ) : null}
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.fondoAplicacion,
  },
  contenedor: {
    flex: 1,
    padding: SPACING.md,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  tituloEncabezado: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  botonAgregar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.botonPrincipal,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  textoBotonAgregar: {
    color: COLORS.superficieTarjeta,
    fontSize: 12,
    fontWeight: 'bold',
  },
  lista: {
    paddingBottom: SPACING.lg * 2,
  },
  tarjetaAgente: {
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  infoAgente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  nombreAgente: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  emailAgente: {
    fontSize: 12,
    color: COLORS.textoSecundario,
  },
  casosAgente: {
    fontSize: 11,
    color: COLORS.textoVerde,
    fontWeight: '600',
    marginTop: 2,
  },
  cajaCasoActivo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.fondoAplicacion,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  tituloCasoActivo: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },
  subtituloCasoActivo: {
    fontSize: 11,
    color: COLORS.textoSecundario,
    marginTop: 2,
  },
  botonLiberarCaso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.fondoPeligro,
    borderWidth: 1,
    borderColor: COLORS.bordePeligro,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.sm,
  },
  textoLiberarCaso: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textoPeligro,
  },
  filaAcciones: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  botonDesplegableUbicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.fondoTarjeta,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  textoBotonUbicacion: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.botonPrincipal,
  },
  accionesAgente: {
    alignItems: 'flex-end',
  },
  botonEstado: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  textoEstado: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  panelDesplegableUbicacion: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.fondoAplicacion,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
  },
  cabeceraPanelUbicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.xs,
  },
  tituloPanelUbicacion: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },
  cuerpoPanelUbicacion: {
    marginTop: 2,
  },
  filaCoordenadas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  etiquetaCoord: {
    fontSize: 11,
    color: COLORS.textoSecundario,
  },
  valorCoord: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textoVerdeOscuro,
    fontFamily: 'monospace',
  },
  textoHoraUbicacion: {
    fontSize: 10,
    color: COLORS.textoSecundario,
    marginTop: 4,
    fontStyle: 'italic',
  },
  botonGoogleMaps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.botonPrincipal,
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
  },
  textoBotonGoogleMaps: {
    color: COLORS.superficieTarjeta,
    fontSize: 12,
    fontWeight: 'bold',
  },
  sinCoordenadasContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  textoSinCoordenadas: {
    fontSize: 11,
    color: COLORS.textoSecundario,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
});