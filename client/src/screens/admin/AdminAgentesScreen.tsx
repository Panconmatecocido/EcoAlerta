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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../utils/theme';
import { adminService, Agente } from '../../services/adminService';
import { TransactionLoaderModal } from '../../components/common/TransactionLoaderModal';

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

  return (
    <SafeAreaView style={styles.safeArea}>
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

                <View style={styles.accionesAgente}>
                  <TouchableOpacity
                    style={[
                      styles.botonEstado,
                      {
                        backgroundColor: item.disponible
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
                          color: item.disponible
                            ? COLORS.textoVerdeOscuro
                            : COLORS.textoPeligro,
                        },
                      ]}
                    >
                      {item.disponible ? 'Disponible' : 'Ocupado / Franco'}
                    </Text>
                  </TouchableOpacity>
                </View>
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
});