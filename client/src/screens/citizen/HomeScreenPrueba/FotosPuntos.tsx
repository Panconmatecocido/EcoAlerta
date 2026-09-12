// src/screens/citizen/HomeScreenPrueba/FotosPuntos.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../../utils/theme';

const { width } = Dimensions.get('window');
const ANCHO_TARJETA = width * 0.48;

interface FotoDesafio {
  id: string;
  titulo: string;
  subtitulo: string;
  puntos: number;
  urlImagen: string;
}

const DESAFIOS_FOTOS: FotoDesafio[] = [
  {
    id: '1',
    titulo: 'Microbasural',
    subtitulo: 'Basura en la vía pública',
    puntos: 50,
    urlImagen:
      'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '2',
    titulo: 'Punto Verde',
    subtitulo: 'Contenedor lleno / desborde',
    puntos: 30,
    urlImagen:
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '3',
    titulo: 'Espacio Público',
    subtitulo: 'Ramas caídas o parque dañado',
    puntos: 40,
    urlImagen:
      'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
  },
];

export const FotosPuntos: React.FC = () => {
  const navigation = useNavigation<any>();

  const irACamara = () => {
    navigation.navigate('Camara');
  };

  return (
    <View style={styles.container}>
      {/* Título de la sección */}
      <View style={styles.header}>
        <View style={styles.tituloContainer}>
          <Ionicons
            name="camera-outline"
            size={ICON_SIZE.lg}
            color={COLORS.iconoPrincipal}
          />
          <Text style={styles.titulo}>Sumá puntos reportando</Text>
        </View>

        <TouchableOpacity activeOpacity={0.7} onPress={irACamara}>
          <Text style={styles.verTodo}>Reportar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtituloGeneral}>
        Sacá una foto de estos problemas urbanos y sumá puntos
      </Text>

      {/* 3 Fotos Horizontales */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {DESAFIOS_FOTOS.map((desafio) => (
          <TouchableOpacity
            key={desafio.id}
            style={styles.card}
            activeOpacity={0.85}
            onPress={irACamara}
          >
            {/* Imagen del problema ambiental */}
            <View style={styles.imagenContainer}>
              <Image
                source={{ uri: desafio.urlImagen }}
                style={styles.imagen}
                resizeMode="cover"
              />

              {/* Insignia flotante de puntos */}
              <View style={styles.puntosBadge}>
                <Ionicons name="leaf" size={13} color="#FFFFFF" />
                <Text style={styles.puntosTexto}>+{desafio.puntos} pts</Text>
              </View>
            </View>

            {/* Información y botón */}
            <View style={styles.infoContainer}>
              <Text style={styles.cardTitulo} numberOfLines={1}>
                {desafio.titulo}
              </Text>
              <Text style={styles.cardSubtitulo} numberOfLines={1}>
                {desafio.subtitulo}
              </Text>

              {/* Botón Tomar Foto */}
              <TouchableOpacity
                style={styles.botonFoto}
                activeOpacity={0.8}
                onPress={irACamara}
              >
                <Ionicons name="camera" size={14} color="#FFFFFF" />
                <Text style={styles.botonFotoTexto}>Tomar foto</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  tituloContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  titulo: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },
  verTodo: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.botonPrincipal,
  },
  subtituloGeneral: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    paddingHorizontal: SPACING.md,
    marginTop: 2,
    marginBottom: SPACING.sm,
  },
  scrollContainer: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  card: {
    width: ANCHO_TARJETA,
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  imagenContainer: {
    position: 'relative',
    width: '100%',
    height: 110,
    backgroundColor: '#E8E8E8',
  },
  imagen: {
    width: '100%',
    height: '100%',
  },
  puntosBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: COLORS.botonPrincipal,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
  },
  puntosTexto: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  infoContainer: {
    padding: SPACING.sm,
  },
  cardTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },
  cardSubtitulo: {
    fontSize: 11,
    color: COLORS.textoSecundario,
    marginTop: 2,
    marginBottom: SPACING.xs,
  },
  botonFoto: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: COLORS.iconoActivoInferior,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: 4,
  },
  botonFotoTexto: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default FotosPuntos;
