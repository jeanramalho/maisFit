// Cabeçalho padrão do app com logo textual (Simples) e botão de ação opcional.
// Comentários em pt-BR.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { FitTheme } from '../theme/FitTheme';

type Props = {
  title?: string;
  rightAction?: React.ReactNode; // ícone ou botão passado pelo pai
  style?: ViewStyle;
  titleStyle?: TextStyle;
};

/** AppHeader
 * - Exibe logo / nome do app no topo.
 * - Recebe `rightAction` para botões de perfil/pesquisa.
 * - Visual limpo, usa tokens do tema.
 */
export const AppHeader: React.FC<Props> = ({ title = '+Fit', rightAction, style, titleStyle }) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.title, titleStyle]}>{title}</Text>
      <View style={styles.right}>{rightAction}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: FitTheme.colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  right: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
});
