// src/views/HomeScreen.tsx
// View (apresentação) da HomeScreen.
// Consome o useHomeViewModel para obter dados e ações.
// Mantemos a View simples: exibe nome do usuário, objetivos e ações rápidas.

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { FitTheme } from '../theme/FitTheme';
import { PrimaryButton } from '../components/PrimaryButton';
import { AppHeader } from '../components/AppHeader';
import { useHomeViewModel } from '../viewmodels/useHomeViewModel';

export const HomeScreen: React.FC = () => {
  const { profile, loading, error, reload, logout } = useHomeViewModel();

  return (
    <View style={styles.container}>
      <AppHeader title="+Fit" rightAction={<PrimaryButton title="Sair" onPress={logout} style={styles.headerBtn} />} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={FitTheme.colors.primary} />
        ) : error ? (
          <View style={styles.row}>
            <Text style={styles.error}>{error}</Text>
            <View style={{ height: 12 }} />
            <PrimaryButton title="Tentar novamente" onPress={reload} />
          </View>
        ) : (
          <>
            <Text style={styles.welcome}>Olá{profile?.full_name ? `, ${profile.full_name}` : ''} 👋</Text>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Seu objetivo</Text>
              <Text style={styles.cardText}>
                {profile?.goal_weight ? `Meta: ${profile.goal_weight} kg` : 'Meta ainda não definida.'}
              </Text>
              <Text style={styles.cardText}>
                {profile?.weight_kg ? `Peso atual: ${profile.weight_kg} kg` : 'Peso atual não informado.'}
              </Text>
            </View>

            <View style={styles.actions}>
              <PrimaryButton
                title="Registrar Refeição"
                onPress={() => {
                  // navegar para tela de registrar refeição - implemente a rota quando criar
                  // navigation.navigate('AddMeal');
                }}
              />
              <View style={{ height: 12 }} />
              <PrimaryButton
                title="Gerar Cardápio (IA)"
                onPress={() => {
                  // exemplo: chamar tela de geração de plano
                  // navigation.navigate('GeneratePlan');
                }}
              />
              <View style={{ height: 12 }} />
              <PrimaryButton title="Ver Diário" onPress={() => { /* navigation.navigate('Diary') */ }} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FitTheme.colors.background,
  },
  content: {
    padding: FitTheme.spacing.md,
  },
  welcome: {
    color: FitTheme.colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  card: {
    backgroundColor: FitTheme.colors.surface,
    padding: FitTheme.spacing.md,
    borderRadius: FitTheme.radii.md,
    marginBottom: 16,
  },
  cardTitle: {
    color: FitTheme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardText: {
    color: FitTheme.colors.textMuted,
    fontSize: 14,
    marginBottom: 4,
  },
  actions: {
    marginTop: 8,
  },
  error: {
    color: FitTheme.colors.danger,
    textAlign: 'center',
  },
  headerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 64,
  },
  row: {
    alignItems: 'center',
  },
});
