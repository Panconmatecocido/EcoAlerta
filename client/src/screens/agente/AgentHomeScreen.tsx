import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  Alert,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../utils/theme';
import { PrioritySemaphoreBadge, PrioridadCaso } from '../../components/agent/PrioritySemaphoreBadge';
import {
  VerificationFormModal,
  ResultadoVerificacion,
} from '../../components/agent/VerificationFormModal';
import { TechnicalClosureModal } from '../../components/agent/TechnicalClosureModal';
import { TransactionLoaderModal } from '../../components/common/TransactionLoaderModal';
import { fieldAgentRepository, CasoCampo } from '../../repositories/agent';
import { adminService } from '../../services/adminService';

type PestanaAgente = 'BOLSA' | 'ACTIVO';
type FiltroPrioridadBolsa = 'TODAS' | PrioridadCaso;

const FILTROS_PRIORIDAD_BOLSA: FiltroPrioridadBolsa[] = [
  'TODAS',
  'URGENTE',
  'ALTA',
  'MEDIA',
  'BAJA',
];

const PESO_PRIORIDAD: Record<PrioridadCaso, number> = {
  URGENTE: 4,
  ALTA: 3,
  MEDIA: 2,
  BAJA: 1,
};

const ordenarBolsaPorPrioridad = (casos: CasoCampo[]): CasoCampo[] => {
  return [...casos].sort((a, b) => {
    const diff = PESO_PRIORIDAD[b.prioridad] - PESO_PRIORIDAD[a.prioridad];
    if (diff !== 0) return diff;
    return new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime();
  });
};

