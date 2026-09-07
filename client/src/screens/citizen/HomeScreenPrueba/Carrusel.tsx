import React, {useState} from 'react';
import { View, Text, ScrollView, Image, StyleSheet} from 'react-native';
import { styles } from '../../../components/HomeStyle/CarruselStyle';
export default function Carrusel() {
  const [activeIndex, setActiveIndex] = useState(0);
  return (
    <View style={styles2.flex}>
      <ScrollView 
          style={styles.boxCarrusel}
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

const styles2 = StyleSheet.create({
  flex: {
    flexGrow: 0,
    padding: 5,
  },
})