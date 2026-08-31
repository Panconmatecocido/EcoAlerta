import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View, Image, ScrollView, Dimensions, Pressable, StatusBar } from 'react-native';
import { styles } from '../../components/HomeStyle';


export default function HomeScreen() {


    return (
<View style={styles.container}>

      <View style={styles.encabezado}>
        <Ionicons
          name="settings-outline"
          size={30}
          color="steelblue"
          style={{ position: 'absolute', right: 10, top: 5 }}
          onPress={() => console.log('Presionaste configuración')}
        />
        <Text style = {styles.textoEncabezado}>HOME</Text>
      </View>
      <View >
        <Text style = {styles.infoCarrusel}> Participación de la ciudad</Text>
      </View>
      <View>
        <Text style = {styles.acompañamiento}> Te dejamos abajo unas muestras de como colabora la gente a mantener el espacio limpio</Text>
      </View>
    <ScrollView
    style = {{ flexGrow: 0 }}
    pagingEnabled
    horizontal={true}
    showsHorizontalScrollIndicator={false}>
      <Image
        source={require('../../../assets/prueba1.jpg')}
        style={styles.image1}
      />
      <Image
        source={require('../../../assets/prueba1.jpg')}
        style={styles.image1}
      />
      <Image
        source={require('../../../assets/prueba1.jpg')}
        style={styles.image1}
      />
    </ScrollView>
    <View style={styles.Boton_foto}>
      <Text style={styles.Texto_Del_Medio}>Tomá tu foto y {'\n'}comenza a ganar puntos.</Text>
    </View>
      <Pressable style={styles.boton_compra}>
          <Text style={styles.textoBoton}>REPORTAR</Text>
      </Pressable>
    <Text style={styles.texto_de_actividad_de_compras}>
      Actividad de compras recientes
    </Text>
    <Image 
      source={require('../../../assets/prueba2.png')}
      style={styles.imagenes_actividad_de_compras}
    />
    <Image 
      source={require('../../../assets/prueba3.png')}
      style={styles.imagenes_actividad_de_compras_2}
    />
        
    </View>
    );
}