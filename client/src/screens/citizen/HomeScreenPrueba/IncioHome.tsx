import Bienvenidapuntos from './Bienvenidapuntos';
import Carrusel from './Carrusel';
import {View, ScrollView} from 'react-native';
import Zonareportes from './Zonareportes';
import SectorTienda from './SectorTienda';
import MuestraProductos from './MuestraProductos';
import Header from '../../../components/Header';
export default function InicioHome() {
  return (
    <View style={{flex: 1, backgroundColor: '#fcf4e3'}}>
        <Header/>
        <Bienvenidapuntos/>
        <Carrusel/>
        <Zonareportes/>
        <SectorTienda/>
        <MuestraProductos/>
    </View>
    );
}