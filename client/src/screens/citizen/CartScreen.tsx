// src/screens/citizen/CartScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, } from "react-native";

// Importación de vectores de Expo para iconos
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons/";

import { Producto } from "../../interfaces/product";
import { obtenerProductos } from "../../services/api";
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from "../../utils/theme";
import { useCart } from "../../context/CartContext";

const CATEGORIAS = [
    { id: '1', nombre: 'Hogar', icono: 'home-outline' },
    { id: '2', nombre: 'Limpieza', icono: 'sparkles-outline' },
    { id: '3', nombre: 'Cuidado Personal', icono: 'person-outline' },
    { id: '4', nombre: 'Papelería', icono: 'folder-outline' },
];

export const StoreScreen = () => {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('Todas');
    const [busqueda, setBusqueda] = useState<string>('');
    const [cargando, setCargando] = useState<boolean>(true);

    // Consumo del Contexto del Carrito
    const { agregarAlCarrito, carrito, puntosTotales } = useCart();

    useEffect(() => {
        cargarProductos();
    }, [categoriaSeleccionada, busqueda]);

    const cargarProductos = async () => {
        try {
            setCargando(true);
            const datos = await obtenerProductos(categoriaSeleccionada, busqueda);
            setProductos(datos);
        } catch (error) {
            console.error("Error al cargar productos:", error);
        } finally {
            setCargando(false);
        }
    };

    return (
        <View style={estilos.contenedor}>
            {/* 1. Tarjeta de Puntos Canjeables */}
            <View style={estilos.tarjetaPuntos}>
                <View style={estilos.puntosIzquierda}>
                    <Text style={estilos.tituloPuntos}>Tus Puntos Canjeables</Text>
                    <View style={estilos.contenedorValorPuntos}>
                        <Ionicons name="star" size={ICON_SIZE.lg} color={COLORS.iconoPrincipal} />
                        <Text style={estilos.valorPuntos}>1250</Text>
                    </View>
                </View>

                <TouchableOpacity style={estilos.puntosDerecha}>
                    <View style={estilos.contenedorValorPuntos}>
                        <Ionicons name="cart" size={ICON_SIZE.lg} color={COLORS.iconoPrincipal} />
                        <Text style={estilos.subValorPuntos}> Mis puntos: 1250</Text>
                    </View>
                    <Text style={estilos.enlaceHistorial}> Ver Historial /gt;</Text>
                </TouchableOpacity>
            </View>

            {/* 2. Categoría con Iconos */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.contenedorCategorias}>
                {CATEGORIAS.map((cat) => (
                    <TouchableOpacity
                        key={cat.id}
                        style={[
                            estilos.tarjetaCategoria,
                            categoriaSeleccionada === cat.nombre && estilos.tarjetaCategoriaActiva,
                        ]}
                        onPress={() => 
                            setCategoriaSeleccionada(
                                categoriaSeleccionada === cat.nombre ? 'Todas' : cat.nombre
                            )
                        }
                    >
                        <View style={estilos.circuloIconoCategoria}>
                            <Ionicons 
                                name={cat.icono as any}
                                size={ICON_SIZE.lg} 
                                color={COLORS.iconoPrincipal}
                            />
                        </View>
                        <Text style={estilos.textoCategoria}>{cat.nombre}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* 3. Barra de Búsqueda */}
            <View style={estilos.contenedorBuscador}>
                <TextInput
                    style={estilos.entradaBuscador}
                    placeholder="Buscar productos..."
                    value={busqueda}
                    onChangeText={setBusqueda}
                    placeholderTextColor={COLORS.textoSecundario}
                />
                <Ionicons
                    name="search-outline"
                    size={ICON_SIZE.md}
                    color={COLORS.iconoPrincipal}
                    style={estilos.iconoBuscador}
                />
            </View>

            {/* 4. Lista de Productos */}
            {cargando ? (
                <ActivityIndicator size="large" color={COLORS.botonPrincipal} style={estilos.cargando} />
            ) : (
                <FlatList
                    data={productos}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    contentContainerStyle={estilos.listaProductos}
                    renderItem={({ item }) => (
                        <View style={estilos.tarjetaProducto}>
                            <Image
                                source={{ uri: item.urlImagen || 'https://via.placeholder.com/150' }}
                                style={estilos.imagenProducto}
                            />
                            <Text style={estilos.tituloProducto} numberOfLines={1}>
                                {item.nombre}
                            </Text>

                            {/* Badge de puntos */}
                            <View style={estilos.insigniaPrecio}>
                                <Ionicons name="star" size={12} color={COLORS.textoVerde} />
                                <Text style={estilos.puntosProducto}> {item.precio} PUNTOS</Text>
                            </View>

                            <TouchableOpacity
                                style={estilos.botonAgregar}
                                onPress={() => agregarAlCarrito(item)}
                            >
                                <Text style={estilos.textoBotonAgregar}>AGREGAR AL CARRITO</Text>
                                <Ionicons name="cart-outline" size={14} color={COLORS.blanco} />
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}
            {/* 5. Barra flotante del carrito */}
            {carrito.length > 0 && (
                <View style={estilos.pieCarrito}>
                    <Text style={estilos.resumenCarrito}>
                        Carrito: {carrito.length} items | Total: {puntosTotales} Pts
                    </Text>
                    <TouchableOpacity style={estilos.botonPagar}>
                        <Text style={estilos.textoPagar}>VER CARRITO Y PAGAR</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const estilos = StyleSheet.create({
    contenedor: {
        flex: 1,
        backgroundColor: COLORS.fondoAplicacion,
        padding: SPACING.md,
    },
    tarjetaPuntos: {
        backgroundColor: COLORS.fondoTarjeta,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    puntosIzquierda: {
        flexDirection: 'column',
    },
    tituloPuntos: {
        fontSize: 14,
        color: COLORS.textoVerdeOscuro,
        fontWeight: '600',
    },
    contenedorValorPuntos: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    valorPuntos: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.textoVerdeOscuro,
    },
    puntosDerecha: {
        alignItems: 'flex-end',
    },
    subValorPuntos: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.textoVerdeOscuro,
    },
    enlaceHistorial: {
        fontSize: 11,
        color: COLORS.textoVerde,
        marginTop: 2,
    },
    contenedorCategorias: {
        maxHeight: 90,
        marginBottom: SPACING.md,
    },
    tarjetaCategoria: {
        alignItems: 'center',
        marginRight: SPACING.md,
        width: 75,
    },
    tarjetaCategoriaActiva: {
        opacity: 0.7,
    },
    circuloIconoCategoria: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.superficieTarjeta,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    textoCategoria: {
        fontSize: 11,
        color: COLORS.textoVerdeOscuro,
        textAlign: 'center',
    },
    contenedorBuscador: {
        position: 'relative',
        justifyContent: 'center',
        marginBottom: SPACING.md,
    },
    entradaBuscador: {
        backgroundColor: COLORS.superficieTarjeta,
        borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: SPACING.md,
        paddingRight: 40,
        height: 40,
        borderWidth: 1,
        borderColor: COLORS.borde,
        color: COLORS.textoVerdeOscuro,
    },
    iconoBuscador: {
        position: 'absolute',
        right: 12,
    },
    cargando: {
        flex: 1,
        justifyContent: 'center',
    },
    listaProductos: {
        paddingBottom: 80,
    },
    tarjetaProducto: {
        flex: 1,
        backgroundColor: COLORS.superficieTarjeta,
        margin: SPACING.xs,
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.borde,
    },
    imagenProducto: {
        width: 80,
        height: 80,
        resizeMode: 'contain',
        marginBottom: SPACING.xs,
    },
    tituloProducto: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textoVerdeOscuro,
        marginBottom: 4,
    },
    insigniaPrecio: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.fondoTarjeta,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.sm,
        marginBottom: SPACING.xs,
    },
    puntosProducto: {
        fontSize: 10,
        color: COLORS.textoVerde,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    botonAgregar: {
        backgroundColor: COLORS.botonPrincipal,
        borderRadius: BORDER_RADIUS.sm,
        paddingVertical: 6,
        paddingHorizontal: 8,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textoBotonAgregar: {
        color: COLORS.blanco,
        fontSize: 9,
        fontWeight: 'bold',
    },
    pieCarrito: {
        position: 'absolute',
        bottom: SPACING.md,
        left: SPACING.md,
        right: SPACING.md,
        backgroundColor: COLORS.textoVerdeOscuro,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    resumenCarrito: {
        color: COLORS.blanco,
        fontSize: 12,
        fontWeight: 'bold',
    },
    botonPagar: {
        backgroundColor: COLORS.botonPrincipal,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 6,
        borderRadius: BORDER_RADIUS.sm,
    },
    textoPagar: {
        color: COLORS.blanco,
        fontSize: 11,
        fontWeight: 'bold',
    },
});
