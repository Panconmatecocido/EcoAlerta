import { StyleSheet } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '../../utils/theme';

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  welcomeCard: {
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
    // Sombra suave premium
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.fondoTarjeta,
    borderWidth: 2,
    borderColor: COLORS.bordeSuave,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  contenedorTextos: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  texto_saludo: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.camaraInferior,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  texto_usuario: { 
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textoVerdeOscuro,
  },
  divisor: {
    width: 1,
    height: 44,
    backgroundColor: COLORS.bordeSuave,
    marginHorizontal: 6,
  },
  contenedorPuntos: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 88,
  },
  filaPuntosTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  texto_puntos: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textoSecundario,
  },
  punto: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.textoVerdeOscuro,
    letterSpacing: 0.3,
  },
  historialBoton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.botonPrincipal,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 12,
    marginTop: 4,
    gap: 3,
  },
  historialTexto: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
