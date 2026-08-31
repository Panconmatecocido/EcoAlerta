import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#d3edb5',
  },

  encabezado: {
    width: '100%',
    height: 40,
    marginTop: 30,
    backgroundColor: '#ace06d',
    justifyContent: 'center',
    alignItems: 'center',
  },

  textoEncabezado: {
    color: '#286429',
    fontSize: 30,
    fontWeight: 'bold',
  },

  configuracion: {
    position: 'absolute',
    right: 10,
    top: 5,
  },

  image1: {
  width: width - 20,
  height: 180,
  marginHorizontal: 10,
  borderRadius: 15,
},
  infoCarrusel: {
    marginTop: 5,
    marginLeft: 5,
    marginBottom: 10,
    fontWeight: '700',
    fontSize: 25,
    color: '#175317',
  },
  acompañamiento: {
    marginLeft: 20,
    marginBottom: 20,
    fontWeight: '300',
    fontSize: 15,
    color: '#175317',
  },
  Boton_foto: {
    width: width - 20,
    height: 100,
    marginHorizontal: 10,
    borderRadius: 15,
    flexDirection: 'column',
    marginTop: 20,
  },
  Texto_Del_Medio: {
    color: '#175317',
    fontSize: 25,
    fontFamily: 'Inter_700Bold',
    marginLeft: 5,
    textAlign: 'center',
    },
  boton_compra: {
    backgroundColor: '#ace06d',
    width: width,
    height: 30,
    borderRadius: 5,
    position: 'absolute',
    bottom: 325,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBoton: {
    color: '#286429',
    fontSize: 20,
    fontWeight: 'bold',
  },
  texto_de_actividad_de_compras: {
    marginTop: 20,
    marginLeft: 20,
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  imagenes_actividad_de_compras: {
    position: 'absolute',
    bottom: 170,
    marginLeft: 10,
    width: 160,
    height: 100,
  },
  imagenes_actividad_de_compras_2: {
    position: 'absolute',
    bottom: 170,
    marginLeft: 180,
    width: 170,
    height: 100,
    
  },
  notificaciones: {
    position: 'absolute',
    right: 10,
    top: 5,
  },
});