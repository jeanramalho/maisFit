// Tokens de tema para o app +Fit (Energetic Teal).
// Use este arquivo em todo o app para garantir consistência visual.

export const FitTheme = {
  colors: {
    background: '#0B0F12',    // fundo principal (dark)
    surface: '#0F1417',       // cards / superfícies
    primary: '#00C2A8',       // cor principal - teal
    primaryStrong: '#00A88F', // variação para botões/hover
    secondary: '#FFD166',     // destaque secundário
    text: '#E6F1EF',          // texto principal
    textMuted: '#9AA5A1',     // texto secundário
    success: '#2ECC71',
    warning: '#FFB74D',
    danger: '#FF6B6B',
    border: '#162022',
  },
  spacing: {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32
  },
  radii: { sm: 6, md: 12, lg: 20 },
  // Sombras simples para Android/iOS – usar com moderação
  shadows: {
    card: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 2 },
    modal: { shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 16, elevation: 8 }
  },
} as const;

export type Theme = typeof FitTheme;
