// En src/screens/admin/AdminHomeScreen.tsx

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import { MetricasAdmin } from '../../mocks/adminDashboard';
import Header from '../../components/Header';
import {
  AdminNotification,
  buildAdminNotifications,
  hasUnreadAdminNotifications,
} from '../../utils/adminNotifications';
import { compressImage, imageUriToDataUri } from '../../utils/imageCompressor';

const ADMIN_NOTIFICATIONS_POLL_INTERVAL = 30_000;

export const AdminHomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { logout, user, actualizarPerfilAdmin } = useAuth();
  const [metricas, setMetricas] = useState<MetricasAdmin | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [notificaciones, setNotificaciones] = useState<AdminNotification[]>([]);
  const [clavesVistas, setClavesVistas] = useState<Set<string>>(new Set());
  const [cargandoNotificaciones, setCargandoNotificaciones] = useState(true);
  const [errorNotificaciones, setErrorNotificaciones] = useState<string | null>(null);
  const [bandejaVisible, setBandejaVisible] = useState(false);
  const [recargaNotificaciones, setRecargaNotificaciones] = useState(0);
  const [perfilVisible, setPerfilVisible] = useState(false);
  const [nombrePerfil, setNombrePerfil] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [procesandoFoto, setProcesandoFoto] = useState(false);
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  const claveAlmacenamiento = `@ecoalerta_admin_notifications_seen:${user?.id ?? 'admin'}`;
  const notificacionesSinLeer = hasUnreadAdminNotifications(notificaciones, clavesVistas);

  const cargarDatosServidor = async () => {
    try {
      setCargando(true);
      const datosMetricas = await adminService.obtenerMetricas();
      setMetricas(datosMetricas);
    } catch (error) {
      console.error('No se pudieron obtener las métricas reales:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatosServidor();
  }, []);

  useEffect(() => {
    let activa = true;

    const cargarClavesVistas = async () => {
      try {
        const valorGuardado = await AsyncStorage.getItem(claveAlmacenamiento);
        if (!activa || valorGuardado === null) return;

        const claves: unknown = JSON.parse(valorGuardado);
        if (!Array.isArray(claves) || !claves.every((clave) => typeof clave === 'string')) {
          throw new Error('El registro de notificaciones vistas no tiene un formato válido.');
        }
        setClavesVistas(new Set(claves));
      } catch (error) {
        console.error('No se pudieron cargar las notificaciones vistas:', error);
        if (activa) {
          setErrorNotificaciones('No se pudo recuperar el estado de lectura de las notificaciones.');
        }
      }
    };

    void cargarClavesVistas();
    return () => {
      activa = false;
    };
  }, [claveAlmacenamiento]);

  useFocusEffect(
    useCallback(() => {
      let activa = true;

      const actualizarNotificaciones = async () => {
        try {
          const [pendientes, porValidar, porCertificar] = await Promise.all([
            adminService.obtenerDenuncias({ estado: 'PENDIENTE' }),
            adminService.obtenerDenuncias({ estado: 'VERIFICADO_PENDIENTE' }),
            adminService.obtenerDenuncias({ estado: 'RESUELTO_TECNICO' }),
          ]);
          if (!activa) return;

          setNotificaciones(buildAdminNotifications([...pendientes, ...porValidar, ...porCertificar]));
          setErrorNotificaciones(null);
        } catch (error) {
          console.error('No se pudieron actualizar las notificaciones administrativas:', error);
          if (activa) {
            setErrorNotificaciones('No se pudieron actualizar las notificaciones. Inténtalo nuevamente.');
          }
        } finally {
          if (activa) setCargandoNotificaciones(false);
        }
      };

      void actualizarNotificaciones();
      const intervalo = setInterval(
        () => void actualizarNotificaciones(),
        ADMIN_NOTIFICATIONS_POLL_INTERVAL
      );

      return () => {
        activa = false;
        clearInterval(intervalo);
      };
    }, [recargaNotificaciones])
  );

  const marcarNotificacionesVistas = async () => {
    const nuevasClavesVistas = new Set([
      ...clavesVistas,
      ...notificaciones.map((notificacion) => notificacion.key),
    ]);

    try {
      await AsyncStorage.setItem(
        claveAlmacenamiento,
        JSON.stringify([...nuevasClavesVistas])
      );
      setClavesVistas(nuevasClavesVistas);
    } catch (error) {
      console.error('No se pudo guardar el estado de lectura de notificaciones:', error);
      Alert.alert(
        'No se pudo guardar',
        'La bandeja se abrirá, pero no se pudo guardar cuáles notificaciones ya leíste.'
      );
    }
  };

  const abrirBandeja = () => {
    setBandejaVisible(true);
    void marcarNotificacionesVistas();
  };

  const abrirReporte = (notificacion: AdminNotification) => {
    setBandejaVisible(false);
    navigation.navigate('DenunciasAdmin', { filtro: notificacion.state });
  };

  const abrirEdicionPerfil = () => {
    setNombrePerfil(user?.name ?? '');
    setFotoPerfil(user?.fotoPerfilUri ?? null);
    setPerfilVisible(true);
  };

  const seleccionarFotoPerfil = async (origen: 'camera' | 'gallery') => {
    setProcesandoFoto(true);
    try {
      const permiso =
        origen === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert(
          'Permiso requerido',
          origen === 'camera'
            ? 'Habilita el acceso a la cámara para tomar tu foto.'
            : 'Habilita el acceso a tus fotos para elegir una imagen de perfil.'
        );
        return;
      }

      const resultado =
        origen === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.75,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.75,
            });
      if (resultado.canceled || resultado.assets.length === 0) return;

      const comprimida = await compressImage(resultado.assets[0].uri);
      setFotoPerfil(await imageUriToDataUri(comprimida.uri));
    } catch (error) {
      console.error('No se pudo procesar la foto del administrador:', error);
      Alert.alert(
        'No se pudo cargar la foto',
        error instanceof Error ? error.message : 'Inténtalo nuevamente.'
      );
    } finally {
      setProcesandoFoto(false);
    }
  };

  const guardarPerfilAdmin = async () => {
    if (!fotoPerfil) {
      Alert.alert('Foto requerida', 'Toma o elige una foto de perfil antes de guardar.');
      return;
    }
    setGuardandoPerfil(true);
    try {
      await actualizarPerfilAdmin(nombrePerfil, fotoPerfil);
      setPerfilVisible(false);
      Alert.alert('Perfil actualizado', 'Tu nombre y foto se guardaron correctamente.');
    } catch (error) {
      console.error('No se pudo actualizar el perfil del administrador:', error);
      Alert.alert(
        'No se pudo actualizar el perfil',
        error instanceof Error ? error.message : 'Inténtalo nuevamente.'
      );
    } finally {
      setGuardandoPerfil(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <Header
        onPressNotifications={abrirBandeja}
        unreadNotifications={notificacionesSinLeer}
        rightContent={
          <TouchableOpacity
            style={styles.botonSalir}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            onPress={() => {
              void logout('login').catch((error: unknown) => {
                Alert.alert(
                  'No se pudo cerrar sesión',
                  error instanceof Error ? error.message : 'Inténtalo nuevamente.'
                );
              });
            }}
          >
            <MaterialCommunityIcons name="logout" size={ICON_SIZE.sm} color={COLORS.textoPeligro} />
            <Text style={styles.textoBotonSalir}>Salir</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView
        style={styles.contenedor}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.tarjetaBienvenida}
          onPress={abrirEdicionPerfil}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Editar nombre y foto de perfil del administrador"
        >
          {user?.fotoPerfilUri ? (
            <Image source={{ uri: user.fotoPerfilUri }} style={styles.iconoBienvenida} />
          ) : (
            <View style={styles.iconoBienvenida}>
              <MaterialCommunityIcons name="account-tie" size={30} color={COLORS.botonPrincipal} />
            </View>
          )}
          <View style={styles.textosBienvenida}>
            <Text style={styles.etiquetaBienvenida}>¡Bienvenido!</Text>
            <Text style={styles.nombreAdministrador} numberOfLines={1} ellipsizeMode="tail">
              {user?.name || 'Administrador'}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="pencil-outline"
            size={ICON_SIZE.md}
            color={COLORS.textoSecundario}
          />
        </TouchableOpacity>

        {/* Resumen Operativo */}
        <View style={styles.cabeceraSeccion}>
          <Text style={styles.tituloSeccion}>Resumen Operativo Global</Text>
          <TouchableOpacity onPress={cargarDatosServidor}>
            <MaterialCommunityIcons name="refresh" size={ICON_SIZE.md} color={COLORS.botonPrincipal} />
          </TouchableOpacity>
        </View>

        {cargando ? (
          <ActivityIndicator size="large" color={COLORS.botonPrincipal} style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.redMetricas}>
            <TouchableOpacity
              style={[styles.tarjetaMetrica, { backgroundColor: COLORS.fondoAdvertencia }]}
              onPress={() => navigation.navigate('DenunciasAdmin', { filtro: 'PENDIENTE' })}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="clock-alert-outline"
                size={ICON_SIZE.lg}
                color={COLORS.textoAdvertencia}
              />
              <Text style={[styles.valorMetrica, { color: COLORS.textoAdvertencia }]}>
                {metricas?.denunciasPendientes ?? 0}
              </Text>
              <Text style={styles.etiquetaMetrica}>Pendientes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tarjetaMetrica, { backgroundColor: COLORS.fondoTarjeta }]}
              onPress={() => navigation.navigate('DenunciasAdmin', { filtro: 'EN_PROCESO' })}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="progress-wrench"
                size={ICON_SIZE.lg}
                color={COLORS.botonPrincipal}
              />
              <Text style={[styles.valorMetrica, { color: COLORS.botonPrincipal }]}>
                {metricas?.denunciasEnProceso ?? 0}
              </Text>
              <Text style={styles.etiquetaMetrica}>En Proceso</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tarjetaMetrica, { backgroundColor: COLORS.fondoTarjeta }]}
              onPress={() => navigation.navigate('DenunciasAdmin', { filtro: 'RESUELTO' })}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={ICON_SIZE.lg}
                color={COLORS.textoVerdeOscuro}
              />
              <Text style={[styles.valorMetrica, { color: COLORS.textoVerdeOscuro }]}>
                {metricas?.denunciasResueltas ?? 0}
              </Text>
              <Text style={styles.etiquetaMetrica}>Resueltas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tarjetaMetrica, { backgroundColor: COLORS.superficieTarjeta }]}
              onPress={() => navigation.navigate('AgentesAdmin')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="account-hard-hat"
                size={ICON_SIZE.lg}
                color={COLORS.textoSecundario}
              />
              <Text style={[styles.valorMetrica, { color: COLORS.textoSecundario }]}>
                {metricas?.totalAgentesActivos ?? 0}
              </Text>
              <Text style={styles.etiquetaMetrica}>Agentes Activos</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Acceso Rápido al ABM de Catálogo y Sucursales */}
        <Text style={styles.tituloSeccion}>Gestión Municipal de Insumos</Text>
        <TouchableOpacity
          style={styles.tarjetaAccesoRapido}
          onPress={() => navigation.navigate('ProductosAdmin')}
          activeOpacity={0.8}
        >
          <View style={styles.iconoAccesoRapido}>
            <MaterialCommunityIcons name="storefront-outline" size={28} color={COLORS.botonPrincipal} />
          </View>
          <View style={styles.textosAccesoRapido}>
            <Text style={styles.tituloAccesoRapido}>ABM de Catálogo y Sucursales</Text>
            <Text style={styles.descripcionAccesoRapido}>
              Gestionar stock, premios ecológicos, baja lógica y puntos de retiro municipales.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textoSecundario} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tarjetaAccesoRapido}
          onPress={() => navigation.navigate('UsuariosAdmin', { rol: 'AGENT' })}
          activeOpacity={0.8}
        >
          <View style={styles.iconoAccesoRapido}>
            <MaterialCommunityIcons
              name="account-multiple-plus-outline"
              size={28}
              color={COLORS.botonPrincipal}
            />
          </View>
          <View style={styles.textosAccesoRapido}>
            <Text style={styles.tituloAccesoRapido}>Crear cuenta de personal</Text>
            <Text style={styles.descripcionAccesoRapido}>
              Dar de alta agentes de campo y colaboradores municipales.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textoSecundario} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tarjetaAccesoRapido}
          onPress={() => navigation.navigate('ColaboradoresAdmin')}
          activeOpacity={0.8}
        >
          <View style={styles.iconoAccesoRapido}>
            <MaterialCommunityIcons
              name="account-badge-outline"
              size={28}
              color={COLORS.botonPrincipal}
            />
          </View>
          <View style={styles.textosAccesoRapido}>
            <Text style={styles.tituloAccesoRapido}>Administrar colaboradores</Text>
            <Text style={styles.descripcionAccesoRapido}>
              Consultar el personal de entrega y actualizar su estado de servicio.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textoSecundario} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tarjetaAccesoRapido}
          onPress={() => navigation.navigate('CuentasPersonalAdmin')}
          activeOpacity={0.8}
        >
          <View style={styles.iconoAccesoRapido}>
            <MaterialCommunityIcons
              name="account-multiple-remove"
              size={30}
              color={COLORS.botonPrincipal}
            />
          </View>
          <View style={styles.textosAccesoRapido}>
            <Text style={styles.tituloAccesoRapido}>Administrar cuentas de personal</Text>
            <Text style={styles.descripcionAccesoRapido}>
              Consultar agentes y colaboradores, y eliminar sus cuentas.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textoSecundario} />
        </TouchableOpacity>

        {/* Sección Auditoría de Actividad */}
        <Text style={styles.tituloSeccion}>Últimas Acciones del Personal</Text>
        <View style={styles.contenedorAuditoria}>
          <View style={styles.itemAuditoria}>
            <MaterialCommunityIcons name="shield-check" size={20} color={COLORS.botonPrincipal} />
            <View style={styles.textosAuditoria}>
              <Text style={styles.tituloAuditoria}>Asignación de Inspector</Text>
              <Text style={styles.detalleAuditoria}>Admin asignó a Inspector Pérez a REP-2026-002</Text>
            </View>
            <Text style={styles.horaAuditoria}>10m</Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={perfilVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!guardandoPerfil && !procesandoFoto) setPerfilVisible(false);
        }}
      >
        <View style={styles.fondoModal}>
          <View style={styles.contenedorModal}>
            <View style={styles.encabezadoModal}>
              <View>
                <Text style={styles.tituloModal}>Mi perfil</Text>
                <Text style={styles.subtituloModal}>Actualiza tu nombre y foto</Text>
              </View>
              <TouchableOpacity
                style={styles.botonCerrarModal}
                onPress={() => setPerfilVisible(false)}
                disabled={guardandoPerfil || procesandoFoto}
                accessibilityRole="button"
                accessibilityLabel="Cerrar edición de perfil"
              >
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textoSecundario} />
              </TouchableOpacity>
            </View>

            <View style={styles.editorFotoPerfil}>
              {fotoPerfil ? (
                <Image source={{ uri: fotoPerfil }} style={styles.fotoPerfilAdmin} />
              ) : (
                <View style={styles.fotoPerfilAdmin}>
                  <MaterialCommunityIcons
                    name="account-tie"
                    size={42}
                    color={COLORS.textoSecundario}
                  />
                </View>
              )}
              <View style={styles.accionesFotoPerfil}>
                <TouchableOpacity
                  style={styles.botonFotoPerfil}
                  onPress={() => void seleccionarFotoPerfil('camera')}
                  disabled={procesandoFoto || guardandoPerfil}
                >
                  <MaterialCommunityIcons name="camera-outline" size={18} color={COLORS.botonPrincipal} />
                  <Text style={styles.textoBotonFotoPerfil}>Tomar foto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.botonFotoPerfil}
                  onPress={() => void seleccionarFotoPerfil('gallery')}
                  disabled={procesandoFoto || guardandoPerfil}
                >
                  <MaterialCommunityIcons name="image-outline" size={18} color={COLORS.botonPrincipal} />
                  <Text style={styles.textoBotonFotoPerfil}>Elegir de galería</Text>
                </TouchableOpacity>
              </View>
            </View>

            {procesandoFoto ? (
              <ActivityIndicator color={COLORS.botonPrincipal} style={styles.procesandoPerfil} />
            ) : null}

            <Text style={styles.etiquetaCampoPerfil}>Nombre</Text>
            <TextInput
              style={styles.inputPerfil}
              value={nombrePerfil}
              onChangeText={setNombrePerfil}
              placeholder="Nombre del administrador"
              placeholderTextColor={COLORS.textoDesactivado}
              autoCapitalize="words"
              maxLength={80}
              editable={!guardandoPerfil && !procesandoFoto}
              accessibilityLabel="Nombre del administrador"
            />

            <TouchableOpacity
              style={[
                styles.botonGuardarPerfil,
                (guardandoPerfil || procesandoFoto) && styles.botonPerfilDeshabilitado,
              ]}
              onPress={() => void guardarPerfilAdmin()}
              disabled={guardandoPerfil || procesandoFoto}
            >
              {guardandoPerfil ? (
                <ActivityIndicator color={COLORS.superficieTarjeta} />
              ) : (
                <Text style={styles.textoGuardarPerfil}>Guardar cambios</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={bandejaVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBandejaVisible(false)}
      >
        <View style={styles.fondoModal}>
          <View style={styles.contenedorModal}>
            <View style={styles.encabezadoModal}>
              <View>
                <Text style={styles.tituloModal}>Notificaciones</Text>
                <Text style={styles.subtituloModal}>Reportes que requieren atención municipal</Text>
              </View>
              <TouchableOpacity
                style={styles.botonCerrarModal}
                onPress={() => setBandejaVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Cerrar notificaciones"
              >
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textoSecundario} />
              </TouchableOpacity>
            </View>

            {errorNotificaciones && (
              <View style={styles.errorNotificaciones}>
                <Text style={styles.textoErrorNotificaciones}>{errorNotificaciones}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setCargandoNotificaciones(true);
                    setRecargaNotificaciones((valor) => valor + 1);
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.textoReintentar}>Reintentar</Text>
                </TouchableOpacity>
              </View>
            )}

            {cargandoNotificaciones ? (
              <ActivityIndicator size="large" color={COLORS.botonPrincipal} style={styles.cargandoModal} />
            ) : notificaciones.length === 0 ? (
              <View style={styles.vacioNotificaciones}>
                <MaterialCommunityIcons
                  name="bell-check-outline"
                  size={38}
                  color={COLORS.textoSecundario}
                />
                <Text style={styles.textoVacioNotificaciones}>
                  No hay reportes que requieran atención por el momento.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.listaNotificaciones}
                showsVerticalScrollIndicator={false}
              >
                {notificaciones.map((notificacion) => (
                  <TouchableOpacity
                    key={notificacion.key}
                    style={styles.itemNotificacion}
                    onPress={() => abrirReporte(notificacion)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.iconoNotificacion}>
                      <MaterialCommunityIcons
                        name={
                          notificacion.state === 'PENDIENTE'
                            ? 'file-alert-outline'
                            : notificacion.state === 'VERIFICADO_PENDIENTE'
                              ? 'clipboard-check-outline'
                              : 'check-decagram-outline'
                        }
                        size={22}
                        color={COLORS.botonPrincipal}
                      />
                    </View>
                    <View style={styles.textosNotificacion}>
                      <Text style={styles.tituloNotificacion}>{notificacion.title}</Text>
                      <Text style={styles.detalleNotificacion}>
                        {notificacion.code} · {notificacion.description}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={22}
                      color={COLORS.textoSecundario}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  },
  contenido: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg * 2,
  },
  tarjetaBienvenida: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    backgroundColor: COLORS.superficieTarjeta,
  },
  iconoBienvenida: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.fondoTarjeta,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    overflow: 'hidden',
  },
  textosBienvenida: {
    flex: 1,
  },
  etiquetaBienvenida: {
    fontSize: 14,
    color: COLORS.textoSecundario,
  },
  nombreAdministrador: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  editorFotoPerfil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  fotoPerfilAdmin: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.fondoTarjeta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accionesFotoPerfil: {
    flex: 1,
    gap: SPACING.xs,
  },
  botonFotoPerfil: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.fondoTarjeta,
  },
  textoBotonFotoPerfil: {
    color: COLORS.textoVerdeOscuro,
    fontSize: 13,
    fontWeight: '600',
  },
  procesandoPerfil: {
    marginBottom: SPACING.sm,
  },
  etiquetaCampoPerfil: {
    marginBottom: SPACING.xs,
    color: COLORS.textoVerdeOscuro,
    fontSize: 13,
    fontWeight: '700',
  },
  inputPerfil: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.fondoAplicacion,
    color: COLORS.textoVerdeOscuro,
    paddingHorizontal: SPACING.sm,
    fontSize: 15,
  },
  botonGuardarPerfil: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.botonPrincipal,
  },
  botonPerfilDeshabilitado: {
    opacity: 0.6,
  },
  textoGuardarPerfil: {
    color: COLORS.superficieTarjeta,
    fontSize: 15,
    fontWeight: '700',
  },
  botonSalir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.fondoPeligro,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.bordePeligro,
  },
  textoBotonSalir: {
    color: COLORS.textoPeligro,
    fontSize: 12,
    fontWeight: 'bold',
  },
  fondoModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  contenedorModal: {
    maxHeight: '82%',
    minHeight: 260,
    backgroundColor: COLORS.superficieTarjeta,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  encabezadoModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  tituloModal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  subtituloModal: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    marginTop: 2,
  },
  botonCerrarModal: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listaNotificaciones: {
    flexGrow: 0,
  },
  itemNotificacion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.bordeSuave,
    gap: SPACING.sm,
  },
  iconoNotificacion: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.fondoTarjeta,
  },
  textosNotificacion: {
    flex: 1,
  },
  tituloNotificacion: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  detalleNotificacion: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    marginTop: 2,
  },
  cargandoModal: {
    marginVertical: SPACING.xl,
  },
  vacioNotificaciones: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  textoVacioNotificaciones: {
    fontSize: 14,
    color: COLORS.textoSecundario,
    textAlign: 'center',
  },
  errorNotificaciones: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.fondoAdvertencia,
    marginBottom: SPACING.sm,
  },
  textoErrorNotificaciones: {
    color: COLORS.textoAdvertencia,
    fontSize: 13,
  },
  textoReintentar: {
    color: COLORS.botonPrincipal,
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: SPACING.xs,
  },
  cabeceraSeccion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  tituloSeccion: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  redMetricas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tarjetaMetrica: {
    width: '48%',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    alignItems: 'center',
  },
  valorMetrica: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: SPACING.xs,
  },
  etiquetaMetrica: {
    fontSize: 12,
    color: COLORS.textoSecundario,
  },
  contenedorAuditoria: {
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    marginTop: SPACING.xs,
  },
  itemAuditoria: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  textosAuditoria: {
    flex: 1,
  },
  tituloAuditoria: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  detalleAuditoria: {
    fontSize: 11,
    color: COLORS.textoSecundario,
  },
  horaAuditoria: {
    fontSize: 10,
    color: COLORS.textoDesactivado,
  },
  tarjetaAccesoRapido: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  iconoAccesoRapido: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.fondoTarjeta,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  textosAccesoRapido: {
    flex: 1,
    marginRight: SPACING.xs,
  },
  tituloAccesoRapido: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  descripcionAccesoRapido: {
    fontSize: 11,
    color: COLORS.textoSecundario,
    marginTop: 2,
  },
});