export const AgentHomeScreen: React.FC = () => {
  const { user: usuario, logout: cerrarSesion } = useAuth();
  const agenteId = usuario?.id || 'agent-user-1';

  const [enServicio, setEnServicio] = useState<boolean>(false);
  const [pestana, setPestana] = useState<PestanaAgente>('BOLSA');
  const [filtroPrioridad, setFiltroPrioridad] = useState<FiltroPrioridadBolsa>('TODAS');
  const [bolsaCasos, setBolsaCasos] = useState<CasoCampo[]>([]);
  const [casoActivo, setCasoActivo] = useState<CasoCampo | null>(null);

  const [cargando, setCargando] = useState<boolean>(true);
  const [refrescando, setRefrescando] = useState<boolean>(false);
  const [modalVerificacionVisible, setModalVerificacionVisible] = useState<boolean>(false);
  const [modalCierreTecnicoVisible, setModalCierreTecnicoVisible] = useState<boolean>(false);


  // Estado de bloqueo transaccional con spinner (RNF-10)
  const [transaccionEnCurso, setTransaccionEnCurso] = useState<boolean>(false);
  const [mensajeTransaccion, setMensajeTransaccion] = useState<string>('Procesando operación...');

  const cargarBolsaYActivo = useCallback(
    async (esRefresco = false) => {
      if (!esRefresco) {
        setCargando(true);
      }
      try {
        const { bolsa, casoActivo: activo } = await fieldAgentRepository.getBolsaYCasoActivo(
          agenteId
        );
        setBolsaCasos(bolsa);
        setCasoActivo(activo);
      } catch (error: any) {
        Alert.alert(
          'Error de conexión',
          error?.message || 'No se pudo sincronizar la bolsa de casos. Intenta nuevamente.'
        );
      } finally {
        setCargando(false);
        setRefrescando(false);
      }
    },
    [agenteId]
  );

  useEffect(() => {
    cargarBolsaYActivo(false);
  }, [cargarBolsaYActivo]);

  useEffect(() => {
    if (!enServicio) return;

    let mounted = true;
    let actualizacionEnCurso = false;
    let errorDeSincronizacionNotificado = false;
    let suscripcion: Location.LocationSubscription | null = null;

    const iniciarSeguimiento = async () => {
      try {
        suscripcion = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 15000,
            distanceInterval: 10,
          },
          (ubicacion) => {
            if (actualizacionEnCurso) return;
            actualizacionEnCurso = true;
            void adminService
              .actualizarUbicacionPropia(
                ubicacion.coords.latitude,
                ubicacion.coords.longitude
              )
              .catch((error: unknown) => {
                console.error('Error al sincronizar la ubicación del agente:', error);
                if (!errorDeSincronizacionNotificado && mounted) {
                  errorDeSincronizacionNotificado = true;
                  Alert.alert(
                    'Error de sincronización',
                    error instanceof Error
                      ? error.message
                      : 'No se pudo actualizar tu ubicación en el servidor.'
                  );
                }
              })
              .finally(() => {
                actualizacionEnCurso = false;
              });
          }
        );

        if (!mounted) suscripcion.remove();
      } catch (error) {
        console.error('Error al iniciar el seguimiento GPS del agente:', error);
        if (mounted) {
          Alert.alert(
            'Error de ubicación',
            error instanceof Error
              ? error.message
              : 'No se pudo iniciar el seguimiento de tu ubicación.'
          );
        }
      }
    };

    void iniciarSeguimiento();
    return () => {
      mounted = false;
      suscripcion?.remove();
    };
  }, [enServicio]);

  const cambiarPestana = (nuevaPestana: PestanaAgente) => {
    if (transaccionEnCurso || cargando) return;
    setPestana(nuevaPestana);
    cargarBolsaYActivo(false);
  };

  const cambiarFiltroPrioridad = (nuevoFiltro: FiltroPrioridadBolsa) => {
    if (transaccionEnCurso || cargando) return;
    setFiltroPrioridad(nuevoFiltro);
    cargarBolsaYActivo(false);
  };

  const casosBolsaFiltrados =
    filtroPrioridad === 'TODAS'
      ? bolsaCasos
      : bolsaCasos.filter((c) => c.prioridad === filtroPrioridad);

  const alRefrescar = () => {
    setRefrescando(true);
    cargarBolsaYActivo(true);
  };

  const alternarServicio = async () => {
    if (transaccionEnCurso) return;
    const nuevoEstado = !enServicio;

    setMensajeTransaccion(
      nuevoEstado ? 'Obteniendo ubicación GPS y activando servicio...' : 'Desactivando servicio...'
    );
    setTransaccionEnCurso(true);
    try {
      if (nuevoEstado) {
        const permiso = await Location.requestForegroundPermissionsAsync();
        if (!permiso.granted) {
          throw new Error(
            'Para activar el servicio, habilita el permiso de ubicación GPS en tu dispositivo.'
          );
        }

        const ubicacion = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        await adminService.actualizarDisponibilidadPropia(true, {
          latitud: ubicacion.coords.latitude,
          longitud: ubicacion.coords.longitude,
        });
      } else {
        await adminService.actualizarDisponibilidadPropia(false);
      }
      setEnServicio(nuevoEstado);
    } catch (error) {
      Alert.alert(
        'Error de sincronización',
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el estado de servicio en el servidor.'
      );
    } finally {
      setTransaccionEnCurso(false);
    }
  };

  // T009: Abrir navegación GPS en Google Maps / Waze externo
  const abrirNavegacionMapa = async (caso: CasoCampo) => {
    const query =
      typeof caso.latitud === 'number' && typeof caso.longitud === 'number'
        ? `${caso.latitud},${caso.longitud}`
        : encodeURIComponent(caso.direccion);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;

    try {
      const soportado = await Linking.canOpenURL(url);
      if (soportado) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Ubicación GPS', `Dirección: ${caso.direccion}\nCoordenadas: ${query}`);
      }
    } catch {
      Alert.alert('Ubicación GPS', `Dirección: ${caso.direccion}`);
    }
  };

  // T009 & T010: Toma de Caso con Bloqueo Transaccional Atómico 1 a 1 y Spinner Bloqueante (RNF-10)
  const manejarTomarCaso = async (caso: CasoCampo) => {
    if (transaccionEnCurso) return;

    if (!enServicio) {
      Alert.alert(
        'Fuera de Servicio',
        'Activa el interruptor "En Servicio" en la parte superior para poder tomar casos de la bolsa.'
      );
      return;
    }

    if (casoActivo) {
      Alert.alert(
        'Bloqueo 1 a 1 Activo',
        `Ya tienes el caso ${casoActivo.codigo} asignado en curso. Debes finalizar su verificación o liberarlo antes de tomar otro.`
      );
      setPestana('ACTIVO');
      return;
    }

    setMensajeTransaccion(`Asignando caso ${caso.codigo} en exclusividad...`);
    setTransaccionEnCurso(true);

    try {
      const { caso: asignado, message } = await fieldAgentRepository.tomarCaso(caso.id, agenteId);

      // 1. Transacción positiva: actualizar estado local sin doble petición bloqueante, ocultar spinner y avanzar
      setCasoActivo(asignado);
      setBolsaCasos((prev) => prev.filter((item) => item.id !== caso.id));
      setTransaccionEnCurso(false);
      setPestana('ACTIVO');

      Alert.alert('Caso Asignado (1 a 1)', message);
    } catch (error: any) {
      // 2. Transacción negativa: ocultar spinner, mantener vista actual y pedir reintento
      setTransaccionEnCurso(false);
      Alert.alert(
        'No se pudo tomar el caso',
        `${error?.message || 'Error al guardar en la base de datos.'}\n\nPor favor, verifica tu conexión e intenta nuevamente.`
      );
    }
  };

  // T011: Enviar Verificación In Situ (Caso A: REAL, Caso B: FALSO, Caso C: INACCESIBLE 1..3) con Spinner (RNF-10)
  const manejarEnviarVerificacion = async (datos: {
    resultado: ResultadoVerificacion;
    fotoVerificacionUrl: string;
    observaciones?: string;
  }) => {
    if (!casoActivo || transaccionEnCurso) return;

    setMensajeTransaccion('Guardando verificación in situ en la base de datos...');
    setTransaccionEnCurso(true);

    try {
      const { caso: actualizado, message } = await fieldAgentRepository.enviarVerificacion(
        casoActivo.id,
        agenteId,
        datos
      );

      // 1. Transacción positiva: cerrar modal y spinner antes de cambiar de vista y mostrar confirmación
      setModalVerificacionVisible(false);
      setTransaccionEnCurso(false);

      if (
        ['VERIFICADO_PENDIENTE', 'RECHAZADO', 'CERRADO_INACCESIBLE'].includes(actualizado.estado)
      ) {
        setCasoActivo(null);
        setPestana('BOLSA');
      } else {
        setCasoActivo(actualizado);
      }

      Alert.alert('Verificación Registrada', message);
    } catch (error: any) {
      // 2. Transacción negativa: mantener el formulario abierto con sus datos para que pueda volver a intentar
      setTransaccionEnCurso(false);
      Alert.alert(
        'Error al registrar verificación',
        `${error?.message || 'No se pudo guardar la verificación en la base de datos.'}\n\nPor favor, intenta nuevamente.`
      );
    }
  };

  const manejarEnviarCierreTecnico = async (datos: {
    fotoSolucionUrl: string;
    informeSolucion: string;
  }) => {
    if (!casoActivo || transaccionEnCurso) return;

    setMensajeTransaccion('Enviando cierre técnico a la base de datos...');
    setTransaccionEnCurso(true);

    try {
      const { caso: actualizado, message } = await fieldAgentRepository.enviarCierreTecnico(
        casoActivo.id,
        agenteId,
        datos
      );

      // Transacción positiva: cerrar modal, spinner y liberar bandeja de caso activo
      setModalCierreTecnicoVisible(false);
      setTransaccionEnCurso(false);
      setCasoActivo(null);
      setPestana('BOLSA');
      await cargarBolsaYActivo(false);

      Alert.alert('Saneamiento Completado', message);
    } catch (error: any) {
      // Transacción negativa: conservar el formulario abierto para reintentar
      setTransaccionEnCurso(false);
      Alert.alert(
        'Error al registrar cierre técnico',
        `${error?.message || 'No se pudo guardar el informe técnico en la base de datos.'}\n\nPor favor, intenta nuevamente.`
      );
    }
  };

  // T012: Liberar / Abandonar Caso Activo con Spinner Bloqueante hasta conocer respuesta de DB (RNF-10)

  const ejecutarLiberacionEnDB = async (casoALiberar: CasoCampo) => {
    if (transaccionEnCurso) return;

    setMensajeTransaccion(`Liberando caso ${casoALiberar.codigo} hacia la bolsa general...`);
    setTransaccionEnCurso(true);

    try {
      const { caso: liberado, message } = await fieldAgentRepository.liberarCaso(
        casoALiberar.id,
        'Liberado por el Agente de Campo por imprevisto operativo'
      );

      // 1. Transacción positiva: actualizar bolsa inmediatamente con el caso devuelto, cerrar spinner y cambiar vista
      setCasoActivo(null);
      setBolsaCasos((prev) => {
        const sinDuplicado = prev.filter((item) => item.id !== liberado.id);
        return ordenarBolsaPorPrioridad([...sinDuplicado, liberado]);
      });
      setTransaccionEnCurso(false);
      setPestana('BOLSA');

      Alert.alert('Caso Liberado', message);
    } catch (error: any) {
      // 2. Transacción negativa: permanecer en la vista del caso activo y mostrar error para reintentar
      setTransaccionEnCurso(false);
      Alert.alert(
        'Error al liberar el caso',
        `${error?.message || 'No se pudo completar la liberación en la base de datos.'}\n\nPor favor, vuelve a intentarlo.`
      );
    }
  };

  const manejarLiberarCaso = () => {
    if (!casoActivo || transaccionEnCurso) return;

    const casoActual = casoActivo;
    const esSaneamiento =
      casoActual.estado === 'EN_SANEAMIENTO' || (casoActual.puntosOtorgados ?? 0) > 0;

    Alert.alert(
      'Liberar / Abandonar Caso',
      esSaneamiento
        ? '¿Sufriste un imprevisto? El caso volverá a la bolsa general conservando su estado EN_SANEAMIENTO para que otro inspector realice la limpieza sin repetir la verificación.'
        : '¿Sufriste un imprevisto? El caso se desvinculará de tu bandeja y volverá a la bolsa general en estado APROBADO.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar Liberación',
          style: 'destructive',
          onPress: () => ejecutarLiberacionEnDB(casoActual),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="dark-content" />

      {/* Spinner Bloqueante de Transacción en Base de Datos (RNF-10) */}
      <TransactionLoaderModal
        visible={transaccionEnCurso}
        mensaje={mensajeTransaccion}
        submensaje="Por favor espera, no cierres ni presiones otros botones"
      />

      <ScrollView
        contentContainerStyle={estilos.contenidoScroll}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={alRefrescar}
            colors={[COLORS.botonPrincipal]}
          />
        }
      >
        {/* Cabecera del Inspector */}
        <View style={estilos.cabecera}>
          <View style={estilos.filaCabecera}>
            <View>
              <Text style={estilos.etiquetaRol}>AGENTE DE CAMPO MUNICIPAL</Text>
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
              disabled={transaccionEnCurso}
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
                  {
                    backgroundColor: enServicio
                      ? COLORS.botonPrincipal
                      : COLORS.textoDesactivado,
                  },
                ]}
              />
              <Text style={estilos.textoEstado}>
                {enServicio ? 'En Servicio - Habilitado para Bolsa' : 'Fuera de Servicio'}
              </Text>
            </View>
            <Switch
              value={enServicio}
              onValueChange={alternarServicio}
              disabled={transaccionEnCurso}
              trackColor={{ false: COLORS.bordeSuave, true: COLORS.fondoEncabezado }}
              thumbColor={enServicio ? COLORS.botonPrincipal : COLORS.textoDesactivado}
            />
          </View>
        </View>

        {/* Selector de Pestañas: Bolsa General vs. Mi Caso Activo (1 a 1) */}
        <View style={estilos.contenedorPestanas}>
          <TouchableOpacity
            style={[estilos.botonPestana, pestana === 'BOLSA' && estilos.botonPestanaActiva]}
            onPress={() => cambiarPestana('BOLSA')}
            disabled={transaccionEnCurso || cargando}
          >
            <MaterialCommunityIcons
              name="briefcase-search-outline"
              size={ICON_SIZE.sm}
              color={pestana === 'BOLSA' ? COLORS.superficieTarjeta : COLORS.textoVerdeOscuro}
            />
            <Text
              style={[estilos.textoPestana, pestana === 'BOLSA' && estilos.textoPestanaActiva]}
            >
              Bolsa de Casos ({bolsaCasos.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[estilos.botonPestana, pestana === 'ACTIVO' && estilos.botonPestanaActiva]}
            onPress={() => cambiarPestana('ACTIVO')}
            disabled={transaccionEnCurso || cargando}
          >
            <MaterialCommunityIcons
              name="shield-account-outline"
              size={ICON_SIZE.sm}
              color={pestana === 'ACTIVO' ? COLORS.superficieTarjeta : COLORS.textoVerdeOscuro}
            />
            <Text
              style={[estilos.textoPestana, pestana === 'ACTIVO' && estilos.textoPestanaActiva]}
            >
              Mi Caso Activo ({casoActivo ? '1/1' : '0/1'})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filtros de Prioridad para la Bolsa General */}
        {pestana === 'BOLSA' ? (
          <View style={estilos.contenedorChipsPrioridadWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={estilos.contenedorChipsPrioridad}
            >
              {FILTROS_PRIORIDAD_BOLSA.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    estilos.chipPrioridad,
                    filtroPrioridad === f && estilos.chipPrioridadActivo,
                  ]}
                  onPress={() => cambiarFiltroPrioridad(f)}
                  disabled={transaccionEnCurso || cargando}
                >
                  <Text
                    style={[
                      estilos.textoChipPrioridad,
                      filtroPrioridad === f && estilos.textoChipPrioridadActivo,
                    ]}
                  >
                    {f === 'TODAS' ? 'TODAS LAS PRIORIDADES' : `PRIORIDAD ${f}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Aviso de Bloqueo 1 a 1 si ya posee un caso activo */}
        {casoActivo && pestana === 'BOLSA' ? (
          <TouchableOpacity
            style={estilos.bannerBloqueoActivo}
            onPress={() => cambiarPestana('ACTIVO')}
            disabled={transaccionEnCurso || cargando}
          >
            <MaterialCommunityIcons
              name="lock-check-outline"
              size={ICON_SIZE.md}
              color={COLORS.textoAdvertencia}
            />
            <View style={{ flex: 1 }}>
              <Text style={estilos.tituloBannerBloqueo}>
                Bloqueo 1 a 1 Activo ({casoActivo.codigo})
              </Text>
              <Text style={estilos.subtituloBannerBloqueo}>
                Tienes un caso en curso. Toca aquí para verificarlo o liberarlo antes de tomar otro.
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {cargando ? (
          <View style={estilos.contenedorCargandoLista}>
            <ActivityIndicator size="large" color={COLORS.botonPrincipal} />
            <Text style={estilos.textoCargandoLista}>
              {pestana === 'BOLSA'
                ? `Cargando bolsa de casos (${filtroPrioridad})...`
                : 'Cargando mi caso activo...'}
            </Text>
          </View>
        ) : pestana === 'BOLSA' ? (
          /* PESTAÑA 1: BOLSA GENERAL DE CASOS ORDENADA POR CRITICIDAD */
          <View style={estilos.seccionTrabajo}>
            <Text style={estilos.tituloSeccion}>
              BOLSA GENERAL ORDENADA POR PRIORIDAD (SEMÁFORO)
            </Text>

            {casosBolsaFiltrados.length === 0 ? (
              <View style={estilos.cajaVacia}>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={ICON_SIZE.xl}
                  color={COLORS.botonPrincipal}
                />
                <Text style={estilos.textoVacio}>
                  No hay casos pendientes en la bolsa para el filtro seleccionado.
                </Text>
              </View>
            ) : (
              casosBolsaFiltrados.map((item) => {
                const bloqueadoPorCasoActivo = !!casoActivo;

                return (
                  <View key={item.id} style={estilos.tarjetaOrden}>
                    <View style={estilos.encabezadoOrden}>
                      <Text style={estilos.codigoOrden}>{item.codigo}</Text>
                      <PrioritySemaphoreBadge prioridad={item.prioridad} />
                    </View>

                    <Text style={estilos.tituloOrden}>{item.titulo}</Text>
                    <Text style={estilos.categoriaOrden}>
                      Categoría: {item.categoria} • Etapa:{' '}
                      {item.estado === 'EN_SANEAMIENTO'
                        ? 'Listo para Saneamiento'
                        : 'Pendiente de Verificación'}
                    </Text>

                    <Text style={estilos.direccionOrden}>
                      <Ionicons
                        name="location-outline"
                        size={ICON_SIZE.sm}
                        color={COLORS.textoSecundario}
                      />{' '}
                      {item.direccion} ({item.distanciaKm} km)
                    </Text>

                    {item.intentosInaccesible > 0 ? (
                      <View style={estilos.insigniaIntentosPrevios}>
                        <MaterialCommunityIcons
                          name="door-closed-lock"
                          size={14}
                          color={COLORS.textoAdvertencia}
                        />
                        <Text style={estilos.textoIntentosPrevios}>
                          Visitas previas sin acceso: {item.intentosInaccesible}/3
                        </Text>
                      </View>
                    ) : null}

                    <View style={estilos.pieOrden}>
                      <TouchableOpacity
                        style={estilos.botonMapa}
                        onPress={() => abrirNavegacionMapa(item)}
                        disabled={transaccionEnCurso}
                      >
                        <MaterialCommunityIcons
                          name="navigation-variant-outline"
                          size={ICON_SIZE.sm}
                          color={COLORS.iconoPrincipal}
                        />
                        <Text style={estilos.textoBotonMapa}>Cómo llegar (Mapa)</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          estilos.botonInspeccionar,
                          (bloqueadoPorCasoActivo || !enServicio || transaccionEnCurso) &&
                            estilos.botonDeshabilitado,
                        ]}
                        onPress={() => manejarTomarCaso(item)}
                        disabled={transaccionEnCurso}
                      >
                        <MaterialCommunityIcons
                          name="hand-back-right-outline"
                          size={ICON_SIZE.sm}
                          color={COLORS.blanco}
                        />
                        <Text style={estilos.textoBotonInspeccionar}>Tomar Caso</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : (
          /* PESTAÑA 2: MI CASO ACTIVO ASIGNADO EN EXCLUSIVIDAD */
          <View style={estilos.seccionTrabajo}>
            <Text style={estilos.tituloSeccion}>MI CASO ACTIVO EN EXCLUSIVIDAD (1 A 1)</Text>

            {!casoActivo ? (
              <View style={estilos.cajaVacia}>
                <MaterialCommunityIcons
                  name="clipboard-text-search-outline"
                  size={ICON_SIZE.xl}
                  color={COLORS.textoSecundario}
                />
                <Text style={estilos.textoVacio}>
                  No tienes ningún caso activo asignado en este momento.
                </Text>
                <TouchableOpacity
                  style={estilos.botonIrABolsa}
                  onPress={() => setPestana('BOLSA')}
                  disabled={transaccionEnCurso}
                >
                  <Text style={estilos.textoBotonIrABolsa}>Explorar Bolsa de Casos</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={estilos.tarjetaCasoActivo}>
                <View style={estilos.encabezadoOrden}>
                  <Text style={estilos.codigoOrden}>{casoActivo.codigo}</Text>
                  <PrioritySemaphoreBadge prioridad={casoActivo.prioridad} />
                </View>

                <Text style={estilos.tituloOrden}>{casoActivo.titulo}</Text>
                <Text style={estilos.descripcionCasoActivo}>{casoActivo.descripcion}</Text>

                <View style={estilos.cajaMetadatosActivo}>
                  <Text style={estilos.itemMetadato}>
                    • Categoría: <Text style={estilos.valorMetadato}>{casoActivo.categoria}</Text>
                  </Text>
                  <Text style={estilos.itemMetadato}>
                    • Estado Actual:{' '}
                    <Text style={estilos.valorMetadato}>
                      {casoActivo.estado.replace(/_/g, ' ')}
                    </Text>
                  </Text>
                  <Text style={estilos.itemMetadato}>
                    • Dirección: <Text style={estilos.valorMetadato}>{casoActivo.direccion}</Text>
                  </Text>
                  <Text style={estilos.itemMetadato}>
                    • Intentos por Inaccesibilidad:{' '}
                    <Text style={estilos.valorMetadato}>
                      {casoActivo.intentosInaccesible} de 3 permitidos
                    </Text>
                  </Text>
                </View>

                {casoActivo.observacionesAdmin ? (
                  <View style={estilos.cajaNotaAdmin}>
                    <Text style={estilos.textoNotaAdmin}>
                      Historial / Notas: {casoActivo.observacionesAdmin}
                    </Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={estilos.botonMapaCompleto}
                  onPress={() => abrirNavegacionMapa(casoActivo)}
                  disabled={transaccionEnCurso}
                >
                  <MaterialCommunityIcons
                    name="google-maps"
                    size={ICON_SIZE.md}
                    color={COLORS.iconoPrincipal}
                  />
                  <Text style={estilos.textoMapaCompleto}>
                    Abrir Navegación GPS hacia la Ubicación
                  </Text>
                </TouchableOpacity>

                {casoActivo.estado === 'EN_SANEAMIENTO' ? (
                  <TouchableOpacity
                    style={[
                      estilos.botonCierreTecnicoPrincipal,
                      transaccionEnCurso && estilos.botonDeshabilitado,
                    ]}
                    onPress={() => setModalCierreTecnicoVisible(true)}
                    disabled={transaccionEnCurso}
                  >
                    <MaterialCommunityIcons
                      name="broom"
                      size={ICON_SIZE.md}
                      color={COLORS.superficieTarjeta}
                    />
                    <Text style={estilos.textoBotonVerificarPrincipal}>
                      Completar Cierre Técnico de Saneamiento
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      estilos.botonVerificarPrincipal,
                      transaccionEnCurso && estilos.botonDeshabilitado,
                    ]}
                    onPress={() => setModalVerificacionVisible(true)}
                    disabled={transaccionEnCurso}
                  >
                    <MaterialCommunityIcons
                      name="camera-outline"
                      size={ICON_SIZE.md}
                      color={COLORS.superficieTarjeta}
                    />
                    <Text style={estilos.textoBotonVerificarPrincipal}>
                      Completar Verificación In Situ (Casos A / B / C)
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[estilos.botonLiberarCaso, transaccionEnCurso && { opacity: 0.5 }]}
                  onPress={manejarLiberarCaso}
                  disabled={transaccionEnCurso}
                >
                  <MaterialCommunityIcons
                    name="briefcase-upload-outline"
                    size={ICON_SIZE.md}
                    color={COLORS.textoPeligro}
                  />
                  <Text style={estilos.textoBotonLiberarCaso}>
                    Liberar / Abandonar Caso (Devolver a Bolsa)
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal de Verificación In Situ y Protocolo de 3 Intentos (T011) */}
      {casoActivo ? (
        <VerificationFormModal
          visible={modalVerificacionVisible}
          codigoCaso={casoActivo.codigo}
          tituloCaso={casoActivo.titulo}
          intentosInaccesibleActuales={casoActivo.intentosInaccesible || 0}
          enviando={transaccionEnCurso}
          onClose={() => {
            if (!transaccionEnCurso) setModalVerificacionVisible(false);
          }}
          onSubmit={manejarEnviarVerificacion}
        />
      ) : null}

      {/* Modal de Cierre Técnico de Saneamiento (US2) */}
      {casoActivo ? (
        <TechnicalClosureModal
          visible={modalCierreTecnicoVisible}
          codigoCaso={casoActivo.codigo}
          tituloCaso={casoActivo.titulo}
          observacionesPrevias={casoActivo.observacionesAdmin}
          enviando={transaccionEnCurso}
          onClose={() => {
            if (!transaccionEnCurso) setModalCierreTecnicoVisible(false);
          }}
          onSubmit={manejarEnviarCierreTecnico}
        />
      ) : null}

    </SafeAreaView>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORS.fondoAplicacion,
  },
  contenidoScroll: {
    paddingBottom: SPACING.xl,
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
  contenedorPestanas: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    gap: 4,
  },
  botonPestana: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  botonPestanaActiva: {
    backgroundColor: COLORS.botonPrincipal,
  },
  textoPestana: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },
  textoPestanaActiva: {
    color: COLORS.superficieTarjeta,
  },
  contenedorChipsPrioridadWrapper: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  contenedorChipsPrioridad: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  chipPrioridad: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: 10,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.superficieTarjeta,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  chipPrioridadActivo: {
    backgroundColor: COLORS.botonPrincipal,
    borderColor: COLORS.botonPrincipal,
  },
  textoChipPrioridad: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textoSecundario,
  },
  textoChipPrioridadActivo: {
    color: COLORS.superficieTarjeta,
  },
  contenedorCargandoLista: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: SPACING.sm,
  },
  textoCargandoLista: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textoVerdeOscuro,
  },
  bannerBloqueoActivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.fondoAdvertencia,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.textoAdvertencia,
  },
  tituloBannerBloqueo: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textoAdvertencia,
  },
  subtituloBannerBloqueo: {
    fontSize: 11,
    color: COLORS.textoVerdeOscuro,
  },
  seccionTrabajo: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  tituloSeccion: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textoVerde,
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  cajaVacia: {
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  textoVacio: {
    fontSize: 13,
    color: COLORS.textoSecundario,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  botonIrABolsa: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.botonPrincipal,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  textoBotonIrABolsa: {
    color: COLORS.superficieTarjeta,
    fontWeight: '700',
    fontSize: 12,
  },
  tarjetaOrden: {
    backgroundColor: COLORS.superficieTarjeta,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  tarjetaCasoActivo: {
    backgroundColor: COLORS.superficieTarjeta,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.botonPrincipal,
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
  tituloOrden: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
    marginTop: SPACING.xs,
  },
  categoriaOrden: {
    fontSize: 12,
    color: COLORS.textoVerde,
    fontWeight: '600',
    marginTop: 2,
  },
  direccionOrden: {
    fontSize: 13,
    color: COLORS.textoSecundario,
    marginTop: 4,
  },
  insigniaIntentosPrevios: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.fondoAdvertencia,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.xs,
    alignSelf: 'flex-start',
  },
  textoIntentosPrevios: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textoAdvertencia,
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
  botonMapa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.fondoTarjeta,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  textoBotonMapa: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.iconoPrincipal,
  },
  botonInspeccionar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.botonPrincipal,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  botonDeshabilitado: {
    backgroundColor: COLORS.textoDesactivado,
  },
  textoBotonInspeccionar: {
    color: COLORS.blanco,
    fontSize: 12,
    fontWeight: '700',
  },
  descripcionCasoActivo: {
    fontSize: 13,
    color: COLORS.textoSecundario,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  cajaMetadatosActivo: {
    backgroundColor: COLORS.fondoTarjeta,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
    gap: 4,
  },
  itemMetadato: {
    fontSize: 12,
    color: COLORS.textoSecundario,
  },
  valorMetadato: {
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },
  cajaNotaAdmin: {
    backgroundColor: COLORS.fondoAdvertencia,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  textoNotaAdmin: {
    fontSize: 12,
    color: COLORS.textoAdvertencia,
    fontWeight: '600',
  },
  botonMapaCompleto: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.fondoTarjeta,
    borderWidth: 1,
    borderColor: COLORS.iconoPrincipal,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  textoMapaCompleto: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.iconoPrincipal,
  },
  botonCierreTecnicoPrincipal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  botonVerificarPrincipal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.botonPrincipal,
    paddingVertical: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },

  textoBotonVerificarPrincipal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.superficieTarjeta,
  },
  botonLiberarCaso: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.fondoPeligro,
    borderWidth: 1,
    borderColor: COLORS.bordePeligro,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.md,
  },
  textoBotonLiberarCaso: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textoPeligro,
  },
});