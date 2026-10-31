import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BORDER_RADIUS, COLORS, SPACING } from '../../utils/theme';
import { marcarOnboardingVisto } from '../../utils/storage';

interface Diapositiva {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: ImageSourcePropType;
}

interface PropsOnboarding {
  /** Se invoca al terminar el onboarding (Omitir, Siguiente final, Crear una cuenta). */
  alFinalizar: () => void;
  /** Se invoca al elegir "Ya tengo cuenta". */
  alIrAlLogin: () => void;
}

const INTERVALO_AUTOPLAY_MS = 4000;
const ANCHO_DOT_ACTIVO = 24;
const ANCHO_DOT_INACTIVO = 8;

const DIAPOSITIVAS: Diapositiva[] = [
  {
    id: 'tarjeta1',
    titulo: 'Detectá y reportá',
    descripcion:
      'Identificá microbasurales y focos de dengue en tu barrio. Tomá una foto y compartí la ubicación exacta.',
    imagen: require('../../../assets/tarjeta1.jfif'),
  },
  {
    id: 'tarjeta2',
    titulo: 'Transformá tu entorno',
    descripcion:
      'Tus alertas ayudan a coordinar limpiezas y fumigaciones para cuidar la salud de la comunidad.',
    imagen: require('../../../assets/tarjeta2.jfif'),
  },
  {
    id: 'tarjeta3',
    titulo: 'Sumá puntos y canjeá',
    descripcion:
      'Cada reporte validado te otorga puntos. Canjealos en el catálogo por insumos ecofriendly.',
    imagen: require('../../../assets/tarjeta3.jfif'),
  },
];

const ULTIMO_INDICE = DIAPOSITIVAS.length - 1;

const configuracionVisibilidad = { itemVisiblePercentThreshold: 60 };

