import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { TransactionLoaderModal } from '../../components/common/TransactionLoaderModal';
import { Agente, adminService, Colaborador } from '../../services/adminService';
import { BORDER_RADIUS, COLORS, ICON_SIZE, SPACING } from '../../utils/theme';

type CuentaPersonal = {
  id: string;
  nombre: string;
  email: string;
  rol: 'AGENT' | 'COLLABORATOR';
  disponible: boolean;
  casosAsignados?: number;
};

const combinarCuentas = (agentes: Agente[], colaboradores: Colaborador[]): CuentaPersonal[] => [
  ...agentes.map((agente) => ({ ...agente, rol: 'AGENT' as const })),
  ...colaboradores.map((colaborador) => ({ ...colaborador, rol: 'COLLABORATOR' as const })),
];

export const AdminCuentasPersonalScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [cuentas, setCuentas] = useState<CuentaPersonal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  const cargarCuentas = useCallback(async (refrescar = false) => {
    if (refrescar) setRefrescando(true);
    else setCargando(true);

    try {
      const [agentes, colaboradores] = await Promise.all([
        adminService.obtenerAgentes(),
        adminService.obtenerColaboradores(),
      ]);
      setCuentas(combinarCuentas(agentes, colaboradores));
      setError(null);
    } catch (loadError) {
      console.error('No se pudieron cargar las cuentas de personal:', loadError);
      setCuentas([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudieron consultar las cuentas de personal.'
      );
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargarCuentas();
    }, [cargarCuentas])
  );

  const eliminarCuenta = (cuenta: CuentaPersonal) => {
    const tipo = cuenta.rol === 'AGENT' ? 'agente' : 'colaborador';
    const casosAsignados = cuenta.rol === 'AGENT' ? cuenta.casosAsignados ?? 0 : 0;
    const detalleCasos =
      '\n\nLos reportes se conservarán. Los casos activos quedarán sin asignación y el historial mantendrá su estado, sin vincularse a la cuenta eliminada.';

    Alert.alert(
      'Eliminar cuenta de personal',
      `¿Eliminar permanentemente la cuenta de ${tipo} de ${cuenta.nombre}? Ya no podrá iniciar sesión.${detalleCasos}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar cuenta',
          style: 'destructive',
          onPress: async () => {
            if (eliminandoId) return;
            setEliminandoId(cuenta.id);
            try {
              const eliminada = await adminService.eliminarCuentaPersonal(cuenta.id);
              setCuentas((actuales) => actuales.filter((item) => item.id !== eliminada.id));
              const reportesLiberados = eliminada.denunciasLiberadas > 0
                ? ` Se liberaron ${eliminada.denunciasLiberadas} reporte(s) asignado(s).`
                : '';
              Alert.alert('Cuenta eliminada', `Se eliminó la cuenta de ${eliminada.nombre}.${reportesLiberados}`);
            } catch (deleteError) {
              console.error('No se pudo eliminar la cuenta de personal:', deleteError);
              Alert.alert(
                'No se pudo eliminar la cuenta',
                deleteError instanceof Error ? deleteError.message : 'Inténtalo nuevamente.'
              );
            } finally {
              setEliminandoId(null);
            }
          },
        },
      ]
    );
  };

  const renderCuenta = ({ item }: { item: CuentaPersonal }) => {
    const esAgente = item.rol === 'AGENT';
    return (
      <View style={styles.tarjeta}>
        <View style={styles.filaCuenta}>
          <View style={styles.iconoCuenta}>
            <MaterialCommunityIcons
              name={esAgente ? 'account-hard-hat' : 'store-check-outline'}
              size={ICON_SIZE.lg}
              color={COLORS.botonPrincipal}
            />
          </View>
          <View style={styles.detalle}>
            <Text style={styles.nombre} numberOfLines={1}>{item.nombre}</Text>
            <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
            <Text style={styles.tipo}>{esAgente ? 'Agente de campo' : 'Colaborador'}</Text>
            {esAgente && item.casosAsignados ? (
              <Text style={styles.casos}>
                {item.casosAsignados} caso(s) activo(s); quedarán sin asignación al eliminar
              </Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.botonEliminar}
            onPress={() => eliminarCuenta(item)}
            disabled={eliminandoId !== null}
            accessibilityRole="button"
            accessibilityLabel={`Eliminar cuenta de ${item.nombre}`}
          >
            <MaterialCommunityIcons
              name="delete-outline"
              size={ICON_SIZE.md}
              color={eliminandoId === item.id ? COLORS.textoDesactivado : COLORS.textoPeligro}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <Header showActions={false} />
      <TransactionLoaderModal
        visible={eliminandoId !== null}
        mensaje="Eliminando cuenta de personal..."
        submensaje="Conservando los reportes y actualizando sus asignaciones"
      />
      <View style={styles.contenido}>
        <View style={styles.encabezado}>
          <TouchableOpacity
            style={styles.botonVolver}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Volver al dashboard"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={ICON_SIZE.md}
              color={COLORS.botonPrincipal}
            />
          </TouchableOpacity>
          <View style={styles.encabezadoTexto}>
            <Text style={styles.titulo}>Cuentas de personal</Text>
            <Text style={styles.subtitulo}>
              Administra las cuentas de agentes y colaboradores de tu municipio.
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => void cargarCuentas(true)}
            accessibilityRole="button"
            accessibilityLabel="Actualizar cuentas de personal"
            disabled={refrescando}
          >
            <MaterialCommunityIcons
              name="refresh"
              size={ICON_SIZE.md}
              color={COLORS.botonPrincipal}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.aviso}>
          <MaterialCommunityIcons
            name="information-outline"
            size={ICON_SIZE.sm}
            color={COLORS.textoSecundario}
          />
          <Text style={styles.avisoTexto}>
            La eliminación es permanente. Los reportes se conservan; los casos activos del Agente
            eliminado vuelven a la bolsa y los reportes históricos conservan su estado.
          </Text>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTexto}>{error}</Text>
            <TouchableOpacity onPress={() => void cargarCuentas()}>
              <Text style={styles.reintentar}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {cargando ? (
          <ActivityIndicator size="large" color={COLORS.botonPrincipal} style={styles.cargando} />
        ) : (
          <FlatList
            data={cuentas}
            keyExtractor={(item) => item.id}
            renderItem={renderCuenta}
            contentContainerStyle={styles.lista}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refrescando}
                onRefresh={() => void cargarCuentas(true)}
                colors={[COLORS.botonPrincipal]}
              />
            }
            ListEmptyComponent={
              error ? undefined : (
                <View style={styles.vacio}>
                  <MaterialCommunityIcons
                    name="account-search-outline"
                    size={ICON_SIZE.xl}
                    color={COLORS.textoSecundario}
                  />
                  <Text style={styles.vacioTexto}>No hay cuentas de personal registradas.</Text>
                </View>
              )
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.fondoAplicacion,
  },
  contenido: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  encabezadoTexto: {
    flex: 1,
  },
  botonVolver: {
    padding: SPACING.xs,
    marginRight: SPACING.xs,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textoVerdeOscuro,
  },
  subtitulo: {
    marginTop: SPACING.xs,
    fontSize: 14,
    color: COLORS.textoSecundario,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.fondoTarjeta,
  },
  avisoTexto: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textoSecundario,
  },
  lista: {
    paddingBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  tarjeta: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.superficieTarjeta,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  filaCuenta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconoCuenta: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.fondoTarjeta,
  },
  detalle: {
    flex: 1,
  },
  nombre: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },
  email: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textoSecundario,
  },
  tipo: {
    marginTop: SPACING.xs,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textoVerde,
  },
  casos: {
    marginTop: SPACING.xs,
    fontSize: 11,
    color: COLORS.textoSecundario,
  },
  botonEliminar: {
    padding: SPACING.sm,
  },
  errorCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.fondoPeligro,
  },
  errorTexto: {
    color: COLORS.textoPeligro,
    fontSize: 13,
  },
  reintentar: {
    marginTop: SPACING.sm,
    fontWeight: '700',
    color: COLORS.textoPeligro,
  },
  cargando: {
    marginTop: SPACING.xl,
  },
  vacio: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    gap: SPACING.sm,
  },
  vacioTexto: {
    color: COLORS.textoSecundario,
    textAlign: 'center',
  },
});
