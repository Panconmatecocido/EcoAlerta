// src/screens/citizen/ProfileScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
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
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../utils/theme';
import { denunciaService, DenunciaCiudadano } from '../../services/denunciasService';
import { storeRepository, RedemptionDetail } from '../../repositories/store';
import { BarraEstadoDenuncia } from '../../components/BarraEstadoDenuncia';
import { CitizenVouchersList } from '../../components/citizen/CitizenVouchersList';

export const ProfileScreen: React.FC = () => {
  const { user: usuario, recargarPerfilUsuario } = useAuth();
  const [pestanaActiva, setPestanaActiva] = useState<'denuncias' | 'canjes'>('denuncias');

  // Estados de datos remotos
  const [denuncias, setDenuncias] = useState<DenunciaCiudadano[]>([]);
  const [vouchers, setVouchers] = useState<RedemptionDetail[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [refrescando, setRefrescando] = useState<boolean>(false);

  // Foto de perfil local o del usuario
  const [fotoPerfilUri, setFotoPerfilUri] = useState<string | null>(null);

  // Carga de datos desde la API
  const cargarDatosPerfil = useCallback(async (esRefresco = false) => {
    if (!esRefresco) {
      setCargando(true);
    }
    try {
      if (recargarPerfilUsuario) {
        recargarPerfilUsuario().catch(() => {});
      }
      const promesas: [Promise<DenunciaCiudadano[]>, Promise<RedemptionDetail[]>] = [
        denunciaService.obtenerMisDenuncias(usuario?.id).catch((err) => {
          console.warn('No se pudieron obtener las denuncias:', err.message);
          return [];
        }),
        storeRepository.getCitizenRedemptions(usuario?.id || 'demo-user-1').catch((err) => {
          console.warn('No se pudieron obtener los vouchers de canje:', err.message);
          return [];
        }),
      ];

      const [misDenuncias, misVouchers] = await Promise.all(promesas);
      setDenuncias(misDenuncias || []);
      setVouchers(misVouchers || []);
    } catch (error) {
      console.error('Error al cargar datos del perfil:', error);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [usuario?.id]);

  useEffect(() => {
    cargarDatosPerfil(false);
  }, [cargarDatosPerfil]);

  const cambiarPestana = (nuevaPestana: 'denuncias' | 'canjes') => {
    if (cargando) return;
    setPestanaActiva(nuevaPestana);
    cargarDatosPerfil(false);
  };

  const alRefrescar = () => {
    setRefrescando(true);
    cargarDatosPerfil(true);
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
            onPress={() => cambiarPestana('denuncias')}
            disabled={cargando}
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
            disabled={cargando}
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
        {cargando ? (
          <View style={{ alignItems: 'center', marginTop: SPACING.lg, gap: SPACING.xs }}>
            <ActivityIndicator size="large" color={COLORS.botonPrincipal} />
            <Text style={{ fontSize: 13, color: COLORS.textoVerdeOscuro, fontWeight: '600' }}>
              Cargando {pestanaActiva === 'denuncias' ? 'mis reportes' : 'mis canjes'}...
            </Text>
          </View>
        ) : (
          <>
            {/* Lista de Denuncias / Reportes */}
            {pestanaActiva === 'denuncias' && (
              <View style={estilos.contenedorLista}>
                {denuncias.length === 0 ? (
                  <View style={estilos.contenedorVacio}>
                    <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={COLORS.textoSecundario} />
                    <Text style={estilos.textoVacio}>Aún no registraste ninguna alerta ambiental.</Text>
                  </View>
                ) : (
                  denuncias.map((denuncia) => (
                    <View key={denuncia.id} style={estilos.tarjetaElemento}>
                      <View style={estilos.encabezadoTarjeta}>
                        <Text style={estilos.tituloTarjeta}>{denuncia.titulo}</Text>
                        <Text style={estilos.fechaTarjeta}>{denuncia.fecha}</Text>
                      </View>

                      <Text style={estilos.subtextoTarjeta}>📌 Categoría: {denuncia.categoria}</Text>
                      <Text style={estilos.subtextoTarjeta}>📍 Ubicación: {denuncia.ubicacion}</Text>

                      {denuncia.fotoUrl && (
                        <Image source={{ uri: denuncia.fotoUrl }} style={estilos.imagenEvidencia} />
                      )}

                      <Text style={estilos.descripcionTarjeta} numberOfLines={2}>
                        {denuncia.descripcion}
                      </Text>

                      {/* Componente dinámico de trazabilidad */}
                      <BarraEstadoDenuncia
                        estado={denuncia.estado}
                        puntosOtorgados={denuncia.puntosOtorgados}
                      />
                    </View>
                  ))
                )}
              </View>
            )}

            {/* Lista de Vouchers de Canje (Módulo 006 - US3) */}
            {pestanaActiva === 'canjes' && (
              <View style={estilos.contenedorLista}>
                <CitizenVouchersList vouchers={vouchers} isLoading={false} />
              </View>
            )}
          </>
        )}
      </ScrollView>
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
});