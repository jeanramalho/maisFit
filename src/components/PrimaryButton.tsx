// Botão primário reutilizável alinhado ao tema.
// Comentários em pt-BR explicando o propósito de cada prop.

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, ViewStyle, TextStyle } from 'react-native';
import { FitTheme } from '../theme/FitTheme';

type Props = TouchableOpacityProps & {
  title: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
};

/** PrimaryButton
 * - Uso: botão principal do app (ações principais).
 * - Recebe `title` e props padrão de TouchableOpacity.
 * - Não contém lógica — apenas apresentação; lógica fica nos ViewModels.
 */
export const PrimaryButton: React.FC<Props> = ({ title, style, textStyle, disabled, ...rest }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.button, style, disabled && styles.disabled]}
      disabled={disabled}
      {...rest}
    >
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: FitTheme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: FitTheme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    // sombra leve (iOS)
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  text: {
    color: FitTheme.colors.background, // sobre teal, texto escuro do fundo para contraste
    fontWeight: '600',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.6,
  },
});
