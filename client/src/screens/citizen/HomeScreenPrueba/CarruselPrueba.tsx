import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../../utils/theme';
import { MOCK_PRODUCTOS } from '../../../mocks/productos';
import { Producto } from '../../../interfaces/product';
import { useNavigation } from '@react-navigation/native';
import { MainNavigator } from '../../../navigation/MainNavigator'

const { width } = Dimensions.get('window');


const ANCHO_TARJETA = width * 0.38;

export const CarruselTienda = () => {
  const navigation = useNavigation<any>();
  const flatListRef = useRef<FlatList<Producto>>(null);

  const moverIzquierda = () => {
    flatListRef.current?.scrollToOffset({
      offset: 0,
      animated: true,
    });
  };

  const moverDerecha = () => {
    flatListRef.current?.scrollToOffset({
      offset: ANCHO_TARJETA + SPACING.sm,
      animated: true,
    });
  };

  const renderProducto = ({ item }: { item: Producto }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.urlImagen }}
          style={styles.imagen}
          resizeMode="contain"
        />

        <Text
          style={styles.nombre}
          numberOfLines={2}
        >
          {item.nombre}
        </Text>

        <Text style={styles.puntos}>
          {item.precio} puntos
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>

      {/* TÍTULO + VER TODO */}
      <View style={styles.header}>

        <View style={styles.tituloContainer}>
          <Ionicons
            name="bag-handle-outline"
            size={ICON_SIZE.lg}
            color={COLORS.iconoPrincipal}
          />

          <Text style={styles.titulo}>
            Canjeá tus puntos
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Tienda')}
        >
          <Text style={styles.verTodo}>
            Ver todo
          </Text>
        </TouchableOpacity>

      </View>

      {/* CARRUSEL */}
      <View style={styles.carruselContainer}>

        {/* FLECHA IZQUIERDA */}
        <TouchableOpacity
          style={styles.flecha}
          onPress={moverIzquierda}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back"
            size={ICON_SIZE.md}
            color={COLORS.iconoPrincipal}
          />
        </TouchableOpacity>

        {/* PRODUCTOS */}
        <FlatList
          ref={flatListRef}
          data={MOCK_PRODUCTOS}
          renderItem={renderProducto}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.lista}
        />

        {/* FLECHA DERECHA */}
        <TouchableOpacity
          style={styles.flecha}
          onPress={moverDerecha}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-forward"
            size={ICON_SIZE.md}
            color={COLORS.iconoPrincipal}
          />
        </TouchableOpacity>

      </View>

    </View>
  );
};

const styles = StyleSheet.create({

  container: {
    width: '100%',
    marginTop: SPACING.lg,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },

  tituloContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginLeft: SPACING.md,
  },

  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },

  verTodo: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.botonPrincipal,
    marginRight: 10,
  },

  carruselContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  lista: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },

  flecha: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.fondoTarjeta,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    zIndex: 2,
  },

  card: {
    width: ANCHO_TARJETA,
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },

  imagen: {
    width: '100%',
    height: 105,
  },

  nombre: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textoVerdeOscuro,
    marginTop: SPACING.sm,
  },

  puntos: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.botonPrincipal,
    marginTop: SPACING.xs,
  },

});