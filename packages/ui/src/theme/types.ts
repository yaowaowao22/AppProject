export interface ColorTokens {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  secondaryDark: string;
  accent: string;
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  border: string;
  divider: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

export interface TypographyTokens {
  fontFamily: {
    regular: string;
    medium: string;
    bold: string;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    hero: number;
  };
}

export interface SpacingTokens {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface RadiusTokens {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  full: number;
}

export interface ShadowValue {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface ShadowTokens {
  none: ShadowValue;
  sm: ShadowValue;
  md: ShadowValue;
  lg: ShadowValue;
}

export interface ButtonOverrides {
  borderRadius?: number;
  paddingVertical?: number;
  paddingHorizontal?: number;
}

export interface CardOverrides {
  borderRadius?: number;
  borderWidth?: number;
}

export interface InputOverrides {
  borderRadius?: number;
  borderWidth?: number;
  height?: number;
}

export interface HeaderOverrides {
  height?: number;
  borderBottomWidth?: number;
}

export interface TabBarOverrides {
  height?: number;
  borderTopWidth?: number;
  showLabel?: boolean;
}

export interface ComponentOverrides {
  button?: ButtonOverrides;
  card?: CardOverrides;
  input?: InputOverrides;
  header?: HeaderOverrides;
  tabBar?: TabBarOverrides;
}

export interface ThemeConfig {
  name: string;
  colors: {
    light: ColorTokens;
    dark: ColorTokens;
  };
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radius: RadiusTokens;
  shadows: ShadowTokens;
  overrides?: ComponentOverrides;
}
