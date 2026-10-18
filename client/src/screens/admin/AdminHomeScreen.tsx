// En src/screens/admin/AdminHomeScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import { MetricasAdmin } from '../../mocks/adminDashboard';

export const AdminHomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { logout, user } = useAuth();
  const [metricas, setMetricas] = useState<MetricasAdmin | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

  const cargarDatosServidor = async () => {
    try {
      setCargando(true);
      const datosMetricas = await adminService.obtenerMetricas();
      setMetricas(datosMetricas);
    } catch (error) {
      console.error('No se pudieron obtener las métricas reales:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatosServidor();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.contenedor}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado */}
        <View style={styles.encabezado}>
          <View>
            <Text style={styles.tituloEncabezado}>EcoAlerta Admin</Text>
            <Text style={styles.subtituloEncabezado}>
              Bienvenido, {user?.name || 'Administrador'}
            </Text>
          </View>
          <TouchableOpacity style={styles.botonSalir} onPress={logout}>
            <MaterialCommunityIcons name="logout" size={ICON_SIZE.sm} color={COLORS.textoPeligro} />
            <Text style={styles.textoBotonSalir}>Salir</Text>
          </TouchableOpacity>
        </View>

        {/* Resumen Operativo */}
        <View style={styles.cabeceraSeccion}>
          <Text style={styles.tituloSeccion}>Resumen Operativo Global</Text>
          <TouchableOpacity onPress={cargarDatosServidor}>
            <MaterialCommunityIcons name="refresh" size={ICON_SIZE.md} color={COLORS.botonPrincipal} />
          </TouchableOpacity>
        </View>

        {cargando ? (
          <ActivityIndicator size="large" color={COLORS.botonPrincipal} style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.redMetricas}>
            <View style={[styles.tarjetaMetrica, { backgroundColor: COLORS.fondoAdvertencia }]}>
              <MaterialCommunityIcons
                name="clock-alert-outline"
                size={ICON_SIZE.lg}
                color={COLORS.textoAdvertencia}
              />
              <Text style={[styles.valorMetrica, { color: COLORS.textoAdvertencia }]}>
                {metricas?.denunciasPendientes ?? 0}
              </Text>
              <Text style={styles.etiquetaMetrica}>Pendientes</Text>
            </View>

            <View style={[styles.tarjetaMetrica, { backgroundColor: COLORS.fondoTarjeta }]}>
              <MaterialCommunityIcons
                name="progress-wrench"
                size={ICON_SIZE.lg}
                color={COLORS.botonPrincipal}
              />
              <Text style={[styles.valorMetrica, { color: COLORS.botonPrincipal }]}>
                {metricas?.denunciasEnProceso ?? 0}
              </Text>
              <Text style={styles.etiquetaMetrica}>En Proceso</Text>
            </View>

            <View style={[styles.tarjetaMetrica, { backgroundColor: COLORS.fondoTarjeta }]}>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={ICON_SIZE.lg}
                color={COLORS.textoVerdeOscuro}
              />
              <Text style={[styles.valorMetrica, { color: COLORS.textoVerdeOscuro }]}>
                {metricas?.denunciasResueltas ?? 0}
              </Text>
              <Text style={styles.etiquetaMetrica}>Resueltas</Text>
            </View>

            <View style={[styles.tarjetaMetrica, { backgroundColor: COLORS.superficieTarjeta }]}>
              <MaterialCommunityIcons
                name="account-hard-hat"
                size={ICON_SIZE.lg}
                color={COLORS.textoSecundario}
              />
              <Text style={[styles.valorMetrica, { color: COLORS.textoSecundario }]}>
                {metricas?.totalAgentesActivos ?? 0}
              </Text>
              <Text style={styles.etiquetaMetrica}>Agentes Activos</Text>
            </View>
          </View>
        )}

        {/* Acceso Rápido al ABM de Catálogo y Sucursales */}
        <Text style={styles.tituloSeccion}>Gestión Municipal de Insumos</Text>
        <TouchableOpacity
          style={styles.tarjetaAccesoRapido}
          onPress={() => navigation.navigate('ProductosAdmin')}
          activeOpacity={0.8}
        >
          <View style={styles.iconoAccesoRapido}>
            <MaterialCommunityIcons name="storefront-outline" size={28} color={COLORS.botonPrincipal} />
          </View>
          <View style={styles.textosAccesoRapido}>
            <Text style={styles.tituloAccesoRapido}>ABM de Catálogo y Sucursales</Text>
            <Text style={styles.descripcionAccesoRapido}>
              Gestionar stock, premios ecológicos, baja lógica y puntos de retiro municipales.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textoSecundario} />
        </TouchableOpacity>

        {/* Sección Auditoría de Actividad */}
        <Text style={styles.tituloSeccion}>Últimas Acciones del Personal</Text>
        <View style={styles.contenedorAuditoria}>
          <View style={styles.itemAuditoria}>
            <MaterialCommunityIcons name="shield-check" size={20} color={COLORS.botonPrincipal} />
            <View style={styles.textosAuditoria}>
              <Text style={styles.tituloAuditoria}>Asignación de Inspector</Text>
              <Text style={styles.detalleAuditoria}>Admin asignó a Inspector Pérez a REP-2026-002</Text>
            </View>
            <Text style={styles.horaAuditoria}>10m</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.fondoAplicacion,
  },
  contenedor: {
    flex: 1,
  },
  contenido: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg * 2,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingTop: SPACING.xs,
  },
  tituloEncabezado: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  subtituloEncabezado: {
    fontSize: 14,
    color: COLORS.textoSecundario,
  },
  botonSalir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.fondoPeligro,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.bordePeligro,
  },
  textoBotonSalir: {
    color: COLORS.textoPeligro,
    fontSize: 12,
    fontWeight: 'bold',
  },
  cabeceraSeccion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  tituloSeccion: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  redMetricas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tarjetaMetrica: {
    width: '48%',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    alignItems: 'center',
  },
  valorMetrica: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: SPACING.xs,
  },
  etiquetaMetrica: {
    fontSize: 12,
    color: COLORS.textoSecundario,
  },
  contenedorAuditoria: {
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    marginTop: SPACING.xs,
  },
  itemAuditoria: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  textosAuditoria: {
    flex: 1,
  },
  tituloAuditoria: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  detalleAuditoria: {
    fontSize: 11,
    color: COLORS.textoSecundario,
  },
  horaAuditoria: {
    fontSize: 10,
    color: COLORS.textoDesactivado,
  },
  tarjetaAccesoRapido: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  iconoAccesoRapido: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.fondoTarjeta,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  textosAccesoRapido: {
    flex: 1,
    marginRight: SPACING.xs,
  },
  tituloAccesoRapido: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  descripcionAccesoRapido: {
    fontSize: 11,
    color: COLORS.textoSecundario,
    marginTop: 2,
  },
});