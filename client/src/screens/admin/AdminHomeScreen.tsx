//Resumen Operativo y Métricas
// src/screens/admin/AdminHomeScreen.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../utils/theme';
import { METRICAS_MOCK } from '../../mocks/adminDashboard';
import { useAuth } from '../../context/AuthContext';

export const AdminHomeScreen: React.FC = () => {
  const { logout, user } = useAuth();

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

        {/* Sección KPI / Resumen */}
        <Text style={styles.tituloSeccion}>Resumen Operativo Global</Text>
        <View style={styles.redMetricas}>
          <View style={[styles.tarjetaMetrica, { backgroundColor: COLORS.fondoAdvertencia }]}>
            <MaterialCommunityIcons
              name="clock-alert-outline"
              size={ICON_SIZE.lg}
              color={COLORS.textoAdvertencia}
            />
            <Text style={[styles.valorMetrica, { color: COLORS.textoAdvertencia }]}>
              {METRICAS_MOCK.denunciasPendientes}
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
              {METRICAS_MOCK.denunciasEnProceso}
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
              {METRICAS_MOCK.denunciasResueltas}
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
              {METRICAS_MOCK.totalAgentesActivos}
            </Text>
            <Text style={styles.etiquetaMetrica}>Agentes Activos</Text>
          </View>
        </View>

        {/* Sección Auditoría de Actividad */}
        <Text style={styles.tituloSeccion}>Últimas Acciones del Personal</Text>
        <View style={styles.contenedorAuditoria}>
          <View style={styles.itemAuditoria}>
            <MaterialCommunityIcons name="shield-check" size={20} color={COLORS.botonPrincipal} />
            <View style={styles.textosAuditoria}>
              <Text style={styles.tituloAuditoria}>Asignación de Inspector</Text>
              <Text style={styles.detalleAuditoria}>Admin Juan asignó a Inspector Pérez en #den-002</Text>
            </View>
            <Text style={styles.horaAuditoria}>10m</Text>
          </View>

          <View style={styles.itemAuditoria}>
            <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.textoPeligro} />
            <View style={styles.textosAuditoria}>
              <Text style={styles.tituloAuditoria}>Denuncia Rechazada</Text>
              <Text style={styles.detalleAuditoria}>Reporte #den-003 marcado por duplicado</Text>
            </View>
            <Text style={styles.horaAuditoria}>45m</Text>
          </View>

          <View style={styles.itemAuditoria}>
            <MaterialCommunityIcons name="plus-circle" size={20} color={COLORS.textoVerde} />
            <View style={styles.textosAuditoria}>
              <Text style={styles.tituloAuditoria}>Nueva Denuncia Ingresada</Text>
              <Text style={styles.detalleAuditoria}>Ciudadano reportó "Basural a cielo abierto"</Text>
            </View>
            <Text style={styles.horaAuditoria}>1h</Text>
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
  tituloSeccion: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
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
  },
  itemAuditoria: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bordeSuave,
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
});