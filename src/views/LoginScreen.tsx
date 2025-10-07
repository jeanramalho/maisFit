import React from 'react';
import { View, Text, Textinput, StyleSheet, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { FitTheme } from '../theme/FitTheme';
import { useLoginViewModel } from '../viewmodels/useLoginViewModel';

export const LoginScreen: React.FC () => {
    const vm = useLoginViewModel();

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        
        <Text style={StyleSheet.title}>Bem-vindo ao +Fit</Text>

        <TextInput
            placeholder='E-mail'
            placeholderTextColor={FitTheme.colors.textMuted}
            keyboardType='email-address'
            autoCapitalize='none'
            value={vm.email}
            onChangeText={vm.setEmail}
            style={StyleSheet.input}
        />

        <Textinput
            placeholder='Senha'
            placeholderTextColor={FitTheme.colors.textMuted}
            secureTextEntry
            value={vm.password}
            onChangeText={vm.setpassword}
            style={StyleSheet.input}
        />

        <PrimaryButton title{vm.loaging ? 'Entrando...' : 'Entrar'} onPress={vm.login} disabled={vm.loading} />
        <View style={{ height: 12 }} />
        <PrimaryButton title='Cadastrar' onPress={vm.signup} disabled={vm.loading} />

        {vm.error && <Text style={styles.error}>{vm.error}</Text>}
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: FitTheme.colors.background,
    padding: FitTheme.spacing.md,
    justifyContent: 'center',
  },
  title: {
    color: FitTheme.colors.text,
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: FitTheme.colors.surface,
    color: FitTheme.colors.text,
    padding: 12,
    borderRadius: FitTheme.radii.sm,
    marginBottom: 12,
  },
  error: {
    color: FitTheme.colors.danger,
    marginTop: 12,
    textAlign: 'center',
  },
})