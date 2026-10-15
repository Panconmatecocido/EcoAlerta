// src/screens/citizen/CartScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { tiendaService, ResultadoCanje } from '../../services/tiendaService';
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../utils/theme';

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

  const [procesando, setProcesando] = useState(false);
  const [comprobante, setComprobante] = useState<ResultadoCanje | null>(null);

  const userPoints = user?.points ?? 0;
  const subtotal = obtenerSubtotalPuntos();
  const totalPuntos = obtenerTotalPuntos();
  const saldoInsuficiente = userPoints < totalPuntos;

  const procesarCanje = async () => {
    if (carrito.length === 0) return;

    if (saldoInsuficiente) {
      Alert.alert(
        'Puntos insuficientes',
        `Tenés ${userPoints.toLocaleString()} PTS y necesitás ${totalPuntos.toLocaleString()} PTS para confirmar este pedido. ¡Seguí reportando alertas para sumar puntos!`
      );
      return;
    }

    try {
      setProcesando(true);
      const itemsPayload = carrito.map((item) => ({
        productoId: item.producto.id,
        cantidad: item.cantidad,
      }));

      const resultado = await tiendaService.procesarCanje(itemsPayload);
      setComprobante(resultado);

      // Vaciar el carrito local y actualizar balance global
      vaciarCarrito();
      if (updateUserPoints) {
        updateUserPoints(resultado.nuevoSaldoPuntos);
      }
    } catch (error: any) {
      Alert.alert(
        'Error en el canje',
        error?.message || 'No se pudo procesar la solicitud. Intentalo nuevamente.'
      );
    } finally {
      setProcesando(false);
    }
  };

  // VISTA COMPROBANTE DE CANJE / CÓDIGO DE RETIRO
  if (comprobante) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.comprobanteContainer}>
          <MaterialCommunityIcons
            name="check-circle-outline"
            size={80}
            color={COLORS.botonPrincipal}
          />
          <Text style={styles.comprobanteTitulo}>¡Canje Confirmado!</Text>
          <Text style={styles.comprobanteSubtitulo}>
            Presentá el siguiente código en el punto ecológico de tu municipio para retirar tus insumos:
          </Text>

          <View style={styles.codigoBox}>
            <Text style={styles.codigoTexto}>{comprobante.codigoRetiro}</Text>
          </View>

          <View style={styles.resumenDescuentoBox}>
            <Text style={styles.textoPuntosDescontados}>
              Puntos descontados: -{comprobante.puntosDescontados.toLocaleString()} PTS
            </Text>
            <Text style={styles.textoSaldoRestante}>
              Nuevo Saldo: {comprobante.nuevoSaldoPuntos.toLocaleString()} PTS
            </Text>
          </View>

          <TouchableOpacity
            style={styles.botonVolver}
            onPress={() => {
              setComprobante(null);
              navigation.navigate('HomeCitizen');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.botonVolverTexto}>Volver al Inicio</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Encabezado Usuario */}
        <View style={styles.headerContainer}>
          <View style={styles.userInfo}>
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="account" size={ICON_SIZE.md} color={COLORS.textoVerdeOscuro} />
            </View>
            <View>
              <Text style={styles.welcomeText}>¡Bienvenido, {user?.name || 'Vecino'}!</Text>
              <Text style={styles.subWelcomeText}>Juntos hacemos una ciudad más limpia 🍃</Text>
            </View>
          </View>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsLabel}>⭐ Mis puntos</Text>
            <Text style={styles.pointsValue}>{userPoints.toLocaleString()}</Text>
          </View>
        </View>

        <Text style={styles.screenTitle}>TU CARRITO DE COMPRAS</Text>

        {/* Lista de Productos */}
        {carrito.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="cart-outline" size={60} color={COLORS.textoSecundario} />
            <Text style={styles.emptyText}>Tu carrito de canje está vacío 🛒</Text>
          </View>
        ) : (
          carrito.map((item) => {
            const { producto, cantidad } = item;
            const imagenUri = producto.urlImagen || 'https://via.placeholder.com/150';

            return (
              <View key={producto.id} style={styles.card}>
                <Image source={{ uri: imagenUri }} style={styles.productImage} />
                <View style={styles.productDetails}>
                  <Text style={styles.productTitle}>{producto.nombre}</Text>
                  <View style={styles.pointsTag}>
                    <Text style={styles.pointsText}>⭐ {producto.precio.toLocaleString()} pts</Text>
                  </View>
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
                      style={styles.qtyBtn}
                      onPress={() => actualizarCantidad(producto.id, 1)}
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

        {/* Resumen y Procesamiento de Canje */}
        {carrito.length > 0 && (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>SUBTOTAL:</Text>
                <Text style={styles.summaryValue}>{subtotal.toLocaleString()} PUNTOS</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>TOTAL CANJE:</Text>
                <Text style={styles.totalValue}>{totalPuntos.toLocaleString()} PUNTOS</Text>
              </View>
            </View>

            {saldoInsuficiente ? (
              <View style={styles.insufficientBox}>
                <MaterialCommunityIcons name="alert-circle-outline" size={20} color={COLORS.textoPeligro} />
                <Text style={styles.insufficientText}>
                  Te faltan {(totalPuntos - userPoints).toLocaleString()} puntos para realizar este canje.
                </Text>
              </View>
            ) : (
              <Text style={styles.infoText}>
                Al confirmar, se descontarán {totalPuntos.toLocaleString()} puntos de tu saldo y obtendrás un código único para retirar tus insumos.
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.checkoutButton,
                (saldoInsuficiente || procesando) && styles.disabledButton,
              ]}
              onPress={procesarCanje}
              disabled={saldoInsuficiente || procesando}
              activeOpacity={0.8}
            >
              {procesando ? (
                <ActivityIndicator size="small" color={COLORS.superficieTarjeta} />
              ) : (
                <Text style={styles.checkoutButtonText}>PROCESAR CANJE Y CONFIRMAR 🛒</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
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
  productImage: {
    width: 65,
    height: 65,
    borderRadius: BORDER_RADIUS.sm,
  },
  productDetails: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  pointsTag: {
    marginTop: SPACING.xs,
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textoVerde,
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
    marginVertical: 2,
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
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.botonPrincipal,
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
    fontSize: 12,
    color: COLORS.textoSecundario,
    marginVertical: SPACING.md,
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
    fontSize: 14,
  },
  comprobanteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  comprobanteTitulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
    marginTop: SPACING.md,
  },
  comprobanteSubtitulo: {
    fontSize: 13,
    color: COLORS.textoSecundario,
    textAlign: 'center',
    marginVertical: SPACING.sm,
  },
  codigoBox: {
    backgroundColor: COLORS.superficieTarjeta,
    borderWidth: 2,
    borderColor: COLORS.botonPrincipal,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginVertical: SPACING.md,
  },
  codigoTexto: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.botonPrincipal,
    letterSpacing: 2,
  },
  resumenDescuentoBox: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  textoPuntosDescontados: {
    fontSize: 13,
    color: COLORS.textoPeligro,
    fontWeight: '600',
  },
  textoSaldoRestante: {
    fontSize: 14,
    color: COLORS.textoVerdeOscuro,
    fontWeight: 'bold',
    marginTop: 2,
  },
  botonVolver: {
    backgroundColor: COLORS.botonPrincipal,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.md,
  },
  botonVolverTexto: {
    color: COLORS.superficieTarjeta,
    fontWeight: 'bold',
    fontSize: 14,
  },
});