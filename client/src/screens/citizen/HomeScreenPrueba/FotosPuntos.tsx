// Inicio de Fase 4 (US2): resumen del historial real para ciudadanos autenticados.
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../../utils/theme';
import { useAuth } from '../../../context/AuthContext';
import { reportRepository } from '../../../repositories/reports';
import { CitizenReport } from '../../../repositories/reports/IReportRepository';
import { ReportStatusBadge } from '../../../components/citizen/ReportStatusBadge';

const { width } = Dimensions.get('window');
const ANCHO_TARJETA = width * 0.72;

interface FotoDesafio {
  id: string;
  titulo: string;
  subtitulo: string;
  puntos: number;
  urlImagen: string;
}

const DESAFIOS_FOTOS: FotoDesafio[] = [
  {
    id: '1',
    titulo: 'Microbasural',
    subtitulo: 'Basura en la vía pública',
    puntos: 50,
    urlImagen:
      'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '2',
    titulo: 'Punto Verde',
    subtitulo: 'Contenedor lleno / desborde',
    puntos: 30,
    urlImagen:
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '3',
    titulo: 'Espacio Público',
    subtitulo: 'Ramas caídas o parque dañado',
    puntos: 40,
    urlImagen:
      'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
  },
];

export const FotosPuntos: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isCitizen = user?.role === 'citizen';

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const loadReports = async () => {
        if (!isCitizen || !user) {
          setReports([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        try {
          const citizenReports = await reportRepository.getCitizenReports(user.id);
          if (active) {
            setReports(citizenReports.slice(0, 5));
            setError(null);
          }
        } catch (loadError) {
          console.error('Error al cargar reportes recientes del ciudadano:', loadError);
          if (active) {
            setError(
              loadError instanceof Error
                ? loadError.message
                : 'No se pudieron cargar los reportes recientes.'
            );
          }
        } finally {
          if (active) setLoading(false);
        }
      };

      void loadReports();
      return () => {
        active = false;
      };
    }, [isCitizen, user])
  );

  const irACamara = () => navigation.navigate('Camara');
  const irAPerfil = () => navigation.navigate('Perfil');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.tituloContainer}>
          <Ionicons
            name={isCitizen ? 'document-text-outline' : 'camera-outline'}
            size={ICON_SIZE.lg}
            color={COLORS.iconoPrincipal}
          />
          <Text style={styles.titulo}>
            {isCitizen ? 'Mis reportes recientes' : 'Sumá puntos reportando'}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={isCitizen ? irAPerfil : irACamara}
          accessibilityRole="button"
        >
          <Text style={styles.verTodo}>{isCitizen ? 'Ver historial' : 'Reportar'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtituloGeneral}>
        {isCitizen
          ? 'Consulta el estado y los puntos de tus reportes.'
          : 'Sacá una foto de estos problemas urbanos para reportarlos.'}
      </Text>

      {isCitizen ? (
        loading ? (
          <ActivityIndicator
            color={COLORS.botonPrincipal}
            style={styles.loading}
            accessibilityLabel="Cargando reportes recientes"
          />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : reports.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Todavía no enviaste reportes.</Text>
            <TouchableOpacity onPress={irACamara} accessibilityRole="button">
              <Text style={styles.reportLink}>Crear mi primer reporte</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            {reports.map((report) => (
              <TouchableOpacity
                key={report.id}
                style={styles.reportCard}
                activeOpacity={0.85}
                onPress={irAPerfil}
                accessibilityRole="button"
                accessibilityLabel={`Reporte ${report.codigo}, estado ${report.estado}`}
              >
                {report.imagenUrl ? (
                  <Image
                    source={{ uri: report.imagenUrl }}
                    style={styles.reportImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.reportImage, styles.placeholderImage]}>
                    <Ionicons name="image-outline" size={32} color={COLORS.textoDesactivado} />
                  </View>
                )}
                <View style={styles.reportInfo}>
                  <Text style={styles.reportTitle} numberOfLines={1}>
                    {report.titulo}
                  </Text>
                  <Text style={styles.reportCode}>{report.codigo}</Text>
                  <View style={styles.reportStatus}>
                    <ReportStatusBadge estado={report.estado} />
                  </View>
                  <Text style={styles.reportPoints}>+{report.puntosOtorgados ?? 0} pts</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {DESAFIOS_FOTOS.map((challenge) => (
            <TouchableOpacity
              key={challenge.id}
              style={styles.challengeCard}
              activeOpacity={0.85}
              onPress={irACamara}
              accessibilityRole="button"
            >
              <View style={styles.challengeImageContainer}>
                <Image
                  source={{ uri: challenge.urlImagen }}
                  style={styles.challengeImage}
                  resizeMode="cover"
                />
                <View style={styles.pointsBadge}>
                  <Ionicons name="leaf" size={13} color={COLORS.superficieTarjeta} />
                  <Text style={styles.pointsText}>+{challenge.puntos} pts</Text>
                </View>
              </View>
              <View style={styles.challengeInfo}>
                <Text style={styles.reportTitle} numberOfLines={1}>
                  {challenge.titulo}
                </Text>
                <Text style={styles.challengeSubtitle} numberOfLines={1}>
                  {challenge.subtitulo}
                </Text>
                <View style={styles.challengeButton}>
                  <Ionicons name="camera" size={14} color={COLORS.superficieTarjeta} />
                  <Text style={styles.challengeButtonText}>Tomar foto</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  tituloContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  titulo: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },
  verTodo: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.botonPrincipal,
  },
  subtituloGeneral: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    paddingHorizontal: SPACING.md,
    marginTop: 2,
    marginBottom: SPACING.sm,
  },
  scrollContainer: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  reportCard: {
    width: ANCHO_TARJETA,
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  reportImage: {
    width: '100%',
    height: 105,
    backgroundColor: COLORS.fondoTarjeta,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportInfo: {
    padding: SPACING.sm,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },
  reportCode: {
    fontSize: 11,
    color: COLORS.textoSecundario,
    marginTop: 2,
  },
  reportStatus: {
    marginTop: SPACING.sm,
  },
  reportPoints: {
    fontSize: 12,
    color: COLORS.textoVerde,
    fontWeight: '700',
    marginTop: SPACING.sm,
  },
  loading: {
    padding: SPACING.lg,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  emptyText: {
    color: COLORS.textoSecundario,
    fontSize: 13,
  },
  reportLink: {
    color: COLORS.textoVerde,
    fontSize: 13,
    fontWeight: '700',
  },
  errorText: {
    color: COLORS.textoPeligro,
    fontSize: 12,
    paddingHorizontal: SPACING.md,
  },
  challengeCard: {
    width: ANCHO_TARJETA,
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  challengeImageContainer: {
    position: 'relative',
    width: '100%',
    height: 110,
    backgroundColor: COLORS.fondoTarjeta,
  },
  challengeImage: {
    width: '100%',
    height: '100%',
  },
  pointsBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: COLORS.botonPrincipal,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.lg,
  },
  pointsText: {
    color: COLORS.superficieTarjeta,
    fontSize: 11,
    fontWeight: '700',
  },
  challengeInfo: {
    padding: SPACING.sm,
  },
  challengeSubtitle: {
    fontSize: 11,
    color: COLORS.textoSecundario,
    marginTop: 2,
    marginBottom: SPACING.xs,
  },
  challengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: COLORS.iconoActivoInferior,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: 4,
  },
  challengeButtonText: {
    color: COLORS.superficieTarjeta,
    fontSize: 11,
    fontWeight: '600',
  },
});

export default FotosPuntos;
