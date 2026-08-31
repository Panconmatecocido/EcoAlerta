// src/screens/auth/RegisterScreen.tsx
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

interface RegisterScreenProps {
  navigation: any;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { register, loginWithGoogle } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    setErrorMessage('');

    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorMessage('Por favor completa todos los campos requeridos');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas ingresadas no coinciden');
      return;
    }

    if (password.length < 4) {
      setErrorMessage('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    setIsLoading(true);
    const result = await register({
      username: username.trim(),
      password: password.trim(),
      confirmPassword: confirmPassword.trim(),
    });
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.message || 'Error al registrar la cuenta');
    }
  };

  const handleGoogleRegister = async () => {
    setErrorMessage('');
    setIsGoogleLoading(true);
    const result = await loginWithGoogle();
    setIsGoogleLoading(false);

    if (!result.success) {
      setErrorMessage(result.message || 'Error al registrarse con Google');
    }
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
          <Text style={styles.title}>REGÍSTRATE</Text>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={COLORS.error} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Campo: Usuario */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Usuario</Text>
            <View style={styles.inputWrapper}>
              <Feather name="user" size={20} color={COLORS.iconoPrincipal} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nombre de usuario"
                placeholderTextColor="#9cb586"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (errorMessage) setErrorMessage('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Campo: Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
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

          {/* Campo: Rep. Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Rep. Password</Text>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={20} color={COLORS.iconoPrincipal} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="•••••••••"
                placeholderTextColor="#9cb586"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errorMessage) setErrorMessage('');
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color={COLORS.iconoPrincipal}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Botones de Acción */}
          <View style={styles.actionButtonsContainer}>
            {/* Botón: REGISTRARSE */}
            <CustomButton
              title="REGISTRARSE"
              onPress={handleRegister}
              variant="primary"
              isLoading={isLoading}
            />

            {/* Botón: Registrate con Google */}
            <CustomButton
              title="Registrate con Google"
              onPress={handleGoogleRegister}
              variant="google"
              isLoading={isGoogleLoading}
            />

            {/* Botón: Iniciar sesión (para volver al login) */}
            <CustomButton
              title="Iniciar sesión"
              onPress={() => navigation.navigate('Login')}
              variant="outline"
            />
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
    marginBottom: 16,
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
  actionButtonsContainer: {
    marginTop: 10,
    gap: 12,
  },
});

export default RegisterScreen;