// src/viewmodels/useProfileViewModel.ts
// ViewModel para a ProfileScreen.
// Responsável por: carregar o perfil do usuário, manter estados do formulário,
// validar e persistir (upsert) no Supabase, calcular TMB e sugerir meta calórica.
//
// Arquitetura MVVM: a View (ProfileScreen) consome este hook; toda lógica fica aqui.

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { subYears, differenceInYears } from 'date-fns';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';

export type ProfileForm = {
  full_name: string;
  gender: 'male' | 'female' | '' ;
  birthdate?: string | null; // ISO yyyy-mm-dd
  height_cm?: number | null;
  weight_kg?: number | null;
  activity_level?: ActivityLevel | '';
  goal_weight?: number | null;
  preferences?: Record<string, any> | null;
};

export const defaultForm: ProfileForm = {
  full_name: '',
  gender: '',
  birthdate: null,
  height_cm: null,
  weight_kg: null,
  activity_level: '',
  goal_weight: null,
  preferences: null,
};

/** Fatores de atividade usados para multiplicar a TMB */
const activityFactors: Record<ActivityLevel, number> = {
  sedentary: 1.2, // pouco ou nenhum exercício
  light: 1.375,   // exercício leve 1-3 dias/semana
  moderate: 1.55, // exercício moderado 3-5 dias/semana
  active: 1.725,  // exercício pesado 6-7 dias/semana
};

/** Calcula idade a partir da birthdate (formato ISO) */
function calculateAge(birthdate?: string | null): number | null {
  if (!birthdate) return null;
  try {
    const b = new Date(birthdate);
    return differenceInYears(new Date(), b);
  } catch {
    return null;
  }
}

/** Calcula TMB pela fórmula de Mifflin-St Jeor
 *  Homens: TMB = 10*peso + 6.25*altura - 5*idade + 5
 *  Mulheres: TMB = 10*peso + 6.25*altura - 5*idade - 161
 */
export function calculateTMB(weightKg?: number | null, heightCm?: number | null, age?: number | null, gender?: 'male' | 'female' | '' ): number | null {
  if (!weightKg || !heightCm || !age || !gender) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'male') return Math.round(base + 5);
  if (gender === 'female') return Math.round(base - 161);
  return null;
}

/** Sugere calorias diárias baseado em TMB e nível de atividade
 *  Aplica fator de atividade e subtrai um déficit padrão (500 kcal) para perda de peso.
 *  O déficit fica explícito e pode ser ajustado pela UI futuramente.
 */
export function suggestDailyCalories(tmb: number, activityLevel?: ActivityLevel | '') {
  const factor = activityLevel && activityLevel !== '' ? activityFactors[activityLevel as ActivityLevel] : activityFactors.sedentary;
  const maintenance = Math.round(tmb * factor);
  const suggestedDeficit = 500; // valor padrão (pode ser ajustado)
  return {
    maintenance,
    suggested: Math.max(1200, maintenance - suggestedDeficit), // não sugerir abaixo de 1200 kcal
    deficit: suggestedDeficit,
  };
}

export const useProfileViewModel = () => {
  const [form, setForm] = useState<ProfileForm>(defaultForm);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Estado calculado
  const age = calculateAge(form.birthdate ?? null);
  const tmb = calculateTMB(form.weight_kg ?? null, form.height_cm ?? null, age, form.gender as any);
  const suggestions = tmb ? suggestDailyCalories(tmb, (form.activity_level as ActivityLevel) ) : null;

  // Carrega profile do Supabase
  async function loadProfile() {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        setError('Usuário não autenticado');
        setForm(defaultForm);
        return;
      }
      const userId = user.id;

      const { data, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileErr) {
        // se não existir, mantemos o form default
        setForm(defaultForm);
      } else if (data) {
        // preenchos os campos existentes
        setForm({
          full_name: data.full_name ?? '',
          gender: data.gender ?? '',
          birthdate: data.birthdate ?? null,
          height_cm: data.height_cm ?? null,
          weight_kg: data.weight_kg ?? null,
          activity_level: data.activity_level ?? '',
          goal_weight: data.goal_weight ?? null,
          preferences: data.preferences ?? null,
        });
      }
    } catch (err: any) {
      setError(err.message ?? 'Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  }

  // Atualiza um campo do formulário
  function setField<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Validação simples antes do upsert
  function validate(): string | null {
    if (!form.full_name || form.full_name.trim().length < 2) return 'Informe seu nome completo.';
    if (!form.gender || (form.gender !== 'male' && form.gender !== 'female')) return 'Selecione o gênero.';
    if (!form.birthdate) return 'Informe a data de nascimento.';
    if (!form.height_cm || form.height_cm <= 0) return 'Informe a altura em cm.';
    if (!form.weight_kg || form.weight_kg <= 0) return 'Informe o peso atual em kg.';
    if (!form.activity_level) return 'Selecione o nível de atividade.';
    return null;
  }

  // Salva (upsert) o profile no Supabase
  async function saveProfile() {
    setSaving(true);
    setError(null);
    try {
      const validation = validate();
      if (validation) {
        setError(validation);
        setSaving(false);
        return false;
      }

      // obtém user id
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        setError('Usuário não autenticado');
        setSaving(false);
        return false;
      }
      const userId = user.id;

      // Faz upsert no perfil (insert ou update)
      const payload = {
        user_id: userId,
        full_name: form.full_name,
        gender: form.gender,
        birthdate: form.birthdate,
        height_cm: form.height_cm,
        weight_kg: form.weight_kg,
        activity_level: form.activity_level,
        goal_weight: form.goal_weight,
        preferences: form.preferences ?? null,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertErr } = await supabase.from('profiles').upsert(payload, { onConflict: 'user_id' });

      if (upsertErr) {
        setError(upsertErr.message ?? 'Erro ao salvar perfil');
        setSaving(false);
        return false;
      }

      // opcional: atualizar diaries/targets ou recalcular quotas aqui

      setSaving(false);
      return true;
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar perfil');
      setSaving(false);
      return false;
    }
  }

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    form,
    setField,
    loading,
    saving,
    error,
    saveProfile,
    reload: loadProfile,
    age,
    tmb,
    suggestions,
  };
};
