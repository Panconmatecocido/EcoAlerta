import React from 'react';
import { SafeAreaView, View, Text, Image, ScrollView } from 'react-native';
import { styles } from '../../../components/HomeStyle/SectorTiendaStyle';
export default function MuestraProductos() {
const productos = [
            {
    id: 1,
    nombre: 'Botella reutilizable',
    puntos: 500,
    imagen: require('../../../../assets/productos.jpg'),
    },
    {
    id: 2,
    nombre: 'Bolsa ecológica',
    puntos: 300,
    imagen: require('../../../../assets/productos.jpg'),
    },
        {
    id: 3,
    nombre: 'Vaso reutilizable',
    puntos: 400,
    imagen: require('../../../../assets/productos.jpg'),
    },
    ];
    return(
    <View style={styles.Contexto}>
       <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {productos.map((producto) => (
    <View key={producto.id} style={{ width: 150, marginRight: 10, alignItems: 'center' }}>
      
      <Image
        source={producto.imagen}
        style={{ width: 120, height: 120 }}
      />

      <Text>{producto.nombre}</Text>
      <Text>{producto.puntos} puntos</Text>

    </View>
    ))}
    </ScrollView>
    </View>
);}