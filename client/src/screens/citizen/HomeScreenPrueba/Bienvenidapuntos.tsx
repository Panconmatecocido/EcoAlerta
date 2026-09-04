import React from 'react';
import { SafeAreaView, View, Text } from 'react-native';
import { styles } from '../../../components/HomeStyle/Bienvenida-puntosStyle';
export default function Bienvenidapuntos () {
    return(
        <View style={styles.welcomeCard}>

  {/* Parte izquierda */}
  <View style={styles.welcomeCard}>
    <View style = {styles.avatar}>
      <Text>👤</Text>
    </View>

    <View>
      <Text style = {styles.texto_usuario}>
        ¡Bienvenido, Joaquín!
      </Text>

      <Text style = {styles.texto_acompañamiento}>
        Juntos hacemos una ciudad más limpia 🌿
      </Text>
    </View>
  </View>

  
  <View>
    <Text style = {styles.texto_puntos}>
      🏅 Mis puntos
    </Text>

    <Text style = {styles.punto}>
      1.250
    </Text>

    <Text style = {styles.historial}>
      Ver historial
    </Text>
  </View>

</View>
)}