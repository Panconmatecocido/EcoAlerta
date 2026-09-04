import React, {useState} from 'react';
import { View, Text, ScrollView, Image} from 'react-native';
import { styles } from '../../../components/HomeStyle/CarruselStyle';
export default function Carrusel() {
  const [activeIndex, setActiveIndex] = useState(0);
  return (
    <View style={styles.boxCarrusel}>
      <ScrollView
          style = {{ flexGrow: 0 }}
          pagingEnabled
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.floor(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width);
            setActiveIndex(index);
          }}>
        <Image style={styles.image}
          source={require('../../../../assets/prueba1.jpg')}
        />
        <Image style={styles.image}
          source={require('../../../../assets/prueba1.jpg')}
        />
        <Image style={styles.image}
          source={require('../../../../assets/prueba1.jpg')}
        />
      </ScrollView>
      <View style={styles.pagination}>
        {[0, 1, 2].map((index) => (
      <View
        key={index}
        style={[
        styles.dot,
        activeIndex === index && styles.activeDot,
      ]}
      />
  ))}
</View>
    </View>
  );
}