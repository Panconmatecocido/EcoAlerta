// src/screens/citizen/CartScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import {
  storeRepository,
  StoreBranch,
  ReservationResponse,
  ConfirmRedemptionResponse,
} from '../../repositories/store';
import { CheckoutReservationModal } from '../../components/citizen/CheckoutReservationModal';
import { TransactionLoaderModal } from '../../components/common/TransactionLoaderModal';
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../utils/theme';
import Header from '../../components/Header';

export const CartScreen: React.FC = ({ navigation }: any) => {
  const { user, updateUserPoints } = useAuth();
  const {
    carrito,
    actualizarCantidad,
    eliminarDelCarrito,
    obtenerSubtotalPuntos,
    obtenerTotalPuntos,
    vaciarCarrito,
  } = useCart();

  // Estados del flujo de Checkout
  const [procesandoReserva, setProcesandoReserva] = useState(false);
  const [confirmandoCanje, setConfirmandoCanje] = useState(false);
  const [modalCheckoutVisible, setModalCheckoutVisible] = useState(false);
  const [canjeActivo, setCanjeActivo] = useState<ReservationResponse | null>(null);
  const [sucursales, setSucursales] = useState<StoreBranch[]>([]);
  const [sucursalSeleccionadaId, setSucursalSeleccionadaId] = useState<string>('');
  const [comprobante, setComprobante] = useState<ConfirmRedemptionResponse | null>(null);

  const userPoints = user?.points ?? 0;
  const subtotalPuntos = obtenerSubtotalPuntos();
  const totalPuntos = obtenerTotalPuntos();
  const saldoInsuficiente = userPoints < totalPuntos;

  // Cargar sucursales al montar
  useEffect(() => {
    const cargarSucursales = async () => {
      try {
        const branches = await storeRepository.getBranches({
          municipioId: (user as any)?.municipioId,
        });
        setSucursales(branches);
        if (branches.length > 0 && !sucursalSeleccionadaId) {
          setSucursalSeleccionadaId(branches[0].id);
        }
      } catch (error) {
        console.error('Error al cargar sucursales municipales:', error);
      }
    };

    cargarSucursales();
  }, [user]);

  // Validar si algún producto supera el stock disponible
  const hayItemSuperaStock = carrito.some((item) => item.cantidad > item.producto.stock);

  // Iniciar Checkout: Fase 1 (Bloqueo Temporal de Stock por 5 minutos)
  const iniciarCheckout = async () => {
    if (!user) {
      Alert.alert(
        'Inicio de Sesión Requerido',
        'Debes identificarte como vecino para canjear tus EcoPuntos.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar Sesión', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }

    if (user.role === 'agent') {
      Alert.alert(
        'Acceso Restringido',
        'Las cuentas operativas de Agente de Campo no pueden canjear productos de la tienda.'
      );
      return;
    }

    if (carrito.length === 0) return;

    if (saldoInsuficiente) {
      Alert.alert(
        'EcoPuntos insuficientes',
        `Tenés ${userPoints.toLocaleString()} EcoPuntos y necesitás ${totalPuntos.toLocaleString()} EcoPuntos para este canje. ¡Seguí reportando alertas para sumar EcoPuntos!`
      );
      return;
    }

    if (hayItemSuperaStock) {
      Alert.alert(
        'Stock insuficiente',
        'Alguno de los productos en tu carrito supera el stock físico disponible. Por favor ajustá las cantidades.'
      );
      return;
    }

    try {
      setProcesandoReserva(true);

      const itemsPayload = carrito.map((item) => ({
        productoId: item.producto.id,
        cantidad: item.cantidad,
      }));

      // Iniciar reserva temporal con TTL 5 min
      const res = await storeRepository.reserveCart(user.id, itemsPayload);
      setCanjeActivo(res);
      setModalCheckoutVisible(true);
    } catch (error: any) {
      Alert.alert(
        'Error al Reservar Stock',
        error?.message || 'No se pudo reservar el stock de los productos. Inténtalo nuevamente.'
      );
    } finally {
      setProcesandoReserva(false);
    }
  };

  // Confirmar Canje: Fase 2 (Descuento atómico de puntos y emisión del voucher)
  const handleConfirmarCanje = async () => {
    if (!canjeActivo) return;
    if (!sucursalSeleccionadaId) {
      Alert.alert('Sucursal requerida', 'Por favor selecciona la sucursal municipal donde retirarás tus insumos.');
      return;
    }

    try {
      setConfirmandoCanje(true);

      const resultado = await storeRepository.confirmRedemption(
        canjeActivo.canjeId,
        sucursalSeleccionadaId,
        user?.id
      );

      setComprobante(resultado);

      // Vaciar carrito tras confirmación exitosa y actualizar saldo en AuthContext
      vaciarCarrito();
      if (updateUserPoints && typeof resultado.nuevoSaldoPuntos === 'number') {
        updateUserPoints(resultado.nuevoSaldoPuntos);
      }
    } catch (error: any) {
      Alert.alert(
        'Error en la Confirmación',
        error?.message || 'No se pudo confirmar el canje. Verifica tu saldo y conexión.'
      );
    } finally {
      setConfirmandoCanje(false);
    }
  };

  // Cancelar reserva manualmente o al cerrar modal
  const handleCerrarModalReserva = async () => {
    if (canjeActivo && !comprobante) {
      try {
        await storeRepository.cancelReservation(canjeActivo.canjeId);
      } catch (err) {
        console.warn('Error al cancelar reserva:', err);
      }
    }
    setModalCheckoutVisible(false);
    setCanjeActivo(null);
    setComprobante(null);
  };

  // Manejo de expiración de los 5 minutos (TTL)
  const handleExpirarReserva = () => {
    Alert.alert(
      'Reserva Expirada',
      'El tiempo límite de 5 minutos ha expirado. El stock fue liberado automáticamente para otros vecinos.'
    );
    setModalCheckoutVisible(false);
    setCanjeActivo(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <Header showActions={false} />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Encabezado Usuario */}
        <View style={styles.headerContainer}>
          <View style={styles.userInfo}>
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="account" size={ICON_SIZE.md} color={COLORS.textoVerdeOscuro} />
            </View>
            <View>
              <Text style={styles.welcomeText}>¡Hola, {user?.name || 'Vecino'}!</Text>
              <Text style={styles.subWelcomeText}>Canjes 100% con EcoPuntos 🍃</Text>
            </View>
          </View>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsLabel}>⭐ Mis EcoPuntos</Text>
            <Text style={styles.pointsValue}>{userPoints.toLocaleString()}</Text>
          </View>
        </View>

        <Text style={styles.screenTitle}>TU CARRITO DE CANJE</Text>

        {/* Lista de Productos */}
        {carrito.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="cart-outline" size={60} color={COLORS.textoSecundario} />
            <Text style={styles.emptyText}>Tu carrito de canje está vacío 🛒</Text>
            <TouchableOpacity
              style={styles.botonExplorarTienda}
              onPress={() => navigation.navigate('Tienda')}
              activeOpacity={0.8}
            >
              <Text style={styles.textoBotonExplorar}>Explorar Tienda Ecológica</Text>
            </TouchableOpacity>
          </View>
        ) : (
          carrito.map((item) => {
            const { producto, cantidad } = item;
            const imagenUri = producto.imagenUrl || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=300&q=80';
            const superaStock = cantidad > producto.stock;

            return (
              <View key={producto.id} style={[styles.card, superaStock && styles.cardAlertaStock]}>
                <Image source={{ uri: imagenUri }} style={styles.productImage} />
                <View style={styles.productDetails}>
                  <Text style={styles.productTitle} numberOfLines={2}>
                    {producto.titulo}
                  </Text>
                  <View style={styles.pointsTag}>
                    <Text style={styles.pointsText}>⭐ {producto.costoPuntos.toLocaleString()} EcoPuntos c/u</Text>
                  </View>
                  <Text style={styles.stockDisponibleTexto}>Stock disponible: {producto.stock}</Text>
                  {superaStock && (
                    <Text style={styles.textoErrorStock}>Supera stock disponible</Text>
                  )}
                </View>

                <View style={styles.actionsContainer}>
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => actualizarCantidad(producto.id, -1)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{cantidad}</Text>
                    <TouchableOpacity
                      style={[styles.qtyBtn, cantidad >= producto.stock && styles.qtyBtnDisabled]}
                      onPress={() => {
                        const pudo = actualizarCantidad(producto.id, 1);
                        if (!pudo) {
                          Alert.alert('Tope de Stock', `Has alcanzado el stock disponible (${producto.stock}).`);
                        }
                      }}
                      disabled={cantidad >= producto.stock}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => eliminarDelCarrito(producto.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteText}>ELIMINAR 🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* Resumen del Canje (Sin costos en dinero ni cargos en ARS) */}
        {carrito.length > 0 && (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal Insumos:</Text>
                <Text style={styles.summaryValue}>{subtotalPuntos.toLocaleString()} EcoPuntos</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Modalidad de Entrega:</Text>
                <Text style={styles.textoRetiroGratis}>Retiro Presencial Municipal ($0 ARS)</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>TOTAL A CANJEAR:</Text>
                <Text style={styles.totalValue}>{totalPuntos.toLocaleString()} EcoPuntos</Text>
              </View>

              {/* Comparativa Saldo Actual vs Total */}
              <View style={styles.comparativaBox}>
                <Text style={styles.textoComparativa}>
                  Tu saldo actual: <Text style={{ fontWeight: 'bold' }}>{userPoints.toLocaleString()} EcoPuntos</Text>
                </Text>
                <Text style={[styles.textoComparativaRestante, saldoInsuficiente && styles.textoComparativaAlerta]}>
                  {saldoInsuficiente
                    ? `Faltan: ${(totalPuntos - userPoints).toLocaleString()} EcoPuntos`
                    : `Saldo posterior: ${(userPoints - totalPuntos).toLocaleString()} EcoPuntos`}
                </Text>
              </View>
            </View>

            {saldoInsuficiente ? (
              <View style={styles.insufficientBox}>
                <MaterialCommunityIcons name="alert-circle-outline" size={20} color={COLORS.textoPeligro} />
                <Text style={styles.insufficientText}>
                  EcoPuntos insuficientes. Te faltan {(totalPuntos - userPoints).toLocaleString()} EcoPuntos para completar este canje.
                </Text>
              </View>
            ) : (
              <Text style={styles.infoText}>
                Al continuar se reservará el stock durante 5 minutos para que elijas la sucursal de retiro sin costo monetario.
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.checkoutButton,
                (saldoInsuficiente || procesandoReserva || hayItemSuperaStock) && styles.disabledButton,
              ]}
              onPress={iniciarCheckout}
              disabled={saldoInsuficiente || procesandoReserva || hayItemSuperaStock}
              activeOpacity={0.8}
            >
              <Text style={styles.checkoutButtonText}>
                {saldoInsuficiente ? 'ECOPUNTOS INSUFICIENTES' : 'CONTINUAR AL CANJE (RESERVA 5 MIN) 🛒'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Modal de Checkout con Bloqueo TTL de 5 Minutos y Comprobante Voucher */}
      <CheckoutReservationModal
        visible={modalCheckoutVisible}
        onClose={handleCerrarModalReserva}
        canjeId={canjeActivo?.canjeId || ''}
        totalPuntos={totalPuntos}
        tiempoRestanteInicial={canjeActivo?.tiempoRestanteSegundos || 300}
        sucursales={sucursales}
        sucursalSeleccionadaId={sucursalSeleccionadaId}
        onSeleccionarSucursal={setSucursalSeleccionadaId}
        onConfirmarCanje={handleConfirmarCanje}
        confirmando={confirmandoCanje}
        comprobante={comprobante}
        onFinalizarComprobante={() => {
          setModalCheckoutVisible(false);
          setCanjeActivo(null);
          setComprobante(null);
          navigation.navigate('Tienda');
        }}
        onExpirarReserva={handleExpirarReserva}
      />

      {/* Spinner Bloqueante RNF-10 durante la mutación de reserva */}
      <TransactionLoaderModal
        visible={procesandoReserva}
        mensaje="Iniciando Reserva Temporal..."
        submensaje="Bloqueando stock por 5 minutos en el servidor central"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.fondoAplicacion,
  },
  scrollContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg * 2,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.fondoTarjeta,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  welcomeText: {
    fontWeight: 'bold',
    fontSize: 15,
    color: COLORS.textoVerdeOscuro,
  },
  subWelcomeText: {
    fontSize: 11,
    color: COLORS.textoSecundario,
  },
  pointsBadge: {
    alignItems: 'flex-end',
  },
  pointsLabel: {
    fontSize: 11,
    color: COLORS.textoSecundario,
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textoVerde,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
    textAlign: 'center',
    marginVertical: SPACING.sm,
  },
  emptyContainer: {
    padding: SPACING.lg * 2,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textoSecundario,
    marginTop: SPACING.xs,
  },
  botonExplorarTienda: {
    backgroundColor: COLORS.botonPrincipal,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
  },
  textoBotonExplorar: {
    color: COLORS.superficieTarjeta,
    fontWeight: 'bold',
    fontSize: 13,
  },
  card: {
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    flexDirection: 'row',
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    alignItems: 'center',
  },
  cardAlertaStock: {
    borderColor: COLORS.textoPeligro,
    backgroundColor: COLORS.fondoPeligro,
  },
  productImage: {
    width: 65,
    height: 65,
    borderRadius: BORDER_RADIUS.sm,
    resizeMode: 'cover',
  },
  productDetails: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  pointsTag: {
    marginTop: 2,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textoVerde,
  },
  stockDisponibleTexto: {
    fontSize: 10,
    color: COLORS.textoSecundario,
    marginTop: 2,
  },
  textoErrorStock: {
    fontSize: 10,
    color: COLORS.textoPeligro,
    fontWeight: 'bold',
    marginTop: 2,
  },
  actionsContainer: {
    alignItems: 'flex-end',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.fondoAplicacion,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  qtyBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  qtyBtnDisabled: {
    opacity: 0.3,
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textoVerde,
  },
  quantityText: {
    paddingHorizontal: SPACING.xs,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
    fontSize: 13,
  },
  deleteButton: {
    marginTop: SPACING.xs,
  },
  deleteText: {
    fontSize: 10,
    color: COLORS.textoPeligro,
    fontWeight: 'bold',
  },
  summaryCard: {
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    padding: SPACING.md,
    marginTop: SPACING.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.textoSecundario,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 13,
    color: COLORS.textoVerdeOscuro,
    fontWeight: 'bold',
  },
  textoRetiroGratis: {
    fontSize: 12,
    color: COLORS.textoVerde,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.bordeSuave,
    marginVertical: SPACING.xs,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  totalValue: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.botonPrincipal,
  },
  comparativaBox: {
    backgroundColor: COLORS.fondoTarjeta,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textoComparativa: {
    fontSize: 11,
    color: COLORS.textoVerdeOscuro,
  },
  textoComparativaRestante: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textoVerde,
  },
  textoComparativaAlerta: {
    color: COLORS.textoPeligro,
  },
  insufficientBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.fondoPeligro,
    borderColor: COLORS.bordePeligro,
    borderWidth: 1,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginVertical: SPACING.md,
  },
  insufficientText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textoPeligro,
    fontWeight: 'bold',
  },
  infoText: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textoSecundario,
    marginVertical: SPACING.sm,
  },
  checkoutButton: {
    backgroundColor: COLORS.botonPrincipal,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  checkoutButtonText: {
    color: COLORS.superficieTarjeta,
    fontWeight: 'bold',
    fontSize: 13,
  },
});