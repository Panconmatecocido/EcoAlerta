// Inicio de Fase 3 (US1): creación autenticada de reportes ambientales geolocalizados.
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker, type MapPressEvent, type Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import {
  compressImage,
  CompressedImage,
  imageUriToDataUri,
} from '../../utils/imageCompressor';
import { reportRepository } from '../../repositories/reports';
import { COLORS, SPACING, BORDER_RADIUS } from '../../utils/theme';

const CATEGORIES = ['Microbasural', 'Foco de Dengue', 'Terreno Baldío', 'Otro'] as const;
type ReportCategory = (typeof CATEGORIES)[number];

const PILAR_REGION: Region = {
  latitude: -34.4587,
  longitude: -58.9142,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

export const ReportScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<ParamListBase>>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const isCapturingRef = useRef(false);
  const [image, setImage] = useState<CompressedImage | null>(null);
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [mapCoordinate, setMapCoordinate] = useState({
    latitude: PILAR_REGION.latitude,
    longitude: PILAR_REGION.longitude,
  });
  const [mapVisible, setMapVisible] = useState(false);
  const [detectedMunicipality, setDetectedMunicipality] = useState('');
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const geocodeRequestId = useRef(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const processImage = async (uri: string) => {
    setIsCameraReady(false);
    setIsProcessingImage(true);
    setErrorMessage('');
    try {
      const compressedImage = await compressImage(uri);
      setImage(compressedImage);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudo procesar la fotografía.'
      );
    } finally {
      setIsProcessingImage(false);
    }
  };

  const takePicture = async () => {
    if (!permission?.granted || image || isProcessingImage || isCapturingRef.current) {
      return;
    }

    if (!isCameraReady) {
      setErrorMessage('La cámara todavía se está preparando. Inténtalo nuevamente en un momento.');
      return;
    }

    isCapturingRef.current = true;
    setErrorMessage('');
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
      if (!photo?.uri) {
        setErrorMessage('No se pudo capturar la fotografía. Inténtalo nuevamente.');
        return;
      }
      await processImage(photo.uri);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Ocurrió un error al tomar la fotografía.'
      );
    } finally {
      isCapturingRef.current = false;
    }
  };

  const takePictureRef = useRef(takePicture);
  takePictureRef.current = takePicture;

  useEffect(
    () =>
      navigation.addListener('tabPress', (event) => {
        if (!navigation.isFocused() || !permission?.granted || image) {
          return;
        }

        event.preventDefault();
        void takePictureRef.current();
      }),
    [image, navigation, permission?.granted]
  );

  const chooseFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
      });
      const selectedImage = result.canceled ? undefined : result.assets[0];
      if (selectedImage?.uri) await processImage(selectedImage.uri);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudo abrir la galería de imágenes.'
      );
    }
  };

  const updateAddressFromCoordinates = async (
    coordinate: { latitude: number; longitude: number }
  ) => {
    const requestId = ++geocodeRequestId.current;
    setIsResolvingAddress(true);

    try {
      const [result] = await Location.reverseGeocodeAsync(coordinate);
      if (requestId !== geocodeRequestId.current) return;

      if (!result) {
        setDetectedMunicipality('');
        setLocationMessage(
          'No se pudo identificar la dirección automáticamente. Puedes ingresarla manualmente.'
        );
        return;
      }

      const localidad = result.city || result.subregion || result.district || '';
      const direccionCalle = [result.street, result.streetNumber].filter(Boolean).join(' ');
      const direccionSugerida = [direccionCalle || result.name, localidad, result.region]
        .filter(Boolean)
        .join(', ');

      setDetectedMunicipality([localidad, result.region].filter(Boolean).join(', '));
      if (direccionSugerida) {
        setAddress(direccionSugerida);
        setLocationMessage('Ubicación detectada. Puedes ajustar el pin o editar la dirección.');
      } else {
        setLocationMessage(
          'No se pudo identificar la dirección automáticamente. Puedes ingresarla manualmente.'
        );
      }
    } catch (error) {
      console.warn('No se pudo obtener la dirección de la ubicación seleccionada:', error);
      if (requestId === geocodeRequestId.current) {
        setDetectedMunicipality('');
        setLocationMessage(
          'No se pudo identificar la dirección automáticamente. Puedes ingresarla manualmente.'
        );
      }
    } finally {
      if (requestId === geocodeRequestId.current) {
        setIsResolvingAddress(false);
      }
    }
  };

  const selectMapCoordinate = (coordinate: { latitude: number; longitude: number }) => {
    setMapCoordinate(coordinate);
    setCoordinates(coordinate);
    setAddress('');
    setDetectedMunicipality('');
    void updateAddressFromCoordinates(coordinate);
  };

  const handleMapPress = (event: MapPressEvent) => {
    selectMapCoordinate(event.nativeEvent.coordinate);
  };

  const captureLocation = async () => {
    setIsGettingLocation(true);
    setLocationMessage('');
    try {
      const permissionResult = await Location.requestForegroundPermissionsAsync();
      if (!permissionResult.granted) {
        setLocationMessage(
          'No se concedió el permiso de ubicación. Puedes elegir el punto en el mapa o ingresar la dirección manualmente.'
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const currentCoordinate = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setMapCoordinate(currentCoordinate);
      setCoordinates(currentCoordinate);
      setAddress('');
      setDetectedMunicipality('');
      setMapVisible(true);
      setLocationMessage('Ubicación GPS capturada. Revisa el pin y ajusta la dirección si hace falta.');
      void updateAddressFromCoordinates(currentCoordinate);
    } catch (error) {
      setLocationMessage(
        error instanceof Error
          ? `No se pudo obtener el GPS: ${error.message}. Puedes elegir el punto en el mapa o ingresar la dirección manualmente.`
          : 'No se pudo obtener el GPS. Puedes elegir el punto en el mapa o ingresar la dirección manualmente.'
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  const openLocationMap = () => {
    if (coordinates) {
      setMapCoordinate(coordinates);
    }
    setMapVisible((visible) => !visible);
  };

  const submitReport = async () => {
    if (!category || !title.trim() || !description.trim() || !address.trim() || !image) {
      setErrorMessage(
        'Completa el título, la descripción, la categoría, la dirección y adjunta una fotografía.'
      );
      return;
    }

    const municipioId = user?.municipioId || process.env.EXPO_PUBLIC_MUNICIPIO_ID;
    if (!municipioId) {
      setErrorMessage(
        'Tu cuenta no tiene un municipio asignado. Configura EXPO_PUBLIC_MUNICIPIO_ID o asigna el municipio a la cuenta antes de enviar.'
      );
      return;
    }

    if (!user || user.role !== 'citizen') {
      setErrorMessage('Debes iniciar sesión con una cuenta ciudadana para enviar un reporte.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const report = await reportRepository.createReport({
        titulo: title.trim(),
        descripcion: description.trim(),
        categoria: category,
        direccion: address.trim(),
        latitud: coordinates?.latitude ?? null,
        longitud: coordinates?.longitude ?? null,
        imagenUrl: await imageUriToDataUri(image.uri),
        ciudadanoId: user.id,
        municipioId,
      });

      Alert.alert(
        'Reporte recibido',
        `Tu reporte quedó registrado con el código ${report.codigo} en estado PENDIENTE. Los EcoPuntos quedan en revisión hasta la verificación en terreno.`,
        [{ text: 'Entendido' }]
      );
      setImage(null);
      setCategory(null);
      setTitle('');
      setDescription('');
      setAddress('');
      setCoordinates(null);
      setMapCoordinate({
        latitude: PILAR_REGION.latitude,
        longitude: PILAR_REGION.longitude,
      });
      setMapVisible(false);
      setDetectedMunicipality('');
      setLocationMessage('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo enviar el reporte. Inténtalo nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.role !== 'citizen') {
    return (
      <View style={styles.gateContainer}>
        <Ionicons name="lock-closed-outline" size={48} color={COLORS.iconoPrincipal} />
        <Text style={styles.gateTitle}>Inicia sesión para reportar</Text>
        <Text style={styles.gateText}>
          La creación de reportes está disponible únicamente para ciudadanos autenticados.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.getParent()?.navigate('Login')}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Ir a iniciar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!permission?.granted && !image) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.permissionContent}>
          <Ionicons name="camera-outline" size={64} color={COLORS.camaraInferior} />
          <Text style={styles.gateTitle}>Agrega una foto del problema</Text>
          <Text style={styles.gateText}>
            Puedes tomar una fotografía o seleccionar una imagen de tu galería.
          </Text>
          <View style={styles.permissionActions}>
            {permission ? (
              <TouchableOpacity
                style={[styles.primaryButton, styles.permissionButton]}
                onPress={requestPermission}
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>Permitir acceso a la cámara</Text>
              </TouchableOpacity>
            ) : (
              <ActivityIndicator color={COLORS.botonPrincipal} />
            )}
            <TouchableOpacity
              style={[styles.secondaryButton, styles.permissionButton]}
              onPress={chooseFromGallery}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>Elegir de la galería</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Crear reporte ambiental</Text>
        <Text style={styles.screenDescription}>
          Describe el problema y agrega la ubicación para que el municipio pueda revisarlo.
        </Text>

        <Text style={styles.label}>Fotografía del problema *</Text>
        {image ? (
          <View style={styles.photoCard}>
            <Image source={{ uri: image.uri }} style={styles.previewImage} />
            <View style={styles.photoInfo}>
              <Text style={styles.photoSize}>
                {(image.size / (1024 * 1024)).toFixed(2)} MB · máximo 1.2 MB
              </Text>
              <TouchableOpacity
                onPress={() => setImage(null)}
                accessibilityRole="button"
                accessibilityLabel="Quitar fotografía"
              >
                <Text style={styles.linkText}>Cambiar fotografía</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.photoActions}>
            {permission?.granted ? (
              <View style={styles.cameraPreview}>
                <CameraView
                  ref={cameraRef}
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  onCameraReady={() => setIsCameraReady(true)}
                />
                <View style={styles.cameraHint}>
                  <Ionicons name="camera-outline" size={22} color={COLORS.superficieTarjeta} />
                  <Text style={styles.cameraHintText}>
                    Presiona el botón de cámara del menú inferior para tomar la foto.
                  </Text>
                </View>
              </View>
            ) : null}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={chooseFromGallery}
              disabled={isProcessingImage}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>Elegir de la galería</Text>
            </TouchableOpacity>
          </View>
        )}
        {isProcessingImage ? (
          <View style={styles.inlineStatus}>
            <ActivityIndicator size="small" color={COLORS.botonPrincipal} />
            <Text style={styles.helperText}>Optimizando fotografía…</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Categoría *</Text>
        <View style={styles.categoryList}>
          {CATEGORIES.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.categoryOption, category === item && styles.categorySelected]}
              onPress={() => setCategory(item)}
              accessibilityRole="radio"
              accessibilityState={{ selected: category === item }}
            >
              <Text
                style={[styles.categoryText, category === item && styles.categoryTextSelected]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Título *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Ej.: Microbasural en la esquina"
          placeholderTextColor={COLORS.textoDesactivado}
          maxLength={100}
          accessibilityLabel="Título del reporte"
        />

        <Text style={styles.label}>Descripción *</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe brevemente el problema"
          placeholderTextColor={COLORS.textoDesactivado}
          multiline
          textAlignVertical="top"
          maxLength={1000}
          accessibilityLabel="Descripción del reporte"
        />

        <Text style={styles.label}>Dirección de referencia *</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={(value) => {
            geocodeRequestId.current += 1;
            setIsResolvingAddress(false);
            setAddress(value);
          }}
          placeholder="Calle, altura o referencia cercana"
          placeholderTextColor={COLORS.textoDesactivado}
          accessibilityLabel="Dirección de referencia"
        />
        <View style={styles.locationActions}>
          <TouchableOpacity
            style={styles.locationAction}
            onPress={captureLocation}
            disabled={isGettingLocation}
            accessibilityRole="button"
          >
            {isGettingLocation ? (
              <ActivityIndicator size="small" color={COLORS.iconoPrincipal} />
            ) : (
              <Ionicons name="locate-outline" size={20} color={COLORS.iconoPrincipal} />
            )}
            <Text style={styles.locationButtonText}>
              {coordinates ? 'Actualizar con mi ubicación GPS' : 'Usar mi ubicación GPS'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.locationAction}
            onPress={openLocationMap}
            accessibilityRole="button"
            accessibilityState={{ expanded: mapVisible }}
          >
            <Ionicons name="map-outline" size={20} color={COLORS.iconoPrincipal} />
            <Text style={styles.locationButtonText}>
              {mapVisible ? 'Ocultar mapa' : 'Elegir ubicación en el mapa'}
            </Text>
          </TouchableOpacity>
        </View>
        {mapVisible ? (
          <View style={styles.mapCard}>
            <Text style={styles.mapInstructions}>
              Toca el mapa o arrastra el pin para marcar el lugar del reporte.
            </Text>
            <MapView
              style={styles.map}
              region={{
                ...mapCoordinate,
                latitudeDelta: 0.012,
                longitudeDelta: 0.012,
              }}
              onPress={handleMapPress}
              accessibilityLabel="Mapa para seleccionar la ubicación del reporte"
            >
              <Marker
                coordinate={mapCoordinate}
                draggable
                title="Ubicación del reporte"
                onDragEnd={(event) => selectMapCoordinate(event.nativeEvent.coordinate)}
              />
            </MapView>
          </View>
        ) : null}
        {isResolvingAddress ? (
          <Text style={styles.helperText}>Buscando la dirección de la ubicación…</Text>
        ) : locationMessage ? (
          <Text style={styles.helperText}>{locationMessage}</Text>
        ) : null}
        {detectedMunicipality ? (
          <Text style={styles.detectedMunicipality}>
            Localidad detectada: {detectedMunicipality}
          </Text>
        ) : null}
        {coordinates ? (
          <Text style={styles.helperText}>
            Coordenadas: {coordinates.latitude.toFixed(5)}, {coordinates.longitude.toFixed(5)}
          </Text>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorBox} accessibilityRole="alert">
            <Ionicons name="alert-circle-outline" size={20} color={COLORS.textoPeligro} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            (isSubmitting || isProcessingImage || isResolvingAddress) && styles.disabledButton,
          ]}
          onPress={submitReport}
          disabled={isSubmitting || isProcessingImage || isResolvingAddress}
          accessibilityRole="button"
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.superficieTarjeta} />
          ) : (
            <Text style={styles.primaryButtonText}>Enviar reporte</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.pointsNote}>
          Los EcoPuntos se acreditan después de la verificación municipal en terreno.
        </Text>
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
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  screenTitle: {
    color: COLORS.textoVerdeOscuro,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  screenDescription: {
    color: COLORS.textoSecundario,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  label: {
    color: COLORS.textoVerdeOscuro,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  photoActions: {
    gap: SPACING.sm,
  },
  cameraPreview: {
    height: 220,
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.fondoTarjeta,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: SPACING.md,
  },
  cameraHint: {
    maxWidth: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  cameraHintText: {
    flexShrink: 1,
    color: COLORS.superficieTarjeta,
    fontSize: 13,
    fontWeight: '600',
  },
  photoCard: {
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.superficieTarjeta,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  previewImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  photoInfo: {
    padding: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoSize: {
    color: COLORS.textoSecundario,
    fontSize: 12,
  },
  linkText: {
    color: COLORS.textoVerde,
    fontSize: 13,
    fontWeight: '700',
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  categoryOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    backgroundColor: COLORS.superficieTarjeta,
  },
  categorySelected: {
    borderColor: COLORS.botonPrincipal,
    backgroundColor: COLORS.fondoTarjeta,
  },
  categoryText: {
    color: COLORS.textoSecundario,
    fontSize: 13,
  },
  categoryTextSelected: {
    color: COLORS.textoVerdeOscuro,
    fontWeight: '700',
  },
  input: {
    minHeight: 48,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borde,
    backgroundColor: COLORS.superficieTarjeta,
    color: COLORS.textoVerdeOscuro,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 110,
  },
  locationActions: {
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  locationAction: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    backgroundColor: COLORS.superficieTarjeta,
  },
  mapCard: {
    marginTop: SPACING.sm,
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    backgroundColor: COLORS.superficieTarjeta,
  },
  mapInstructions: {
    padding: SPACING.sm,
    color: COLORS.textoSecundario,
    fontSize: 13,
  },
  map: {
    width: '100%',
    height: 240,
  },
  detectedMunicipality: {
    color: COLORS.textoVerdeOscuro,
    fontSize: 13,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  locationButtonText: {
    color: COLORS.textoVerde,
    fontSize: 14,
    fontWeight: '600',
  },
  helperText: {
    color: COLORS.textoSecundario,
    fontSize: 12,
    lineHeight: 18,
    marginTop: SPACING.xs,
  },
  inlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.fondoPeligro,
    padding: SPACING.sm,
    marginTop: SPACING.md,
  },
  errorText: {
    flex: 1,
    color: COLORS.textoPeligro,
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.botonPrincipal,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  primaryButtonText: {
    color: COLORS.superficieTarjeta,
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.botonPrincipal,
    backgroundColor: COLORS.superficieTarjeta,
    paddingHorizontal: SPACING.md,
  },
  secondaryButtonText: {
    color: COLORS.textoVerde,
    fontWeight: '700',
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.65,
  },
  pointsNote: {
    color: COLORS.textoSecundario,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    marginTop: SPACING.sm,
  },
  gateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.fondoAplicacion,
    padding: SPACING.lg,
  },
  permissionContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  permissionActions: {
    width: '100%',
    gap: SPACING.md,
  },
  permissionButton: {
    width: '100%',
    marginTop: 0,
  },
  gateTitle: {
    color: COLORS.textoVerdeOscuro,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    marginTop: SPACING.md,
  },
  gateText: {
    color: COLORS.textoSecundario,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
});

export default ReportScreen;
