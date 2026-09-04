import { StyleSheet, Dimensions, ScrollView } from 'react-native';
export const styles = StyleSheet.create ({
boxCarrusel: {
        backgroundColor: '#fcf4e3',
        padding: 10,
        height: 190,
},

image: {
        width: Dimensions.get('window').width - 20,
        height: 165,
        borderRadius: 20
},
pagination: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  height: 30,
},

dot: {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: 'gray',
  marginHorizontal: 4,
},

activeDot: {
  backgroundColor: 'green',
},
})