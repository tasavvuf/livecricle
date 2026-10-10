import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

interface BadgeProps {
  label: string;
  variant?: 'cobalt' | 'navy' | 'green' | 'terracotta' | 'muted';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'cobalt', style }) => {
  const getBadgeStyles = () => {
    switch (variant) {
      case 'green':
        return {
          bg: colors.statusEnterBg,
          text: colors.statusEnter,
          border: 'transparent',
        };
      case 'terracotta':
        return {
          bg: colors.statusExitBg,
          text: colors.statusExit,
          border: 'transparent',
        };
      case 'navy':
        return {
          bg: colors.text,
          text: colors.white,
          border: 'transparent',
        };
      case 'muted':
        return {
          bg: colors.surface,
          text: colors.textMuted,
          border: colors.border,
        };
      case 'cobalt':
      default:
        return {
          bg: '#EDF1FD',
          text: colors.accent,
          border: 'transparent',
        };
    }
  };

  const theme = getBadgeStyles();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: theme.bg,
          borderColor: theme.border,
          borderWidth: theme.border !== 'transparent' ? 1 : 0,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: theme.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.overline,
    fontSize: 10,
    letterSpacing: 0.8,
  },
});
