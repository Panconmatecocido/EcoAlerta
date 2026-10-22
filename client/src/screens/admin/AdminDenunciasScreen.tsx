// src/screens/admin/AdminDenunciasScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../utils/theme';
import {
  adminService,
  AgenteCandidato,
  Denuncia,
  PrioridadDenuncia,
} from '../../services/adminService';

type FiltroEstado =
  | 'TODAS'
  | 'PENDIENTE'
  | 'APROBADO'
  | 'EN_VERIFICACION'
  | 'EN_SANEAMIENTO'
  | 'RECHAZADO';

export const AdminDenunciasScreen: React.FC = () => {
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [agentesCandidatos, setAgentesCandidatos] = useState<AgenteCandidato[]>([]);
  const [cargandoAgentes, setCargandoAgentes] = useState(false);
  const [errorAgentes, setErrorAgentes] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<FiltroEstado>('TODAS');
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Modal Asignación
  const [modalVisible, setModalVisible] = useState(false);
  const [denunciaSeleccionada, setDenunciaSeleccionada] = useState<Denuncia | null>(null);
  const [agenteSeleccionadoId, setAgenteSeleccionadoId] = useState<string | null>(null);
  const [enviandoAsignacion, setEnviandoAsignacion] = useState(false);
  const [reporteTriaje, setReporteTriaje] = useState<Denuncia | null>(null);
  const [prioridadTriaje, setPrioridadTriaje] = useState<PrioridadDenuncia>('MEDIA');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [enviandoTriaje, setEnviandoTriaje] = useState(false);

  const cargarDatos = useCallback(async () => {
    setErrorCarga(null);
    try {
      const filtroParam = filtro === 'TODAS' ? undefined : filtro;
      const dataDenuncias = await adminService.obtenerDenuncias({
        estado: filtroParam,
        busqueda,
      });
      setDenuncias(dataDenuncias);
    } catch (error) {
      setDenuncias([]);
      setErrorCarga(
        error instanceof Error
          ? error.message
          : 'No se pudieron obtener los reportes del servidor.'
      );
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [filtro, busqueda]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const alRefrescar = () => {
    setRefrescando(true);
    cargarDatos();
  };

  const reintentarCarga = () => {
    setCargando(true);
    cargarDatos();
  };

  const abrirModalTriaje = (denuncia: Denuncia) => {
    setReporteTriaje(denuncia);
    setPrioridadTriaje('MEDIA');
    setMotivoRechazo('');
  };

  const enviarTriaje = async (accion: 'APROBAR' | 'RECHAZAR') => {
    if (!reporteTriaje || enviandoTriaje) return;
    if (accion === 'RECHAZAR' && !motivoRechazo.trim()) {
      Alert.alert('Motivo requerido', 'Escribe una justificación para rechazar el reporte.');
      return;
    }
    setEnviandoTriaje(true);
    try {
      await adminService.triajeDenuncia(
        reporteTriaje.id,
        accion === 'APROBAR'
          ? { accion, prioridad: prioridadTriaje }
          : { accion, observacionesAdmin: motivoRechazo.trim() }
      );
      setReporteTriaje(null);
      await cargarDatos();
      Alert.alert('Triaje completado', accion === 'APROBAR' ? 'Reporte aprobado.' : 'Reporte rechazado.');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'No se pudo guardar el triaje.'
      );
      await cargarDatos();
    } finally {
      setEnviandoTriaje(false);
    }
  };

  const abrirModalAsignacion = async (denuncia: Denuncia) => {
    setDenunciaSeleccionada(denuncia);
    setAgentesCandidatos([]);
    setAgenteSeleccionadoId(null);
    setErrorAgentes(null);
    setCargandoAgentes(true);
    setModalVisible(true);
    try {
      const candidates = await adminService.obtenerAgentesCandidatos(denuncia.id);
      setAgentesCandidatos(candidates);
    } catch (error) {
      setErrorAgentes(
        error instanceof Error
          ? error.message
          : 'No se pudieron consultar agentes candidatos.'
      );
    } finally {
      setCargandoAgentes(false);
    }
  };

  const confirmarAsignacion = async () => {
    if (!denunciaSeleccionada || !agenteSeleccionadoId || enviandoAsignacion) return;
    setEnviandoAsignacion(true);
    try {
      const actualizada = await adminService.asignarAgenteDenuncia(
        denunciaSeleccionada.id,
        agenteSeleccionadoId
      );
      setDenuncias((previous) =>
        previous.map((report) => (report.id === actualizada.id ? actualizada : report))
      );
      setModalVisible(false);
      await cargarDatos();
      Alert.alert('Asignación completada', 'El reporte quedó reservado para verificación.');
    } catch (error) {
      Alert.alert(
        'No se pudo asignar',
        error instanceof Error ? error.message : 'El reporte o el agente ya no están disponibles.'
      );
      await cargarDatos();
      setModalVisible(false);
    } finally {
      setEnviandoAsignacion(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.contenedor}>
        <Text style={styles.tituloEncabezado}>Gestión de Denuncias</Text>

        {/* Buscador */}
        <View style={styles.contenedorBuscador}>
          <MaterialCommunityIcons name="magnify" size={ICON_SIZE.md} color={COLORS.textoSecundario} />
          <TextInput
            style={styles.inputBuscador}
            placeholder="Buscar por título o ubicación..."
            placeholderTextColor={COLORS.textoDesactivado}
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>

        {/* Filtros Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollChips}
          contentContainerStyle={styles.contenedorChips}
        >
          {(['TODAS', 'PENDIENTE', 'APROBADO', 'EN_VERIFICACION', 'EN_SANEAMIENTO', 'RECHAZADO'] as FiltroEstado[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, filtro === f && styles.chipActivo]}
              onPress={() => setFiltro(f)}
            >
              <Text style={[styles.textoChip, filtro === f && styles.textoChipActivo]}>
                {f.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Lista de Denuncias */}
        {cargando ? (
          <ActivityIndicator size="large" color={COLORS.botonPrincipal} style={{ marginTop: 40 }} />
        ) : errorCarga ? (
          <View style={styles.estadoError}>
            <Text style={styles.textoError}>{errorCarga}</Text>
            <TouchableOpacity style={styles.botonReintentar} onPress={reintentarCarga}>
              <Text style={styles.textoBotonReintentar}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={denuncias}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listaContenido}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refrescando} onRefresh={alRefrescar} colors={[COLORS.botonPrincipal]} />
            }
            ListEmptyComponent={
              <Text style={styles.textoVacio}>No hay reportes para los filtros seleccionados.</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.tarjetaDenuncia}>
                <View style={styles.cabeceraDenuncia}>
                  <View style={styles.identificacionReporte}>
                    <Text style={styles.codigoDenuncia}>{item.codigo}</Text>
                    <Text style={styles.tituloDenuncia}>{item.titulo}</Text>
                  </View>
                  <Text style={styles.fechaDenuncia}>{item.fecha}</Text>
                </View>

                <Text style={styles.detalleDenuncia}>
                  Estado: {item.estado.replace(/_/g, ' ')} · Prioridad: {item.prioridad}
                </Text>
                <Text style={styles.detalleDenuncia}>Categoría: {item.categoria}</Text>
                <Text style={styles.detalleDenuncia}>Dirección: {item.direccion}</Text>
                <Text style={styles.descripcionDenuncia}>{item.descripcion}</Text>
                {item.latitud !== null && item.longitud !== null && (
                  <Text style={styles.detalleDenuncia}>
                    Coordenadas: {item.latitud}, {item.longitud}
                  </Text>
                )}

                {item.agenteAsignadoNombre && (
                  <View style={styles.contenedorAgenteAsignado}>
                    <Text style={styles.textoAgenteAsignado}>
                      Inspector Asignado: <Text style={styles.nombreAgenteInsignia}>{item.agenteAsignadoNombre}</Text>
                    </Text>
                  </View>
                )}

                {item.estado === 'PENDIENTE' && (
                  <TouchableOpacity
                    style={[styles.botonAsignar, styles.botonTriaje]}
                    onPress={() => abrirModalTriaje(item)}
                  >
                    <MaterialCommunityIcons
                      name="clipboard-check-outline"
                      size={16}
                      color={COLORS.superficieTarjeta}
                    />
                    <Text style={styles.textoBotonAsignar}>Evaluar reporte</Text>
                  </TouchableOpacity>
                )}
                {item.estado === 'APROBADO' && !item.agenteAsignadoId && (
                  <TouchableOpacity
                    style={styles.botonAsignar}
                    onPress={() => abrirModalAsignacion(item)}
                  >
                    <MaterialCommunityIcons
                      name="account-plus-outline"
                      size={16}
                      color={COLORS.superficieTarjeta}
                    />
                    <Text style={styles.textoBotonAsignar}>Asignar agente cercano</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        )}

        {/* Modal Selección Agente */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => !enviandoAsignacion && setModalVisible(false)}
        >
          <View style={styles.superposicionModal}>
            <View style={styles.contenidoModal}>
              <Text style={styles.tituloModal}>Agentes cercanos al reporte</Text>
              <Text style={styles.subtituloModal}>
                Denuncia: {denunciaSeleccionada?.titulo}
              </Text>

              {cargandoAgentes ? (
                <ActivityIndicator color={COLORS.botonPrincipal} style={styles.cargaCandidatos} />
              ) : errorAgentes ? (
                <Text style={styles.errorCandidatos}>{errorAgentes}</Text>
              ) : agentesCandidatos.length === 0 ? (
                <Text style={styles.estadoSinCandidatos}>
                  No hay agentes disponibles con ubicación GPS actual para este reporte.
                </Text>
              ) : (
                <FlatList
                  data={agentesCandidatos}
                  keyExtractor={(agente) => agente.id}
                  renderItem={({ item }) => (
                    <View style={styles.itemAgenteModal}>
                      <View style={styles.detalleCandidato}>
                        <Text style={styles.nombreAgenteModal}>{item.nombre}</Text>
                        <Text style={styles.emailAgenteModal}>
                          {item.disponible ? 'Disponible' : 'No disponible'} · {item.casosActivos} casos activos
                        </Text>
                        <Text style={styles.emailAgenteModal}>
                          {(item.distanciaMetros / 1000).toFixed(2)} km · Ubicación actualizada{' '}
                          {new Date(item.ubicacionActualizadaEn).toLocaleString()}
                        </Text>
                      </View>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={`Seleccionar a ${item.nombre}`}
                        style={[
                          styles.botonSeleccionarAgente,
                          agenteSeleccionadoId === item.id && styles.botonAgenteSeleccionado,
                        ]}
                        onPress={() => setAgenteSeleccionadoId(item.id)}
                        disabled={enviandoAsignacion}
                      >
                        <Text
                          style={[
                            styles.textoSeleccionar,
                            agenteSeleccionadoId === item.id && styles.textoAgenteSeleccionado,
                          ]}
                        >
                          {agenteSeleccionadoId === item.id ? 'Seleccionado' : 'Seleccionar'}
                        </Text>
                      </TouchableOpacity>
                      </View>
                  )}
                />
              )}

              <View style={styles.accionesModal}>
                <TouchableOpacity
                  style={[styles.botonCerrarModal, enviandoAsignacion && styles.botonDeshabilitado]}
                  onPress={() => setModalVisible(false)}
                  disabled={enviandoAsignacion}
                >
                  <Text style={styles.textoBotonCerrarModal}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.botonConfirmarAsignacion,
                    (!agenteSeleccionadoId || enviandoAsignacion) && styles.botonDeshabilitado,
                  ]}
                  onPress={confirmarAsignacion}
                  disabled={!agenteSeleccionadoId || enviandoAsignacion}
                >
                  {enviandoAsignacion ? (
                    <ActivityIndicator color={COLORS.superficieTarjeta} />
                  ) : (
                    <Text style={styles.textoBotonCerrarModal}>Confirmar asignación</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="slide"
          transparent
          visible={reporteTriaje !== null}
          onRequestClose={() => !enviandoTriaje && setReporteTriaje(null)}
        >
          <View style={styles.superposicionModal}>
            <View style={styles.contenidoModal}>
              <ScrollView contentContainerStyle={styles.contenidoModalScrollable}>
                <Text style={styles.tituloModal}>Evaluar reporte</Text>
                <Text style={styles.subtituloModal}>{reporteTriaje?.titulo}</Text>
                <Text style={styles.etiquetaCampo}>Prioridad para aprobar</Text>
                <View style={styles.opcionesPrioridad}>
                  {(['BAJA', 'MEDIA', 'ALTA', 'URGENTE'] as PrioridadDenuncia[]).map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.opcionPrioridad,
                        prioridadTriaje === priority && styles.opcionPrioridadActiva,
                      ]}
                      onPress={() => setPrioridadTriaje(priority)}
                      disabled={enviandoTriaje}
                    >
                      <Text
                        style={[
                          styles.textoOpcionPrioridad,
                          prioridadTriaje === priority && styles.textoOpcionPrioridadActiva,
                        ]}
                      >
                        {priority}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.botonConfirmarAsignacion, enviandoTriaje && styles.botonDeshabilitado]}
                  onPress={() => enviarTriaje('APROBAR')}
                  disabled={enviandoTriaje}
                >
                  {enviandoTriaje ? (
                    <ActivityIndicator color={COLORS.superficieTarjeta} />
                  ) : (
                    <Text style={styles.textoBotonCerrarModal}>Aprobar reporte</Text>
                  )}
                </TouchableOpacity>

                <Text style={[styles.etiquetaCampo, styles.etiquetaMotivo]}>Motivo de rechazo</Text>
                <TextInput
                  style={styles.inputMotivo}
                  value={motivoRechazo}
                  onChangeText={setMotivoRechazo}
                  placeholder="Escribe la justificación"
                  placeholderTextColor={COLORS.textoDesactivado}
                  multiline
                  editable={!enviandoTriaje}
                />
                <TouchableOpacity
                  style={[
                    styles.botonRechazarTriaje,
                    (!motivoRechazo.trim() || enviandoTriaje) && styles.botonDeshabilitado,
                  ]}
                  onPress={() => enviarTriaje('RECHAZAR')}
                  disabled={!motivoRechazo.trim() || enviandoTriaje}
                >
                  <Text style={styles.textoBotonCerrarModal}>Rechazar reporte</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.botonCerrarModal}
                  onPress={() => setReporteTriaje(null)}
                  disabled={enviandoTriaje}
                >
                  <Text style={styles.textoBotonCerrarModal}>Cancelar</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  tituloEncabezado: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
    marginBottom: SPACING.md,
  },
  contenedorBuscador: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    marginBottom: SPACING.sm,
  },
  inputBuscador: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    fontSize: 14,
    color: COLORS.textoVerdeOscuro,
  },
  scrollChips: {
    flexGrow: 0,
    marginBottom: SPACING.md,
  },
  contenedorChips: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  chip: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: 8,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.superficieTarjeta,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  chipActivo: {
    backgroundColor: COLORS.botonPrincipal,
    borderColor: COLORS.botonPrincipal,
  },
  textoChip: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textoSecundario,
  },
  textoChipActivo: {
    color: COLORS.superficieTarjeta,
  },
  listaContenido: {
    paddingBottom: SPACING.lg * 2,
  },
  textoVacio: {
    textAlign: 'center',
    marginTop: 30,
    color: COLORS.textoSecundario,
    fontSize: 14,
  },
  estadoError: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: SPACING.lg,
  },
  textoError: {
    color: COLORS.textoPeligro,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  botonReintentar: {
    backgroundColor: COLORS.botonPrincipal,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  textoBotonReintentar: {
    color: COLORS.superficieTarjeta,
    fontWeight: 'bold',
  },
  tarjetaDenuncia: {
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  cabeceraDenuncia: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  identificacionReporte: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  codigoDenuncia: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textoVerde,
    marginBottom: SPACING.xs,
  },
  tituloDenuncia: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
    flex: 1,
  },
  fechaDenuncia: {
    fontSize: 12,
    color: COLORS.textoSecundario,
  },
  detalleDenuncia: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    marginBottom: SPACING.xs,
  },
  descripcionDenuncia: {
    fontSize: 13,
    color: COLORS.textoVerdeOscuro,
    marginBottom: SPACING.xs,
  },
  contenedorAgenteAsignado: {
    backgroundColor: COLORS.fondoTarjeta,
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  textoAgenteAsignado: {
    fontSize: 12,
    color: COLORS.textoVerdeOscuro,
  },
  nombreAgenteInsignia: {
    fontWeight: 'bold',
    color: COLORS.textoVerde,
  },
  accionesFila: {
    marginVertical: SPACING.xs,
  },
  botonAsignar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.camaraInferior,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  textoBotonAsignar: {
    color: COLORS.superficieTarjeta,
    fontSize: 11,
    fontWeight: 'bold',
  },
  botonTriaje: {
    marginTop: SPACING.xs,
    backgroundColor: COLORS.botonPrincipal,
  },
  superposicionModal: {
    flex: 1,
    backgroundColor: COLORS.superposicionOscura,
    justifyContent: 'center',
    padding: SPACING.md,
  },
  contenidoModal: {
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  contenidoModalScrollable: {
    flexGrow: 0,
  },
  tituloModal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  subtituloModal: {
    fontSize: 13,
    color: COLORS.textoSecundario,
    marginBottom: SPACING.md,
  },
  itemAgenteModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bordeSuave,
  },
  nombreAgenteModal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  emailAgenteModal: {
    fontSize: 12,
    color: COLORS.textoSecundario,
  },
  detalleCandidato: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  cargaCandidatos: {
    marginVertical: SPACING.lg,
  },
  errorCandidatos: {
    color: COLORS.textoPeligro,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  estadoSinCandidatos: {
    color: COLORS.textoSecundario,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  textoSeleccionar: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.botonPrincipal,
  },
  botonSeleccionarAgente: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.botonPrincipal,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  botonAgenteSeleccionado: {
    backgroundColor: COLORS.botonPrincipal,
  },
  textoAgenteSeleccionado: {
    color: COLORS.superficieTarjeta,
  },
  accionesModal: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  botonConfirmarAsignacion: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.botonPrincipal,
    borderRadius: BORDER_RADIUS.sm,
    minHeight: 44,
  },
  botonDeshabilitado: {
    opacity: 0.55,
  },
  etiquetaCampo: {
    color: COLORS.textoVerdeOscuro,
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  opcionesPrioridad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  opcionPrioridad: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  opcionPrioridadActiva: {
    backgroundColor: COLORS.botonPrincipal,
    borderColor: COLORS.botonPrincipal,
  },
  textoOpcionPrioridad: {
    color: COLORS.textoSecundario,
    fontSize: 11,
    fontWeight: 'bold',
  },
  textoOpcionPrioridadActiva: {
    color: COLORS.superficieTarjeta,
  },
  etiquetaMotivo: {
    marginTop: SPACING.md,
  },
  inputMotivo: {
    minHeight: 76,
    maxHeight: 140,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    color: COLORS.textoVerdeOscuro,
    textAlignVertical: 'top',
  },
  botonRechazarTriaje: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.textoPeligro,
    borderRadius: BORDER_RADIUS.sm,
    minHeight: 44,
  },
  botonCerrarModal: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    backgroundColor: COLORS.fondoAplicacion,
    borderRadius: BORDER_RADIUS.sm,
  },
  textoBotonCerrarModal: {
    color: COLORS.textoSecundario,
    fontWeight: 'bold',
  },
});