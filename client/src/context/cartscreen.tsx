import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useCart } from './CartContext';

export const CartScreen = () => {
  const {
    cart,
    userPoints,
    shippingPoints,
    shippingARS,
    updateQuantity,
    removeItem,
    getSubtotalPoints,
    getTotalPoints,
  } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<'POINTS' | 'ARS'>('POINTS');

  const subtotal = getSubtotalPoints();
  const totalPoints = getTotalPoints();
  const equivalentARS = totalPoints * 0.1; // Ejemplo de conversión a ARS

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
            <TouchableOpacity>
              <Text style={styles.historyLink}>Ver historial &gt;</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.screenTitle}>TU CARRITO DE COMPRAS</Text>

        {/* Lista de Productos */}
        {cart.map((item) => (
          <View key={item.id} style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.productImage} />
            <View style={styles.productDetails}>
              <Text style={styles.productTitle}>{item.title}</Text>
              <View style={styles.pointsTag}>
                <Text style={styles.pointsText}>⭐ {item.points}</Text>
              </View>
            </View>
            <View style={styles.actionsContainer}>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.id, -1)}
                >
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.id, 1)}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => removeItem(item.id)}
              >
                <Text style={styles.deleteText}>ELIMINAR 🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Card de Resumen y Pago */}
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
            <Text style={styles.totalValue}>{totalPoints.toLocaleString()} PUNTOS</Text>
          </View>

          <Text style={styles.sectionTitle}>MÉTODO DE CANJE</Text>

          {/* Opciones Radio Button */}
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setPaymentMethod('POINTS')}
          >
            <View style={[styles.radioCircle, paymentMethod === 'POINTS' && styles.selectedRadio]} />
            <Text style={styles.radioText}>Usar {totalPoints.toLocaleString()} PUNTOS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setPaymentMethod('ARS')}
          >
            <View style={[styles.radioCircle, paymentMethod === 'ARS' && styles.selectedRadio]} />
            <Text style={styles.radioText}>
              Pagar {equivalentARS} ARS (equivalente)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mensaje Informativo */}
        <Text style={styles.infoText}>
          Tus {userPoints.toLocaleString()} puntos actuales cubren el subtotal, pagarás la diferencia.
        </Text>

        {/* Botón Principal */}
        <TouchableOpacity style={styles.checkoutButton}>
          <Text style={styles.checkoutButtonText}>PROCESAR CANJE Y CONFIRMAR PEDIDO 🛒</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EBF5E9' },
  scrollContainer: { padding: 16 },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#A8D5BA',
    marginRight: 10,
  },
  welcomeText: { fontWeight: 'bold', fontSize: 16, color: '#1B3B22' },
  subWelcomeText: { fontSize: 11, color: '#4A6B50' },
  pointsBadge: { alignItems: 'flex-end' },
  pointsLabel: { fontSize: 12, color: '#4A6B50' },
  pointsValue: { fontSize: 18, fontWeight: 'bold', color: '#2D5A27' },
  historyLink: { fontSize: 10, color: '#2D5A27' },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5A27',
    textAlign: 'center',
    marginVertical: 12,
  },
  card: {
    backgroundColor: '#DDF0D8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A8D5BA',
    flexDirection: 'row',
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  productImage: { width: 70, height: 70, borderRadius: 8 },
  productDetails: { flex: 1, marginLeft: 12 },
  productTitle: { fontSize: 16, fontWeight: 'bold', color: '#1B3B22' },
  pointsTag: { marginTop: 4 },
  pointsText: { fontSize: 14, fontWeight: '600', color: '#2D5A27' },
  actionsContainer: { alignItems: 'flex-end' },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5E9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A8D5BA',
  },
  qtyBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  qtyBtnText: { fontSize: 16, fontWeight: 'bold', color: '#2D5A27' },
  quantityText: { paddingHorizontal: 8, fontWeight: 'bold' },
  deleteButton: { marginTop: 8 },
  deleteText: { fontSize: 10, color: '#4A6B50', fontWeight: 'bold' },
  summaryCard: {
    backgroundColor: '#DDF0D8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A8D5BA',
    padding: 16,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  summaryLabel: { fontSize: 14, color: '#1B3B22', fontWeight: '500' },
  summaryValue: { fontSize: 14, color: '#1B3B22', fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#A8D5BA', marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#1B3B22' },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: '#1B3B22' },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B3B22',
    marginTop: 12,
    marginBottom: 8,
  },
  radioOption: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  radioCircle: {
    height: 16,
    width: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2D5A27',
    marginRight: 8,
  },
  selectedRadio: { backgroundColor: '#2D5A27' },
  radioText: { fontSize: 14, color: '#1B3B22' },
  infoText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#4A6B50',
    marginVertical: 12,
  },
  checkoutButton: {
    backgroundColor: '#4E8C3B',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  checkoutButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});
