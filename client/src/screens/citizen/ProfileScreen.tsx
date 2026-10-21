// src/screens/citizen/ProfileScreen.tsx
// Inicio de Fase 4 (US2): historial ciudadano, seguimiento y detalle de reportes.
import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../utils/theme';
import { reportRepository } from '../../repositories/reports';
import { CitizenReport } from '../../repositories/reports/IReportRepository';
import { ReportStatusBadge } from '../../components/citizen/ReportStatusBadge';
import { tiendaService, ResultadoCanje } from '../../services/tiendaService';

// Inicio de Fase 5 (US3): archivado lógico de reportes desde el historial ciudadano.
export const ProfileScreen: React.FC = () => {
  const { user: usuario } = useAuth();
  const [pestanaActiva, setPestanaActiva] = useState<'denuncias' | 'compras'>('denuncias');

  // Estados de datos remotos
  const [denuncias, setDenuncias] = useState<CitizenReport[]>([]);
  const [canjes, setCanjes] = useState<ResultadoCanje[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [refrescando, setRefrescando] = useState<boolean>(false);
  const [errorDenuncias, setErrorDenuncias] = useState<string | null>(null);
  const [denunciaSeleccionada, setDenunciaSeleccionada] = useState<CitizenReport | null>(null);
  const [ocultandoReporteId, setOcultandoReporteId] = useState<string | null>(null);

  // Foto de perfil local o del usuario
  const [fotoPerfilUri, setFotoPerfilUri] = useState<string | null>(null);

  const cargarDatosPerfil = useCallback(
    async (refrescar = false, sigueActivo: () => boolean = () => true) => {
      if (!usuario || usuario.role !== 'citizen') {
        setDenuncias([]);
        setCargando(false);
        setRefrescando(false);
        return;
      }
      if (refrescar) setRefrescando(true);

      try {
        const misDenuncias = await reportRepository.getCitizenReports(usuario.id);
        if (sigueActivo()) {
          setDenuncias(misDenuncias);
          setErrorDenuncias(null);
        }
      } catch (error) {
        console.error('Error al cargar reportes del perfil:', error);
        if (sigueActivo()) {
          setErrorDenuncias(
            error instanceof Error
              ? error.message
              : 'No se pudieron cargar tus reportes. Intenta nuevamente.'
          );
        }
      } finally {
        if (sigueActivo()) {
          setCargando(false);
          setRefrescando(false);
        }
      }
    },
    [usuario]
  );

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      void cargarDatosPerfil(false, () => activo);
      return () => {
        activo = false;
      };
    }, [cargarDatosPerfil])
  );

  const alRefrescar = () => {
    setRefrescando(true);
    void cargarDatosPerfil(true);
  };

  const confirmarOcultamiento = (denuncia: CitizenReport) => {
    if (denuncia.estado === 'PENDIENTE') {
      Alert.alert(
        'Reporte en revisión',
        'Solo puedes ocultar reportes que ya hayan sido evaluados por el municipio.'
      );
      return;
    }

    Alert.alert(
      'Ocultar de mi historial',
      `El reporte ${denuncia.codigo} dejará de aparecer en tu historial. Se conservará en los registros municipales.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Ocultar',
          onPress: () => {
            void ocultarReporte(denuncia);
          },
        },
      ]
    );
  };

  const ocultarReporte = async (denuncia: CitizenReport) => {
    if (!usuario || usuario.role !== 'citizen' || ocultandoReporteId) return;

    setOcultandoReporteId(denuncia.id);
    try {
      await reportRepository.hideReportForCitizen(denuncia.id, usuario.id);
      setDenuncias((reportes) => reportes.filter((reporte) => reporte.id !== denuncia.id));
      setDenunciaSeleccionada((seleccionada) =>
        seleccionada?.id === denuncia.id ? null : seleccionada
      );
    } catch (error) {
      console.error('Error al ocultar reporte del historial:', error);
      Alert.alert(
        'No se pudo ocultar el reporte',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al archivar el reporte. Inténtalo nuevamente.'
      );
    } finally {
      setOcultandoReporteId(null);
    }
  };

  // Puntos consumidos calculados sobre denuncias/canjes
  const totalPuntosGastados = canjes.reduce(
    (acumulado, canje) => acumulado + canje.puntosDescontados,
    0
  );

  // Funciones de captura e imagen de perfil
  const seleccionarDeGaleria = async () => {
    const resultadoPermiso = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!resultadoPermiso.granted) {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos permiso para acceder a tus fotos y cambiar tu imagen de perfil.'
      );
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!resultado.canceled && resultado.assets[0].uri) {
      setFotoPerfilUri(resultado.assets[0].uri);
    }
  };

  const tomarFotoConCamara = async () => {
    const resultadoPermiso = await ImagePicker.requestCameraPermissionsAsync();

    if (!resultadoPermiso.granted) {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a la cámara para tomar tu foto de perfil.'
      );
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!resultado.canceled && resultado.assets[0].uri) {
      setFotoPerfilUri(resultado.assets[0].uri);
    }
  };

  const mostrarOpcionesFoto = () => {
    Alert.alert(
      'Foto de Perfil',
      'Selecciona una opción para cambiar tu foto:',
      [
        { text: 'Tomar Foto', onPress: tomarFotoConCamara },
        { text: 'Elegir de Galería', onPress: seleccionarDeGaleria },
        { text: 'Cancelar', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar backgroundColor={COLORS.fondoEncabezado} barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={estilos.contenidoScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={alRefrescar}
            colors={[COLORS.botonPrincipal]}
          />
        }
      >
        {/* Cabecera del Perfil con Foto Interactiva */}
        <View style={estilos.cabecera}>
          <TouchableOpacity
            style={estilos.contenedorAvatar}
            onPress={mostrarOpcionesFoto}
            activeOpacity={0.8}
          >
            {fotoPerfilUri ? (
              <Image source={{ uri: fotoPerfilUri }} style={estilos.imagenPerfil} />
            ) : (
              <Ionicons name="person" size={44} color={COLORS.textoVerdeOscuro} />
            )}

            {/* Botón flotante de cámara */}
            <View style={estilos.botonCambiarFoto}>
              <Ionicons name="camera" size={14} color={COLORS.superficieTarjeta} />
            </View>
          </TouchableOpacity>

          <Text style={estilos.nombreUsuario}>{usuario?.name || 'Ciudadano Eco'}</Text>
          <Text style={estilos.correoUsuario}>{usuario?.email || 'sin-email@ecoalerta.com'}</Text>
        </View>

        {/* Tarjeta de Resumen de Puntos */}
        <View style={estilos.contenedorPuntos}>
          <View style={estilos.tarjetaPunto}>
            <MaterialCommunityIcons name="leaf" size={ICON_SIZE.md} color={COLORS.botonPrincipal} />
            <Text style={estilos.valorPunto}>{usuario?.points ?? 0}</Text>
            <Text style={estilos.etiquetaPunto}>Puntos Disponibles</Text>
          </View>
          <View style={estilos.divisorPuntos} />
          <View style={estilos.tarjetaPunto}>
            <MaterialCommunityIcons name="cart-arrow-down" size={ICON_SIZE.md} color={COLORS.textoSecundario} />
            <Text style={[estilos.valorPunto, { color: COLORS.textoSecundario }]}>
              {totalPuntosGastados}
            </Text>
            <Text style={estilos.etiquetaPunto}>Puntos Usados</Text>
          </View>
        </View>

        {/* Pestañas de Navegación Interna */}
        <View style={estilos.barraPestanas}>
          <TouchableOpacity
            style={[
              estilos.botonPestana,
              pestanaActiva === 'denuncias' && estilos.botonPestanaActiva,
            ]}
            onPress={() => setPestanaActiva('denuncias')}
          >
            <Text
              style={[
                estilos.textoPestana,
                pestanaActiva === 'denuncias' && estilos.textoPestanaActiva,
              ]}
            >
              Mis Denuncias ({denuncias.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              estilos.botonPestana,
              pestanaActiva === 'compras' && estilos.botonPestanaActiva,
            ]}
            onPress={() => setPestanaActiva('compras')}
          >
            <Text
              style={[
                estilos.textoPestana,
                pestanaActiva === 'compras' && estilos.textoPestanaActiva,
              ]}
            >
              Canjes ({canjes.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contenido de Pestañas */}
        {cargando ? (
          <ActivityIndicator size="large" color={COLORS.botonPrincipal} style={{ marginTop: SPACING.lg }} />
        ) : (
          <>
            {/* Inicio de Fase 4 (US2): tarjetas conectadas al historial real del ciudadano. */}
            {pestanaActiva === 'denuncias' && (
              <View style={estilos.contenedorLista}>
                {errorDenuncias ? (
                  <View style={estilos.errorHistorial}>
                    <Text style={estilos.textoErrorHistorial}>{errorDenuncias}</Text>
                    <TouchableOpacity onPress={() => void cargarDatosPerfil(true)}>
                      <Text style={estilos.enlaceDetalle}>Reintentar</Text>
                    </TouchableOpacity>
                  </View>
                ) : denuncias.length === 0 ? (
                  <View style={estilos.contenedorVacio}>
                    <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={COLORS.textoSecundario} />
                    <Text style={estilos.textoVacio}>Aún no registraste ninguna alerta ambiental.</Text>
                  </View>
                ) : (
                  denuncias.map((denuncia) => (
                    <View key={denuncia.id} style={estilos.tarjetaElemento}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setDenunciaSeleccionada(denuncia)}
                        accessibilityRole="button"
                        accessibilityLabel={`Ver detalle del reporte ${denuncia.codigo}`}
                      >
                        <View style={estilos.encabezadoTarjeta}>
                          <View style={estilos.encabezadoReporte}>
                            <Text style={estilos.tituloTarjeta}>{denuncia.titulo}</Text>
                            <Text style={estilos.codigoReporte}>{denuncia.codigo}</Text>
                          </View>
                          <Text style={estilos.fechaTarjeta}>
                            {new Date(denuncia.creadoEn).toLocaleDateString()}
                          </Text>
                        </View>
                        <Text style={estilos.subtextoTarjeta}>
                          Categoría: {denuncia.categoria}
                        </Text>
                        <Text style={estilos.subtextoTarjeta}>
                          Dirección: {denuncia.direccion}
                        </Text>
                        <View style={estilos.filaEstadoPuntos}>
                          <ReportStatusBadge estado={denuncia.estado} />
                          <Text style={estilos.puntosReporte}>
                            +{denuncia.puntosOtorgados ?? 0} pts
                          </Text>
                        </View>
                        <Text style={estilos.enlaceDetalle}>Ver detalle</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          estilos.botonOcultar,
                          denuncia.estado === 'PENDIENTE' && estilos.botonOcultarDeshabilitado,
                        ]}
                        onPress={() => confirmarOcultamiento(denuncia)}
                        disabled={denuncia.estado === 'PENDIENTE' || ocultandoReporteId !== null}
                        accessibilityRole="button"
                        accessibilityLabel={`Ocultar reporte ${denuncia.codigo} de mi historial`}
                      >
                        <Ionicons
                          name="eye-off-outline"
                          size={16}
                          color={
                            denuncia.estado === 'PENDIENTE'
                              ? COLORS.textoDesactivado
                              : COLORS.textoPeligro
                          }
                        />
                        <Text
                          style={[
                            estilos.textoBotonOcultar,
                            denuncia.estado === 'PENDIENTE' &&
                              estilos.textoBotonOcultarDeshabilitado,
                          ]}
                        >
                          {denuncia.estado === 'PENDIENTE'
                            ? 'Disponible luego de la evaluación'
                            : 'Ocultar de mi historial'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* Lista de Compras / Canjes */}
            {pestanaActiva === 'compras' && (
              <View style={estilos.contenedorLista}>
                {canjes.length === 0 ? (
                  <View style={estilos.contenedorVacio}>
                    <MaterialCommunityIcons name="cart-off" size={48} color={COLORS.textoSecundario} />
                    <Text style={estilos.textoVacio}>Aún no realizaste canjes de productos ecológicos.</Text>
                  </View>
                ) : (
                  canjes.map((canje) => (
                    <View key={canje.id} style={estilos.tarjetaElemento}>
                      <View style={estilos.encabezadoTarjeta}>
                        <Text style={estilos.tituloTarjeta}>Código: {canje.codigoRetiro}</Text>
                        <Text style={estilos.textoPuntosGastados}>-{canje.puntosDescontados} PTS</Text>
                      </View>
                      <Text style={estilos.subtextoTarjeta}>Fecha: {canje.fecha}</Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
      <Modal
        visible={denunciaSeleccionada !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setDenunciaSeleccionada(null)}
      >
        <View style={estilos.fondoModal}>
          <View style={estilos.contenidoModal}>
            {denunciaSeleccionada ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={estilos.encabezadoModal}>
                  <Text style={estilos.tituloModal}>{denunciaSeleccionada.titulo}</Text>
                  <TouchableOpacity
                    onPress={() => setDenunciaSeleccionada(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar detalle del reporte"
                  >
                    <Ionicons name="close" size={26} color={COLORS.textoVerdeOscuro} />
                  </TouchableOpacity>
                </View>
                <Text style={estilos.codigoReporte}>{denunciaSeleccionada.codigo}</Text>
                <Text style={estilos.subtextoTarjeta}>
                  {denunciaSeleccionada.categoria} ·{' '}
                  {new Date(denunciaSeleccionada.creadoEn).toLocaleDateString()}
                </Text>
                <Text style={estilos.descripcionTarjeta}>{denunciaSeleccionada.descripcion}</Text>
                <Text style={estilos.subtextoTarjeta}>
                  Dirección: {denunciaSeleccionada.direccion}
                </Text>
                <View style={estilos.filaEstadoPuntos}>
                  <ReportStatusBadge estado={denunciaSeleccionada.estado} />
                  <Text style={estilos.puntosReporte}>
                    +{denunciaSeleccionada.puntosOtorgados ?? 0} pts
                  </Text>
                </View>
                {denunciaSeleccionada.estado === 'RECHAZADO' ? (
                  <View style={estilos.seccionDetalle}>
                    <Text style={estilos.labelDetalle}>Motivo del rechazo</Text>
                    <Text style={estilos.textoDetalle}>
                      {denunciaSeleccionada.observacionesAdmin ||
                        'El municipio aún no agregó observaciones.'}
                    </Text>
                  </View>
                ) : null}
                {denunciaSeleccionada.estado === 'RESUELTO' ? (
                  <View style={estilos.seccionDetalle}>
                    <Text style={estilos.labelDetalle}>Antes y después</Text>
                    {denunciaSeleccionada.imagenUrl ? (
                      <>
                        <Text style={estilos.subtituloImagen}>Antes</Text>
                        <Image
                          source={{ uri: denunciaSeleccionada.imagenUrl }}
                          style={estilos.imagenDetalle}
                        />
                      </>
                    ) : null}
                    {denunciaSeleccionada.fotoSolucionUrl ? (
                      <>
                        <Text style={estilos.subtituloImagen}>Después</Text>
                        <Image
                          source={{ uri: denunciaSeleccionada.fotoSolucionUrl }}
                          style={estilos.imagenDetalle}
                        />
                      </>
                    ) : null}
                    {denunciaSeleccionada.informeSolucion ? (
                      <Text style={estilos.textoDetalle}>
                        {denunciaSeleccionada.informeSolucion}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
                <TouchableOpacity
                  style={[
                    estilos.botonOcultar,
                    estilos.botonOcultarDetalle,
                    denunciaSeleccionada.estado === 'PENDIENTE' &&
                      estilos.botonOcultarDeshabilitado,
                  ]}
                  onPress={() => confirmarOcultamiento(denunciaSeleccionada)}
                  disabled={
                    denunciaSeleccionada.estado === 'PENDIENTE' || ocultandoReporteId !== null
                  }
                  accessibilityRole="button"
                >
                  {ocultandoReporteId === denunciaSeleccionada.id ? (
                    <ActivityIndicator size="small" color={COLORS.textoPeligro} />
                  ) : (
                    <Ionicons
                      name="eye-off-outline"
                      size={18}
                      color={
                        denunciaSeleccionada.estado === 'PENDIENTE'
                          ? COLORS.textoDesactivado
                          : COLORS.textoPeligro
                      }
                    />
                  )}
                  <Text
                    style={[
                      estilos.textoBotonOcultar,
                      denunciaSeleccionada.estado === 'PENDIENTE' &&
                        estilos.textoBotonOcultarDeshabilitado,
                    ]}
                  >
                    {denunciaSeleccionada.estado === 'PENDIENTE'
                      ? 'Disponible luego de la evaluación'
                      : 'Ocultar de mi historial'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
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
    paddingBottom: SPACING.lg * 2,
  },
  cabecera: {
    backgroundColor: COLORS.fondoEncabezado,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
  },
  contenedorAvatar: {
    position: 'relative',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.superficieTarjeta,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    elevation: 3,
  },
  imagenPerfil: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  botonCambiarFoto: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.botonPrincipal,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.superficieTarjeta,
  },
  nombreUsuario: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },
  correoUsuario: {
    fontSize: 14,
    color: COLORS.textoSecundario,
    marginTop: 2,
  },
  contenedorPuntos: {
    flexDirection: 'row',
    backgroundColor: COLORS.superficieTarjeta,
    marginHorizontal: SPACING.md,
    marginTop: -20,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  tarjetaPunto: {
    flex: 1,
    alignItems: 'center',
  },
  divisorPuntos: {
    width: 1,
    backgroundColor: COLORS.bordeSuave,
  },
  valorPunto: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textoVerde,
    marginVertical: 2,
  },
  etiquetaPunto: {
    fontSize: 12,
    color: COLORS.textoSecundario,
  },
  barraPestanas: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.fondoTarjeta,
    padding: 4,
  },
  botonPestana: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm - 2,
  },
  botonPestanaActiva: {
    backgroundColor: COLORS.superficieTarjeta,
    elevation: 1,
  },
  textoPestana: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textoSecundario,
  },
  textoPestanaActiva: {
    color: COLORS.textoVerdeOscuro,
  },
  contenedorLista: {
    paddingHorizontal: SPACING.md,
  },
  contenedorVacio: {
    alignItems: 'center',
    marginTop: SPACING.lg,
    gap: SPACING.xs,
  },
  textoVacio: {
    fontSize: 13,
    color: COLORS.textoSecundario,
    textAlign: 'center',
  },
  tarjetaElemento: {
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  encabezadoReporte: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  codigoReporte: {
    color: COLORS.textoVerde,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  filaEstadoPuntos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  puntosReporte: {
    color: COLORS.textoVerdeOscuro,
    fontSize: 13,
    fontWeight: '700',
  },
  enlaceDetalle: {
    color: COLORS.textoVerde,
    fontSize: 12,
    fontWeight: '700',
    marginTop: SPACING.sm,
  },
  errorHistorial: {
    backgroundColor: COLORS.fondoPeligro,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
  },
  botonOcultar: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.bordePeligro,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.fondoPeligro,
  },
  botonOcultarDetalle: {
    marginTop: SPACING.lg,
  },
  botonOcultarDeshabilitado: {
    borderColor: COLORS.bordeSuave,
    backgroundColor: COLORS.fondoTarjeta,
  },
  textoBotonOcultar: {
    color: COLORS.textoPeligro,
    fontSize: 12,
    fontWeight: '700',
  },
  textoBotonOcultarDeshabilitado: {
    color: COLORS.textoDesactivado,
  },
  textoErrorHistorial: {
    color: COLORS.textoPeligro,
    fontSize: 13,
  },
  encabezadoTarjeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  tituloTarjeta: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textoVerdeOscuro,
    flex: 1,
  },
  subtextoTarjeta: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    marginBottom: 2,
  },
  descripcionTarjeta: {
    fontSize: 12,
    color: COLORS.textoVerdeOscuro,
    marginVertical: SPACING.xs,
  },
  imagenEvidencia: {
    width: '100%',
    height: 120,
    borderRadius: BORDER_RADIUS.sm,
    marginVertical: SPACING.xs,
  },
  fechaTarjeta: {
    fontSize: 11,
    color: COLORS.textoSecundario,
  },
  textoPuntosGastados: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textoPeligro,
  },
  fondoModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.superposicionOscura,
  },
  contenidoModal: {
    maxHeight: '88%',
    backgroundColor: COLORS.superficieTarjeta,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  encabezadoModal: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  tituloModal: {
    flex: 1,
    color: COLORS.textoVerdeOscuro,
    fontSize: 20,
    fontWeight: '800',
  },
  seccionDetalle: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.bordeSuave,
  },
  labelDetalle: {
    color: COLORS.textoVerdeOscuro,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  textoDetalle: {
    color: COLORS.textoSecundario,
    fontSize: 14,
    lineHeight: 20,
  },
  subtituloImagen: {
    color: COLORS.textoVerde,
    fontSize: 13,
    fontWeight: '700',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  imagenDetalle: {
    width: '100%',
    height: 210,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.fondoTarjeta,
    marginBottom: SPACING.xs,
  },
});