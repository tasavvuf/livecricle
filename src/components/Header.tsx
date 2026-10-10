import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface HeaderProps {
  overline?: string;
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  onBack?: () => void;
  style?: ViewStyle;
}

export const Header: React.FC<HeaderProps> = ({
  overline,
  title,
  subtitle,
  rightAction,
  onBack,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.contentRow}>
        <View style={styles.titleContainer}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          )}
          {overline && <Text style={styles.overline}>{overline}</Text>}
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
  },
  backButton: {
    marginBottom: spacing.xs,
  },
  backText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  overline: {
    ...typography.overline,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.titleHero,
  },
  subtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.textMuted,
  },
  rightAction: {
    marginLeft: spacing.md,
    alignSelf: 'center',
  },
});
