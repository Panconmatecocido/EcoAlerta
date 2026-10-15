// src/screens/admin/AdminDenunciasScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../utils/theme';
import { adminService, Denuncia, Agente } from '../../services/adminService';

type FiltroEstado = 'TODAS' | 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO' | 'RECHAZADO';

export const AdminDenunciasScreen: React.FC = () => {
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<FiltroEstado>('TODAS');
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  // Modal Asignación
  const [modalVisible, setModalVisible] = useState(false);
  const [denunciaSeleccionada, setDenunciaSeleccionada] = useState<Denuncia | null>(null);

  const cargarDatos = useCallback(async () => {
    try {
      const filtroParam = filtro === 'TODAS' ? undefined : filtro;
      const [dataDenuncias, dataAgentes] = await Promise.all([
        adminService.obtenerDenuncias({ estado: filtroParam, busqueda }),
        adminService.obtenerAgentes(),
      ]);
      setDenuncias(dataDenuncias);
      setAgentes(dataAgentes);
    } catch (error) {
      console.error('Error cargando denuncias/agentes:', error);
      Alert.alert('Error', 'No se pudieron obtener los datos del servidor.');
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

  const cambiarEstado = async (id: string, nuevoEstado: Denuncia['estado']) => {
    try {
      await adminService.actualizarEstadoDenuncia(id, nuevoEstado);
      setDenuncias((prev) =>
        prev.map((item) => (item.id === id ? { ...item, estado: nuevoEstado } : item))
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado de la denuncia.');
    }
  };

  const abrirModalAsignacion = (denuncia: Denuncia) => {
    setDenunciaSeleccionada(denuncia);
    setModalVisible(true);
  };

  const asignarAgente = async (agente: Agente) => {
    if (!denunciaSeleccionada) return;

    try {
      await adminService.asignarAgenteDenuncia(denunciaSeleccionada.id, agente.id);
      
      setDenuncias((prev) =>
        prev.map((item) =>
          item.id === denunciaSeleccionada.id
            ? {
                ...item,
                agenteAsignadoId: agente.id,
                agenteAsignadoNombre: agente.nombre,
                estado: item.estado === 'PENDIENTE' ? 'EN_PROCESO' : item.estado,
              }
            : item
        )
      );

      setModalVisible(false);
      Alert.alert('Asignación Exitosa', `Agente ${agente.nombre} asignado a la denuncia.`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo asignar el agente a la denuncia.');
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
        <View style={styles.contenedorChips}>
          {(['TODAS', 'PENDIENTE', 'EN_PROCESO', 'RESUELTO', 'RECHAZADO'] as FiltroEstado[]).map((f) => (
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
        </View>

        {/* Lista de Denuncias */}
        {cargando ? (
          <ActivityIndicator size="large" color={COLORS.botonPrincipal} style={{ marginTop: 40 }} />
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
              <Text style={styles.textoVacio}>No se encontraron denuncias para los filtros seleccionados.</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.tarjetaDenuncia}>
                <View style={styles.cabeceraDenuncia}>
                  <Text style={styles.tituloDenuncia}>{item.titulo}</Text>
                  <Text style={styles.fechaDenuncia}>{item.fecha}</Text>
                </View>

                <Text style={styles.detalleDenuncia}>
                  Categoría: {item.categoria} | Ubicación: {item.ubicacion}
                </Text>

                {item.agenteAsignadoNombre && (
                  <View style={styles.contenedorAgenteAsignado}>
                    <Text style={styles.textoAgenteAsignado}>
                      Inspector Asignado: <Text style={styles.nombreAgenteInsignia}>{item.agenteAsignadoNombre}</Text>
                    </Text>
                  </View>
                )}

                <View style={styles.accionesFila}>
                  <TouchableOpacity
                    style={styles.botonAsignar}
                    onPress={() => abrirModalAsignacion(item)}
                  >
                    <MaterialCommunityIcons name="account-plus-outline" size={16} color={COLORS.superficieTarjeta} />
                    <Text style={styles.textoBotonAsignar}>
                      {item.agenteAsignadoNombre ? 'Reasignar' : 'Asignar Inspector'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Acciones de Cambio de Estado */}
                <View style={styles.contenedorBotonesEstado}>
                  <TouchableOpacity
                    style={[styles.botonEstado, item.estado === 'PENDIENTE' && styles.botonEstadoActivo]}
                    onPress={() => cambiarEstado(item.id, 'PENDIENTE')}
                  >
                    <Text style={[styles.textoBotonEstado, item.estado === 'PENDIENTE' && styles.textoBotonEstadoActivo]}>
                      Pendiente
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.botonEstado, item.estado === 'EN_PROCESO' && styles.botonEstadoActivo]}
                    onPress={() => cambiarEstado(item.id, 'EN_PROCESO')}
                  >
                    <Text style={[styles.textoBotonEstado, item.estado === 'EN_PROCESO' && styles.textoBotonEstadoActivo]}>
                      En Proceso
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.botonEstado, item.estado === 'RESUELTO' && styles.botonEstadoActivo]}
                    onPress={() => cambiarEstado(item.id, 'RESUELTO')}
                  >
                    <Text style={[styles.textoBotonEstado, item.estado === 'RESUELTO' && styles.textoBotonEstadoActivo]}>
                      Resolver
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.botonEstado, item.estado === 'RECHAZADO' && styles.botonPeligroActivo]}
                    onPress={() => cambiarEstado(item.id, 'RECHAZADO')}
                  >
                    <Text style={[styles.textoBotonEstado, item.estado === 'RECHAZADO' && styles.textoBotonEstadoActivo]}>
                      Rechazar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}

        {/* Modal Selección Agente */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.superposicionModal}>
            <View style={styles.contenidoModal}>
              <Text style={styles.tituloModal}>Seleccionar Agente de Campo</Text>
              <Text style={styles.subtituloModal}>
                Denuncia: {denunciaSeleccionada?.titulo}
              </Text>

              <FlatList
                data={agentes}
                keyExtractor={(agente) => agente.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.itemAgenteModal}
                    onPress={() => asignarAgente(item)}
                  >
                    <View>
                      <Text style={styles.nombreAgenteModal}>{item.nombre}</Text>
                      <Text style={styles.emailAgenteModal}>
                        {item.disponible ? 'Disponible' : 'Franco/Ocupado'} • {item.casosAsignados} casos
                      </Text>
                    </View>
                    <Text style={styles.textoSeleccionar}>Asignar →</Text>
                  </TouchableOpacity>
                )}
              />

              <TouchableOpacity
                style={styles.botonCerrarModal}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.textoBotonCerrarModal}>Cancelar</Text>
              </TouchableOpacity>
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
  contenedorChips: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
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
  contenedorBotonesEstado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
    gap: 4,
  },
  botonEstado: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    backgroundColor: COLORS.fondoAplicacion,
  },
  botonEstadoActivo: {
    backgroundColor: COLORS.botonPrincipal,
    borderColor: COLORS.botonPrincipal,
  },
  botonPeligroActivo: {
    backgroundColor: COLORS.textoPeligro,
    borderColor: COLORS.textoPeligro,
  },
  textoBotonEstado: {
    fontSize: 10,
    color: COLORS.textoVerdeOscuro,
    fontWeight: '600',
  },
  textoBotonEstadoActivo: {
    color: COLORS.superficieTarjeta,
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
  textoSeleccionar: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.botonPrincipal,
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