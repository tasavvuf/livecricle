/**
 * LiveCircle Design System
 * Based on "Warm Editorial Minimalism" guidelines
 */

export const colors = {
  // Core Editorial Palette
  background: '#FAF8F1', // Primary background: warm ivory
  surface: '#F5F1E8', // Secondary background: soft cream
  surfaceMuted: '#EEE9DE', // Card / active pill background
  text: '#17243D', // Primary text: deep navy
  textMuted: '#77766F', // Muted text: warm gray
  textSubtle: '#9E9D95', // Placeholder / secondary caption
  accent: '#3158D8', // Accent blue: vivid cobalt
  accentSecondary: '#6479E8', // Secondary blue: soft periwinkle
  border: '#E6E0D5', // Borders and dividers: subtle warm beige
  borderStrong: '#D5CDC0', // Emphasized borders
  white: '#FFFFFF', // Pure white, used selectively

  // Semantic Status Accents
  statusEnter: '#2E7D52', // Deep green for geofence entry
  statusEnterBg: '#EAF5EE',
  statusExit: '#C85A3F', // Terracotta for geofence exit
  statusExitBg: '#FAECE9',
  activeOnline: '#2E7D52',
  inactiveOffline: '#A3A099',

  // Named Colors
  cobalt: '#3158D8',
  navy: '#17243D',

  // Geofence Map Render Overlays
  geofenceFill: 'rgba(49, 88, 216, 0.12)',
  geofenceStroke: '#3158D8',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  pill: 9999,
};

export const typography = {
  titleHero: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.text,
    letterSpacing: -0.6,
    lineHeight: 38,
  },
  titleSection: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  titleCard: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.text,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: colors.text,
    lineHeight: 22,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.text,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: colors.textMuted,
    lineHeight: 18,
  },
  overline: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  handwrittenAccent: {
    fontSize: 14,
    fontStyle: 'italic' as const,
    color: colors.accent,
    letterSpacing: 0.2,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
};

/**
 * Editorial Map Style matching Warm Ivory & Deep Navy
 */
export const warmEditorialMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#FAF8F1' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#17243D' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#FAF8F1' }, { weight: 3 }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#17243D' }],
  },
  {
    featureType: 'poi',
    stylers: [{ visibility: 'simplified' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#F2EDE2' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#77766F' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#E8EFE5' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#FFFFFF' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#E6E0D5' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#F0EADF' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#DCD4C4' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#EBE5D8' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#DEE7F0' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6479E8' }],
  },
];
