import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Header from '../../components/Header';
import { TransactionLoaderModal } from '../../components/common/TransactionLoaderModal';
import type { AdminTabParamList } from '../../navigation/AdminNavigator';
import { adminService } from '../../services/adminService';
import type { RolPersonalAdmin } from '../../services/adminService';
import { BORDER_RADIUS, COLORS, ICON_SIZE, SPACING } from '../../utils/theme';
import { compressImage, imageUriToDataUri } from '../../utils/imageCompressor';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_OPTIONS: Array<{
  role: RolPersonalAdmin;
  title: string;
  description: string;
  icon: 'account-hard-hat' | 'store-check-outline';
}> = [
  {
    role: 'AGENT',
    title: 'Agente',
    description: 'Personal de inspección y saneamiento en campo.',
    icon: 'account-hard-hat',
  },
  {
    role: 'COLLABORATOR',
    title: 'Colaborador',
    description: 'Personal que valida y registra entregas de canjes.',
    icon: 'store-check-outline',
  },
];

export const AdminUsuariosScreen: React.FC = () => {
  const route = useRoute<RouteProp<AdminTabParamList, 'UsuariosAdmin'>>();
  const [rol, setRol] = useState<RolPersonalAdmin>(route.params?.rol ?? 'AGENT');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmarPassword, setMostrarConfirmarPassword] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [capturandoFoto, setCapturandoFoto] = useState(false);
  const [fotoPerfilUri, setFotoPerfilUri] = useState<string | null>(null);

  const seleccionarRol = useCallback((nuevoRol: RolPersonalAdmin) => {
    setRol(nuevoRol);
    setFotoPerfilUri(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.rol) seleccionarRol(route.params.rol);
    }, [route.params?.rol, seleccionarRol])
  );

  const tomarFotoPerfil = async () => {
    setCapturandoFoto(true);
    try {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert(
          'Permiso de cámara requerido',
          'Habilita el acceso a la cámara para tomar la foto del personal.'
        );
        return;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
      });

      if (resultado.canceled || resultado.assets.length === 0) return;

      const imagenComprimida = await compressImage(resultado.assets[0].uri);
      const fotoDataUri = await imageUriToDataUri(imagenComprimida.uri);
      setFotoPerfilUri(fotoDataUri);
    } catch (error) {
      console.error('No se pudo capturar la foto del personal:', error);
      Alert.alert(
        'No se pudo procesar la foto',
        error instanceof Error ? error.message : 'Inténtalo nuevamente.'
      );
    } finally {
      setCapturandoFoto(false);
    }
  };

  const crearCuenta = async () => {
    const nombreLimpio = nombre.trim();
    const emailLimpio = email.trim().toLowerCase();

    if (nombreLimpio.length < 2 || nombreLimpio.length > 80) {
      Alert.alert('Revisa el nombre', 'Debe tener entre 2 y 80 caracteres.');
      return;
    }
    if (!EMAIL_PATTERN.test(emailLimpio)) {
      Alert.alert('Revisa el correo', 'Ingresa una dirección de correo electrónico válida.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Revisa la contraseña', 'Debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmarPassword) {
      Alert.alert('Las contraseñas no coinciden', 'Confirma la contraseña exactamente como la ingresaste.');
      return;
    }
    if (!fotoPerfilUri) {
      Alert.alert('Foto requerida', 'Toma una foto antes de crear la cuenta de personal.');
      return;
    }

    setGuardando(true);
    try {
      const cuenta = await adminService.crearCuentaPersonal({
        nombre: nombreLimpio,
        email: emailLimpio,
        password,
        rol,
        fotoPerfilUri,
      });
      setNombre('');
      setEmail('');
      setPassword('');
      setConfirmarPassword('');
      setFotoPerfilUri(null);
      setMostrarPassword(false);
      setMostrarConfirmarPassword(false);
      Alert.alert(
        'Cuenta creada',
        `Se creó la cuenta de ${rol === 'AGENT' ? 'Agente' : 'Colaborador'} para ${cuenta.nombre} (${cuenta.email}).`
      );
    } catch (error) {
      console.error('No se pudo crear la cuenta de personal:', error);
      Alert.alert(
        'No se pudo crear la cuenta',
        error instanceof Error ? error.message : 'Inténtalo nuevamente.'
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <Header showActions={false} />
      <TransactionLoaderModal
        visible={guardando}
        mensaje="Creando cuenta de personal..."
        submensaje="Guardando la cuenta en el municipio asociado"
      />
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Crear cuenta de personal</Text>
          <Text style={styles.description}>
            Da de alta agentes y colaboradores vinculados a tu municipio. El registro público sigue
            habilitado únicamente para ciudadanos.
          </Text>

          <Text style={styles.sectionTitle}>Tipo de cuenta</Text>
          <View style={styles.roleOptions}>
            {ROLE_OPTIONS.map((option) => {
              const isSelected = rol === option.role;
              return (
                <TouchableOpacity
                  key={option.role}
                  style={[styles.roleOption, isSelected && styles.roleOptionSelected]}
                  onPress={() => seleccionarRol(option.role)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  disabled={guardando || capturandoFoto}
                >
                  <MaterialCommunityIcons
                    name={option.icon}
                    size={ICON_SIZE.lg}
                    color={isSelected ? COLORS.botonPrincipal : COLORS.textoSecundario}
                  />
                  <View style={styles.roleText}>
                    <Text style={[styles.roleTitle, isSelected && styles.roleTitleSelected]}>
                      {option.title}
                    </Text>
                    <Text style={styles.roleDescription}>{option.description}</Text>
                  </View>
                  <MaterialCommunityIcons
                    name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                    size={ICON_SIZE.md}
                    color={isSelected ? COLORS.botonPrincipal : COLORS.textoDesactivado}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.formCard}>
            <View style={styles.profilePhotoSection}>
              <Text style={styles.inputLabel}>
                Foto de perfil del {rol === 'AGENT' ? 'agente' : 'colaborador'}
              </Text>
              <View style={styles.profilePhotoRow}>
                {fotoPerfilUri ? (
                  <Image source={{ uri: fotoPerfilUri }} style={styles.profilePhoto} />
                ) : (
                  <View style={styles.profilePhotoPlaceholder}>
                    <MaterialCommunityIcons
                      name="account"
                      size={ICON_SIZE.xl}
                      color={COLORS.textoSecundario}
                    />
                  </View>
                )}
                <View style={styles.profilePhotoInfo}>
                  <Text style={styles.profilePhotoHint}>
                    La foto debe tomarse con la cámara y es obligatoria para crear la cuenta.
                  </Text>
                  <TouchableOpacity
                    style={styles.photoButton}
                    onPress={() => void tomarFotoPerfil()}
                    disabled={guardando || capturandoFoto}
                    accessibilityRole="button"
                    accessibilityLabel={fotoPerfilUri ? 'Volver a tomar foto' : 'Tomar foto'}
                  >
                    <MaterialCommunityIcons
                      name="camera-outline"
                      size={ICON_SIZE.sm}
                      color={COLORS.superficieTarjeta}
                    />
                    <Text style={styles.photoButtonText}>
                      {capturandoFoto
                        ? 'Procesando...'
                        : fotoPerfilUri
                          ? 'Volver a tomar'
                          : 'Tomar foto'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <Text style={styles.inputLabel}>Nombre completo</Text>
            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Nombre y apellido"
              placeholderTextColor={COLORS.textoDesactivado}
              autoCapitalize="words"
              maxLength={80}
              editable={!guardando}
              accessibilityLabel="Nombre completo"
            />

            <Text style={styles.inputLabel}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="nombre@municipio.gob.ar"
              placeholderTextColor={COLORS.textoDesactivado}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!guardando}
              accessibilityLabel="Correo electrónico"
            />

            <Text style={styles.inputLabel}>Contraseña inicial</Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor={COLORS.textoDesactivado}
                secureTextEntry={!mostrarPassword}
                autoCapitalize="none"
                editable={!guardando}
                accessibilityLabel="Contraseña inicial"
              />
              <TouchableOpacity
                style={styles.passwordVisibilityButton}
                onPress={() => setMostrarPassword((mostrar) => !mostrar)}
                accessibilityRole="button"
                accessibilityLabel={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                accessibilityState={{ checked: mostrarPassword }}
                disabled={guardando}
              >
                <MaterialCommunityIcons
                  name={mostrarPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={ICON_SIZE.md}
                  color={COLORS.textoSecundario}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Confirmar contraseña</Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={styles.passwordInput}
                value={confirmarPassword}
                onChangeText={setConfirmarPassword}
                placeholder="Repite la contraseña"
                placeholderTextColor={COLORS.textoDesactivado}
                secureTextEntry={!mostrarConfirmarPassword}
                autoCapitalize="none"
                editable={!guardando}
                accessibilityLabel="Confirmar contraseña"
              />
              <TouchableOpacity
                style={styles.passwordVisibilityButton}
                onPress={() => setMostrarConfirmarPassword((mostrar) => !mostrar)}
                accessibilityRole="button"
                accessibilityLabel={
                  mostrarConfirmarPassword
                    ? 'Ocultar confirmación de contraseña'
                    : 'Mostrar confirmación de contraseña'
                }
                accessibilityState={{ checked: mostrarConfirmarPassword }}
                disabled={guardando}
              >
                <MaterialCommunityIcons
                  name={mostrarConfirmarPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={ICON_SIZE.md}
                  color={COLORS.textoSecundario}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, guardando && styles.submitButtonDisabled]}
              onPress={() => void crearCuenta()}
              disabled={guardando}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name="account-plus-outline"
                size={ICON_SIZE.md}
                color={COLORS.superficieTarjeta}
              />
              <Text style={styles.submitButtonText}>Crear cuenta</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.securityNote}>
            <MaterialCommunityIcons
              name="shield-lock-outline"
              size={ICON_SIZE.md}
              color={COLORS.textoVerde}
            />
            <Text style={styles.securityNoteText}>
              La cuenta se vincula al municipio del administrador. Las contraseñas se guardan de
              forma protegida.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.fondoAplicacion,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textoSecundario,
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
    marginBottom: SPACING.sm,
  },
  roleOptions: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  roleOption: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    backgroundColor: COLORS.superficieTarjeta,
  },
  roleOptionSelected: {
    borderColor: COLORS.botonPrincipal,
    backgroundColor: COLORS.fondoTarjeta,
  },
  roleText: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textoSecundario,
  },
  roleTitleSelected: {
    color: COLORS.textoVerdeOscuro,
  },
  roleDescription: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    marginTop: 2,
  },
  formCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    backgroundColor: COLORS.superficieTarjeta,
  },
  profilePhotoSection: {
    marginBottom: SPACING.sm,
  },
  profilePhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  profilePhoto: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.fondoAplicacion,
  },
  profilePhotoPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.fondoAplicacion,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  profilePhotoInfo: {
    flex: 1,
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  profilePhotoHint: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textoSecundario,
  },
  photoButton: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.botonPrincipal,
  },
  photoButtonText: {
    color: COLORS.superficieTarjeta,
    fontSize: 13,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textoVerdeOscuro,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  input: {
    minHeight: 48,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    backgroundColor: COLORS.fondoAplicacion,
    paddingHorizontal: SPACING.sm,
    color: COLORS.textoVerdeOscuro,
    fontSize: 15,
  },
  passwordInputWrapper: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    backgroundColor: COLORS.fondoAplicacion,
  },
  passwordInput: {
    flex: 1,
    minHeight: 46,
    paddingHorizontal: SPACING.sm,
    color: COLORS.textoVerdeOscuro,
    fontSize: 15,
  },
  passwordVisibilityButton: {
    width: 48,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    minHeight: 50,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.botonPrincipal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.superficieTarjeta,
    fontSize: 16,
    fontWeight: 'bold',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  securityNoteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textoSecundario,
  },
});
