import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Modal,
  ScrollView as ModalScrollView,
} from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS, ICON_SIZE } from '../../utils/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CitizenNotificationsModal } from '../../components/citizen/CitizenNotificationsModal';
import Header from '../../components/Header';

type InformacionVisible = 'help' | 'terms' | null;

const PREGUNTAS_FRECUENTES = [
  {
    question: '¿Cómo hago un reporte?',
    answer:
      'Usa el botón de cámara para fotografiar el problema, completa los datos solicitados y envía el reporte para que el municipio pueda revisarlo.',
  },
  {
    question: '¿Cómo consulto el estado de un reporte?',
    answer:
      'En Perfil puedes revisar tus reportes y su estado. También puedes abrir Notificaciones para ver los estados actuales.',
  },
  {
    question: '¿Cuándo recibo EcoPuntos?',
    answer:
      'Los EcoPuntos se acreditan cuando el municipio verifica y aprueba el reporte, según la evaluación correspondiente.',
  },
  {
    question: '¿Cuándo puedo retirar un canje?',
    answer:
      'Los canjes pendientes se muestran en Notificaciones. La disponibilidad se calcula luego de dos días hábiles desde su creación.',
  },
  {
    question: '¿Cómo cambio mi foto o nombre?',
    answer:
      'Abre Editar Perfil. Desde Perfil puedes cambiar tu foto y editar tu nombre. El correo de la cuenta es de solo lectura.',
  },
];

const BORRADOR_TERMINOS = [
  {
    title: 'Borrador para revisión',
    body:
      'Este texto es informativo y está pendiente de revisión y aprobación municipal y legal. No reemplaza los términos oficiales del municipio.',
  },
  {
    title: 'Uso de EcoAlerta',
    body:
      'La aplicación permite enviar reportes ambientales, consultar su estado y, para cuentas ciudadanas, participar en el programa de EcoPuntos y canjes. La información enviada debe ser veraz y referirse a situaciones reales.',
  },
  {
    title: 'Reportes y ubicación',
    body:
      'Al enviar un reporte, la imagen y los datos que proporciones pueden ser utilizados por el municipio para evaluar, gestionar y dar seguimiento al caso. Comparte únicamente información pertinente y evita incluir datos personales de terceros.',
  },
  {
    title: 'EcoPuntos y canjes',
    body:
      'La acreditación de EcoPuntos depende de la revisión municipal. Los canjes están sujetos a disponibilidad, reglas de retiro y validación por parte de la sucursal correspondiente.',
  },
  {
    title: 'Cuenta y datos',
    body:
      'Eres responsable de mantener el acceso a tu cuenta bajo control. Puedes actualizar tu nombre y foto desde Perfil; el correo asociado a la cuenta no se modifica desde la aplicación.',
  },
];

