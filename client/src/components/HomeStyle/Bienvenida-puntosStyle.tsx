import { StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../../utils/theme';

const { width } = Dimensions.get('window');
export const styles = StyleSheet.create({
  welcomeCard: {
    backgroundColor: COLORS.fondoEncabezado,
    padding: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 25,
    marginRight: 10,
    marginLeft: 10,
    height: 100,
    marginTop: 10,
},
parteIzquierda: {
  flexDirection: 'column',
  justifyContent: 'space-between',
},
avatar: {
  width: 55,
  height: 55,
  borderRadius: 35,
  backgroundColor: '#EAF7D9',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 5,
},
texto_usuario: { 
  fontSize: 17,
  fontWeight: 'bold',
  color: COLORS.textoLogo,
},
texto_acompañamiento: {
  padding: 2,
  fontSize: 15,
  width: 150,
},
texto_puntos: {
  fontSize: 16,
  fontWeight: 'bold',
  marginRight: 10,
  color: COLORS.textoLogo,
},
punto: {
  fontSize: 15,
  marginLeft: 20,
},
historial: {
  backgroundColor: COLORS.botonPrincipal,
  fontSize: 14,
  marginLeft: 20,
  borderBottomRightRadius : 10,
  borderTopRightRadius: 10,
  borderTopLeftRadius: 5,
  borderBottomLeftRadius: 5,
  textAlign : 'center',
},
divisor: {
  width: 1,
  height: '70%',
  backgroundColor: COLORS.textoLogo,
  marginHorizontal: 5,
},
})
