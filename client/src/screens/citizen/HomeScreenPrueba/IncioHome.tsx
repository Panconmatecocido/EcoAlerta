import Bienvenidapuntos from './Bienvenidapuntos';

import { View, ScrollView } from 'react-native';

import Header from '../../../components/Header';
import { CarruselTienda } from './CarruselPrueba';
import { FotosPuntos } from './FotosPuntos';
export default function InicioHome() {
  return (
    <View style={{ flex: 1, backgroundColor: '#fcf4e3' }}>
      <Header />
      <Bienvenidapuntos />
      <CarruselTienda />
      <FotosPuntos />
    </View>
  );
}