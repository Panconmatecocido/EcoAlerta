import { styles } from '../../../components/HomeStyle/SectorTiendaStyle';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
export default function SectorTienda() {
  return ( 
    <View style={styles.contenedor}>
        <View>{/* Título */}
        <Text style={styles.titulo}>
          Canjea Tus puntos
        </Text>   
        </View>
        <View style={styles.VerTodo}>
            <Text> Ver Todo</Text>
        </View>
        
    </View>
    )
}