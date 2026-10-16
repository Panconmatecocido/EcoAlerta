// src/screens/admin/AdminAgentesScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../utils/theme';
import { adminService, Agente } from '../../services/adminService';

export const AdminAgenteScreen: React.FC = () => {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [refrescando, setRefrescando] = useState<boolean>(false);

  const cargarAgentes = useCallback(async () => {
    try {
      const data = await adminService.obtenerAgentes();
      setAgentes(data);
    } catch (error) {
      console.error('Error al cargar agentes:', error);
      Alert.alert('Error', 'No se pudo obtener la lista de inspectores.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    cargarAgentes();
  }, [cargarAgentes]);

  const alRefrescar = () => {
    setRefrescando(true);
    cargarAgentes();
  };

  const alternarDisponibilidad = async (id: string, estadoActual: boolean) => {
    try {
      const nuevoEstado = !estadoActual;
      await adminService.alternarDisponibilidadAgente(id, nuevoEstado);
      
      setAgentes((prev) =>
        prev.map((a) => (a.id === id ? { ...a, disponible: nuevoEstado } : a))
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado del agente.');
    }
  };

  const nuevoAgente = () => {
    Alert.alert('Nuevo Inspector', 'Función para dar de alta un nuevo inspector municipal en el sistema.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.contenedor}>
        <View style={styles.encabezado}>
          <Text style={styles.tituloEncabezado}>Personal de Campo</Text>
          <TouchableOpacity style={styles.botonAgregar} onPress={nuevoAgente}>
            <MaterialCommunityIcons name="account-plus" size={ICON_SIZE.sm} color={COLORS.superficieTarjeta} />
            <Text style={styles.textoBotonAgregar}>Nuevo</Text>
          </TouchableOpacity>
        </View>

        {cargando ? (
          <ActivityIndicator size="large" color={COLORS.botonPrincipal} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={agentes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.lista}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refrescando} onRefresh={alRefrescar} colors={[COLORS.botonPrincipal]} />
            }
            renderItem={({ item }) => (
              <View style={styles.tarjetaAgente}>
                <View style={styles.infoAgente}>
                  <MaterialCommunityIcons
                    name="account-hard-hat"
                    size={ICON_SIZE.xl}
                    color={item.disponible ? COLORS.botonPrincipal : COLORS.textoDesactivado}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nombreAgente}>{item.nombre}</Text>
                    <Text style={styles.emailAgente}>{item.email}</Text>
                    <Text style={styles.casosAgente}>Casos activos: {item.casosAsignados}</Text>
                  </View>
                </View>

                <View style={styles.accionesAgente}>
                  <TouchableOpacity
                    style={[
                      styles.botonEstado,
                      { backgroundColor: item.disponible ? COLORS.fondoTarjeta : COLORS.fondoPeligro },
                    ]}
                    onPress={() => alternarDisponibilidad(item.id, item.disponible)}
                  >
                    <Text
                      style={[
                        styles.textoEstado,
                        { color: item.disponible ? COLORS.textoVerdeOscuro : COLORS.textoPeligro },
                      ]}
                    >
                      {item.disponible ? 'Disponible' : 'Ocupado / Franco'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
  contenedor: {
    flex: 1,
    padding: SPACING.md,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  tituloEncabezado: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  botonAgregar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.botonPrincipal,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  textoBotonAgregar: {
    color: COLORS.superficieTarjeta,
    fontSize: 12,
    fontWeight: 'bold',
  },
  lista: {
    paddingBottom: SPACING.lg * 2,
  },
  tarjetaAgente: {
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  infoAgente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  nombreAgente: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  emailAgente: {
    fontSize: 12,
    color: COLORS.textoSecundario,
  },
  casosAgente: {
    fontSize: 11,
    color: COLORS.textoVerde,
    fontWeight: '600',
    marginTop: 2,
  },
  accionesAgente: {
    alignItems: 'flex-end',
  },
  botonEstado: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  textoEstado: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});