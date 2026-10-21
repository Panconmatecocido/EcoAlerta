// src/screens/auth/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/Header';
import { CustomButton } from '../../components/CustomButton';
import { COLORS } from '../../utils/theme';

const DEMO_ACCOUNTS = [
  { label: 'Ciudadano', email: 'ciudadano@ecoalerta.com', password: 'ciudadano123' },
  { label: 'Agente', email: 'agente1@ecoalerta.com', password: 'agente123' },
  { label: 'Administrador', email: 'admin@ecoalerta.com', password: 'admin123' },
  { label: 'Colaborador', email: 'colaborador@ecoalerta.com', password: 'colaborador123' },
];

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login, loginWithGoogle } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    setErrorMessage('');
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Por favor ingresa tu correo y contraseña');
      return;
    }
    if (
      identifier.includes('@') &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim())
    ) {
      setErrorMessage('Ingresa un correo electrónico válido');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login({ identifier, password });
      if (!result.success) {
        const message = result.message || 'Error al iniciar sesión';
        setErrorMessage(message);
        Alert.alert('No se pudo iniciar sesión', message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectDemoAccount = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setIdentifier(account.email);
    setPassword(account.password);
    setErrorMessage('');
  };

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setIsGoogleLoading(true);
    const result = await loginWithGoogle();
    setIsGoogleLoading(false);

    if (!result.success) {
      setErrorMessage(result.message || 'Error al iniciar sesión con Google');
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Recuperar Contraseña',
      'Ingresa tu correo electrónico para enviarte las instrucciones de restablecimiento.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: () =>
            Alert.alert('Éxito', 'Se ha enviado un enlace a tu correo electrónico.'),
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header idéntico al boceto */}
      <Header
        onPressNotifications={() => Alert.alert('Notificaciones', 'No tienes notificaciones nuevas')}
        onPressSettings={() => Alert.alert('Ajustes', 'Configuración de la aplicación')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Tarjeta Blanca Principal con bordes superiores curvos */}
        <View style={styles.card}>
          <Text style={styles.title}>INICIAR SESIÓN</Text>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={COLORS.error} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Campo: Correo Electrónico */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <View style={styles.inputWrapper}>
              <Feather name="user" size={20} color={COLORS.iconoPrincipal} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="ejemplo@email.com"
                placeholderTextColor="#9cb586"
                value={identifier}
                onChangeText={(text) => {
                  setIdentifier(text);
                  if (errorMessage) setErrorMessage('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Campo: Contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={20} color={COLORS.iconoPrincipal} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="•••••••••"
                placeholderTextColor="#9cb586"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errorMessage) setErrorMessage('');
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color={COLORS.iconoPrincipal}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Enlace: Olvidé mi contraseña */}
          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={handleForgotPassword}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotPasswordText}>Olvidé mi contraseña</Text>
          </TouchableOpacity>

          {/* Botón Principal: INICIAR SESIÓN */}
          <View style={styles.actionButtonsContainer}>
            <CustomButton
              title="INICIAR SESIÓN"
              onPress={handleLogin}
              variant="primary"
              isLoading={isLoading}
            />

            {/* Botón: Iniciar sesión con Google */}
            <CustomButton
              title="Iniciar sesión con Google"
              onPress={handleGoogleLogin}
              variant="google"
              isLoading={isGoogleLoading}
            />

            <View style={styles.demoSection}>
              <Text style={styles.demoTitle}>Acceso rápido de demostración</Text>
              <View style={styles.demoAccounts}>
                {DEMO_ACCOUNTS.map((account) => (
                  <TouchableOpacity
                    key={account.email}
                    accessibilityRole="button"
                    style={styles.demoAccountButton}
                    onPress={() => selectDemoAccount(account)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.demoAccountText}>{account.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.demoHint}>
                Selecciona un rol y luego pulsa “Iniciar sesión”.
              </Text>
            </View>

            {/* Enlace para ir al Registro */}
            <TouchableOpacity
              style={styles.switchAuthContainer}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.7}
            >
              <Text style={styles.switchAuthText}>
                ¿No tienes cuenta? <Text style={styles.switchAuthHighlight}>Regístrate</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestButton}
              accessibilityRole="button"
              onPress={() => navigation.navigate('MainApp')}
              activeOpacity={0.75}
            >
              <Feather name="arrow-left" size={16} color={COLORS.botonPrincipal} />
              <Text style={styles.guestButtonText}>Volver al inicio como invitado</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.fondoAplicacion,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 5,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.superficieTarjeta,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.textoVerdeOscuro,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fde8e8',
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textoVerdeOscuro,
    marginBottom: 8,
    paddingLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.superficieTarjeta,
    borderWidth: 1.5,
    borderColor: COLORS.iconoPrincipal,
    borderRadius: 22,
    height: 54,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textoVerdeOscuro,
    height: '100%',
  },
  eyeButton: {
    padding: 6,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -4,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: COLORS.textoVerdeOscuro,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  actionButtonsContainer: {
    marginTop: 8,
    gap: 12,
  },
  demoSection: {
    marginTop: 4,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.fondoTarjeta,
  },
  demoTitle: {
    marginBottom: 10,
    color: COLORS.textoVerdeOscuro,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  demoAccounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  demoAccountButton: {
    minWidth: '45%',
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    borderRadius: 10,
    backgroundColor: COLORS.superficieTarjeta,
  },
  demoAccountText: {
    color: COLORS.textoVerde,
    fontSize: 13,
    fontWeight: '700',
  },
  demoHint: {
    marginTop: 8,
    color: COLORS.textoSecundario,
    fontSize: 12,
    textAlign: 'center',
  },
  switchAuthContainer: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 8,
  },
  switchAuthText: {
    fontSize: 14,
    color: COLORS.textoVerdeOscuro,
  },
  switchAuthHighlight: {
    color: COLORS.botonPrincipal,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  guestButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  guestButtonText: {
    color: COLORS.botonPrincipal,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default LoginScreen;