// src/viewmodels/useHomeViewModel.ts
// ViewModel para a HomeScreen:
// - busca perfil do usuário no Supabase
// - expõe estado para a View (HomeScreen)
// - provê ação de logout
//
// Observação: mantenha a lógica aqui (MVVM). A View apenas consome os estados/ações.

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';

export type Profile = {
  user_id: string;
  full_name?: string | null;
  birthdate?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  activity_level?: string | null;
  goal_weight?: number | null;
  created_at?: string | null;
};

export const useHomeViewModel = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Busca o usuário atual (auth) e carrega o profile associado
  async function loadProfile() {
    setLoading(true);
    setError(null);
    try {
      // Pega o usuário logado
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        setError('Usuário não autenticado');
        setProfile(null);
        return;
      }

      const userId = user.id;

      // Busca o profile em public.profiles (RLS vai garantir segurança)
      const { data, error: profileError } = await supabase
        .from<Profile>('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        // Se não existir profile, mantemos null (a app pode encaminhar para criação)
        if (profileError.code === 'PGRST116') {
          setProfile(null);
        } else {
          throw profileError;
        }
      } else {
        setProfile(data);
      }
    } catch (err: any) {
      setError(err.message ?? 'Erro ao carregar perfil');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  // Logout: desloga do Supabase e navega para Login
  async function logout() {
    setLoading(true);
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      // volta para tela de login
      navigation.navigate('Login');
    } catch (err: any) {
      setError(err.message ?? 'Erro ao deslogar');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // carregar profile ao montar o hook
    loadProfile();

    // opcional: subscrever mudanças de auth para recarregar profile quando necessário
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => {
      // cleanup da subscription
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    profile,
    loading,
    error,
    reload: loadProfile,
    logout,
  };
};
