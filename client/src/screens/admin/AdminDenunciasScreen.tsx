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
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../utils/theme';
import { adminService, Denuncia, Agente, EstadoDenunciaAdmin } from '../../services/adminService';
import {
  PrioritySemaphoreBadge,
  PrioridadCaso,
} from '../../components/agent/PrioritySemaphoreBadge';
import { TransactionLoaderModal } from '../../components/common/TransactionLoaderModal';
import { PointsScaleModal } from '../../components/admin/PointsScaleModal';
import { BeforeAfterAuditModal } from '../../components/admin/BeforeAfterAuditModal';
import { AdminTabParamList } from '../../navigation/AdminNavigator';

type FiltroEstado =
  | 'TODAS'
  | 'PENDIENTE'
  | 'EN_PROCESO'
  | 'APROBADO'
  | 'EN_VERIFICACION'
  | 'VERIFICADO_PENDIENTE'
  | 'EN_SANEAMIENTO'
  | 'RESUELTO_TECNICO'
  | 'RESUELTO'
  | 'RECHAZADO'
  | 'CERRADO_INACCESIBLE';

const ESTADOS_EN_PROCESO: string[] = [
  'APROBADO',
  'EN_PROCESO',
  'EN_VERIFICACION',
  'VERIFICADO_PENDIENTE',
  'EN_SANEAMIENTO',
  'RESUELTO_TECNICO',
];

const FILTROS_DISPONIBLES: FiltroEstado[] = [
  'TODAS',
  'PENDIENTE',
  'EN_PROCESO',
  'APROBADO',
  'EN_VERIFICACION',
  'VERIFICADO_PENDIENTE',
  'EN_SANEAMIENTO',
  'RESUELTO_TECNICO',
  'RESUELTO',
  'RECHAZADO',
  'CERRADO_INACCESIBLE',
];


const PRIORIDADES: PrioridadCaso[] = ['URGENTE', 'ALTA', 'MEDIA', 'BAJA'];

