import { StyleSheet } from 'react-native';
import { COLORS } from '../../utils/theme';

export const styles = StyleSheet.create({
  welcomeCard: {
    backgroundColor: COLORS.fondoEncabezado,
    padding: 16,
    borderRadius: 25,
    marginHorizontal: 10,
    marginTop: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 55,
    height: 55,
    flexShrink: 0,
    borderRadius: 35,
    backgroundColor: '#EAF7D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  texto_usuario: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textoLogo,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textoLogo,
  },
  texto_acompañamiento: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.textoVerdeOscuro,
  },
});
