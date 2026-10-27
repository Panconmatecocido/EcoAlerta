// client/src/screens/admin/AdminProductosScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { storeRepository, StoreProduct, StoreBranch } from '../../repositories/store';
import { TransactionLoaderModal } from '../../components/common/TransactionLoaderModal';
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../utils/theme';

export const AdminProductosScreen: React.FC = () => {
  const [seccionActiva, setSeccionActiva] = useState<'productos' | 'sucursales'>('productos');
  const [productos, setProductos] = useState<StoreProduct[]>([]);
  const [sucursales, setSucursales] = useState<StoreBranch[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState<string>('');
  const [mutando, setMutando] = useState<boolean>(false);
  const [mensajeMutacion, setMensajeMutacion] = useState<string>('Guardando cambios...');

  // Modales de Creación / Edición
  const [modalProductoVisible, setModalProductoVisible] = useState<boolean>(false);
  const [editandoProductoId, setEditandoProductoId] = useState<string | null>(null);
  const [formTitulo, setFormTitulo] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formPuntos, setFormPuntos] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formImagenUrl, setFormImagenUrl] = useState('');

  // Modal Sucursales
  const [modalSucursalVisible, setModalSucursalVisible] = useState<boolean>(false);
  const [editandoSucursalId, setEditandoSucursalId] = useState<string | null>(null);
  const [formSucNombre, setFormSucNombre] = useState('');
  const [formSucDireccion, setFormSucDireccion] = useState('');
  const [formSucHorario, setFormSucHorario] = useState('');

  const cargarDatos = async () => {
    try {
      setCargando(true);
      if (seccionActiva === 'productos') {
        const data = await storeRepository.getProductsAdmin({ busqueda });
        setProductos(data);
      } else {
        const data = await storeRepository.getBranches({ todas: true });
        setSucursales(data);
      }
    } catch (error) {
      console.error('Error al cargar datos en panel Admin:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [seccionActiva, busqueda]);

  // Manejo de Productos (ABM + Baja Lógica)
  const abrirModalCrearProducto = () => {
    setEditandoProductoId(null);
    setFormTitulo('');
    setFormDescripcion('');
    setFormPuntos('');
    setFormStock('');
    setFormImagenUrl('');
    setModalProductoVisible(true);
  };

  const abrirModalEditarProducto = (prod: StoreProduct) => {
    setEditandoProductoId(prod.id);
    setFormTitulo(prod.titulo);
    setFormDescripcion(prod.descripcion);
    setFormPuntos(String(prod.costoPuntos));
    setFormStock(String(prod.stock));
    setFormImagenUrl(prod.imagenUrl || '');
    setModalProductoVisible(true);
  };

  const guardarProducto = async () => {
    if (!formTitulo.trim() || !formDescripcion.trim()) {
      Alert.alert('Campos requeridos', 'Ingresa título y descripción para el producto.');
      return;
    }

    const puntosNum = Number(formPuntos);
    const stockNum = Number(formStock);

    if (isNaN(puntosNum) || puntosNum < 0 || isNaN(stockNum) || stockNum < 0) {
      Alert.alert('Valores inválidos', 'Costo en puntos y stock deben ser números positivos o cero.');
      return;
    }

    try {
      setMensajeMutacion(editandoProductoId ? 'Actualizando producto...' : 'Creando producto ecológico...');
      setMutando(true);

      if (editandoProductoId) {
        await storeRepository.updateProduct(editandoProductoId, {
          titulo: formTitulo.trim(),
          descripcion: formDescripcion.trim(),
          costoPuntos: puntosNum,
          stock: stockNum,
          imagenUrl: formImagenUrl.trim() || null,
        });
      } else {
        await storeRepository.createProduct({
          titulo: formTitulo.trim(),
          descripcion: formDescripcion.trim(),
          costoPuntos: puntosNum,
          stock: stockNum,
          imagenUrl: formImagenUrl.trim() || null,
        });
      }

      setModalProductoVisible(false);
      await cargarDatos();
      Alert.alert('Éxito', editandoProductoId ? 'Producto actualizado correctamente' : 'Producto creado con éxito');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo guardar el producto');
    } finally {
      setMutando(false);
    }
  };

  const alternarBajaLogicaProducto = async (prod: StoreProduct) => {
    const accion = prod.activo ? 'desactivar (Baja Lógica)' : 'reactivar';
    Alert.alert(
      'Confirmar Acción',
      `¿Deseas ${accion} el producto "${prod.titulo}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: prod.activo ? 'Desactivar' : 'Reactivar',
          style: prod.activo ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setMensajeMutacion(prod.activo ? 'Aplicando baja lógica...' : 'Reactivando producto...');
              setMutando(true);

              if (prod.activo) {
                await storeRepository.deactivateProduct(prod.id);
              } else {
                await storeRepository.updateProduct(prod.id, { activo: true });
              }

              await cargarDatos();
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'No se pudo modificar el estado del producto');
            } finally {
              setMutando(false);
            }
          },
        },
      ]
    );
  };

  // Manejo de Sucursales
  const abrirModalCrearSucursal = () => {
    setEditandoSucursalId(null);
    setFormSucNombre('');
    setFormSucDireccion('');
    setFormSucHorario('');
    setModalSucursalVisible(true);
  };

  const abrirModalEditarSucursal = (suc: StoreBranch) => {
    setEditandoSucursalId(suc.id);
    setFormSucNombre(suc.nombre);
    setFormSucDireccion(suc.direccion);
    setFormSucHorario(suc.horario || '');
    setModalSucursalVisible(true);
  };

  const guardarSucursal = async () => {
    if (!formSucNombre.trim() || !formSucDireccion.trim()) {
      Alert.alert('Campos requeridos', 'Ingresa nombre y dirección de la sucursal.');
      return;
    }

    try {
      setMensajeMutacion(editandoSucursalId ? 'Actualizando sucursal...' : 'Registrando nueva sucursal...');
      setMutando(true);

      if (editandoSucursalId) {
        await storeRepository.updateBranch(editandoSucursalId, {
          nombre: formSucNombre.trim(),
          direccion: formSucDireccion.trim(),
          horario: formSucHorario.trim() || null,
        });
      } else {
        await storeRepository.createBranch({
          nombre: formSucNombre.trim(),
          direccion: formSucDireccion.trim(),
          horario: formSucHorario.trim() || null,
        });
      }

      setModalSucursalVisible(false);
      await cargarDatos();
      Alert.alert('Éxito', editandoSucursalId ? 'Sucursal actualizada' : 'Sucursal registrada exitosamente');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo guardar la sucursal');
    } finally {
      setMutando(false);
    }
  };

  const alternarActivaSucursal = async (suc: StoreBranch) => {
    try {
      setMensajeMutacion('Actualizando estado de sucursal...');
      setMutando(true);
      await storeRepository.updateBranch(suc.id, { activa: !suc.activa });
      await cargarDatos();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo actualizar la sucursal');
    } finally {
      setMutando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Cabecera */}
        <View style={styles.header}>
          <View>
            <Text style={styles.tituloHeader}>ABM Tienda y Sucursales</Text>
            <Text style={styles.subtituloHeader}>Gestión de catálogo y puntos de retiro</Text>
          </View>
          <TouchableOpacity
            style={styles.botonCrearPrincipal}
            onPress={seccionActiva === 'productos' ? abrirModalCrearProducto : abrirModalCrearSucursal}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="plus" size={18} color={COLORS.superficieTarjeta} />
            <Text style={styles.textoBotonCrear}>
              {seccionActiva === 'productos' ? 'Nuevo Producto' : 'Nueva Sucursal'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pestañas de Selector */}
        <View style={styles.pestanasContenedor}>
          <TouchableOpacity
            style={[styles.pestana, seccionActiva === 'productos' && styles.pestanaActiva]}
            onPress={() => setSeccionActiva('productos')}
          >
            <MaterialCommunityIcons
              name="package-variant"
              size={18}
              color={seccionActiva === 'productos' ? COLORS.botonPrincipal : COLORS.textoSecundario}
            />
            <Text
              style={[
                styles.textoPestana,
                seccionActiva === 'productos' && styles.textoPestanaActiva,
              ]}
            >
              Productos ({productos.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pestana, seccionActiva === 'sucursales' && styles.pestanaActiva]}
            onPress={() => setSeccionActiva('sucursales')}
          >
            <MaterialCommunityIcons
              name="storefront-outline"
              size={18}
              color={seccionActiva === 'sucursales' ? COLORS.botonPrincipal : COLORS.textoSecundario}
            />
            <Text
              style={[
                styles.textoPestana,
                seccionActiva === 'sucursales' && styles.textoPestanaActiva,
              ]}
            >
              Sucursales ({sucursales.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Buscador de Productos */}
        {seccionActiva === 'productos' && (
          <View style={styles.buscadorContenedor}>
            <TextInput
              style={styles.buscadorInput}
              placeholder="Buscar por título o descripción..."
              value={busqueda}
              onChangeText={setBusqueda}
              placeholderTextColor={COLORS.textoSecundario}
            />
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={COLORS.iconoPrincipal}
              style={styles.iconoBuscador}
            />
          </View>
        )}

        {/* Lista de Contenido */}
        {cargando ? (
          <View style={styles.centrado}>
            <ActivityIndicator size="large" color={COLORS.botonPrincipal} />
            <Text style={styles.textoCargando}>Cargando datos del panel...</Text>
          </View>
        ) : seccionActiva === 'productos' ? (
          <ScrollView contentContainerStyle={styles.listaScroll} showsVerticalScrollIndicator={false}>
            {productos.length === 0 ? (
              <Text style={styles.textoVacio}>No hay productos registrados en el catálogo.</Text>
            ) : (
              productos.map((prod) => (
                <View
                  key={prod.id}
                  style={[styles.tarjetaAdmin, !prod.activo && styles.tarjetaInactiva]}
                >
                  <View style={styles.filaFilaProducto}>
                    {prod.imagenUrl ? (
                      <Image source={{ uri: prod.imagenUrl }} style={styles.miniaturaProducto} />
                    ) : (
                      <View style={styles.placeholderMiniatura}>
                        <MaterialCommunityIcons name="leaf" size={24} color={COLORS.textoSecundario} />
                      </View>
                    )}

                    <View style={styles.detallesProducto}>
                      <View style={styles.filaTituloBadge}>
                        <Text style={styles.tituloItem} numberOfLines={1}>
                          {prod.titulo}
                        </Text>
                        <View
                          style={[
                            styles.badgeEstado,
                            prod.activo ? styles.badgeActivo : styles.badgeInactivo,
                          ]}
                        >
                          <Text
                            style={[
                              styles.textoBadgeEstado,
                              prod.activo ? styles.textoBadgeActivo : styles.textoBadgeInactivo,
                            ]}
                          >
                            {prod.activo ? 'ACTIVO' : 'BAJA LÓGICA'}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.descripcionItem} numberOfLines={2}>
                        {prod.descripcion}
                      </Text>

                      <View style={styles.filaPuntosStock}>
                        <Text style={styles.puntosItem}>⭐ {prod.costoPuntos} PTS</Text>
                        <Text style={styles.stockItem}>📦 Stock: {prod.stock}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Acciones */}
                  <View style={styles.accionesFila}>
                    <TouchableOpacity
                      style={styles.botonAccionEditar}
                      onPress={() => abrirModalEditarProducto(prod)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="pencil" size={15} color={COLORS.botonPrincipal} />
                      <Text style={styles.textoAccionEditar}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.botonAccionToggle,
                        prod.activo ? styles.botonToggleBaja : styles.botonToggleAlta,
                      ]}
                      onPress={() => alternarBajaLogicaProducto(prod)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={prod.activo ? 'eye-off-outline' : 'eye-outline'}
                        size={15}
                        color={prod.activo ? COLORS.textoPeligro : COLORS.textoVerde}
                      />
                      <Text
                        style={[
                          styles.textoAccionToggle,
                          prod.activo ? styles.textoToggleBaja : styles.textoToggleAlta,
                        ]}
                      >
                        {prod.activo ? 'Baja Lógica' : 'Reactivar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.listaScroll} showsVerticalScrollIndicator={false}>
            {sucursales.length === 0 ? (
              <Text style={styles.textoVacio}>No hay sucursales registradas.</Text>
            ) : (
              sucursales.map((suc) => (
                <View
                  key={suc.id}
                  style={[styles.tarjetaAdmin, !suc.activa && styles.tarjetaInactiva]}
                >
                  <View style={styles.filaTituloBadge}>
                    <Text style={styles.tituloItem}>{suc.nombre}</Text>
                    <View
                      style={[
                        styles.badgeEstado,
                        suc.activa ? styles.badgeActivo : styles.badgeInactivo,
                      ]}
                    >
                      <Text
                        style={[
                          styles.textoBadgeEstado,
                          suc.activa ? styles.textoBadgeActivo : styles.textoBadgeInactivo,
                        ]}
                      >
                        {suc.activa ? 'ACTIVA' : 'INACTIVA'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.direccionItem}>📍 {suc.direccion}</Text>
                  {suc.horario && (
                    <Text style={styles.horarioItem}>🕒 {suc.horario}</Text>
                  )}

                  {/* Acciones Sucursal */}
                  <View style={styles.accionesFila}>
                    <TouchableOpacity
                      style={styles.botonAccionEditar}
                      onPress={() => abrirModalEditarSucursal(suc)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="pencil" size={15} color={COLORS.botonPrincipal} />
                      <Text style={styles.textoAccionEditar}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.botonAccionToggle,
                        suc.activa ? styles.botonToggleBaja : styles.botonToggleAlta,
                      ]}
                      onPress={() => alternarActivaSucursal(suc)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={suc.activa ? 'cancel' : 'check'}
                        size={15}
                        color={suc.activa ? COLORS.textoPeligro : COLORS.textoVerde}
                      />
                      <Text
                        style={[
                          styles.textoAccionToggle,
                          suc.activa ? styles.textoToggleBaja : styles.textoToggleAlta,
                        ]}
                      >
                        {suc.activa ? 'Desactivar' : 'Activar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>

      {/* Modal Formulario Producto */}
      <Modal visible={modalProductoVisible} transparent animationType="slide">
        <View style={styles.overlayModal}>
          <View style={styles.contenidoModalForm}>
            <View style={styles.cabeceraForm}>
              <Text style={styles.tituloForm}>
                {editandoProductoId ? 'Editar Insumo Ecológico' : 'Nuevo Producto Ecológico'}
              </Text>
              <TouchableOpacity onPress={() => setModalProductoVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color={COLORS.textoSecundario} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.labelInput}>Título del Producto *</Text>
              <TextInput
                style={styles.inputForm}
                placeholder="Ej. Termo Térmico 500ml"
                value={formTitulo}
                onChangeText={setFormTitulo}
              />

              <Text style={styles.labelInput}>Descripción detallada *</Text>
              <TextInput
                style={[styles.inputForm, styles.inputArea]}
                placeholder="Detalle de materiales ecológicos, origen o uso..."
                value={formDescripcion}
                onChangeText={setFormDescripcion}
                multiline
                numberOfLines={3}
              />

              <View style={styles.filaDosColumnas}>
                <View style={{ flex: 1, marginRight: SPACING.xs }}>
                  <Text style={styles.labelInput}>Costo en Puntos *</Text>
                  <TextInput
                    style={styles.inputForm}
                    placeholder="Ej. 100"
                    keyboardType="numeric"
                    value={formPuntos}
                    onChangeText={setFormPuntos}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: SPACING.xs }}>
                  <Text style={styles.labelInput}>Stock Físico *</Text>
                  <TextInput
                    style={styles.inputForm}
                    placeholder="Ej. 25"
                    keyboardType="numeric"
                    value={formStock}
                    onChangeText={setFormStock}
                  />
                </View>
              </View>

              <Text style={styles.labelInput}>URL de Imagen (opcional)</Text>
              <TextInput
                style={styles.inputForm}
                placeholder="https://images.unsplash.com/..."
                value={formImagenUrl}
                onChangeText={setFormImagenUrl}
              />

              <TouchableOpacity
                style={styles.botonGuardarForm}
                onPress={guardarProducto}
                activeOpacity={0.8}
              >
                <Text style={styles.textoBotonGuardar}>
                  {editandoProductoId ? 'GUARDAR CAMBIOS' : 'CREAR PRODUCTO'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Formulario Sucursal */}
      <Modal visible={modalSucursalVisible} transparent animationType="slide">
        <View style={styles.overlayModal}>
          <View style={styles.contenidoModalForm}>
            <View style={styles.cabeceraForm}>
              <Text style={styles.tituloForm}>
                {editandoSucursalId ? 'Editar Sucursal' : 'Nueva Sucursal Municipal'}
              </Text>
              <TouchableOpacity onPress={() => setModalSucursalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color={COLORS.textoSecundario} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.labelInput}>Nombre de la Sucursal / Delegación *</Text>
              <TextInput
                style={styles.inputForm}
                placeholder="Ej. Delegación Del Viso"
                value={formSucNombre}
                onChangeText={setFormSucNombre}
              />

              <Text style={styles.labelInput}>Dirección Completa *</Text>
              <TextInput
                style={styles.inputForm}
                placeholder="Ej. Av. Madero 1234, Pilar"
                value={formSucDireccion}
                onChangeText={setFormSucDireccion}
              />

              <Text style={styles.labelInput}>Horario de Atención</Text>
              <TextInput
                style={styles.inputForm}
                placeholder="Ej. Lunes a Viernes de 08:00 a 14:00 hs"
                value={formSucHorario}
                onChangeText={setFormSucHorario}
              />

              <TouchableOpacity
                style={styles.botonGuardarForm}
                onPress={guardarSucursal}
                activeOpacity={0.8}
              >
                <Text style={styles.textoBotonGuardar}>
                  {editandoSucursalId ? 'GUARDAR SUCURSAL' : 'CREAR SUCURSAL'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Spinner Bloqueante RNF-10 */}
      <TransactionLoaderModal
        visible={mutando}
        mensaje={mensajeMutacion}
        submensaje="Actualizando registros del municipio en el servidor central"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.fondoAplicacion,
  },
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  tituloHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  subtituloHeader: {
    fontSize: 12,
    color: COLORS.textoSecundario,
  },
  botonCrearPrincipal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.botonPrincipal,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  textoBotonCrear: {
    color: COLORS.superficieTarjeta,
    fontSize: 11,
    fontWeight: 'bold',
  },
  pestanasContenedor: {
    flexDirection: 'row',
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    padding: 3,
    marginBottom: SPACING.sm,
  },
  pestana: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.sm,
    gap: 6,
  },
  pestanaActiva: {
    backgroundColor: COLORS.fondoTarjeta,
  },
  textoPestana: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    fontWeight: '600',
  },
  textoPestanaActiva: {
    color: COLORS.botonPrincipal,
    fontWeight: 'bold',
  },
  buscadorContenedor: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  buscadorInput: {
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingRight: 40,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    fontSize: 12,
    color: COLORS.textoVerdeOscuro,
  },
  iconoBuscador: {
    position: 'absolute',
    right: 12,
  },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoCargando: {
    marginTop: SPACING.xs,
    fontSize: 12,
    color: COLORS.textoSecundario,
  },
  listaScroll: {
    paddingBottom: SPACING.lg * 2,
  },
  textoVacio: {
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.textoSecundario,
    marginTop: SPACING.xl,
  },
  tarjetaAdmin: {
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tarjetaInactiva: {
    opacity: 0.6,
    borderColor: COLORS.textoDesactivado,
  },
  filaFilaProducto: {
    flexDirection: 'row',
  },
  miniaturaProducto: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
    resizeMode: 'cover',
  },
  placeholderMiniatura: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.fondoTarjeta,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detallesProducto: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  filaTituloBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tituloItem: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
    flex: 1,
    marginRight: SPACING.xs,
  },
  badgeEstado: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeActivo: {
    backgroundColor: COLORS.fondoTarjeta,
  },
  badgeInactivo: {
    backgroundColor: COLORS.fondoPeligro,
  },
  textoBadgeEstado: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  textoBadgeActivo: {
    color: COLORS.textoVerde,
  },
  textoBadgeInactivo: {
    color: COLORS.textoPeligro,
  },
  descripcionItem: {
    fontSize: 11,
    color: COLORS.textoSecundario,
    marginTop: 2,
  },
  filaPuntosStock: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: 4,
  },
  puntosItem: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textoVerde,
  },
  stockItem: {
    fontSize: 11,
    color: COLORS.textoSecundario,
  },
  direccionItem: {
    fontSize: 11,
    color: COLORS.textoSecundario,
    marginTop: 3,
  },
  horarioItem: {
    fontSize: 10,
    color: COLORS.textoVerde,
    marginTop: 2,
  },
  accionesFila: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.bordeSuave,
  },
  botonAccionEditar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    gap: 4,
  },
  textoAccionEditar: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.botonPrincipal,
  },
  botonAccionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    gap: 4,
  },
  botonToggleBaja: {
    borderColor: COLORS.bordePeligro,
    backgroundColor: COLORS.fondoPeligro,
  },
  botonToggleAlta: {
    borderColor: COLORS.bordeSuave,
    backgroundColor: COLORS.fondoTarjeta,
  },
  textoAccionToggle: {
    fontSize: 11,
    fontWeight: '600',
  },
  textoToggleBaja: {
    color: COLORS.textoPeligro,
  },
  textoToggleAlta: {
    color: COLORS.textoVerde,
  },
  overlayModal: {
    flex: 1,
    backgroundColor: COLORS.superposicionOscura,
    justifyContent: 'center',
    padding: SPACING.md,
  },
  contenidoModalForm: {
    backgroundColor: COLORS.fondoAplicacion,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    maxHeight: '85%',
  },
  cabeceraForm: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  tituloForm: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textoVerdeOscuro,
  },
  labelInput: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textoSecundario,
    marginBottom: 3,
    marginTop: SPACING.xs,
  },
  inputForm: {
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    fontSize: 13,
    color: COLORS.textoVerdeOscuro,
  },
  inputArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  filaDosColumnas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  botonGuardarForm: {
    backgroundColor: COLORS.botonPrincipal,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  textoBotonGuardar: {
    color: COLORS.superficieTarjeta,
    fontWeight: 'bold',
    fontSize: 13,
  },
});