export const AdminDenunciasScreen: React.FC = () => {
  const route = useRoute<RouteProp<AdminTabParamList, 'DenunciasAdmin'>>();
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<FiltroEstado>(
    (route.params?.filtro as FiltroEstado) || 'TODAS'
  );
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  // Sincronizar filtro cuando cambien los parámetros de navegación
  useEffect(() => {
    if (route.params?.filtro) {
      setFiltro(route.params.filtro as FiltroEstado);
    }
  }, [route.params?.filtro]);

  // Modal Asignación Directa de Inspector
  const [modalVisible, setModalVisible] = useState(false);
  const [denunciaSeleccionada, setDenunciaSeleccionada] = useState<Denuncia | null>(null);
  const [detalleVisible, setDetalleVisible] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [denunciaDetalle, setDenunciaDetalle] = useState<Denuncia | null>(null);
  const [fotoDetalleNoDisponible, setFotoDetalleNoDisponible] = useState(false);

  // Modal de Triaje Inicial (T008: Aprobar con Prioridad hacia Bolsa o Rechazar con Motivo Obligatorio)
  const [modalTriajeVisible, setModalTriajeVisible] = useState(false);
  const [denunciaParaTriaje, setDenunciaParaTriaje] = useState<Denuncia | null>(null);
  const [modoTriaje, setModoTriaje] = useState<'APROBAR' | 'RECHAZAR'>('APROBAR');
  const [prioridadSeleccionada, setPrioridadSeleccionada] = useState<PrioridadCaso>('ALTA');
  const [motivoTriaje, setMotivoTriaje] = useState('');

  // Modal Validación de Veracidad y Baremo de Puntos (US1)
  const [modalVeracidadVisible, setModalVeracidadVisible] = useState(false);
  const [denunciaParaVeracidad, setDenunciaParaVeracidad] = useState<Denuncia | null>(null);

  // Modal Certificación Antes vs. Después (US3)
  const [modalCertificarVisible, setModalCertificarVisible] = useState(false);
  const [denunciaParaCertificar, setDenunciaParaCertificar] = useState<Denuncia | null>(null);

  // RNF-10: Estado de bloqueo transaccional con spinner
  const [procesandoTriaje, setProcesandoTriaje] = useState(false);
  const [mensajeTransaccion, setMensajeTransaccion] = useState('Guardando en base de datos...');


  const cargarDatos = useCallback(
    async (esRefresco = false) => {
      if (!esRefresco) {
        setCargando(true);
      }
      try {
        const filtroParam = filtro === 'TODAS' ? undefined : filtro;
        const [dataDenuncias, dataAgentes] = await Promise.all([
          adminService.obtenerDenuncias({ estado: filtroParam, busqueda }),
          adminService.obtenerAgentes(),
        ]);
        setDenuncias(dataDenuncias);
        setAgentes(dataAgentes);
      } catch {
        // Fallback local para operación sin conexión o pruebas rápidas en Expo Go
        const fallback: Denuncia[] = [
          {
            id: 'den-mock-1',
            codigo: 'REP-2026-101',
            titulo: 'Foco de Dengue y Agua Estancada en Neumáticos',
            categoria: 'Foco de Dengue',
            ubicacion: 'Av. De Mayo 1420, Pilar',
            fecha: '2026-04-15',
            estado: 'PENDIENTE',
            prioridad: 'URGENTE',
            intentosInaccesible: 0,
          },
          {
            id: 'den-mock-2',
            codigo: 'REP-2026-102',
            titulo: 'Microbasural Clandestino en Esquina',
            categoria: 'Microbasural',
            ubicacion: 'Calle 12 y Ruta 25, Pilar',
            fecha: '2026-04-15',
            estado: 'EN_VERIFICACION',
            prioridad: 'ALTA',
            intentosInaccesible: 1,
            agenteAsignadoId: 'agent-user-1',
            agenteAsignadoNombre: 'Inspector Perez',
          },
        ];
        setDenuncias(
          filtro === 'TODAS'
            ? fallback
            : filtro === 'EN_PROCESO'
            ? fallback.filter((item) => ESTADOS_EN_PROCESO.includes(item.estado))
            : fallback.filter((item) => item.estado === filtro)
        );
      } finally {
        setCargando(false);
        setRefrescando(false);
      }
    },
    [filtro, busqueda]
  );

  useEffect(() => {
    cargarDatos(false);
  }, [cargarDatos]);

  const cambiarFiltro = (nuevoFiltro: FiltroEstado) => {
    if (procesandoTriaje) return;
    if (nuevoFiltro === filtro) {
      // Si toca el mismo filtro activo, recarga con spinner visible
      cargarDatos(false);
      return;
    }
    setCargando(true);
    setFiltro(nuevoFiltro);
  };

  const cambiarBusqueda = (texto: string) => {
    setCargando(true);
    setBusqueda(texto);
  };

  const alRefrescar = () => {
    setRefrescando(true);
    cargarDatos(true);
  };

  const abrirModalTriaje = (denuncia: Denuncia, accionInicial: 'APROBAR' | 'RECHAZAR') => {
    if (procesandoTriaje) return;
    setDenunciaParaTriaje(denuncia);
    setModoTriaje(accionInicial);
    setPrioridadSeleccionada(denuncia.prioridad || 'ALTA');
    setMotivoTriaje(denuncia.observacionesAdmin || '');
    setModalTriajeVisible(true);
  };

  const verDetalleDenuncia = async (denuncia: Denuncia) => {
    setCargandoDetalle(true);
    try {
      const detalle = await adminService.obtenerDetalleDenuncia(denuncia.id);
      setDenunciaDetalle(detalle);
      setFotoDetalleNoDisponible(false);
      setDetalleVisible(true);
    } catch (error) {
      Alert.alert(
        'Error al cargar el reporte',
        error instanceof Error ? error.message : 'No se pudo obtener el detalle de la denuncia.'
      );
    } finally {
      setCargandoDetalle(false);
    }
  };

  const confirmarTriaje = async () => {
    if (!denunciaParaTriaje || procesandoTriaje) return;

    if (modoTriaje === 'RECHAZAR' && motivoTriaje.trim().length === 0) {
      Alert.alert(
        'Justificación Obligatoria',
        'Para rechazar un reporte como improcedente o falso debes ingresar obligatoriamente el motivo en las observaciones.'
      );
      return;
    }

    setMensajeTransaccion(
      modoTriaje === 'APROBAR'
        ? 'Publicando reporte en la bolsa general...'
        : 'Registrando rechazo del reporte en la base de datos...'
    );
    setProcesandoTriaje(true);
    const nuevoEstado: EstadoDenunciaAdmin =
      modoTriaje === 'APROBAR' ? 'APROBADO' : 'RECHAZADO';

    try {
      await adminService.triajeDenuncia(denunciaParaTriaje.id, {
        accion: modoTriaje,
        prioridad: modoTriaje === 'APROBAR' ? prioridadSeleccionada : undefined,
        observacionesAdmin: motivoTriaje.trim() || undefined,
      });

      // Transacción positiva: actualizar estado local respetando el filtro activo, cerrar spinner/modal y notificar
      setDenuncias((prev) => {
        const actualizadas = prev.map((item) =>
          item.id === denunciaParaTriaje.id
            ? {
                ...item,
                estado: nuevoEstado,
                prioridad: modoTriaje === 'APROBAR' ? prioridadSeleccionada : item.prioridad,
                observacionesAdmin: motivoTriaje.trim() || item.observacionesAdmin,
                puntosOtorgados: modoTriaje === 'RECHAZAR' ? 0 : item.puntosOtorgados,
                agenteAsignadoId: undefined,
                agenteAsignadoNombre: undefined,
              }
            : item
        );
        return filtro === 'TODAS'
          ? actualizadas
          : filtro === 'EN_PROCESO'
          ? actualizadas.filter((item) => ESTADOS_EN_PROCESO.includes(item.estado))
          : actualizadas.filter((item) => item.estado === filtro);
      });
      setProcesandoTriaje(false);
      setModalTriajeVisible(false);

      Alert.alert(
        modoTriaje === 'APROBAR' ? 'Aprobado a Bolsa General' : 'Reporte Rechazado',
        modoTriaje === 'APROBAR'
          ? `La denuncia pasó a estado APROBADO con prioridad ${prioridadSeleccionada} y ya está disponible en la bolsa de agentes.`
          : 'La denuncia fue rechazada con justificación y 0 puntos otorgados.'
      );
    } catch (error: any) {
      // Transacción negativa: ocultar spinner y permitir reintentar
      setProcesandoTriaje(false);
      Alert.alert(
        'Error al guardar triaje',
        `${error?.message || 'No se pudo actualizar la denuncia en la base de datos.'}\n\nPor favor, intenta nuevamente.`
      );
    }
  };

  // T013: Desasignar / Liberar Caso a la Bolsa General conservando etapa y mostrando spinner (RNF-10)
  const desasignarCasoDeAgente = (denuncia: Denuncia) => {
    if (procesandoTriaje) return;

    const yaVerificado =
      denuncia.estado === 'EN_SANEAMIENTO' || (denuncia.puntosOtorgados ?? 0) > 0;
    const estadoDestino: EstadoDenunciaAdmin = yaVerificado ? 'EN_SANEAMIENTO' : 'APROBADO';

    Alert.alert(
      'Forzar Desasignación a la Bolsa',
      `¿Deseas desvincular al inspector ${denuncia.agenteAsignadoNombre || ''} de este caso?\n\nEl reporte regresará a la bolsa general en estado ${estadoDestino}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Liberar a Bolsa',
          style: 'destructive',
          onPress: async () => {
            setMensajeTransaccion('Liberando caso hacia la bolsa general...');
            setProcesandoTriaje(true);
            try {
              await adminService.liberarCasoAgente(
                denuncia.id,
                'Desasignación forzada por Administrador'
              );
              setDenuncias((prev) => {
                const actualizadas = prev.map((item) =>
                  item.id === denuncia.id
                    ? {
                        ...item,
                        estado: estadoDestino,
                        agenteAsignadoId: undefined,
                        agenteAsignadoNombre: undefined,
                      }
                    : item
                );
                return filtro === 'TODAS'
                  ? actualizadas
                  : actualizadas.filter((item) => item.estado === filtro);
              });
              setProcesandoTriaje(false);
              Alert.alert(
                'Caso Liberado',
                `El reporte regresó a la bolsa general en estado ${estadoDestino}.`
              );
            } catch (error: any) {
              setProcesandoTriaje(false);
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

  const abrirModalAsignacion = (denuncia: Denuncia) => {
    if (procesandoTriaje) return;
    const agentesDisponibles = agentes.filter(
      (a) => a.disponible && a.casosAsignados === 0 && a.id !== denuncia.agenteAsignadoId
    );
    if (agentesDisponibles.length === 0) {
      Alert.alert(
        'Agente no disponible',
        'No hay inspectores disponibles y sin casos activos para recibir este reporte. Cada agente puede tener como máximo un caso activo.'
      );
      return;
    }
    setDenunciaSeleccionada(denuncia);
    setModalVisible(true);
  };

  const asignarAgente = async (agente: Agente) => {
    if (!denunciaSeleccionada || procesandoTriaje) return;

    if (!agente.disponible) {
      Alert.alert(
        'Agente no disponible',
        `El inspector ${agente.nombre} no se encuentra disponible para recibir asignaciones.`
      );
      return;
    }

    const nuevoEstado: EstadoDenunciaAdmin =
      denunciaSeleccionada.estado === 'EN_SANEAMIENTO'
        ? 'EN_SANEAMIENTO'
        : 'EN_VERIFICACION';

    setMensajeTransaccion(`Asignando inspector ${agente.nombre} en la base de datos...`);
    setProcesandoTriaje(true);

    try {
      await adminService.asignarAgenteDenuncia(denunciaSeleccionada.id, agente.id);

      setDenuncias((prev) =>
        prev.map((item) =>
          item.id === denunciaSeleccionada.id
            ? {
                ...item,
                agenteAsignadoId: agente.id,
                agenteAsignadoNombre: agente.nombre,
                estado: nuevoEstado,
              }
            : item
        )
      );

      setProcesandoTriaje(false);
      setModalVisible(false);
      Alert.alert('Asignación Exitosa', `Inspector ${agente.nombre} asignado al caso.`);
    } catch (error: any) {
      setProcesandoTriaje(false);
      Alert.alert(
        'Error al asignar inspector',
        `${error?.message || 'No se pudo guardar la asignación en la base de datos.'}\n\nPor favor, intenta nuevamente.`
      );
    }
  };

  const abrirModalVeracidad = async (item: Denuncia) => {
    try {
      const detalle = await adminService.obtenerDetalleDenuncia(item.id);
      setDenunciaParaVeracidad(detalle);
      setModalVeracidadVisible(true);
    } catch (error) {
      Alert.alert(
        'Error al cargar el reporte',
        error instanceof Error ? error.message : 'No se pudo obtener el detalle de la denuncia.'
      );
    }
  };

  const manejarValidarVeracidad = async (payload: {
    decision: 'APROBAR_VERACIDAD' | 'RECHAZAR_FALSO';
    puntos?: number;
    observacionesAdmin?: string;
  }) => {
    if (!denunciaParaVeracidad) return;
    setProcesandoTriaje(true);
    setMensajeTransaccion(
      payload.decision === 'APROBAR_VERACIDAD'
        ? `Acreditando ${payload.puntos} puntos y avanzando a saneamiento...`
        : 'Registrando rechazo por falsedad...'
    );
    try {
      await adminService.validarVeracidadYAcreditarPuntos(denunciaParaVeracidad.id, payload);
      setModalVeracidadVisible(false);
      setDenunciaParaVeracidad(null);
      await cargarDatos(false);
      Alert.alert(
        'Operación Exitosa',
        payload.decision === 'APROBAR_VERACIDAD'
          ? `Se acreditaron ${payload.puntos} puntos al ciudadano y el reporte avanzó a etapa de Saneamiento.`
          : 'Reporte cerrado como falso en terreno con 0 puntos otorgados.'
      );
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo procesar la validación de veracidad.');
    } finally {
      setProcesandoTriaje(false);
    }
  };

  const abrirModalCertificar = async (item: Denuncia) => {
    try {
      const detalle = await adminService.obtenerDetalleDenuncia(item.id);
      setDenunciaParaCertificar(detalle);
      setModalCertificarVisible(true);
    } catch (error) {
      Alert.alert(
        'Error al cargar el reporte',
        error instanceof Error ? error.message : 'No se pudo obtener el detalle de la denuncia.'
      );
    }
  };

  const manejarCertificarResolucion = async (payload: {
    decision: 'CERTIFICAR' | 'OBSERVAR_REHACER';
    observacionesAdmin?: string;
  }) => {
    if (!denunciaParaCertificar) return;
    setProcesandoTriaje(true);
    setMensajeTransaccion(
      payload.decision === 'CERTIFICAR'
        ? 'Certificando saneamiento y cerrando caso definitivamente...'
        : 'Devolviendo caso a saneamiento con notas técnicas...'
    );
    try {
      await adminService.certificarSaneamientoFinal(denunciaParaCertificar.id, payload);
      setModalCertificarVisible(false);
      setDenunciaParaCertificar(null);
      await cargarDatos(false);
      Alert.alert(
        'Auditoría Registrada',
        payload.decision === 'CERTIFICAR'
          ? 'Caso certificado y cerrado definitivamente (RESUELTO).'
          : 'El caso ha sido devuelto a EN_SANEAMIENTO con las observaciones técnicas.'
      );
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo procesar la certificación.');
    } finally {
      setProcesandoTriaje(false);
    }
  };

  return (

    <SafeAreaView style={styles.safeArea}>
      <TransactionLoaderModal
        visible={procesandoTriaje}
        mensaje={mensajeTransaccion}
        submensaje="Por favor espera a que finalice la transacción"
      />
      <View style={styles.contenedor}>
        <Text style={styles.tituloEncabezado}>Triaje y Gestión de Denuncias</Text>

        {/* Buscador */}
        <View style={styles.contenedorBuscador}>
          <MaterialCommunityIcons name="magnify" size={ICON_SIZE.md} color={COLORS.textoSecundario} />
          <TextInput
            style={styles.inputBuscador}
            placeholder="Buscar por código, título o ubicación..."
            placeholderTextColor={COLORS.textoDesactivado}
            value={busqueda}
            onChangeText={cambiarBusqueda}
          />
        </View>

        {/* Filtros Chips Horizontales */}
        <View style={styles.contenedorChipsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contenedorChips}>
            {FILTROS_DISPONIBLES.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.chip, filtro === f && styles.chipActivo]}
                onPress={() => cambiarFiltro(f)}
                disabled={cargando || procesandoTriaje}
              >
                <Text style={[styles.textoChip, filtro === f && styles.textoChipActivo]}>
                  {f.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Lista de Denuncias */}
        {cargando ? (
          <View style={styles.contenedorCargandoFiltro}>
            <ActivityIndicator size="large" color={COLORS.botonPrincipal} />
            <Text style={styles.textoCargandoFiltro}>
              Cargando denuncias ({filtro.replace(/_/g, ' ')})...
            </Text>
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
              <Text style={styles.textoVacio}>No se encontraron denuncias para los filtros seleccionados.</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.tarjetaDenuncia}>
                <View style={styles.cabeceraDenuncia}>
                  <View style={{ flex: 1, marginRight: SPACING.xs }}>
                    {item.codigo ? (
                      <Text style={styles.codigoDenuncia}>{item.codigo}</Text>
                    ) : null}
                    <Text style={styles.tituloDenuncia}>{item.titulo}</Text>
                  </View>
                  <PrioritySemaphoreBadge prioridad={item.prioridad || 'MEDIA'} />
                </View>

                <Text style={styles.detalleDenuncia}>
                  Categoría: {item.categoria} • Fecha: {item.fecha}
                </Text>
                <Text style={styles.detalleDenuncia}>Ubicación: {item.ubicacion}</Text>
                {item.descripcion ? (
                  <Text style={styles.descripcionDenuncia} numberOfLines={3}>
                    {item.descripcion}
                  </Text>
                ) : null}
                <TouchableOpacity
                  style={styles.botonVerDetalle}
                  onPress={() => void verDetalleDenuncia(item)}
                  disabled={cargandoDetalle}
                >
                  {cargandoDetalle ? (
                    <ActivityIndicator size="small" color={COLORS.botonPrincipal} />
                  ) : (
                    <MaterialCommunityIcons
                      name="image-search-outline"
                      size={16}
                      color={COLORS.botonPrincipal}
                    />
                  )}
                  <Text style={styles.textoBotonVerDetalle}>Ver detalle y fotografía</Text>
                </TouchableOpacity>

                <View style={styles.filaMetadatosEstado}>
                  <View style={styles.badgeEstadoActual}>
                    <Text style={styles.textoEstadoActual}>
                      Estado: {item.estado.replace(/_/g, ' ')}
                    </Text>
                  </View>

                  {(item.intentosInaccesible ?? 0) > 0 && (
                    <View style={styles.badgeIntentos}>
                      <MaterialCommunityIcons
                        name="door-closed-lock"
                        size={13}
                        color={COLORS.textoAdvertencia}
                      />
                      <Text style={styles.textoIntentos}>
                        Inaccesible: {item.intentosInaccesible}/3
                      </Text>
                    </View>
                  )}
                </View>

                {item.observacionesAdmin ? (
                  <View style={styles.cajaObservaciones}>
                    <Text style={styles.textoObservaciones}>
                      Observaciones: {item.observacionesAdmin}
                    </Text>
                  </View>
                ) : null}

                {item.agenteAsignadoNombre ? (
                  <View style={styles.contenedorAgenteAsignado}>
                    <Text style={styles.textoAgenteAsignado}>
                      Inspector en cargo:{' '}
                      <Text style={styles.nombreAgenteInsignia}>{item.agenteAsignadoNombre}</Text>
                    </Text>
                    <TouchableOpacity
                      style={styles.botonDesasignar}
                      onPress={() => desasignarCasoDeAgente(item)}
                    >
                      <MaterialCommunityIcons
                        name="account-remove-outline"
                        size={14}
                        color={COLORS.textoPeligro}
                      />
                      <Text style={styles.textoBotonDesasignar}>Liberar a Bolsa</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* Acciones de Triaje Inicial y Asignación */}
                <View style={styles.accionesFila}>
                  {item.estado === 'PENDIENTE' && (
                    <>
                      <TouchableOpacity
                        style={styles.botonAprobarBolsa}
                        onPress={() => abrirModalTriaje(item, 'APROBAR')}
                      >
                        <MaterialCommunityIcons
                          name="check-circle-outline"
                          size={16}
                          color={COLORS.superficieTarjeta}
                        />
                        <Text style={styles.textoBotonAccion}>Aprobar a Bolsa</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.botonRechazarTriaje}
                        onPress={() => abrirModalTriaje(item, 'RECHAZAR')}
                      >
                        <MaterialCommunityIcons
                          name="close-circle-outline"
                          size={16}
                          color={COLORS.textoPeligro}
                        />
                        <Text style={styles.textoBotonRechazar}>Rechazar</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {item.estado === 'VERIFICADO_PENDIENTE' && (
                    <TouchableOpacity
                      style={styles.botonValidarVeracidad}
                      onPress={() => abrirModalVeracidad(item)}
                    >
                      <MaterialCommunityIcons
                        name="shield-check"
                        size={16}
                        color={COLORS.superficieTarjeta}
                      />
                      <Text style={styles.textoBotonAccion}>Validar Veracidad y Puntos</Text>
                    </TouchableOpacity>
                  )}

                  {item.estado === 'RESUELTO_TECNICO' && (
                    <TouchableOpacity
                      style={styles.botonAuditarCertificar}
                      onPress={() => abrirModalCertificar(item)}
                    >
                      <MaterialCommunityIcons
                        name="compare"
                        size={16}
                        color={COLORS.superficieTarjeta}
                      />
                      <Text style={styles.textoBotonAccion}>Auditar Antes vs. Después</Text>
                    </TouchableOpacity>
                  )}

                  {item.estado !== 'RECHAZADO' &&
                    item.estado !== 'RESUELTO' &&
                    item.estado !== 'CERRADO_INACCESIBLE' && (
                      <TouchableOpacity
                        style={styles.botonAsignar}
                        onPress={() => abrirModalAsignacion(item)}
                      >
                        <MaterialCommunityIcons
                          name="account-plus-outline"
                          size={16}
                          color={COLORS.superficieTarjeta}
                        />
                        <Text style={styles.textoBotonAsignar}>
                          {item.agenteAsignadoNombre ? 'Reasignar' : 'Asignar Inspector'}
                        </Text>
                      </TouchableOpacity>
                    )}

                </View>
              </View>
            )}
          />
        )}

        <Modal
          animationType="slide"
          transparent
          visible={detalleVisible}
          onRequestClose={() => setDetalleVisible(false)}
        >
          <View style={styles.superposicionModal}>
            <View style={styles.contenidoModal}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.tituloModal}>Detalle del reporte</Text>
                <Text style={styles.subtituloModal}>
                  {denunciaDetalle?.codigo ? `${denunciaDetalle.codigo} • ` : ''}
                  {denunciaDetalle?.titulo}
                </Text>

                {denunciaDetalle?.imagenUrl &&
                !denunciaDetalle.imagenUrl.startsWith('file://') &&
                !fotoDetalleNoDisponible ? (
                  <Image
                    source={{ uri: denunciaDetalle.imagenUrl }}
                    style={styles.fotoDetalle}
                    resizeMode="contain"
                    onError={() => setFotoDetalleNoDisponible(true)}
                  />
                ) : (
                  <View style={styles.fotoDetalleVacia}>
                    <MaterialCommunityIcons
                      name="image-off-outline"
                      size={32}
                      color={COLORS.textoDesactivado}
                    />
                    <Text style={styles.textoFotoDetalleVacia}>
                      {fotoDetalleNoDisponible
                        ? 'La fotografía guardada no está disponible desde este dispositivo.'
                        : denunciaDetalle?.imagenUrl?.startsWith('file://')
                        ? 'La foto se guardó localmente en el teléfono del vecino y no se puede compartir. Los nuevos reportes sincronizan la imagen para el administrador.'
                        : 'Este reporte no tiene una fotografía disponible.'}
                    </Text>
                  </View>
                )}

                <Text style={styles.etiquetaDetalle}>Descripción</Text>
                <Text style={styles.valorDetalle}>
                  {denunciaDetalle?.descripcion || 'Sin descripción.'}
                </Text>
                <Text style={styles.etiquetaDetalle}>Categoría</Text>
                <Text style={styles.valorDetalle}>{denunciaDetalle?.categoria}</Text>
                <Text style={styles.etiquetaDetalle}>Ubicación</Text>
                <Text style={styles.valorDetalle}>
                  {denunciaDetalle?.ubicacion || denunciaDetalle?.direccion || 'Sin ubicación'}
                </Text>
                {denunciaDetalle?.ciudadanoNombre ? (
                  <>
                    <Text style={styles.etiquetaDetalle}>Reportado por</Text>
                    <Text style={styles.valorDetalle}>{denunciaDetalle.ciudadanoNombre}</Text>
                  </>
                ) : null}
              </ScrollView>

              <TouchableOpacity
                style={styles.botonCerrarDetalle}
                onPress={() => setDetalleVisible(false)}
              >
                <Text style={styles.textoBotonCerrarDetalle}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal de Triaje Inicial (T008: Prioridad o Rechazo con Justificación Obligatoria) */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalTriajeVisible}
          onRequestClose={() => setModalTriajeVisible(false)}
        >
          <View style={styles.superposicionModal}>
            <View style={styles.contenidoModal}>
              <Text style={styles.tituloModal}>
                {modoTriaje === 'APROBAR'
                  ? 'Aprobar Reporte a Bolsa General'
                  : 'Rechazar Reporte Improcedente'}
              </Text>
              <Text style={styles.subtituloModal}>
                {denunciaParaTriaje?.codigo ? `${denunciaParaTriaje.codigo} • ` : ''}
                {denunciaParaTriaje?.titulo}
              </Text>

              {/* Selector de Modo dentro del Modal */}
              <View style={styles.selectorModoTriaje}>
                <TouchableOpacity
                  style={[
                    styles.tabModoTriaje,
                    modoTriaje === 'APROBAR' && styles.tabModoAprobarActivo,
                  ]}
                  onPress={() => setModoTriaje('APROBAR')}
                >
                  <Text
                    style={[
                      styles.textoTabModo,
                      modoTriaje === 'APROBAR' && styles.textoTabModoActivo,
                    ]}
                  >
                    Aprobar a Bolsa
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabModoTriaje,
                    modoTriaje === 'RECHAZAR' && styles.tabModoRechazarActivo,
                  ]}
                  onPress={() => setModoTriaje('RECHAZAR')}
                >
                  <Text
                    style={[
                      styles.textoTabModo,
                      modoTriaje === 'RECHAZAR' && styles.textoTabModoActivo,
                    ]}
                  >
                    Rechazar (0 pts)
                  </Text>
                </TouchableOpacity>
              </View>

              {modoTriaje === 'APROBAR' ? (
                <View style={{ marginBottom: SPACING.md }}>
                  <Text style={styles.labelCampoModal}>
                    Asignar Nivel de Prioridad para los Agentes *
                  </Text>
                  <View style={styles.filaPrioridadesModal}>
                    {PRIORIDADES.map((nivel) => (
                      <TouchableOpacity
                        key={nivel}
                        style={[
                          styles.botonPrioridadModal,
                          prioridadSeleccionada === nivel && styles.botonPrioridadModalActivo,
                        ]}
                        onPress={() => setPrioridadSeleccionada(nivel)}
                      >
                        <PrioritySemaphoreBadge prioridad={nivel} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : null}

              <Text style={styles.labelCampoModal}>
                {modoTriaje === 'RECHAZAR'
                  ? 'Motivo de Rechazo / Justificación Obligatoria *'
                  : 'Notas de Triaje para el Inspector (Opcional)'}
              </Text>
              <TextInput
                style={styles.inputMotivoTriaje}
                placeholder={
                  modoTriaje === 'RECHAZAR'
                    ? 'Explica por qué se desestima la alerta (ej. foto borrosa, broma, duplicado)...'
                    : 'Indicaciones opcionales de acceso o referencia...'
                }
                placeholderTextColor={COLORS.textoDesactivado}
                value={motivoTriaje}
                onChangeText={setMotivoTriaje}
                multiline
                numberOfLines={3}
              />

              <View style={styles.filaBotonesModalTriaje}>
                <TouchableOpacity
                  style={styles.botonCancelarModal}
                  onPress={() => setModalTriajeVisible(false)}
                  disabled={procesandoTriaje}
                >
                  <Text style={styles.textoBotonCerrarModal}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.botonConfirmarTriaje,
                    modoTriaje === 'RECHAZAR' && { backgroundColor: COLORS.textoPeligro },
                  ]}
                  onPress={confirmarTriaje}
                  disabled={procesandoTriaje}
                >
                  <Text style={styles.textoConfirmarTriaje}>
                    {modoTriaje === 'APROBAR' ? 'Publicar en Bolsa' : 'Confirmar Rechazo'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
                ListEmptyComponent={
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: COLORS.textoSecundario, textAlign: 'center' }}>
                      No hay inspectores disponibles para asignar en este momento.
                    </Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const esAgenteActual = item.id === denunciaSeleccionada?.agenteAsignadoId;
                  const estaDisponible =
                    item.disponible && item.casosAsignados === 0 && !esAgenteActual;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.itemAgenteModal,
                        !estaDisponible && { opacity: 0.5, backgroundColor: '#f0f0f0' },
                      ]}
                      onPress={() => asignarAgente(item)}
                      disabled={!estaDisponible}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.nombreAgenteModal,
                            !estaDisponible && { color: COLORS.textoDesactivado },
                          ]}
                        >
                          {item.nombre}{' '}
                          {esAgenteActual
                            ? '(Asignado actualmente)'
                            : !item.disponible
                            ? '(Fuera de servicio)'
                            : item.casosAsignados > 0
                            ? '(Ya tiene un caso activo)'
                            : ''}
                        </Text>
                        <Text style={styles.emailAgenteModal}>
                          {estaDisponible
                            ? 'Disponible para recibir un caso'
                            : `${item.casosAsignados} caso(s) activo(s)`}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.textoSeleccionar,
                          !estaDisponible && { color: COLORS.textoDesactivado },
                        ]}
                      >
                        {estaDisponible ? 'Asignar →' : 'No disponible'}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
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

        {/* Modal Validación de Veracidad y Baremo de Puntos (US1) */}
        <PointsScaleModal
          visible={modalVeracidadVisible}
          denuncia={
            denunciaParaVeracidad
              ? {
                  ...denunciaParaVeracidad,
                  ubicacion: denunciaParaVeracidad.ubicacion || denunciaParaVeracidad.direccion || '',
                }
              : null
          }
          procesando={procesandoTriaje}
          onClose={() => {
            if (!procesandoTriaje) {
              setModalVeracidadVisible(false);
              setDenunciaParaVeracidad(null);
            }
          }}
          onSubmit={manejarValidarVeracidad}
        />

        {/* Modal Certificación Antes vs. Después (US3) */}
        <BeforeAfterAuditModal
          visible={modalCertificarVisible}
          denuncia={
            denunciaParaCertificar
              ? {
                  ...denunciaParaCertificar,
                  ubicacion: denunciaParaCertificar.ubicacion || denunciaParaCertificar.direccion || '',
                }
              : null
          }
          procesando={procesandoTriaje}
          onClose={() => {
            if (!procesandoTriaje) {
              setModalCertificarVisible(false);
              setDenunciaParaCertificar(null);
            }
          }}
          onSubmit={manejarCertificarResolucion}
        />
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
  contenedorChipsWrapper: {
    marginBottom: SPACING.md,
  },
  contenedorChips: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  chip: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: 10,
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
  contenedorCargandoFiltro: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: SPACING.sm,
  },
  textoCargandoFiltro: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textoVerdeOscuro,
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
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  codigoDenuncia: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textoVerde,
    marginBottom: 2,
  },
  tituloDenuncia: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  detalleDenuncia: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    marginBottom: 2,
  },
  descripcionDenuncia: {
    fontSize: 12,
    color: COLORS.textoVerdeOscuro,
    marginTop: SPACING.xs,
    lineHeight: 18,
  },
  botonVerDetalle: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
    paddingVertical: 5,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.fondoEncabezado,
  },
  textoBotonVerDetalle: {
    color: COLORS.botonPrincipal,
    fontSize: 12,
    fontWeight: '700',
  },
  fotoDetalle: {
    width: '100%',
    height: 230,
    backgroundColor: COLORS.fondoAplicacion,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  fotoDetalleVacia: {
    minHeight: 110,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.fondoAplicacion,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  textoFotoDetalleVacia: {
    marginTop: SPACING.xs,
    textAlign: 'center',
    color: COLORS.textoSecundario,
    fontSize: 12,
  },
  etiquetaDetalle: {
    marginTop: SPACING.xs,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textoSecundario,
  },
  valorDetalle: {
    marginTop: 2,
    color: COLORS.textoVerdeOscuro,
    fontSize: 13,
    lineHeight: 19,
  },
  botonCerrarDetalle: {
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.fondoAplicacion,
  },
  textoBotonCerrarDetalle: {
    color: COLORS.textoVerdeOscuro,
    fontWeight: '700',
  },
  filaMetadatosEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  badgeEstadoActual: {
    backgroundColor: COLORS.fondoEncabezado,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  textoEstadoActual: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },
  badgeIntentos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.fondoAdvertencia,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  textoIntentos: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textoAdvertencia,
  },
  cajaObservaciones: {
    backgroundColor: COLORS.fondoAplicacion,
    padding: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.botonPrincipal,
    marginBottom: SPACING.xs,
  },
  textoObservaciones: {
    fontSize: 11,
    color: COLORS.textoVerdeOscuro,
  },
  contenedorAgenteAsignado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.fondoTarjeta,
    padding: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  textoAgenteAsignado: {
    fontSize: 12,
    color: COLORS.textoVerdeOscuro,
    flex: 1,
  },
  nombreAgenteInsignia: {
    fontWeight: 'bold',
    color: COLORS.textoVerde,
  },
  botonDesasignar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.fondoPeligro,
    borderWidth: 1,
    borderColor: COLORS.bordePeligro,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  textoBotonDesasignar: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textoPeligro,
  },
  accionesFila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  botonAprobarBolsa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.botonPrincipal,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  textoBotonAccion: {
    color: COLORS.superficieTarjeta,
    fontSize: 11,
    fontWeight: 'bold',
  },
  botonRechazarTriaje: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.fondoPeligro,
    borderWidth: 1,
    borderColor: COLORS.bordePeligro,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  textoBotonRechazar: {
    color: COLORS.textoPeligro,
    fontSize: 11,
    fontWeight: 'bold',
  },
  botonAsignar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.camaraInferior,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  botonValidarVeracidad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.botonPrincipal,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  botonAuditarCertificar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  textoBotonAsignar: {

    color: COLORS.superficieTarjeta,
    fontSize: 11,
    fontWeight: 'bold',
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
    maxHeight: '85%',
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
    marginTop: 2,
  },
  selectorModoTriaje: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  tabModoTriaje: {
    flex: 1,
    paddingVertical: SPACING.xs + 2,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    backgroundColor: COLORS.fondoAplicacion,
  },
  tabModoAprobarActivo: {
    backgroundColor: COLORS.botonPrincipal,
    borderColor: COLORS.botonPrincipal,
  },
  tabModoRechazarActivo: {
    backgroundColor: COLORS.textoPeligro,
    borderColor: COLORS.textoPeligro,
  },
  textoTabModo: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },
  textoTabModoActivo: {
    color: COLORS.superficieTarjeta,
  },
  labelCampoModal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
    marginBottom: SPACING.xs,
  },
  filaPrioridadesModal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  botonPrioridadModal: {
    padding: 4,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  botonPrioridadModalActivo: {
    borderColor: COLORS.textoVerdeOscuro,
  },
  inputMotivoTriaje: {
    backgroundColor: COLORS.fondoAplicacion,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    fontSize: 13,
    color: COLORS.textoVerdeOscuro,
    minHeight: 72,
    textAlignVertical: 'top',
    marginBottom: SPACING.md,
  },
  filaBotonesModalTriaje: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  botonCancelarModal: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    backgroundColor: COLORS.fondoAplicacion,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  botonConfirmarTriaje: {
    flex: 2,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    backgroundColor: COLORS.botonPrincipal,
    borderRadius: BORDER_RADIUS.sm,
  },
  textoConfirmarTriaje: {
    color: COLORS.superficieTarjeta,
    fontWeight: 'bold',
    fontSize: 13,
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