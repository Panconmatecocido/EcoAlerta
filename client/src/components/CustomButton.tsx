// src/components/CustomButton.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';

export type ButtonVariant = 'primary' | 'google' | 'outline' | 'secondary';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  isLoading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
}) => {
  const getContainerStyle = () => {
    switch (variant) {
      case 'google':
        return styles.googleButton;
      case 'outline':
        return styles.outlineButton;
      case 'secondary':
        return styles.secondaryButton;
      case 'primary':
      default:
        return styles.primaryButton;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'google':
        return styles.googleText;
      case 'outline':
        return styles.outlineText;
      case 'secondary':
        return styles.secondaryText;
      case 'primary':
      default:
        return styles.primaryText;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.baseButton,
        getContainerStyle(),
        (disabled || isLoading) && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'primary' ? COLORS.blanco : COLORS.botonPrincipal}
          size="small"
        />
      ) : (
        <View style={styles.contentRow}>
          {variant === 'google' && !leftIcon && (
            <AntDesign
              name="google"
              size={22}
              color="#EA4335"
              style={styles.googleIcon}
            />
          )}
          {leftIcon && <View style={styles.iconWrapper}>{leftIcon}</View>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginVertical: 6,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: COLORS.botonPrincipal,
    shadowColor: COLORS.botonPrincipal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  googleButton: {
    backgroundColor: COLORS.superficieTarjeta,
    borderWidth: 1.5,
    borderColor: COLORS.iconoPrincipal,
  },
  outlineButton: {
    backgroundColor: COLORS.superficieTarjeta,
    borderWidth: 1.5,
    borderColor: COLORS.iconoPrincipal,
  },
  secondaryButton: {
    backgroundColor: COLORS.fondoTarjeta,
    borderWidth: 1,
    borderColor: COLORS.borde,
  },
  disabledButton: {
    opacity: 0.6,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    marginRight: 10,
  },
  iconWrapper: {
    marginRight: 10,
  },
  primaryText: {
    color: COLORS.blanco,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  googleText: {
    color: COLORS.textoVerdeOscuro,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  outlineText: {
    color: COLORS.textoVerdeOscuro,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryText: {
    color: COLORS.textoVerde,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default CustomButton;