import React from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../utils/theme';

interface TransactionLoaderModalProps {
  visible: boolean;
  mensaje?: string;
  submensaje?: string;
}

/**
 * RNF-10: Modal bloqueante con spinner durante transacciones contra la Base de Datos.
 * Impide múltiples pulsaciones accidentales hasta confirmar si el estado de la operación
 * fue exitoso o fallido.
 */
export const TransactionLoaderModal: React.FC<TransactionLoaderModalProps> = ({
  visible,
  mensaje = 'Procesando operación...',
  submensaje = 'Aguardando confirmación de la base de datos',
}) => {
  return (
    <Modal visible={visible} transparent={true} animationType="fade" statusBarTranslucent>
      <View style={styles.fondoBloqueante}>
        <View style={styles.tarjetaLoader}>
          <ActivityIndicator size="large" color={COLORS.botonPrincipal} />
          <Text style={styles.textoPrincipal}>{mensaje}</Text>
          {submensaje ? <Text style={styles.textoSecundario}>{submensaje}</Text> : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fondoBloqueante: {
    flex: 1,
    backgroundColor: COLORS.superposicionOscura,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  tarjetaLoader: {
    width: '85%',
    maxWidth: 320,
    backgroundColor: COLORS.superficieTarjeta,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.bordeSuave,
  },
  textoPrincipal: {
    marginTop: SPACING.md,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textoVerdeOscuro,
    textAlign: 'center',
  },
  textoSecundario: {
    marginTop: SPACING.xs,
    fontSize: 12,
    color: COLORS.textoSecundario,
    textAlign: 'center',
  },
});
