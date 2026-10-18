// src/screens/citizen/ReportCameraScreen.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { COLORS, SPACING, BORDER_RADIUS } from '../../utils/theme';
import type { ReportCameraScreenProps } from '../../navigation/types';

export const ReportCameraScreen: React.FC<ReportCameraScreenProps> = ({
  navigation,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);

  // Mientras se verifica el permiso
  if (!permission) {
    return <View style={styles.container} />;
  }

  // Permiso denegado permanentemente — el sistema ya no puede preguntar
  if (!permission.granted && !permission.canAskAgain) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons
          name="camera-outline"
          size={70}
          color={COLORS.camaraInferior}
        />

        <Text style={styles.permissionTitle}>
          Permiso de cámara denegado
        </Text>

        <Text style={styles.permissionText}>
          El acceso a la cámara es necesario para fotografiar problemas
          ambientales. Habilitalo desde la configuración del dispositivo.
        </Text>

        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => Linking.openSettings()}
          activeOpacity={0.8}
        >
          <Text style={styles.permissionButtonText}>
            Abrir configuración
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Si todavía no tenemos permiso (y todavía se puede pedir)
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons
          name="camera-outline"
          size={70}
          color={COLORS.camaraInferior}
        />

        <Text style={styles.permissionTitle}>
          Necesitamos acceder a tu cámara
        </Text>

        <Text style={styles.permissionText}>
          El acceso a la cámara es necesario para fotografiar el problema
          ambiental que querés reportar.
        </Text>

        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
          activeOpacity={0.8}
        >
          <Text style={styles.permissionButtonText}>
            Permitir cámara
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Tomar foto
  const takePicture = async () => {
    if (!cameraRef.current) return;
    setCaptureError(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        navigation.navigate('ReportForm', { fotoUri: photo.uri });
      } else {
        setCaptureError('No se pudo obtener la fotografía. Intentá nuevamente.');
      }
    } catch {
      setCaptureError('La captura no pudo completarse. Intentá nuevamente.');
    }
  };

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        />

        {/* Texto superior en superposición */}
        <View style={styles.cameraOverlay}>
          <Text style={styles.cameraTitle}>
            Generar Reporte
          </Text>

          <Text style={styles.cameraSubtitle}>
            Capturá una foto del basural o problema ambiental
          </Text>
        </View>

        {/* Error de captura inline */}
        {captureError !== null && (
          <View style={styles.captureErrorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={COLORS.blanco}
              style={styles.captureErrorIcon}
            />
            <Text style={styles.captureErrorText}>{captureError}</Text>
          </View>
        )}

        {/* Botón para sacar foto */}
        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={takePicture}
            activeOpacity={0.8}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.fondoAplicacion,
  },

  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },

  camera: {
    flex: 1,
  },

  cameraOverlay: {
    position: 'absolute',
    top: SPACING.md,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },

  cameraTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.superficieTarjeta,
    marginBottom: SPACING.xs / 2,
    textShadowColor: COLORS.superposicionOscura,
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 4,
  },

  cameraSubtitle: {
    fontSize: 14,
    color: COLORS.superficieTarjeta,
    textAlign: 'center',
    textShadowColor: COLORS.superposicionOscura,
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 4,
  },

  captureErrorContainer: {
    position: 'absolute',
    bottom: SPACING.lg + 78 + SPACING.md,
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },

  captureErrorIcon: {
    marginRight: SPACING.xs,
  },

  captureErrorText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.blanco,
    fontWeight: '600',
  },

  cameraControls: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  captureButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: COLORS.superficieTarjeta,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.bordeSuave,
  },

  captureButtonInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 3,
    borderColor: COLORS.textoVerdeOscuro,
  },

  permissionContainer: {
    flex: 1,
    backgroundColor: COLORS.fondoAplicacion,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },

  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textoVerdeOscuro,
    textAlign: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },

  permissionText: {
    fontSize: 15,
    color: COLORS.textoSecundario,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },

  permissionButton: {
    backgroundColor: COLORS.camaraInferior,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.md,
  },

  permissionButtonText: {
    color: COLORS.superficieTarjeta,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ReportCameraScreen;
