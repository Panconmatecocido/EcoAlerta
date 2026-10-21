import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BORDER_RADIUS, COLORS, SPACING } from '../../utils/theme';

interface AuthGateModalProps {
  visible: boolean;
  onClose: () => void;
  onRegister: () => void;
  onLogin: () => void;
}

export const AuthGateModal: React.FC<AuthGateModalProps> = ({
  visible,
  onClose,
  onRegister,
  onLogin,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
    statusBarTranslucent
  >
    <View style={styles.overlay}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar aviso"
        style={StyleSheet.absoluteFill}
        onPress={onClose}
      />
      <View accessibilityRole="alert" style={styles.card}>
        <View style={styles.iconContainer}>
          <Feather name="lock" size={26} color={COLORS.botonPrincipal} />
        </View>
        <Text style={styles.title}>Necesitas una cuenta</Text>
        <Text style={styles.description}>
          Regístrate o inicia sesión para reportar problemas ambientales, ver tu perfil y canjear productos.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.registerButton}
          onPress={onRegister}
          activeOpacity={0.85}
        >
          <Text style={styles.registerButtonText}>Registrarme</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.loginButton}
          onPress={onLogin}
          activeOpacity={0.75}
        >
          <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.75}
        >
          <Text style={styles.closeButtonText}>Ahora no</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.superposicionOscura,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    padding: SPACING.lg,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.superficieTarjeta,
  },
  iconContainer: {
    width: 56,
    height: 56,
    marginBottom: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: COLORS.fondoEncabezado,
  },
  title: {
    color: COLORS.textoVerdeOscuro,
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
    color: COLORS.textoSecundario,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  registerButton: {
    width: '100%',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.botonPrincipal,
  },
  registerButtonText: {
    color: COLORS.blanco,
    fontSize: 16,
    fontWeight: '700',
  },
  loginButton: {
    width: '100%',
    minHeight: 48,
    marginTop: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.botonPrincipal,
    borderRadius: BORDER_RADIUS.md,
  },
  loginButtonText: {
    color: COLORS.botonPrincipal,
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    padding: SPACING.md,
  },
  closeButtonText: {
    color: COLORS.textoSecundario,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AuthGateModal;
