import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  Alert,
  Modal,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../utils/theme';
import { MOCK_DENUNCIAS_AGENTE, DenunciaAgenteMock } from '../../mocks/denunciasAgente';
import { adminService } from '../../services/adminService';

export const AgentHomeScreen: React.FC = () => {
  const { user: usuario, logout: cerrarSesion } = useAuth();
  const [enServicio, setEnServicio] = useState<boolean>(false);
  const [actualizandoUbicacion, setActualizandoUbicacion] = useState(false);
  const [listaInspecciones, setListaInspecciones] = useState<DenunciaAgenteMock[]>(MOCK_DENUNCIAS_AGENTE);
  const [inspeccionSeleccionada, setInspeccionSeleccionada] = useState<DenunciaAgenteMock | null>(null);

  const solicitarUbicacionActual = async (): Promise<Location.LocationObject | null> => {
    const permiso = await Location.requestForegroundPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert(
        'Permiso de ubicación requerido',
        'Para compartir disponibilidad geográfica, habilita la ubicación en primer plano y vuelve a intentarlo.',
        [
          { text: 'Ahora no', style: 'cancel' },
          {
            text: 'Abrir ajustes',
            onPress: () => {
              void Linking.openSettings().catch(() => {
                Alert.alert('No se pudieron abrir los ajustes', 'Activa el permiso de ubicación desde los ajustes del dispositivo.');
              });
            },
          },
        ]
      );
      return null;
    }

    return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  };

  const alternarServicio = async (disponible: boolean) => {
    if (actualizandoUbicacion) return;
    setActualizandoUbicacion(true);
    try {
      if (!disponible) {
        await adminService.actualizarDisponibilidadPropia(false);
        setEnServicio(false);
        return;
      }

      const posicion = await solicitarUbicacionActual();
      if (!posicion) return;
      await adminService.actualizarDisponibilidadPropia(true, {
        latitud: posicion.coords.latitude,
        longitud: posicion.coords.longitude,
      });
      setEnServicio(true);
    } catch (error) {
      Alert.alert(
        'No se pudo actualizar la disponibilidad',
        error instanceof Error ? error.message : 'Comprueba la conexión e inténtalo nuevamente.'
      );
    } finally {
      setActualizandoUbicacion(false);
    }
  };

  const actualizarUbicacion = async () => {
    if (actualizandoUbicacion || !enServicio) return;
    setActualizandoUbicacion(true);
    try {
      const posicion = await solicitarUbicacionActual();
      if (!posicion) return;
      await adminService.actualizarUbicacionPropia(
        posicion.coords.latitude,
        posicion.coords.longitude
      );
      Alert.alert('Ubicación actualizada', 'Se compartió tu posición más reciente.');
    } catch (error) {
      Alert.alert(
        'No se pudo actualizar la ubicación',
        error instanceof Error ? error.message : 'Comprueba la conexión e inténtalo nuevamente.'
      );
    } finally {
      setActualizandoUbicacion(false);
    }
  };

  const obtenerColorPrioridad = (prioridad: DenunciaAgenteMock['prioridad']) => {
    switch (prioridad) {
      case 'ALTA':
        return { texto: COLORS.textoPeligro, fondo: COLORS.fondoPeligro };
      case 'MEDIA':
        return { texto: COLORS.textoAdvertencia, fondo: COLORS.fondoAdvertencia };
      case 'BAJA':
        return { texto: COLORS.textoVerde, fondo: COLORS.fondoTarjeta };
    }
  };

  const resolverDenuncia = (id: string) => {
    setListaInspecciones((prev) =>
      prev.map((item) => (item.id === id ? { ...item, estado: 'RESUELTO' } : item))
    );
    setInspeccionSeleccionada(null);
    Alert.alert('Inspección Completada', 'El reporte ha sido marcado como resuelto e informado al centro de control.');
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar backgroundColor={COLORS.fondoEncabezado} barStyle="dark-content" />
      <ScrollView contentContainerStyle={estilos.contenidoScroll}>
        
        {/* Cabecera del Inspector */}
        <View style={estilos.cabecera}>
          <View style={estilos.filaCabecera}>
            <View>
              <Text style={estilos.etiquetaRol}>AGENTE DE CAMPO</Text>
              <Text style={estilos.nombreAgente}>{usuario?.name || 'Inspector Municipal'}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                void cerrarSesion('login').catch((error: unknown) => {
                  Alert.alert(
                    'No se pudo cerrar sesión',
                    error instanceof Error ? error.message : 'Inténtalo nuevamente.'
                  );
                });
              }}
              style={estilos.botonSalir}
            >
              <Ionicons name="log-out-outline" size={ICON_SIZE.md} color={COLORS.textoPeligro} />
            </TouchableOpacity>
          </View>

          {/* Switch de Disponibilidad */}
          <View style={estilos.tarjetaEstado}>
            <View style={estilos.infoEstado}>
              <View
                style={[
                  estilos.indicadorPunto,
                  { backgroundColor: enServicio ? COLORS.botonPrincipal : COLORS.textoDesactivado },
                ]}
              />
              <Text style={estilos.textoEstado}>
                {enServicio ? 'En Servicio - Recibiendo Asignaciones' : 'Fuera de Servicio'}
              </Text>
            </View>
            <Switch
              value={enServicio}
              onValueChange={alternarServicio}
              disabled={actualizandoUbicacion}
              trackColor={{ false: COLORS.bordeSuave, true: COLORS.fondoEncabezado }}
              thumbColor={enServicio ? COLORS.botonPrincipal : COLORS.textoDesactivado}
            />
          </View>
          {actualizandoUbicacion ? (
            <ActivityIndicator color={COLORS.botonPrincipal} style={estilos.estadoUbicacion} />
          ) : enServicio ? (
            <TouchableOpacity style={estilos.botonActualizarUbicacion} onPress={actualizarUbicacion}>
              <Ionicons name="navigate-outline" size={ICON_SIZE.sm} color={COLORS.botonPrincipal} />
              <Text style={estilos.textoActualizarUbicacion}>Actualizar ubicación actual</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Mapa Simulado / Radar de Cobertura */}
        <View style={estilos.contenedorMapaSimulado}>
          <MaterialCommunityIcons name="map-marker-radius" size={ICON_SIZE.xl} color={COLORS.iconoPrincipal} />
          <Text style={estilos.textoMapa}>
            {enServicio ? 'Disponibilidad GPS activa' : 'Ubicación no compartida'}
          </Text>
          <Text style={estilos.subtextoMapa}>
            {enServicio
              ? 'Comparte solo tu ubicación actual mientras estés disponible'
              : 'Activa el servicio para compartir tu ubicación actual'}
          </Text>
        </View>

        {/* Lista de Trabajo */}
        <View style={estilos.seccionTrabajo}>
          <Text style={estilos.tituloSeccion}>ORDENES DE INSPECCIÓN ASIGNADAS</Text>

          {listaInspecciones.map((item) => {
            const colorPrioridad = obtenerColorPrioridad(item.prioridad);
            const esResuelto = item.estado === 'RESUELTO';

            return (
              <View
                key={item.id}
                style={[estilos.tarjetaOrden, esResuelto && estilos.tarjetaOrdenResuelta]}
              >
                <View style={estilos.encabezadoOrden}>
                  <Text style={estilos.codigoOrden}>{item.codigo}</Text>
                  <View style={[estilos.placaPrioridad, { backgroundColor: colorPrioridad.fondo }]}>
                    <Text style={[estilos.textoPlaca, { color: colorPrioridad.texto }]}>
                      {item.prioridad}
                    </Text>
                  </View>
                </View>

                <Text style={estilos.tituloOrden}>{item.titulo}</Text>
                <Text style={estilos.direccionOrden}>
                  <Ionicons name="location-outline" size={ICON_SIZE.sm} color={COLORS.textoSecundario} />{' '}
                  {item.direccion} ({item.distanciaKm} km)
                </Text>

                <View style={estilos.pieOrden}>
                  <Text style={estilos.tiempoOrden}>{item.fechaAsignacion}</Text>
                  
                  {esResuelto ? (
                    <Text style={estilos.textoCompletado}>✓ Completado</Text>
                  ) : (
                    <TouchableOpacity
                      style={estilos.botonInspeccionar}
                      onPress={() => setInspeccionSeleccionada(item)}
                    >
                      <Text style={estilos.textoBotonInspeccionar}>Atender</Text>
                      <Feather name="arrow-right" size={ICON_SIZE.sm} color={COLORS.blanco} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

      </ScrollView>

      {/* Modal de Resolución de Inspección */}
      <Modal
        visible={!!inspeccionSeleccionada}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setInspeccionSeleccionada(null)}
      >
        <View style={estilos.fondoModal}>
          <View style={estilos.contenidoModal}>
            <Text style={estilos.tituloModal}>Inspección de Campo</Text>
            <Text style={estilos.subtituloModal}>{inspeccionSeleccionada?.codigo}</Text>

            <Text style={estilos.descripcionModal}>{inspeccionSeleccionada?.descripcion}</Text>

            <TouchableOpacity style={estilos.botonTomarEvidencia}>
              <Ionicons name="camera" size={ICON_SIZE.lg} color={COLORS.iconoPrincipal} />
              <Text style={estilos.textoTomarEvidencia}>Tomar Foto de Acta / Evidencia</Text>
            </TouchableOpacity>

            <View style={estilos.accionesModal}>
              <TouchableOpacity
                style={estilos.botonCancelarModal}
                onPress={() => setInspeccionSeleccionada(null)}
              >
                <Text style={estilos.textoCancelarModal}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={estilos.botonCompletarModal}
                onPress={() => inspeccionSeleccionada && resolverDenuncia(inspeccionSeleccionada.id)}
              >
                <Text style={estilos.textoCompletarModal}>Marcar Resuelto</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORS.fondoAplicacion,
  },
  contenidoScroll: {
    paddingBottom: SPACING.lg,
  },
  cabecera: {
    backgroundColor: COLORS.fondoEncabezado,
    padding: SPACING.md,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
  },
  filaCabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  etiquetaRol: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textoVerde,
    letterSpacing: 0.8,
  },
  nombreAgente: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },
  botonSalir: {
    padding: SPACING.xs,
    backgroundColor: COLORS.fondoPeligro,
    borderRadius: BORDER_RADIUS.sm,
  },
  tarjetaEstado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.superficieTarjeta,
    padding: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.md,
  },
  infoEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  indicadorPunto: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
  textoEstado: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textoVerdeOscuro,
  },
  estadoUbicacion: {
    marginTop: SPACING.sm,
  },
  botonActualizarUbicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.fondoTarjeta,
  },
  textoActualizarUbicacion: {
    color: COLORS.botonPrincipal,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  contenedorMapaSimulado: {
    backgroundColor: COLORS.superficieTarjeta,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  textoMapa: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
    marginTop: SPACING.xs,
  },
  subtextoMapa: {
    fontSize: 12,
    color: COLORS.textoSecundario,
  },
  seccionTrabajo: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  tituloSeccion: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textoVerde,
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  tarjetaOrden: {
    backgroundColor: COLORS.superficieTarjeta,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  tarjetaOrdenResuelta: {
    opacity: 0.6,
    backgroundColor: COLORS.fondoTarjeta,
  },
  encabezadoOrden: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codigoOrden: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textoSecundario,
  },
  placaPrioridad: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  textoPlaca: {
    fontSize: 10,
    fontWeight: '700',
  },
  tituloOrden: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
    marginTop: SPACING.xs,
  },
  direccionOrden: {
    fontSize: 13,
    color: COLORS.textoSecundario,
    marginTop: 4,
  },
  pieOrden: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.bordeSuave,
  },
  tiempoOrden: {
    fontSize: 12,
    color: COLORS.textoDesactivado,
  },
  botonInspeccionar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.botonPrincipal,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  textoBotonInspeccionar: {
    color: COLORS.blanco,
    fontSize: 12,
    fontWeight: '700',
    marginRight: SPACING.xs,
  },
  textoCompletado: {
    color: COLORS.textoVerde,
    fontWeight: '700',
    fontSize: 13,
  },
  fondoModal: {
    flex: 1,
    backgroundColor: COLORS.superposicionOscura,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  contenidoModal: {
    width: '100%',
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  tituloModal: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },
  subtituloModal: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    marginBottom: SPACING.md,
  },
  descripcionModal: {
    fontSize: 14,
    color: COLORS.textoVerdeOscuro,
    marginBottom: SPACING.lg,
  },
  botonTomarEvidencia: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.fondoTarjeta,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.iconoPrincipal,
    marginBottom: SPACING.lg,
  },
  textoTomarEvidencia: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.iconoPrincipal,
    marginLeft: SPACING.sm,
  },
  accionesModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  botonCancelarModal: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md - 2,
    marginRight: SPACING.sm,
  },
  textoCancelarModal: {
    color: COLORS.textoSecundario,
    fontWeight: '600',
  },
  botonCompletarModal: {
    flex: 2,
    backgroundColor: COLORS.botonPrincipal,
    alignItems: 'center',
    paddingVertical: SPACING.md - 2,
    borderRadius: BORDER_RADIUS.md,
  },
  textoCompletarModal: {
    color: COLORS.blanco,
    fontWeight: '700',
  },
});