export const MasScreen: React.FC = () => {
  const { user: usuario, logout: cerrarSesion } = useAuth();
  const navigation = useNavigation<any>();
  const [notificacionesVisibles, setNotificacionesVisibles] = React.useState(false);
  const [informacionVisible, setInformacionVisible] = React.useState<InformacionVisible>(null);

  const manejarCerrarSesion = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir de tu cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: () => {
            void cerrarSesion().catch((error: unknown) => {
              Alert.alert(
                'No se pudo cerrar sesión',
                error instanceof Error ? error.message : 'Inténtalo nuevamente.'
              );
            });
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={estilos.contenedor} edges={['left', 'right', 'bottom']}>
      <Header showActions={false} />
      <StatusBar barStyle="dark-content" />
      <CitizenNotificationsModal
        visible={notificacionesVisibles}
        ciudadanoId={usuario?.role === 'citizen' ? usuario.id : undefined}
        onClose={() => setNotificacionesVisibles(false)}
      />
      <Modal
        visible={informacionVisible !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setInformacionVisible(null)}
      >
        <View style={estilos.modalBackdrop}>
          <View style={estilos.modalContenido}>
            <View style={estilos.modalCabecera}>
              <Text style={estilos.modalTitulo}>
                {informacionVisible === 'help' ? 'Centro de Ayuda' : 'Términos y Privacidad'}
              </Text>
              <TouchableOpacity
                onPress={() => setInformacionVisible(null)}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                style={estilos.botonCerrarModal}
              >
                <Feather name="x" size={22} color={COLORS.textoVerdeOscuro} />
              </TouchableOpacity>
            </View>
            <ModalScrollView contentContainerStyle={estilos.modalLista}>
              {informacionVisible === 'help'
                ? PREGUNTAS_FRECUENTES.map((item) => (
                    <View key={item.question} style={estilos.tarjetaInformacion}>
                      <Text style={estilos.tituloInformacion}>{item.question}</Text>
                      <Text style={estilos.textoInformacion}>{item.answer}</Text>
                    </View>
                  ))
                : BORRADOR_TERMINOS.map((item) => (
                    <View key={item.title} style={estilos.tarjetaInformacion}>
                      <Text style={estilos.tituloInformacion}>{item.title}</Text>
                      <Text style={estilos.textoInformacion}>{item.body}</Text>
                    </View>
                  ))}
            </ModalScrollView>
          </View>
        </View>
      </Modal>
      <ScrollView contentContainerStyle={estilos.contenidoScroll}>
        
        {/* Encabezado */}
        <View style={estilos.cabecera}>
          <Text style={estilos.tituloCabecera}>Más Opciones</Text>
          <Text style={estilos.subtituloCabecera}>
            Ajustes, soporte e información general
          </Text>
        </View>

        {/* Sección: Cuenta y Ajustes */}
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>CUENTA</Text>
          
          <TouchableOpacity
            style={estilos.opcionFila}
            onPress={() => navigation.navigate('Perfil')}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <View style={estilos.contenedorIcono}>
              <Ionicons name="person-outline" size={ICON_SIZE.md} color={COLORS.iconoPrincipal} />
            </View>
            <View style={estilos.textoFila}>
              <Text style={estilos.tituloOpcion}>Editar Perfil</Text>
              <Text style={estilos.subtituloOpcion}>Modifica tu nombre y foto de perfil</Text>
            </View>
            <Feather name="chevron-right" size={ICON_SIZE.md} color={COLORS.textoSecundario} />
          </TouchableOpacity>

          <TouchableOpacity
            style={estilos.opcionFila}
            onPress={() => setNotificacionesVisibles(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <View style={estilos.contenedorIcono}>
              <Ionicons name="notifications-outline" size={ICON_SIZE.md} color={COLORS.iconoPrincipal} />
            </View>
            <View style={estilos.textoFila}>
              <Text style={estilos.tituloOpcion}>Notificaciones</Text>
              <Text style={estilos.subtituloOpcion}>Alertas de denuncias y novedades</Text>
            </View>
            <Feather name="chevron-right" size={ICON_SIZE.md} color={COLORS.textoSecundario} />
          </TouchableOpacity>
        </View>

        {/* Sección: Soporte e Información */}
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>SOPORTE Y COMUNIDAD</Text>

          <TouchableOpacity
            style={estilos.opcionFila}
            onPress={() => setInformacionVisible('help')}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <View style={estilos.contenedorIcono}>
              <Ionicons name="help-circle-outline" size={ICON_SIZE.md} color={COLORS.iconoPrincipal} />
            </View>
            <View style={estilos.textoFila}>
              <Text style={estilos.tituloOpcion}>Centro de Ayuda y Preguntas</Text>
              <Text style={estilos.subtituloOpcion}>Aprende a realizar reportes efectivos</Text>
            </View>
            <Feather name="chevron-right" size={ICON_SIZE.md} color={COLORS.textoSecundario} />
          </TouchableOpacity>

          <TouchableOpacity
            style={estilos.opcionFila}
            onPress={() => setInformacionVisible('terms')}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <View style={estilos.contenedorIcono}>
              <MaterialIcons name="security" size={ICON_SIZE.md} color={COLORS.iconoPrincipal} />
            </View>
            <View style={estilos.textoFila}>
              <Text style={estilos.tituloOpcion}>Términos y Privacidad</Text>
              <Text style={estilos.subtituloOpcion}>Políticas de uso de la aplicación</Text>
            </View>
            <Feather name="chevron-right" size={ICON_SIZE.md} color={COLORS.textoSecundario} />
          </TouchableOpacity>
        </View>

        {/* Botón de Cerrar Sesión */}
        <View style={estilos.contenedorCerrarSesion}>
          <TouchableOpacity
            style={estilos.botonCerrarSesion}
            onPress={manejarCerrarSesion}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={ICON_SIZE.md} color={COLORS.textoPeligro} />
            <Text style={estilos.textoCerrarSesion}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Versión de la app */}
        <Text style={estilos.textoVersion}>EcoAlerta v1.0.0 (Beta)</Text>

      </ScrollView>
    </SafeAreaView>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORS.fondoAplicacion,
  },
  contenidoScroll: {
    paddingBottom: SPACING.lg,
  },
  cabecera: {
    backgroundColor: COLORS.fondoEncabezado,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  tituloCabecera: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
  },
  subtituloCabecera: {
    fontSize: 13,
    color: COLORS.textoSecundario,
    marginTop: SPACING.xs,
  },
  seccion: {
    marginTop: SPACING.sm,
    marginHorizontal: SPACING.md,
  },
  tituloSeccion: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textoVerde,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
    letterSpacing: 0.5,
  },
  opcionFila: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.superficieTarjeta,
    padding: SPACING.md - 2, // 14px de padding interior
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  contenedorIcono: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.fondoTarjeta,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 4,
  },
  textoFila: {
    flex: 1,
  },
  tituloOpcion: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textoVerdeOscuro,
  },
  subtituloOpcion: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    marginTop: 2,
  },
  contenedorCerrarSesion: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  botonCerrarSesion: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.fondoPeligro,
    borderWidth: 1,
    borderColor: COLORS.bordePeligro,
    paddingVertical: SPACING.md - 2,
    borderRadius: BORDER_RADIUS.md,
  },
  textoCerrarSesion: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textoPeligro,
    marginLeft: SPACING.sm,
  },
  textoVersion: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textoDesactivado,
    marginTop: SPACING.lg,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.superposicionOscura,
  },
  modalContenido: {
    maxHeight: '85%',
    minHeight: '50%',
    backgroundColor: COLORS.fondoAplicacion,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    paddingTop: SPACING.md,
  },
  modalCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bordeSuave,
  },
  modalTitulo: {
    flex: 1,
    color: COLORS.textoVerdeOscuro,
    fontSize: 20,
    fontWeight: '700',
  },
  botonCerrarModal: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLista: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  tarjetaInformacion: {
    padding: SPACING.md,
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  tituloInformacion: {
    color: COLORS.textoVerdeOscuro,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  textoInformacion: {
    color: COLORS.textoSecundario,
    fontSize: 14,
    lineHeight: 20,
  },
});