export default function OnboardingPantalla({ alFinalizar, alIrAlLogin }: PropsOnboarding) {
  const { width: anchoPantalla } = useWindowDimensions();
  const listaRef = useRef<FlatList<Diapositiva>>(null);
  const desplazamientoX = useRef(new Animated.Value(0)).current;
  const indiceRef = useRef(0);
  const [indiceActual, setIndiceActual] = useState(0);
  const [autoplayActivo, setAutoplayActivo] = useState(true);

  const esUltima = indiceActual === ULTIMO_INDICE;

  const irAIndice = useCallback((indice: number) => {
    listaRef.current?.scrollToIndex({ index: indice, animated: true });
  }, []);

  // Autoplay: avanza cada 4s hasta la última tarjeta; se detiene si el usuario interactúa.
  useEffect(() => {
    if (!autoplayActivo || indiceActual >= ULTIMO_INDICE) return;
    const temporizador = setTimeout(() => irAIndice(indiceActual + 1), INTERVALO_AUTOPLAY_MS);
    return () => clearTimeout(temporizador);
  }, [autoplayActivo, indiceActual, irAIndice]);

  const alCambiarVisibles = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const indice = viewableItems[0]?.index;
      if (indice != null && indice !== indiceRef.current) {
        indiceRef.current = indice;
        setIndiceActual(indice);
      }
    },
  ).current;

  const pausarAutoplay = () => setAutoplayActivo(false);

  const finalizar = async () => {
    // Si falla el guardado no se bloquea al usuario: solo se volverá a mostrar el onboarding.
    await marcarOnboardingVisto().catch(() => undefined);
    alFinalizar();
  };

  const irAlLogin = async () => {
    await marcarOnboardingVisto().catch(() => undefined);
    alIrAlLogin();
  };

  const alPresionarSiguiente = () => {
    pausarAutoplay();
    if (esUltima) {
      void finalizar();
    } else {
      irAIndice(indiceActual + 1);
    }
  };

  const renderizarDiapositiva = ({ item }: { item: Diapositiva }) => (
    <View style={[estilos.diapositiva, { width: anchoPantalla }]}>
      <View style={estilos.contenedorImagen}>
        <Image source={item.imagen} style={estilos.imagen} resizeMode="contain" />
      </View>
      <View style={estilos.contenedorTexto}>
        <Text style={estilos.titulo}>{item.titulo}</Text>
        <Text style={estilos.descripcion}>{item.descripcion}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={estilos.contenedor}>
      <View style={estilos.encabezado}>
        {!esUltima && (
          <TouchableOpacity
            onPress={() => void finalizar()}
            accessibilityRole="button"
            accessibilityLabel="Omitir presentación"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={estilos.textoOmitir}>Omitir</Text>
          </TouchableOpacity>
        )}
      </View>

      <Animated.FlatList
        ref={listaRef}
        data={DIAPOSITIVAS}
        keyExtractor={(item) => item.id}
        renderItem={renderizarDiapositiva}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, indice) => ({
          length: anchoPantalla,
          offset: anchoPantalla * indice,
          index: indice,
        })}
        onScrollBeginDrag={pausarAutoplay}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: desplazamientoX } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        onViewableItemsChanged={alCambiarVisibles}
        viewabilityConfig={configuracionVisibilidad}
        onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          const indice = Math.round(e.nativeEvent.contentOffset.x / anchoPantalla);
          indiceRef.current = indice;
          setIndiceActual(indice);
        }}
      />

      <View style={estilos.indicadores}>
        {DIAPOSITIVAS.map((diapositiva, indice) => {
          const rango = [(indice - 1) * anchoPantalla, indice * anchoPantalla, (indice + 1) * anchoPantalla];
          const ancho = desplazamientoX.interpolate({
            inputRange: rango,
            outputRange: [ANCHO_DOT_INACTIVO, ANCHO_DOT_ACTIVO, ANCHO_DOT_INACTIVO],
            extrapolate: 'clamp',
          });
          const color = desplazamientoX.interpolate({
            inputRange: rango,
            outputRange: [COLORS.borde, COLORS.botonPrincipal, COLORS.borde],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={diapositiva.id}
              style={[estilos.dot, { width: ancho, backgroundColor: color }]}
            />
          );
        })}
      </View>

      <View style={estilos.acciones}>
        {esUltima ? (
          <>
            <TouchableOpacity
              style={estilos.botonPrimario}
              onPress={() => void finalizar()}
              accessibilityRole="button"
            >
              <Text style={estilos.textoBotonPrimario}>Crear una cuenta</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={estilos.botonSecundario}
              onPress={() => void irAlLogin()}
              accessibilityRole="button"
            >
              <Text style={estilos.textoBotonSecundario}>Ya tengo cuenta</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={estilos.botonPrimario}
            onPress={alPresionarSiguiente}
            accessibilityRole="button"
          >
            <Text style={estilos.textoBotonPrimario}>Siguiente</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORS.fondoEncabezado,
  },
  encabezado: {
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  textoOmitir: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textoVerde,
  },
  diapositiva: {
    flex: 1,
    backgroundColor: COLORS.fondoEncabezado,
  },
  contenedorImagen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  imagen: {
    width: '100%',
    height: '100%',
  },
  contenedorTexto: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  titulo: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textoLogo,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  descripcion: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textoVerdeOscuro,
    textAlign: 'center',
  },
  indicadores: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  dot: {
    height: ANCHO_DOT_INACTIVO,
    borderRadius: BORDER_RADIUS.sm,
    marginHorizontal: SPACING.xs,
  },
  acciones: {
    minHeight: 120,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    justifyContent: 'flex-start',
  },
  botonPrimario: {
    backgroundColor: COLORS.botonPrincipal,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  textoBotonPrimario: {
    color: COLORS.blanco,
    fontSize: 16,
    fontWeight: '700',
  },
  botonSecundario: {
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.botonPrincipal,
    paddingVertical: 14,
    alignItems: 'center',
  },
  textoBotonSecundario: {
    color: COLORS.botonPrincipal,
    fontSize: 16,
    fontWeight: '700',
  },
});
