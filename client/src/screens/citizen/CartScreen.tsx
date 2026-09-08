// src/screens/citizen/CartScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useCart } from '../../context/CartContext';
import { COLORS, SPACING, BORDER_RADIUS } from '../../utils/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export const CartScreen: React.FC = () => {
  const {
    carrito,
    userPoints,
    shippingPoints,
    shippingARS,
    actualizarCantidad,
    eliminarDelCarrito,
    obtenerSubtotalPuntos,
    obtenerTotalPuntos,
  } = useCart();

  const [metodoPago, setMetodoPago] = useState<'PUNTOS' | 'ARS'>('PUNTOS');

  const subtotal = obtenerSubtotalPuntos();
  const totalPuntos = obtenerTotalPuntos();
  const equivalenteARS = totalPuntos * 0.1;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Encabezado Usuario */}
        <View style={styles.headerContainer}>
          <View style={styles.userInfo}>
            <View style={styles.avatarPlaceholder} />
            <View>
              <Text style={styles.welcomeText}>¡Bienvenido, Joaquín!</Text>
              <Text style={styles.subWelcomeText}>Juntos hacemos una ciudad más limpia 🍃</Text>
            </View>
          </View>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsLabel}>⭐ Mis puntos</Text>
            <Text style={styles.pointsValue}>{userPoints.toLocaleString()}</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.historyLink}>Ver historial &gt;</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.screenTitle}>TU CARRITO DE COMPRAS</Text>

        {/* Lista de Productos */}
        {carrito.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Tu carrito está vacío 🛒</Text>
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
                    <Text style={styles.pointsText}>⭐ {producto.precio} pts</Text>
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

        {/* Resumen y Pago */}
        {carrito.length > 0 && (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>SUBTOTAL:</Text>
                <Text style={styles.summaryValue}>{subtotal.toLocaleString()} PUNTOS</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>COSTO DE ENVÍO:</Text>
                <Text style={styles.summaryValue}>
                  {shippingPoints} PUNTOS (o {shippingARS} ARS)
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>TOTAL:</Text>
                <Text style={styles.totalValue}>{totalPuntos.toLocaleString()} PUNTOS</Text>
              </View>

              <Text style={styles.sectionTitle}>MÉTODO DE CANJE</Text>

              {/* Opciones Radio Button */}
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setMetodoPago('PUNTOS')}
                activeOpacity={0.8}
              >
                <View style={[styles.radioCircle, metodoPago === 'PUNTOS' && styles.selectedRadio]} />
                <Text style={styles.radioText}>Usar {totalPuntos.toLocaleString()} PUNTOS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setMetodoPago('ARS')}
                activeOpacity={0.8}
              >
                <View style={[styles.radioCircle, metodoPago === 'ARS' && styles.selectedRadio]} />
                <Text style={styles.radioText}>
                  Pagar ${equivalenteARS.toFixed(2)} ARS (equivalente)
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.infoText}>
              Tus {userPoints.toLocaleString()} puntos actuales cubren el subtotal, pagarás la diferencia.
            </Text>

            <TouchableOpacity style={styles.checkoutButton} activeOpacity={0.8}>
              <Text style={styles.checkoutButtonText}>PROCESAR CANJE Y CONFIRMAR PEDIDO 🛒</Text>
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
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORS.fondoEncabezado,
    marginRight: SPACING.sm,
  },
  welcomeText: {
    fontWeight: 'bold',
    fontSize: 16,
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
    fontSize: 12,
    color: COLORS.textoSecundario,
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textoVerde,
  },
  historyLink: {
    fontSize: 10,
    color: COLORS.textoVerde,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textoVerde,
    textAlign: 'center',
    marginVertical: SPACING.sm,
  },
  emptyContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textoSecundario,
  },
  card: {
    backgroundColor: COLORS.fondoTarjeta,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    flexDirection: 'row',
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    alignItems: 'center',
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: BORDER_RADIUS.sm,
  },
  productDetails: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  pointsTag: {
    marginTop: SPACING.xs,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textoVerde,
  },
  actionsContainer: {
    alignItems: 'flex-end',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  qtyBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
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
    backgroundColor: COLORS.fondoTarjeta,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    padding: SPACING.md,
    marginTop: SPACING.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: SPACING.xs,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textoVerdeOscuro,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.textoVerdeOscuro,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.bordeSuave,
    marginVertical: SPACING.sm,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xs,
  },
  radioCircle: {
    height: 16,
    width: 16,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.textoVerde,
    marginRight: SPACING.sm,
  },
  selectedRadio: {
    backgroundColor: COLORS.textoVerde,
  },
  radioText: {
    fontSize: 14,
    color: COLORS.textoVerdeOscuro,
  },
  infoText: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textoSecundario,
    marginVertical: SPACING.sm,
  },
  checkoutButton: {
    backgroundColor: COLORS.botonPrincipal,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  checkoutButtonText: {
    color: COLORS.superficieTarjeta,
    fontWeight: 'bold',
    fontSize: 14,
  },
});