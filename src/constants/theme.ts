export const COLORS = {
  // Brand Primary
  espresso: '#2C1B12', // Explicit espresso requested
  ink: '#3A2B27', // v2 ink
  cream: '#FFFBF8', // v2 cream
  surface: '#FFFFFF', // v2 surface
  
  // Accents
  rose: '#C2456A', // v2 primary
  roseDeep: '#C2456A', // v2 primary
  roseBlush: '#E8839E', // v2 primary-light
  roseBlushSoft: '#FBE4EA', // v2 primary-bg

  // Neutrals / Stone
  stone100: '#FFFBF8', // using cream
  stone200: '#F0DCE2', // v2 border
  stone300: '#E8839E', // primary-light
  stone400: '#826F69', // v2 ink-soft
  stone600: '#826F69', // v2 ink-soft

  // Utility / Status
  sage: '#4F9A5C', // v2 success
  sageBg: '#E2F2E4', // v2 success-bg
  caramel: '#E08A4F', // v2 accent
  caramelBg: '#FCE5D2', // v2 accent-bg
  brick: '#D6485E', // v2 error
  brickBg: '#FBE5E9', // v2 error-bg

  // Semantic
  primary: '#C2456A', // v2 primary

  // Defaults for text
  text: '#3A2B27', // ink
  textLight: '#826F69', // ink-soft
  border: '#F0DCE2', // border
  background: '#FFFBF8', // cream
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const TYPOGRAPHY = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  fonts: {
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semibold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
  }
};
