import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({

  contenedorExterior: {
    width: '94%',
    alignSelf: 'center',
    marginTop: 12,
  },

  contenedor: {
    backgroundColor: '#F3FAEE',
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 10,
  },

  titulo: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#173D20',
    textAlign: 'center',
    marginBottom: 14,
  },

  contenido: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  opcion: {
    width: '29%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconoSecundario: {
    width: 78,
    height: 78,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  textoPrincipal: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#173D20',
    textAlign: 'center',
    lineHeight: 21,
  },

  textoSecundario: {
    fontSize: 14,
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 3,
  },

  centro: {
    width: '38%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  botonCamara: {
    width: 125,
    height: 125,
    borderRadius: 70,
    backgroundColor: '#4CAF20',
    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 8,
    borderColor: '#D8F3CC',

    elevation: 4,
  },

  reportar: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#4CAF20',
    marginTop: 7,
  },

  descripcion: {
    fontSize: 14,
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 2,
  },
});