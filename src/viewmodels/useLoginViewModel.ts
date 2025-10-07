// ViewModel para Login — responsável por interagir com o serviço (Supabase).
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

/**
 * useLoginViewModel
 * - Guarda estado local do formulário
 * - Executa chamadas de autenticação no supabase
 * - Navega para Home em caso de sucesso
 *
 * MVVM: View (LoginScreen) consome esse hook; aqui fica a lógica.
 */
export const useLoginViewModel = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  async function login() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // login bem-sucedido
      navigation.navigate('Home');
    } catch (err: any) {
      setError(err.message ?? 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  }

  async function signup() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      // após cadastro podemos navegar ou solicitar confirmação de email
      navigation.navigate('Home');
    } catch (err: any) {
      setError(err.message ?? 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    login,
    signup,
  };
};
