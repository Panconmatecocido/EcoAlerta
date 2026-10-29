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
import { buildStoreGridRows } from '../../utils/storeGrid';

const CATEGORIAS = [
  { id: '0', nombre: 'Todos', icono: 'grid-outline' },
  { id: '1', nombre: 'Hogar', icono: 'home-outline' },
  { id: '2', nombre: 'Limpieza', icono: 'sparkles-outline' },
  { id: '3', nombre: 'Cuidado Personal', icono: 'person-outline' },
  { id: '4', nombre: 'Papelería', icono: 'folder-outline' },
];

export const StoreScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, requireAuth } = useAuth();
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
      if (requireAuth) {
        requireAuth();
        return;
      }
      Alert.alert(
        'Inicio de Sesión Requerido',
        'Para agregar productos al carrito y canjear tus EcoPuntos, debes iniciar sesión o registrarte como vecino.',
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
      if (requireAuth) {
        requireAuth();
        return;
      }
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
  const filasProductos = buildStoreGridRows(productos, (producto) => producto.id);

  const renderProducto = (item: StoreProduct) => {
    const sinStock = item.stock <= 0;
    return (
      <View key={item.id} style={estilos.tarjetaProducto}>
        <Image
          source={{
            uri:
              item.imagenUrl && item.imagenUrl.startsWith('http')
                ? item.imagenUrl
                : 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=400',
          }}
          style={estilos.imagenProducto}
        />
        <Text style={estilos.tituloProducto} numberOfLines={2}>
          {item.titulo}
        </Text>

        <View style={estilos.filaBadges}>
          <View style={estilos.insigniaPrecio}>
            <Ionicons name="star" size={ICON_SIZE.sm} color={COLORS.iconoPrincipal} />
            <Text style={estilos.puntosProducto}>{item.costoPuntos} EcoPuntos</Text>
          </View>
          {sinStock ? (
            <View style={estilos.badgeSinStock}>
              <Text style={estilos.textoSinStock}>AGOTADO</Text>
            </View>
          ) : (
            <Text style={estilos.textoStockDisponible}>{item.stock} disp.</Text>
          )}
        </View>

        <TouchableOpacity
          style={[estilos.botonAgregar, sinStock && estilos.botonAgregarDisabled]}
          onPress={() => handleAgregarAlCarrito(item)}
          activeOpacity={sinStock ? 1 : 0.8}
          disabled={sinStock}
        >
          <Text style={estilos.textoBotonAgregar}>
            {sinStock ? 'Sin Stock' : 'Agregar'}
          </Text>
          {!sinStock && (
            <Ionicons name="add" size={ICON_SIZE.sm} color={COLORS.superficieTarjeta} />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={estilos.contenedor}>
      <Header
        showSettings={false}
        rightContent={
          <TouchableOpacity
            style={estilos.headerStoreAction}
            activeOpacity={0.7}
            onPress={handleVerHistorial}
            accessibilityRole="button"
            accessibilityLabel={user
              ? `Mis EcoPuntos: ${userPuntos}. Ver carrito`
              : 'Iniciar sesión para ver el carrito'}
          >
            <View style={estilos.headerStoreText}>
              <Text style={estilos.headerStoreBalance} numberOfLines={1}>
                {user ? userPuntos.toLocaleString('es-AR') : 'Entrar'}
              </Text>
              <Text style={estilos.headerStoreLabel} numberOfLines={1}>
                {user ? 'EcoPuntos' : 'al carrito'}
              </Text>
            </View>
            <Ionicons name="cart" size={ICON_SIZE.md} color={COLORS.iconoPrincipal} />
          </TouchableOpacity>
        }
      />

      {/* 2. Categorías con Iconos */}
      <View style={estilos.wrapperCategorias}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={estilos.contenedorCategorias}
        >
          {CATEGORIAS.map((cat) => {
            const esActiva = categoriaSeleccionada === cat.nombre;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[estilos.tarjetaCategoria, esActiva && estilos.tarjetaCategoriaActiva]}
                onPress={() => setCategoriaSeleccionada(cat.nombre)}
              >
                <View style={estilos.circuloIconoCategoria}>
                  <Ionicons
                    name={cat.icono as any}
                    size={ICON_SIZE.md}
                    color={esActiva ? COLORS.botonPrincipal : COLORS.textoSecundario}
                  />
                </View>
                <Text style={[estilos.textoCategoria, esActiva && estilos.textoCategoriaActiva]}>
                  {cat.nombre}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Buscador */}
      <View style={estilos.contenedorBuscador}>
        <TextInput
          placeholder="Buscar un producto..."
          placeholderTextColor={COLORS.textoDesactivado}
          style={estilos.entradaBuscador}
          value={busqueda}
          onChangeText={setBusqueda}
        />
        <Ionicons
          name="search-outline"
          size={ICON_SIZE.md}
          color={COLORS.textoSecundario}
          style={estilos.iconoBuscador}
        />
      </View>

      {/* 4. Lista de Productos en 2 columnas */}
      {cargando ? (
        <ActivityIndicator size="large" color={COLORS.botonPrincipal} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filasProductos}
          keyExtractor={(row) => row.key}
          contentContainerStyle={estilos.listaProductos}
          renderItem={({ item: row }) =>
            row.type === 'ad' ? (
              <View
                style={estilos.bannerAnuncios}
                accessibilityRole="image"
                accessibilityLabel="Anuncios"
              >
                <Text style={estilos.textoBannerAnuncios}>Anuncios</Text>
              </View>
            ) : (
              <View style={estilos.filaProductos}>
                {row.products.map(renderProducto)}
                {row.products.length === 1 && <View style={estilos.espacioProducto} />}
              </View>
            )
          }
        />
      )}

      {/* 5. Barra Inferior Flotante del Carrito */}
      {cantidadItems > 0 && (
        <View style={estilos.pieCarrito}>
          <Text style={estilos.resumenCarrito}>
            {cantidadItems} {cantidadItems === 1 ? 'ítem' : 'ítems'} | {totalPuntosCarrito} EcoPuntos
          </Text>
          <TouchableOpacity
            style={estilos.botonPagar}
            onPress={() => navigation.navigate('Cart')}
          >
            <Text style={estilos.textoPagar}>Ir al Carrito</Text>
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
  headerStoreAction: {
    width: 108,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SPACING.xs,
  },
  headerStoreText: {
    flexShrink: 1,
    alignItems: 'flex-end',
  },
  headerStoreBalance: {
    maxWidth: 82,
    color: COLORS.textoVerdeOscuro,
    fontSize: 17,
    fontWeight: '800',
  },
  headerStoreLabel: {
    color: COLORS.textoVerdeOscuro,
    fontSize: 12,
    fontWeight: '700',
  },
  wrapperCategorias: {
    maxHeight: 90,
    marginTop: SPACING.sm,
    marginHorizontal: SPACING.sm,
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.fondoSeccion,
    borderRadius: BORDER_RADIUS.md,
  },
  contenedorCategorias: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.sm,
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
  filaProductos: {
    flexDirection: 'row',
  },
  espacioProducto: {
    flex: 1,
    margin: SPACING.xs,
  },
  bannerAnuncios: {
    height: 88,
    marginHorizontal: SPACING.xs,
    marginVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.fondoEncabezado,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    borderStyle: 'dashed',
  },
  textoBannerAnuncios: {
    color: COLORS.textoVerdeOscuro,
    fontSize: 14,
    fontWeight: '700',
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
