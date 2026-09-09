import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { COLORS } from '../../utils/theme';

export const ReportScreen: React.FC = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  // Mientras se verifica el permiso
  if (!permission) {
    return <View style={styles.container} />;
  }

  // Si todavía no tenemos permiso
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
          La cámara se utilizará para tomar una foto del problema ambiental
          que quieras reportar.
        </Text>

        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
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

    const photo = await cameraRef.current.takePictureAsync();

    console.log('Foto tomada:', photo?.uri);

    // Más adelante acá vamos a:
    // 1. Guardar la foto
    // 2. Obtener ubicación GPS
    // 3. Crear el reporte
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

        {/* Texto superior */}
        <View style={styles.cameraOverlay}>
          <Text style={styles.cameraTitle}>
            Generar Reporte
          </Text>

          <Text style={styles.cameraSubtitle}>
            Capturá una foto del basural o problema ambiental
          </Text>
        </View>

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
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 25,
  },

  cameraTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 4,
  },

  cameraSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 4,
  },

  cameraControls: {
    position: 'absolute',
    bottom: 35,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  captureButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.7)',
  },

  captureButtonInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 3,
    borderColor: '#333333',
  },

  permissionContainer: {
    flex: 1,
    backgroundColor: COLORS.fondoAplicacion,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textoVerdeOscuro,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },

  permissionText: {
    fontSize: 15,
    color: COLORS.textoSecundario,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },

  permissionButton: {
    backgroundColor: COLORS.camaraInferior,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },

  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ReportScreen;