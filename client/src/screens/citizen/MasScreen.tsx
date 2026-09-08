import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../utils/theme';

export const MasScreen: React.FC = () => {
  const { user: usuario, logout: cerrarSesion } = useAuth();

  const manejarCerrarSesion = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir de tu cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await cerrarSesion();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const mostrarMensajeMokeado = (titulo: string) => {
    Alert.alert(
      titulo,
      'Esta sección se encuentra en desarrollo para la versión beta de EcoAlerta.'
    );
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar backgroundColor={COLORS.fondoEncabezado} barStyle="dark-content" />
      <ScrollView contentContainerStyle={estilos.contenidoScroll}>
        
        {/* Encabezado */}
        <View style={estilos.cabecera}>
          <Text style={estilos.tituloCabecera}>Más Opciones</Text>
          <Text style={estilos.subtituloCabecera}>
            Ajustes, soporte e información general
          </Text>
        </View>

        {/* Sección: Cuenta y Ajustes */}
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>CUENTA</Text>
          
          <TouchableOpacity
            style={estilos.opcionFila}
            onPress={() => mostrarMensajeMokeado('Editar Perfil')}
            activeOpacity={0.7}
          >
            <View style={estilos.contenedorIcono}>
              <Ionicons name="person-outline" size={ICON_SIZE.md} color={COLORS.iconoPrincipal} />
            </View>
            <View style={estilos.textoFila}>
              <Text style={estilos.tituloOpcion}>Editar Perfil</Text>
              <Text style={estilos.subtituloOpcion}>Modifica tus datos personales</Text>
            </View>
            <Feather name="chevron-right" size={ICON_SIZE.md} color={COLORS.textoSecundario} />
          </TouchableOpacity>

          <TouchableOpacity
            style={estilos.opcionFila}
            onPress={() => mostrarMensajeMokeado('Notificaciones')}
            activeOpacity={0.7}
          >
            <View style={estilos.contenedorIcono}>
              <Ionicons name="notifications-outline" size={ICON_SIZE.md} color={COLORS.iconoPrincipal} />
            </View>
            <View style={estilos.textoFila}>
              <Text style={estilos.tituloOpcion}>Notificaciones</Text>
              <Text style={estilos.subtituloOpcion}>Alertas de denuncias y novedades</Text>
            </View>
            <Feather name="chevron-right" size={ICON_SIZE.md} color={COLORS.textoSecundario} />
          </TouchableOpacity>
        </View>

        {/* Sección: Soporte e Información */}
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>SOPORTE Y COMUNIDAD</Text>

          <TouchableOpacity
            style={estilos.opcionFila}
            onPress={() => mostrarMensajeMokeado('Centro de Ayuda')}
            activeOpacity={0.7}
          >
            <View style={estilos.contenedorIcono}>
              <Ionicons name="help-circle-outline" size={ICON_SIZE.md} color={COLORS.iconoPrincipal} />
            </View>
            <View style={estilos.textoFila}>
              <Text style={estilos.tituloOpcion}>Centro de Ayuda y Preguntas</Text>
              <Text style={estilos.subtituloOpcion}>Aprende a realizar reportes efectivos</Text>
            </View>
            <Feather name="chevron-right" size={ICON_SIZE.md} color={COLORS.textoSecundario} />
          </TouchableOpacity>

          <TouchableOpacity
            style={estilos.opcionFila}
            onPress={() => mostrarMensajeMokeado('Términos y Condiciones')}
            activeOpacity={0.7}
          >
            <View style={estilos.contenedorIcono}>
              <MaterialIcons name="security" size={ICON_SIZE.md} color={COLORS.iconoPrincipal} />
            </View>
            <View style={estilos.textoFila}>
              <Text style={estilos.tituloOpcion}>Términos y Privacidad</Text>
              <Text style={estilos.subtituloOpcion}>Políticas de uso de la aplicación</Text>
            </View>
            <Feather name="chevron-right" size={ICON_SIZE.md} color={COLORS.textoSecundario} />
          </TouchableOpacity>
        </View>

        {/* Botón de Cerrar Sesión */}
        <View style={estilos.contenedorCerrarSesion}>
          <TouchableOpacity
            style={estilos.botonCerrarSesion}
            onPress={manejarCerrarSesion}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={ICON_SIZE.md} color={COLORS.textoPeligro} />
            <Text style={estilos.textoCerrarSesion}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Versión de la app */}
        <Text style={estilos.textoVersion}>EcoAlerta v1.0.0 (Beta)</Text>

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
    paddingBottom: SPACING.lg,
  },
  cabecera: {
    backgroundColor: COLORS.fondoEncabezado,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  tituloCabecera: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },
  subtituloCabecera: {
    fontSize: 13,
    color: COLORS.textoSecundario,
    marginTop: SPACING.xs,
  },
  seccion: {
    marginTop: SPACING.sm,
    marginHorizontal: SPACING.md,
  },
  tituloSeccion: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textoVerde,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
    letterSpacing: 0.5,
  },
  opcionFila: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.superficieTarjeta,
    padding: SPACING.md - 2, // 14px de padding interior
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  contenedorIcono: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.fondoTarjeta,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 4,
  },
  textoFila: {
    flex: 1,
  },
  tituloOpcion: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textoVerdeOscuro,
  },
  subtituloOpcion: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    marginTop: 2,
  },
  contenedorCerrarSesion: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  botonCerrarSesion: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.fondoPeligro,
    borderWidth: 1,
    borderColor: COLORS.bordePeligro,
    paddingVertical: SPACING.md - 2,
    borderRadius: BORDER_RADIUS.md,
  },
  textoCerrarSesion: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textoPeligro,
    marginLeft: SPACING.sm,
  },
  textoVersion: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textoDesactivado,
    marginTop: SPACING.lg,
  },
});