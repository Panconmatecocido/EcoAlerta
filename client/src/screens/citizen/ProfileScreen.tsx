import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../utils/theme';
import { MOCK_DENUNCIAS, DenunciaMock } from '../../mocks/denuncias';
import { MOCK_COMPRAS, CompraMock } from '../../mocks/compras';

export const ProfileScreen: React.FC = () => {
  const { user: usuario } = useAuth();
  const [pestanaActiva, setPestanaActiva] = useState<'denuncias' | 'compras'>('denuncias');
  
  // Estado local para la foto de perfil elegida
  const [fotoPerfilUri, setFotoPerfilUri] = useState<string | null>(null);

  // Suma total de puntos gastados en compras mokeadas
  const totalPuntosGastados = MOCK_COMPRAS.reduce(
    (acumulado, compra) => acumulado + compra.puntosUsados,
    0
  );

  // Función para seleccionar imagen de la galería
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
      aspect: [1, 1], // Mantiene la foto cuadrada/circular
      quality: 0.8,
    });

    if (!resultado.canceled && resultado.assets[0].uri) {
      setFotoPerfilUri(resultado.assets[0].uri);
    }
  };

  // Función para tomar foto desde la cámara
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

  // Menú modal de opciones al tocar el avatar o la camarita
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

  const obtenerEtiquetaEstado = (estado: DenunciaMock['estado']) => {
    switch (estado) {
      case 'APROBADO':
        return { texto: 'Aprobado', colorTexto: '#2e7d32', colorFondo: '#e8f5e9' };
      case 'PENDIENTE':
        return { texto: 'Pendiente', colorTexto: '#ed6c02', colorFondo: '#fff4e5' };
      case 'RECHAZADO':
        return { texto: 'Rechazado', colorTexto: '#d32f2f', colorFondo: '#fdeded' };
    }
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar backgroundColor={COLORS.fondoEncabezado} barStyle="dark-content" />
      <ScrollView contentContainerStyle={estilos.contenidoScroll}>
        
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
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <Text style={estilos.nombreUsuario}>{usuario?.name || 'Ciudadano Eco'}</Text>
          <Text style={estilos.correoUsuario}>{usuario?.email || 'sin-email@ecoalerta.com'}</Text>
        </View>

        {/* Tarjeta de Resumen de Puntos */}
        <View style={estilos.contenedorPuntos}>
          <View style={estilos.tarjetaPunto}>
            <MaterialCommunityIcons name="leaf" size={24} color={COLORS.iconoPrincipal} />
            <Text style={estilos.valorPunto}>{usuario?.points ?? 0}</Text>
            <Text style={estilos.etiquetaPunto}>Puntos Disponibles</Text>
          </View>
          <View style={estilos.divisorPuntos} />
          <View style={estilos.tarjetaPunto}>
            <MaterialCommunityIcons name="cart-arrow-down" size={24} color={COLORS.textoSecundario} />
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
              Mis Denuncias ({MOCK_DENUNCIAS.length})
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
              Canjes ({MOCK_COMPRAS.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Denuncias */}
        {pestanaActiva === 'denuncias' && (
          <View style={estilos.contenedorLista}>
            {MOCK_DENUNCIAS.map((denuncia) => {
              const etiqueta = obtenerEtiquetaEstado(denuncia.estado);
              return (
                <View key={denuncia.id} style={estilos.tarjetaElemento}>
                  <View style={estilos.encabezadoTarjeta}>
                    <Text style={estilos.tituloTarjeta}>{denuncia.titulo}</Text>
                    <View style={[estilos.placaEstado, { backgroundColor: etiqueta.colorFondo }]}>
                      <Text style={[estilos.textoPlaca, { color: etiqueta.colorTexto }]}>
                        {etiqueta.texto}
                      </Text>
                    </View>
                  </View>
                  <Text style={estilos.subtextoTarjeta}>Categoría: {denuncia.categoria}</Text>
                  <Text style={estilos.subtextoTarjeta}>Ubicación: {denuncia.ubicacion}</Text>
                  <Text style={estilos.fechaTarjeta}>Fecha: {denuncia.fecha}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Lista de Compras / Canjes */}
        {pestanaActiva === 'compras' && (
          <View style={estilos.contenedorLista}>
            {MOCK_COMPRAS.map((compra) => (
              <View key={compra.id} style={estilos.tarjetaElemento}>
                <View style={estilos.encabezadoTarjeta}>
                  <Text style={estilos.tituloTarjeta}>{compra.nombreProducto}</Text>
                  <Text style={estilos.textoPuntosGastados}>-{compra.puntosUsados} pts</Text>
                </View>
                <Text style={estilos.subtextoTarjeta}>Estado del canje: {compra.estado}</Text>
                <Text style={estilos.fechaTarjeta}>Fecha: {compra.fecha}</Text>
              </View>
            ))}
          </View>
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
    paddingBottom: 24,
  },
  cabecera: {
    backgroundColor: COLORS.fondoEncabezado,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  contenedorAvatar: {
    position: 'relative',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.superficieTarjeta,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
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
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 12,
    paddingVertical: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tarjetaPunto: {
    flex: 1,
    alignItems: 'center',
  },
  divisorPuntos: {
    width: 1,
    backgroundColor: '#e5eedb',
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
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: COLORS.fondoTarjeta,
    padding: 4,
  },
  botonPestana: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
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
    paddingHorizontal: 16,
  },
  tarjetaElemento: {
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5eedb',
  },
  encabezadoTarjeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tituloTarjeta: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textoVerdeOscuro,
    flex: 1,
  },
  placaEstado: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  textoPlaca: {
    fontSize: 11,
    fontWeight: '700',
  },
  subtextoTarjeta: {
    fontSize: 13,
    color: COLORS.textoSecundario,
    marginBottom: 2,
  },
  fechaTarjeta: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  textoPuntosGastados: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textoVerde,
  },
});