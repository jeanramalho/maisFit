// src/views/ProfileScreen.tsx
// View para edição/criação do perfil do usuário.
// Usa useProfileViewModel para separar lógica (MVVM).
// Contém inputs para nome, gênero, data de nascimento, altura, peso, nível de atividade e meta.
// Exibe TMB calculada e sugestão de calorias.

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import { FitTheme } from "../theme/FitTheme";
import {
  useProfileViewModel,
  ActivityLevel,
} from "../viewmodels/useProfileViewModel";
import { AppHeader } from "../components/AppHeader";
import DateTimePicker from "@react-native-community/datetimepicker"; // npx expo install @react-native-community/datetimepicker

// Atenção: se estiver usando Expo Managed, instale a lib acima via expo install.
// Alternativa: use um componente de data customizado.

export const ProfileScreen: React.FC = () => {
  const {
    form,
    setField,
    loading,
    saving,
    error,
    saveProfile,
    age,
    tmb,
    suggestions,
  } = useProfileViewModel();

  // local state para datepicker (controlado)
  const [showDatePicker, setShowDatePicker] = React.useState(false);

  function onChangeDate(event: any, selectedDate?: Date) {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      // converte para string yyyy-mm-dd
      const iso = selectedDate.toISOString().slice(0, 10);
      setField("birthdate", iso);
    }
  }

  async function handleSave() {
    const ok = await saveProfile();
    if (ok) {
      Alert.alert("Perfil salvo", "Seu perfil foi atualizado com sucesso.");
    } else {
      // error exibido pela ViewModel; se necessário mostramos alerta
      if (error) Alert.alert("Erro", error);
    }
  }

  return (
    <View style={styles.container}>
      <AppHeader title="+Fit" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Meu Perfil</Text>

        <Text style={styles.label}>Nome completo</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: João da Silva"
          placeholderTextColor={FitTheme.colors.textMuted}
          value={form.full_name}
          onChangeText={(v) => setField("full_name", v)}
        />

        <Text style={styles.label}>Gênero</Text>
        <View style={styles.row}>
          <PrimaryButton
            title="Masculino"
            onPress={() => setField("gender", "male")}
            style={[
              styles.genderBtn,
              form.gender === "male" && styles.genderActive,
            ]}
          />
          <View style={{ width: 8 }} />
          <PrimaryButton
            title="Feminino"
            onPress={() => setField("gender", "female")}
            style={[
              styles.genderBtn,
              form.gender === "female" && styles.genderActive,
            ]}
          />
        </View>

        <Text style={styles.label}>Data de nascimento</Text>
        <PrimaryButton
          title={form.birthdate ?? "Selecionar data"}
          onPress={() => setShowDatePicker(true)}
          style={styles.dateBtn}
        />
        {showDatePicker && (
          <DateTimePicker
            value={
              form.birthdate
                ? new Date(form.birthdate)
                : new Date(new Date().getFullYear() - 25, 0, 1)
            }
            mode="date"
            display="spinner"
            maximumDate={new Date()}
            onChange={onChangeDate}
          />
        )}

        <Text style={styles.label}>Altura (cm)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 175"
          placeholderTextColor={FitTheme.colors.textMuted}
          keyboardType="numeric"
          value={form.height_cm ? String(form.height_cm) : ""}
          onChangeText={(v) => setField("height_cm", v ? Number(v) : null)}
        />

        <Text style={styles.label}>Peso (kg)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 82"
          placeholderTextColor={FitTheme.colors.textMuted}
          keyboardType="numeric"
          value={form.weight_kg ? String(form.weight_kg) : ""}
          onChangeText={(v) => setField("weight_kg", v ? Number(v) : null)}
        />

        <Text style={styles.label}>Nível de atividade</Text>
        <View style={styles.rowWrap}>
          {(
            [
              { key: "sedentary", label: "Sedentário" },
              { key: "light", label: "Leve" },
              { key: "moderate", label: "Moderado" },
              { key: "active", label: "Ativo" },
            ] as { key: ActivityLevel; label: string }[]
          ).map((it) => (
            <PrimaryButton
              key={it.key}
              title={it.label}
              onPress={() => setField("activity_level", it.key)}
              style={[
                styles.activityBtn,
                form.activity_level === it.key && styles.activityActive,
              ]}
            />
          ))}
        </View>

        <Text style={styles.label}>Meta de peso (kg)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 75"
          placeholderTextColor={FitTheme.colors.textMuted}
          keyboardType="numeric"
          value={form.goal_weight ? String(form.goal_weight) : ""}
          onChangeText={(v) => setField("goal_weight", v ? Number(v) : null)}
        />

        <View style={{ height: 12 }} />

        {/* Exibe cálculos */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cálculos</Text>
          <Text style={styles.cardText}>Idade: {age ?? "—"}</Text>
          <Text style={styles.cardText}>TMB: {tmb ?? "—"} kcal/dia</Text>
          {suggestions && (
            <>
              <Text style={styles.cardText}>
                Manutenção estimada: {suggestions.maintenance} kcal/dia
              </Text>
              <Text style={styles.cardText}>
                Sugestão (com déficit {suggestions.deficit} kcal):{" "}
                {suggestions.suggested} kcal/dia
              </Text>
            </>
          )}
        </View>

        <View style={{ height: 16 }} />
        <PrimaryButton
          title={saving ? "Salvando..." : "Salvar perfil"}
          onPress={handleSave}
          disabled={saving}
        />

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FitTheme.colors.background },
  content: { padding: FitTheme.spacing.md, paddingBottom: 64 },
  title: {
    color: FitTheme.colors.text,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  label: { color: FitTheme.colors.textMuted, marginTop: 12, marginBottom: 8 },
  input: {
    backgroundColor: FitTheme.colors.surface,
    color: FitTheme.colors.text,
    padding: 12,
    borderRadius: FitTheme.radii.sm,
  },
  row: { flexDirection: "row", alignItems: "center" },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  genderBtn: { paddingHorizontal: 12, paddingVertical: 8, minWidth: 120 },
  genderActive: { borderWidth: 2, borderColor: FitTheme.colors.primaryStrong },
  activityBtn: { marginRight: 8, marginBottom: 8, paddingHorizontal: 12 },
  activityActive: {
    borderWidth: 2,
    borderColor: FitTheme.colors.primaryStrong,
  },
  dateBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  card: {
    backgroundColor: FitTheme.colors.surface,
    padding: FitTheme.spacing.md,
    borderRadius: FitTheme.radii.md,
  },
  cardTitle: {
    color: FitTheme.colors.text,
    fontWeight: "700",
    marginBottom: 8,
  },
  cardText: { color: FitTheme.colors.textMuted, marginBottom: 4 },
});
