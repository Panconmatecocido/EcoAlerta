import Bienvenidapuntos from './Bienvenidapuntos';
import Carrusel from './Carrusel';
import {View} from 'react-native';
import Zonareportes from './Zonareportes';
import SectorTienda from './SectorTienda';
import MuestraProductos from './MuestraProductos';
export default function InicioHome() {
  return (
    <View style={{flex: 1, backgroundColor: '#fcf4e3'}}>  
        <Bienvenidapuntos/>
        <Carrusel/>
        <Zonareportes/>
        <SectorTienda/>
        <MuestraProductos/>
    </View>
    );
}