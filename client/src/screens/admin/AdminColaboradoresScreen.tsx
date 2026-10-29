import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { TransactionLoaderModal } from '../../components/common/TransactionLoaderModal';
import { Colaborador, adminService } from '../../services/adminService';
import { BORDER_RADIUS, COLORS, ICON_SIZE, SPACING } from '../../utils/theme';

export const AdminColaboradoresScreen: React.FC = () => {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);

  const cargarColaboradores = useCallback(async (refrescar = false) => {
    if (refrescar) setRefrescando(true);
    else setCargando(true);

    try {
      const lista = await adminService.obtenerColaboradores();
      setColaboradores(lista);
      setError(null);
    } catch (loadError) {
      console.error('No se pudieron cargar los colaboradores:', loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudo consultar la lista de colaboradores.'
      );
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargarColaboradores();
      const intervalo = setInterval(() => void cargarColaboradores(true), 30_000);
      return () => clearInterval(intervalo);
    }, [cargarColaboradores])
  );

  const alternarServicio = async (colaborador: Colaborador) => {
    if (actualizandoId) return;
    const nuevoEstado = !colaborador.disponible;
    setActualizandoId(colaborador.id);

    try {
      const actualizado = await adminService.alternarDisponibilidadColaborador(
        colaborador.id,
        nuevoEstado
      );
      setColaboradores((actuales) =>
        actuales.map((item) => (item.id === actualizado.id ? actualizado : item))
      );
    } catch (updateError) {
      console.error('No se pudo actualizar el servicio del colaborador:', updateError);
      Alert.alert(
        'No se pudo actualizar el estado',
        updateError instanceof Error ? updateError.message : 'Inténtalo nuevamente.'
      );
    } finally {
      setActualizandoId(null);
    }
  };

  const renderColaborador = ({ item }: { item: Colaborador }) => {
    const colorEstado = item.disponible ? COLORS.textoVerde : COLORS.textoPeligro;
    return (
      <View style={styles.tarjeta}>
        <View style={styles.filaPerfil}>
          {item.fotoPerfilUri ? (
            <Image
              source={{ uri: item.fotoPerfilUri }}
              style={styles.foto}
              accessibilityLabel={`Foto de ${item.nombre}`}
            />
          ) : (
            <View style={styles.fotoAlternativa}>
              <MaterialCommunityIcons
                name="badge-account-horizontal"
                size={ICON_SIZE.lg}
                color={COLORS.textoSecundario}
              />
            </View>
          )}
          <View style={styles.detalle}>
            <Text style={styles.nombre} numberOfLines={1}>{item.nombre}</Text>
            <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
          </View>
        </View>

        <View style={styles.filaEstado}>
          <View style={styles.estadoTexto}>
            <MaterialCommunityIcons
              name={item.disponible ? 'check-circle' : 'minus-circle'}
              size={ICON_SIZE.sm}
              color={colorEstado}
            />
            <Text style={[styles.estado, { color: colorEstado }]}>
              {item.disponible ? 'En servicio' : 'Fuera de servicio'}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.botonEstado,
              item.disponible ? styles.botonDesactivar : styles.botonActivar,
              actualizandoId === item.id && styles.botonDeshabilitado,
            ]}
            onPress={() => void alternarServicio(item)}
            disabled={actualizandoId !== null}
            accessibilityRole="button"
            accessibilityLabel={
              item.disponible
                ? `Poner fuera de servicio a ${item.nombre}`
                : `Poner en servicio a ${item.nombre}`
            }
          >
            <Text style={styles.textoBotonEstado}>
              {item.disponible ? 'Desactivar' : 'Activar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <Header showActions={false} />
      <TransactionLoaderModal
        visible={actualizandoId !== null}
        mensaje="Actualizando estado de servicio..."
        submensaje="Guardando el cambio en el municipio"
      />
      <View style={styles.contenido}>
        <View style={styles.encabezado}>
          <View style={styles.encabezadoTexto}>
            <Text style={styles.titulo}>Colaboradores</Text>
            <Text style={styles.subtitulo}>
              Consulta el personal y administra quién está en servicio.
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => void cargarColaboradores(true)}
            accessibilityRole="button"
            accessibilityLabel="Actualizar colaboradores"
            disabled={refrescando}
          >
            <MaterialCommunityIcons
              name="refresh"
              size={ICON_SIZE.md}
              color={COLORS.botonPrincipal}
            />
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTexto}>{error}</Text>
            <TouchableOpacity onPress={() => void cargarColaboradores()}>
              <Text style={styles.reintentar}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {cargando ? (
          <ActivityIndicator
            size="large"
            color={COLORS.botonPrincipal}
            style={styles.cargando}
          />
        ) : (
          <FlatList
            data={colaboradores}
            keyExtractor={(item) => item.id}
            renderItem={renderColaborador}
            contentContainerStyle={styles.lista}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refrescando}
                onRefresh={() => void cargarColaboradores(true)}
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
                  <Text style={styles.vacioTexto}>Todavía no hay colaboradores registrados.</Text>
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
    marginBottom: SPACING.md,
  },
  encabezadoTexto: {
    flex: 1,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textoVerdeOscuro,
  },
  subtitulo: {
    marginTop: SPACING.xs,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textoSecundario,
  },
  lista: {
    gap: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  tarjeta: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.superficieTarjeta,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  filaPerfil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  foto: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.fondoAplicacion,
  },
  fotoAlternativa: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.fondoAplicacion,
  },
  detalle: {
    flex: 1,
  },
  nombre: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },
  email: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.textoSecundario,
  },
  filaEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.bordeSuave,
  },
  estadoTexto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  estado: {
    fontSize: 14,
    fontWeight: '700',
  },
  botonEstado: {
    minWidth: 96,
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  botonActivar: {
    backgroundColor: COLORS.fondoTarjeta,
  },
  botonDesactivar: {
    backgroundColor: COLORS.fondoPeligro,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  textoBotonEstado: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },
  errorCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.fondoPeligro,
  },
  errorTexto: {
    color: COLORS.textoPeligro,
    fontSize: 13,
  },
  reintentar: {
    marginTop: SPACING.sm,
    color: COLORS.textoPeligro,
    fontWeight: '700',
  },
  cargando: {
    marginTop: SPACING.xl,
  },
  vacio: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
    gap: SPACING.sm,
  },
  vacioTexto: {
    textAlign: 'center',
    color: COLORS.textoSecundario,
    fontSize: 14,
  },
});
