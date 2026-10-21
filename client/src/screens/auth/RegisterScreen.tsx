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
import {
  RegistrationFormErrors,
  validateRegistrationForm,
} from '../../utils/validators';

interface RegisterScreenProps {
  navigation: any;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { register, loginWithGoogle } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<RegistrationFormErrors>({});

  const handleRegister = async () => {
    setErrorMessage('');

    const errors = validateRegistrationForm({
      nombre: username,
      email,
      password,
      confirmPassword,
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
      });
      if (!result.success) {
        const message = result.message || 'Error al registrar la cuenta';
        setErrorMessage(message);
        Alert.alert('No se pudo registrar la cuenta', message);
      }
    } finally {
      setIsLoading(false);
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

          {/* Campo: Nombre */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre</Text>
            <View style={styles.inputWrapper}>
              <Feather name="user" size={20} color={COLORS.iconoPrincipal} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Tu nombre"
                placeholderTextColor="#9cb586"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  setFieldErrors((current) => ({ ...current, nombre: undefined }));
                }}
                autoCapitalize="words"
                autoCorrect={false}
                accessibilityLabel="Nombre"
              />
            </View>
            {fieldErrors.nombre ? (
              <Text style={styles.fieldError}>{fieldErrors.nombre}</Text>
            ) : null}
          </View>

          {/* Campo: Correo Electrónico */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <View style={styles.inputWrapper}>
              <Feather name="mail" size={20} color={COLORS.iconoPrincipal} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="ejemplo@correo.com"
                placeholderTextColor="#9cb586"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setFieldErrors((current) => ({ ...current, email: undefined }));
                  setErrorMessage('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Correo electrónico"
              />
            </View>
            {fieldErrors.email ? (
              <Text style={styles.fieldError}>{fieldErrors.email}</Text>
            ) : null}
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
                  setFieldErrors((current) => ({ ...current, password: undefined }));
                  setErrorMessage('');
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Contraseña"
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
            {fieldErrors.password ? (
              <Text style={styles.fieldError}>{fieldErrors.password}</Text>
            ) : null}
          </View>

          {/* Campo: Confirmación de contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmar contraseña</Text>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={20} color={COLORS.iconoPrincipal} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="•••••••••"
                placeholderTextColor="#9cb586"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
                  setErrorMessage('');
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Confirmar contraseña"
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
            {fieldErrors.confirmPassword ? (
              <Text style={styles.fieldError}>{fieldErrors.confirmPassword}</Text>
            ) : null}
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
  fieldError: {
    marginTop: 6,
    marginLeft: 8,
    color: COLORS.error,
    fontSize: 12,
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