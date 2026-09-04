import { styles } from '../../../components/HomeStyle/AccionesStyle';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function Acciones() {
  return (
    <View style={styles.contenedorExterior}>
      <View style={styles.contenedor}>

        {/* Título */}
        <Text style={styles.titulo}>
          ¿Qué querés hacer hoy?
        </Text>

        <View style={styles.contenido}>

          {/* IZQUIERDA */}
          <View style={styles.opcion}>
            <View style={styles.iconoSecundario}>
              <Ionicons
                name="leaf"
                size={38}
                color="#4CAF20"
              />
            </View>

            <Text style={styles.textoPrincipal}>
              Sumá puntos
            </Text>

            <Text style={styles.textoSecundario}>
              por cada reporte{'\n'}validado
            </Text>
          </View>


          {/* CENTRO - BOTÓN CÁMARA */}
          <View style={styles.centro}>

            <TouchableOpacity style={styles.botonCamara}>
              <Ionicons
                name="camera"
                size={55}
                color="white"
              />
            </TouchableOpacity>

            <Text style={styles.reportar}>
              REPORTAR
            </Text>

            <Text style={styles.descripcion}>
              Tomá una foto y ayudá{'\n'}a tu comunidad
            </Text>

          </View>


          {/* DERECHA */}
          <View style={styles.opcion}>
            <View style={styles.iconoSecundario}>
              <Ionicons
                name="gift"
                size={38}
                color="#4CAF20"
              />
            </View>

            <Text style={styles.textoPrincipal}>
              Canjeá tus puntos
            </Text>

            <Text style={styles.textoSecundario}>
              por productos{'\n'}ecológicos
            </Text>
          </View>

        </View>
      </View>
    </View>
  );
}