import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
export const styles = StyleSheet.create({
  welcomeCard: {
    backgroundColor: '#fcf4e3',
    padding: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 20,
},
avatar: {
  width: 65,
  height: 65,
  borderRadius: 35,
  backgroundColor: '#EAF7D9',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 10,
},
texto_usuario: { 
  fontSize: 17,
  fontWeight: 'bold',
},
texto_acompañamiento: {
  padding: 2,
  width: 150,
  fontSize: 15,
},
texto_puntos: {
  fontSize: 16,
  fontWeight: 'bold',
  marginRight: 10,
},
punto: {
  fontSize: 20,
  marginLeft: 20,
},
historial: {
  fontSize: 14,
  marginLeft: 20,
},
})
