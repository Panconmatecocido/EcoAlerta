import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({

  contenedor: {
    backgroundColor: '#F5FBEF',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginHorizontal: 10,
  },
  contenedorExterior: {
    backgroundColor: '#fcf4e3',
  },

  titulo: {
    textAlign: 'center',
    fontSize: 21,
    fontWeight: '700',
    color: '#263D20',
    marginBottom: 15,
  },

  contenido: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  opcion: {
    flex: 1,
    alignItems: 'center',
  },

  centro: {
    flex: 1.2,
    alignItems: 'center',
  },

  iconoSecundario: {
    width: 75,
    height: 75,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  botonCamara: {
    width: 125,
    height: 125,
    borderRadius: 70,
    backgroundColor: '#58B52B',
    alignItems: 'center',
    justifyContent: 'center',

    // Efecto de borde exterior
    borderWidth: 7,
    borderColor: '#CDECBF',

    elevation: 5,
  },

  textoPrincipal: {
    fontSize: 15,
    fontWeight: '600',
    color: '#263D20',
    textAlign: 'center',
  },

  textoSecundario: {
    fontSize: 14,
    color: '#4D5C49',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 4,
  },

  reportar: {
    fontSize: 19,
    fontWeight: '800',
    color: '#4A8F27',
    marginTop: 8,
  },

  descripcion: {
    fontSize: 14,
    color: '#4D5C49',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 2,
  },

});