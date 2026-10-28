import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../../utils/theme';
import { storeRepository, StoreProduct } from '../../../repositories/store';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';

const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=300&q=80';

const ImagenProducto: React.FC<{ producto: StoreProduct }> = ({ producto }) => {
  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const imagenOriginal = producto.imagenUrl?.trim();
  const tieneUrlHttp = imagenOriginal && /^https?:\/\//i.test(imagenOriginal);

  if (intentosFallidos >= 2) {
    return (
      <View style={[styles.imagen, styles.imagenSinProducto]}>
        <Ionicons name="leaf-outline" size={ICON_SIZE.xl} color={COLORS.iconoPrincipal} />
      </View>
    );
  }

  return (
    <Image
      source={{
        uri: intentosFallidos === 0 && tieneUrlHttp ? imagenOriginal : FALLBACK_PRODUCT_IMAGE,
      }}
      style={styles.imagen}
      resizeMode="contain"
      onError={() => setIntentosFallidos((intentos) => Math.min(intentos + 1, 2))}
    />
  );
};

export const CarruselTienda = () => {
  const navigation = useNavigation<any>();
  const { user, requireAuth } = useAuth();
  const { agregarAlCarrito, carrito } = useCart();
  const flatListRef = useRef<FlatList<StoreProduct>>(null);
  const { width } = useWindowDimensions();
  const cardWidth = width * 0.38;
  const [productos, setProductos] = useState<StoreProduct[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [intentoCarga, setIntentoCarga] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let activo = true;

      const cargarProductos = async () => {
        setCargando(true);
        setErrorCarga(false);

        try {
          const datos = await storeRepository.getProducts({
            municipioId: user?.municipioId,
          });
          if (activo) setProductos(datos);
        } catch (error) {
          console.error('Error al cargar productos del carrusel:', error);
          if (activo) {
            setProductos([]);
            setErrorCarga(true);
          }
        } finally {
          if (activo) setCargando(false);
        }
      };

      void cargarProductos();
      return () => {
        activo = false;
      };
    }, [intentoCarga, user?.municipioId])
  );

  const moverIzquierda = () => {
    flatListRef.current?.scrollToOffset({
      offset: 0,
      animated: true,
    });
  };

  const moverDerecha = () => {
    flatListRef.current?.scrollToOffset({
      offset: cardWidth + SPACING.sm,
      animated: true,
    });
  };

  const abrirCarritoConProducto = (producto: StoreProduct) => {
    if (!user) {
      requireAuth();
      return;
    }

    if (user.role === 'agent') {
      Alert.alert(
        'Acceso Restringido',
        'Las cuentas operativas de Agente de Campo no tienen acceso al canje de premios.'
      );
      return;
    }

    if (producto.stock <= 0) {
      Alert.alert('Producto Agotado', 'Este producto no cuenta con unidades disponibles en este momento.');
      return;
    }

    const itemEnCarrito = carrito.find((item) => item.producto.id === producto.id);
    if (itemEnCarrito && itemEnCarrito.cantidad >= producto.stock) {
      Alert.alert(
        'Límite de Stock',
        `No puedes agregar más unidades. Ya alcanzaste el stock máximo disponible (${producto.stock}) para este producto.`
      );
      return;
    }

    agregarAlCarrito(producto);
    navigation.navigate('Tienda', { screen: 'Cart' });
  };

  const renderProducto = ({ item }: { item: StoreProduct }) => {
    return (
      <TouchableOpacity
        style={[styles.card, { width: cardWidth }]}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Agregar ${item.titulo} al carrito`}
        onPress={() => abrirCarritoConProducto(item)}
      >
        <ImagenProducto key={`${item.id}:${item.imagenUrl ?? ''}`} producto={item} />

        <Text
          style={styles.nombre}
          numberOfLines={2}
        >
          {item.titulo}
        </Text>

        <Text style={styles.puntos}>
          {item.costoPuntos} EcoPuntos
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

          <Text style={styles.titulo} numberOfLines={1} ellipsizeMode="tail">
            Canjeá tus EcoPuntos
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
        {cargando ? (
          <View style={styles.estadoContainer}>
            <ActivityIndicator color={COLORS.botonPrincipal} />
          </View>
        ) : errorCarga ? (
          <View style={styles.estadoContainer}>
            <Text style={styles.estadoTexto}>No se pudieron cargar los productos.</Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setIntentoCarga((intento) => intento + 1)}
            >
              <Text style={styles.reintentar}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : productos.length === 0 ? (
          <View style={styles.estadoContainer}>
            <Text style={styles.estadoTexto}>No hay productos disponibles.</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={productos}
            renderItem={renderProducto}
            keyExtractor={(item) => item.id}
            horizontal
            style={styles.productList}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.lista}
          />
        )}

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
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.fondoSeccion,
    borderRadius: BORDER_RADIUS.lg,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },

  tituloContainer: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginLeft: SPACING.md,
  },

  titulo: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },

  verTodo: {
    flexShrink: 0,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.botonPrincipal,
    marginRight: 10,
  },

  carruselContainer: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },

  productList: {
    flex: 1,
    minWidth: 0,
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

  imagenSinProducto: {
    alignItems: 'center',
    justifyContent: 'center',
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

  estadoContainer: {
    flex: 1,
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },

  estadoTexto: {
    color: COLORS.textoSecundario,
    fontSize: 14,
    textAlign: 'center',
  },

  reintentar: {
    marginTop: SPACING.xs,
    color: COLORS.botonPrincipal,
    fontSize: 14,
    fontWeight: '700',
  },

});