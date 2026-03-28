export const Colors = {
  // Core palette — military authority + digital trust
  navy: '#0A1628',
  navyMid: '#112240',
  navyLight: '#1B3A5C',
  gold: '#C9A84C',
  goldBright: '#F0C040',
  goldDim: '#8A6F2E',
  crimson: '#C0392B',
  crimsonLight: '#E74C3C',
  teal: '#1ABC9C',
  tealDim: '#148F77',
  white: '#FFFFFF',
  offWhite: '#F0F4F8',
  gray100: '#E8EDF3',
  gray300: '#B0BEC5',
  gray500: '#78909C',
  gray700: '#455A64',
  dark: '#060F1E',
  success: '#27AE60',
  warning: '#F39C12',
  danger: '#C0392B',
  overlay: 'rgba(10, 22, 40, 0.85)',
};

export const Font = {
  display: 'Georgia', // Authoritative, institutional
  body: 'System',
  mono: 'Courier New',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 6,
  md: 12,
  lg: 20,
  full: 999,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
};
