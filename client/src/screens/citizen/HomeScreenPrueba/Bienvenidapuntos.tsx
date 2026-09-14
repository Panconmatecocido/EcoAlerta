import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import { styles } from '../../../components/HomeStyle/Bienvenida-puntosStyle';
import { COLORS } from '../../../utils/theme';

export default function Bienvenidapuntos() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <View style={styles.welcomeCard}>
        {/* Avatar con foto o icono estilizado */}
        <View style={styles.avatar}>
          {user?.avatarUri ? (
            <Image
              source={{ uri: user.avatarUri }}
              style={styles.avatarImage}
            />
          ) : (
            <Ionicons name="person" size={24} color={COLORS.camaraInferior} />
          )}
        </View>

        {/* Saludo y Nombre del usuario */}
        <View style={styles.contenedorTextos}>
          <Text style={styles.texto_saludo}>¡Bienvenido!</Text>
          <Text
            style={styles.texto_usuario}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {user?.name || 'Joaquín'}
          </Text>
        </View>

        {/* Divisor vertical suave */}
        <View style={styles.divisor} />

        {/* Bloque de Puntos y botón Historial */}
        <View style={styles.contenedorPuntos}>
          <View style={styles.filaPuntosTitulo}>
            <MaterialCommunityIcons name="leaf" size={14} color={COLORS.botonPrincipal} />
            <Text style={styles.texto_puntos}>Mis Puntos</Text>
          </View>

          <Text style={styles.punto}>
            {user?.points ?? 1250}
          </Text>

          <TouchableOpacity
            style={styles.historialBoton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Perfil')}
          >
            <Text style={styles.historialTexto}>Historial</Text>
            <Ionicons name="chevron-forward" size={11} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
