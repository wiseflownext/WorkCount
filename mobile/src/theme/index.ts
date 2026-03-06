import { MD3LightTheme } from 'react-native-paper';

export const Colors = {
  primary: '#1976D2',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  background: '#F5F5F5',
  card: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  border: '#E0E0E0',
  disabled: '#BDBDBD',
};

export const FontSize = {
  amount: 28,
  title: 24,
  header: 22,
  body: 18,
  button: 20,
  caption: 14,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    error: Colors.error,
    background: Colors.background,
    surface: Colors.card,
  },
};
