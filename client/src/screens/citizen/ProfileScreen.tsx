// src/screens/citizen/ProfileScreen.tsx
// Fusión de Módulos 002 (reportes ciudadanos, historial y ocultamiento) y 006 (vouchers de canje).
import React, { useState, useCallback, useRef } from 'react';
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
import { storeRepository, RedemptionDetail } from '../../repositories/store';
import { CitizenVouchersList } from '../../components/citizen/CitizenVouchersList';
import { reportRepository } from '../../repositories/reports';
import { CitizenReport } from '../../repositories/reports/IReportRepository';
import { ReportStatusBadge } from '../../components/citizen/ReportStatusBadge';

export const ProfileScreen: React.FC = () => {
  const {
    user: usuario,
    logout,
    recargarPerfilUsuario,
    actualizarFotoPerfil,
  } = useAuth();
  const usuarioId = usuario?.id;
  const esCiudadano = usuario?.role === 'citizen';
  const recargarPerfilRef = useRef(recargarPerfilUsuario);
  recargarPerfilRef.current = recargarPerfilUsuario;
  const [pestanaActiva, setPestanaActiva] = useState<'denuncias' | 'canjes'>('denuncias');

  // Estados de datos remotos
  const [denuncias, setDenuncias] = useState<CitizenReport[]>([]);
  const [vouchers, setVouchers] = useState<RedemptionDetail[]>([]);
  const [cargandoDenuncias, setCargandoDenuncias] = useState<boolean>(true);
  const [cargandoVouchers, setCargandoVouchers] = useState<boolean>(true);
  const [refrescando, setRefrescando] = useState<boolean>(false);
  const [errorDenuncias, setErrorDenuncias] = useState<string | null>(null);
  const [denunciaSeleccionada, setDenunciaSeleccionada] = useState<CitizenReport | null>(null);
  const [ocultandoReporteId, setOcultandoReporteId] = useState<string | null>(null);

  const fotoPerfilUri = usuario?.fotoPerfilUri ?? null;

  const cargarDatosPerfil = useCallback(
    async (refrescar = false, sigueActivo: () => boolean = () => true) => {
      if (!usuarioId || !esCiudadano) {
        setDenuncias([]);
        setVouchers([]);
        setCargandoDenuncias(false);
        setCargandoVouchers(false);
        setRefrescando(false);
        return;
      }
      if (refrescar) {
        setRefrescando(true);
      } else {
        setCargandoDenuncias(true);
        setCargandoVouchers(true);
      }

      if (recargarPerfilRef.current) {
        recargarPerfilRef.current().catch((error: unknown) => {
          console.warn('No se pudo actualizar el perfil antes de cargar el historial:', error);
        });
      }

      const cargarDenuncias = async () => {
        try {
          const misDenuncias = await reportRepository.getCitizenReports(usuarioId);
          if (sigueActivo()) {
            setDenuncias(misDenuncias || []);
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
          if (sigueActivo()) setCargandoDenuncias(false);
        }
      };

      const cargarVouchers = async () => {
        try {
          const misVouchers = await storeRepository.getCitizenRedemptions(
            usuarioId || 'demo-user-1'
          );
          if (sigueActivo()) setVouchers(misVouchers || []);
        } catch (error) {
          console.warn('No se pudieron obtener los vouchers de canje:', error);
          if (sigueActivo()) setVouchers([]);
        } finally {
          if (sigueActivo()) setCargandoVouchers(false);
        }
      };

      try {
        await Promise.all([cargarDenuncias(), cargarVouchers()]);
      } finally {
        if (sigueActivo()) {
          setRefrescando(false);
        }
      }
    },
    [usuarioId, esCiudadano]
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

  const cambiarPestana = (nuevaPestana: 'denuncias' | 'canjes') => {
    setPestanaActiva(nuevaPestana);
  };

  const alRefrescar = () => {
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

  // Puntos consumidos calculados sobre vouchers reales
  const totalPuntosGastados = vouchers.reduce(
    (acumulado, v) => acumulado + (v.totalPuntos || 0),
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
      try {
        await actualizarFotoPerfil(resultado.assets[0].uri);
      } catch (error) {
        console.error('Error al guardar la foto de perfil:', error);
        Alert.alert(
          'No se pudo guardar la foto',
          error instanceof Error ? error.message : 'Intenta nuevamente.'
        );
      }
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
      try {
        await actualizarFotoPerfil(resultado.assets[0].uri);
      } catch (error) {
        console.error('Error al guardar la foto de perfil:', error);
        Alert.alert(
          'No se pudo guardar la foto',
          error instanceof Error ? error.message : 'Intenta nuevamente.'
        );
      }
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

  const confirmarCerrarSesion = () => {
    Alert.alert('Cerrar sesión', '¿Quieres salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: () => {
          void logout().catch((error: unknown) => {
            Alert.alert(
              'No se pudo cerrar sesión',
              error instanceof Error ? error.message : 'Inténtalo nuevamente.'
            );
          });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="dark-content" />
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

        {/* Tarjeta de resumen de EcoPuntos */}
        <View style={estilos.contenedorPuntos}>
          <View style={estilos.tarjetaPunto}>
            <MaterialCommunityIcons name="leaf" size={ICON_SIZE.md} color={COLORS.botonPrincipal} />
            <Text style={estilos.valorPunto}>{usuario?.points ?? 0}</Text>
            <Text style={estilos.etiquetaPunto}>EcoPuntos disponibles</Text>
          </View>
          <View style={estilos.divisorPuntos} />
          <View style={estilos.tarjetaPunto}>
            <MaterialCommunityIcons name="cart-arrow-down" size={ICON_SIZE.md} color={COLORS.textoSecundario} />
            <Text style={[estilos.valorPunto, { color: COLORS.textoSecundario }]}>
              {totalPuntosGastados}
            </Text>
            <Text style={estilos.etiquetaPunto}>EcoPuntos usados</Text>
          </View>
        </View>

        {/* Pestañas de Navegación Interna */}
        <View style={estilos.barraPestanas}>
          <TouchableOpacity
            style={[
              estilos.botonPestana,
              pestanaActiva === 'denuncias' && estilos.botonPestanaActiva,
            ]}
            onPress={() => cambiarPestana('denuncias')}
          >
            <Text
              style={[
                estilos.textoPestana,
                pestanaActiva === 'denuncias' && estilos.textoPestanaActiva,
              ]}
            >
              Mis Reportes ({denuncias.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              estilos.botonPestana,
              pestanaActiva === 'canjes' && estilos.botonPestanaActiva,
            ]}
            onPress={() => cambiarPestana('canjes')}
          >
            <Text
              style={[
                estilos.textoPestana,
                pestanaActiva === 'canjes' && estilos.textoPestanaActiva,
              ]}
            >
              Mis Canjes ({vouchers.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contenido de Pestañas */}
        {(pestanaActiva === 'denuncias' ? cargandoDenuncias : cargandoVouchers) ? (
          <View style={{ alignItems: 'center', marginTop: SPACING.lg, gap: SPACING.xs }}>
            <ActivityIndicator size="large" color={COLORS.botonPrincipal} />
            <Text style={{ fontSize: 13, color: COLORS.textoVerdeOscuro, fontWeight: '600' }}>
              Cargando {pestanaActiva === 'denuncias' ? 'mis reportes' : 'mis canjes'}...
            </Text>
          </View>
        ) : (
          <>
            {/* Lista de Reportes Ciudadanos */}
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
                            +{denuncia.puntosOtorgados ?? 0} EcoPuntos
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

            {/* Lista de Vouchers de Canje (Módulo 006) */}
            {pestanaActiva === 'canjes' && (
              <View style={estilos.contenedorLista}>
                <CitizenVouchersList vouchers={vouchers} isLoading={false} />
              </View>
            )}
          </>
        )}

        <TouchableOpacity
          accessibilityRole="button"
          style={estilos.botonCerrarSesion}
          onPress={confirmarCerrarSesion}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={ICON_SIZE.md} color={COLORS.textoPeligro} />
          <Text style={estilos.textoCerrarSesion}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de Detalle de Reporte */}
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
                    +{denunciaSeleccionada.puntosOtorgados ?? 0} EcoPuntos
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
  botonCerrarSesion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.fondoPeligro,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.superficieTarjeta,
  },
  textoCerrarSesion: {
    color: COLORS.textoPeligro,
    fontSize: 15,
    fontWeight: '700',
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
