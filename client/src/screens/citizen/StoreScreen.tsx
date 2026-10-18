// src/screens/citizen/StoreScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { storeRepository, StoreProduct } from '../../repositories/store';
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../utils/theme';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';

const CATEGORIAS = [
  { id: '0', nombre: 'Todos', icono: 'grid-outline' },
  { id: '1', nombre: 'Hogar', icono: 'home-outline' },
  { id: '2', nombre: 'Limpieza', icono: 'sparkles-outline' },
  { id: '3', nombre: 'Cuidado Personal', icono: 'person-outline' },
  { id: '4', nombre: 'Papelería', icono: 'folder-outline' },
];

export const StoreScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { agregarAlCarrito, carrito, obtenerSubtotalPuntos } = useCart();

  const [productos, setProductos] = useState<StoreProduct[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('Todos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(true);

  const cargarProductos = async () => {
    try {
      setCargando(true);
      const datos = await storeRepository.getProducts({
        busqueda,
        municipioId: (user as any)?.municipioId,
      });

      // Filtrado local por categoría si aplica
      if (categoriaSeleccionada !== 'Todos') {
        const cat = categoriaSeleccionada.toLowerCase();
        const filtrados = datos.filter(
          (p) =>
            p.titulo.toLowerCase().includes(cat) ||
            p.descripcion.toLowerCase().includes(cat)
        );
        setProductos(filtrados);
      } else {
        setProductos(datos);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, [categoriaSeleccionada, busqueda]);

  const handleAgregarAlCarrito = (producto: StoreProduct) => {
    // 1. Auth Gate para Invitados (user === null)
    if (!user) {
      Alert.alert(
        'Inicio de Sesión Requerido',
        'Para agregar productos al carrito y canjear tus puntos ecológicos, debes iniciar sesión o registrarte como vecino.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Iniciar Sesión',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
      return;
    }

    // 2. Restricción RBAC: Agentes de campo no pueden canjear
    if (user.role === 'agent') {
      Alert.alert(
        'Acceso Restringido',
        'Las cuentas operativas de Agente de Campo no tienen acceso al canje de premios.'
      );
      return;
    }

    // 3. Validación de Stock disponible
    if (producto.stock <= 0) {
      Alert.alert('Producto Agotado', 'Este producto no cuenta con unidades disponibles en este momento.');
      return;
    }

    const exito = agregarAlCarrito(producto);
    if (!exito) {
      Alert.alert(
        'Límite de Stock',
        `No puedes agregar más unidades. Ya alcanzaste el stock máximo disponible (${producto.stock}) para este producto.`
      );
    }
  };

  const handleVerHistorial = () => {
    if (!user) {
      Alert.alert(
        'Inicio de Sesión Requerido',
        'Inicia sesión para ver tu historial de canjes y vouchers.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar Sesión', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }
    navigation.navigate('Cart');
  };

  const totalPuntosCarrito = obtenerSubtotalPuntos ? obtenerSubtotalPuntos() : 0;
  const cantidadItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  const userPuntos = user?.points ?? 0;

  return (
    <View style={estilos.contenedor}>
      <Header />

      {/* 1. Tarjeta de Puntos Canjeables */}
      <View style={estilos.tarjetaPuntos}>
        <View style={estilos.puntosIzquierda}>
          <Text style={estilos.tituloPuntos}>
            {user ? 'Tus Puntos Canjeables' : 'Modo Invitado'}
          </Text>
          <View style={estilos.contenedorValorPuntos}>
            <Ionicons name="star" size={ICON_SIZE.lg} color={COLORS.iconoPrincipal} />
            <Text style={estilos.valorPuntos}>
              {user ? userPuntos.toLocaleString() : '0'} PTS
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={estilos.puntosDerecha}
          activeOpacity={0.7}
          onPress={handleVerHistorial}
        >
          <View style={estilos.contenedorValorPuntos}>
            <Ionicons name="cart" size={ICON_SIZE.md} color={COLORS.iconoPrincipal} />
            <Text style={estilos.subValorPuntos}>
              {user ? ` Mis puntos: ${userPuntos}` : ' Iniciar sesión'}
            </Text>
          </View>
          <Text style={estilos.enlaceHistorial}>Ver Carrito &gt;</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Categorías con Iconos */}
      <View style={estilos.wrapperCategorias}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={estilos.contenedorCategorias}
        >
          {CATEGORIAS.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                estilos.tarjetaCategoria,
                categoriaSeleccionada === cat.nombre && estilos.tarjetaCategoriaActiva,
              ]}
              onPress={() =>
                setCategoriaSeleccionada(
                  categoriaSeleccionada === cat.nombre ? 'Todos' : cat.nombre
                )
              }
              activeOpacity={0.7}
            >
              <View style={estilos.circuloIconoCategoria}>
                <Ionicons
                  name={cat.icono as any}
                  size={ICON_SIZE.lg}
                  color={categoriaSeleccionada === cat.nombre ? COLORS.botonPrincipal : COLORS.iconoPrincipal}
                />
              </View>
              <Text
                style={[
                  estilos.textoCategoria,
                  categoriaSeleccionada === cat.nombre && estilos.textoCategoriaActiva,
                ]}
              >
                {cat.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 3. Barra de Búsqueda */}
      <View style={estilos.contenedorBuscador}>
        <TextInput
          style={estilos.entradaBuscador}
          placeholder="Buscar productos ecológicos..."
          value={busqueda}
          onChangeText={setBusqueda}
          placeholderTextColor={COLORS.textoSecundario}
        />
        <Ionicons
          name="search-outline"
          size={ICON_SIZE.md}
          color={COLORS.iconoPrincipal}
          style={estilos.iconoBuscador}
        />
      </View>

      {/* 4. Lista de Productos */}
      {cargando ? (
        <View style={{ alignItems: 'center', marginTop: SPACING.xl, gap: SPACING.xs }}>
          <ActivityIndicator size="large" color={COLORS.botonPrincipal} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textoVerdeOscuro }}>
            Cargando catálogo ({categoriaSeleccionada})...
          </Text>
        </View>
      ) : productos.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: SPACING.xl, padding: SPACING.md }}>
          <Ionicons name="leaf-outline" size={48} color={COLORS.textoSecundario} />
          <Text style={{ fontSize: 14, color: COLORS.textoSecundario, marginTop: SPACING.xs }}>
            No se encontraron insumos ecológicos disponibles.
          </Text>
        </View>
      ) : (
        <FlatList
          data={productos}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={estilos.listaProductos}
          renderItem={({ item }) => {
            const imagenUri = item.imagenUrl || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=300&q=80';
            const sinStock = item.stock <= 0;

            return (
              <View style={estilos.tarjetaProducto}>
                <Image source={{ uri: imagenUri }} style={estilos.imagenProducto} />
                <Text style={estilos.tituloProducto} numberOfLines={1}>
                  {item.titulo}
                </Text>

                {/* Badge de puntos y stock */}
                <View style={estilos.filaBadges}>
                  <View style={estilos.insigniaPrecio}>
                    <Ionicons name="star" size={12} color={COLORS.textoVerde} />
                    <Text style={estilos.puntosProducto}> {item.costoPuntos} PTS</Text>
                  </View>

                  {sinStock ? (
                    <View style={estilos.badgeSinStock}>
                      <Text style={estilos.textoSinStock}>SIN STOCK</Text>
                    </View>
                  ) : (
                    <Text style={estilos.textoStockDisponible}>{item.stock} disp.</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    estilos.botonAgregar,
                    sinStock && estilos.botonAgregarDisabled,
                  ]}
                  onPress={() => handleAgregarAlCarrito(item)}
                  activeOpacity={sinStock ? 1 : 0.8}
                  disabled={sinStock}
                >
                  <Text style={estilos.textoBotonAgregar}>
                    {sinStock ? 'SIN STOCK' : 'AGREGAR AL CARRITO'}
                  </Text>
                  {!sinStock && (
                    <Ionicons name="cart-outline" size={14} color={COLORS.superficieTarjeta} />
                  )}
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* 5. Barra flotante del carrito */}
      {carrito.length > 0 && (
        <View style={estilos.pieCarrito}>
          <Text style={estilos.resumenCarrito}>
            Carrito: {cantidadItems} items | Total: {totalPuntosCarrito} Pts
          </Text>
          <TouchableOpacity
            style={estilos.botonPagar}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Cart')}
          >
            <Text style={estilos.textoPagar}>VER CARRITO Y CANJEAR</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORS.fondoAplicacion,
  },
  tarjetaPuntos: {
    backgroundColor: COLORS.fondoTarjeta,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  puntosIzquierda: {
    flexDirection: 'column',
  },
  tituloPuntos: {
    fontSize: 14,
    color: COLORS.textoVerdeOscuro,
    fontWeight: '600',
  },
  contenedorValorPuntos: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valorPuntos: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
    marginLeft: SPACING.xs,
  },
  puntosDerecha: {
    alignItems: 'flex-end',
  },
  subValorPuntos: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  enlaceHistorial: {
    fontSize: 11,
    color: COLORS.textoVerde,
    marginTop: 2,
    fontWeight: '600',
  },
  wrapperCategorias: {
    maxHeight: 90,
    marginBottom: SPACING.md,
  },
  contenedorCategorias: {
    flexDirection: 'row',
  },
  tarjetaCategoria: {
    alignItems: 'center',
    marginRight: SPACING.md,
    width: 75,
  },
  tarjetaCategoriaActiva: {
    opacity: 1,
  },
  circuloIconoCategoria: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.superficieTarjeta,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  textoCategoria: {
    fontSize: 11,
    color: COLORS.textoVerdeOscuro,
    textAlign: 'center',
  },
  textoCategoriaActiva: {
    color: COLORS.botonPrincipal,
    fontWeight: 'bold',
  },
  contenedorBuscador: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  entradaBuscador: {
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingRight: 40,
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    color: COLORS.textoVerdeOscuro,
  },
  iconoBuscador: {
    position: 'absolute',
    right: 28,
  },
  listaProductos: {
    paddingHorizontal: SPACING.sm,
    paddingBottom: 90,
  },
  tarjetaProducto: {
    flex: 1,
    backgroundColor: COLORS.superficieTarjeta,
    margin: SPACING.xs,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  imagenProducto: {
    width: 90,
    height: 90,
    resizeMode: 'cover',
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  tituloProducto: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textoVerdeOscuro,
    marginBottom: 4,
    textAlign: 'center',
  },
  filaBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING.xs,
    paddingHorizontal: 2,
  },
  insigniaPrecio: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.fondoTarjeta,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  puntosProducto: {
    fontSize: 11,
    color: COLORS.textoVerde,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  badgeSinStock: {
    backgroundColor: COLORS.fondoPeligro,
    borderColor: COLORS.bordePeligro,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  textoSinStock: {
    fontSize: 9,
    color: COLORS.textoPeligro,
    fontWeight: 'bold',
  },
  textoStockDisponible: {
    fontSize: 10,
    color: COLORS.textoSecundario,
  },
  botonAgregar: {
    backgroundColor: COLORS.botonPrincipal,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: 7,
    paddingHorizontal: 8,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonAgregarDisabled: {
    backgroundColor: COLORS.bordeSuave,
  },
  textoBotonAgregar: {
    color: COLORS.superficieTarjeta,
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 4,
  },
  pieCarrito: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.textoVerdeOscuro,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  resumenCarrito: {
    color: COLORS.superficieTarjeta,
    fontSize: 12,
    fontWeight: 'bold',
  },
  botonPagar: {
    backgroundColor: COLORS.botonPrincipal,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.sm,
  },
  textoPagar: {
    color: COLORS.superficieTarjeta,
    fontSize: 11,
    fontWeight: 'bold',
  },
});