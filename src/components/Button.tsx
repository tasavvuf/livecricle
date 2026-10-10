import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, radii, spacing } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'cobalt' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'cobalt':
        return {
          backgroundColor: colors.accent,
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.border,
        };
      case 'ghost':
        return {
          backgroundColor: colors.surface,
          borderWidth: 0,
        };
      case 'danger':
        return {
          backgroundColor: colors.statusExitBg,
          borderWidth: 1,
          borderColor: colors.statusExit,
        };
      case 'primary':
      default:
        return {
          backgroundColor: colors.text,
          borderWidth: 0,
        };
    }
  };

  const getTextColor = (): string => {
    if (disabled) return colors.textSubtle;
    switch (variant) {
      case 'outline':
        return colors.text;
      case 'ghost':
        return colors.text;
      case 'danger':
        return colors.statusExit;
      case 'cobalt':
      case 'primary':
      default:
        return colors.white;
    }
  };

  const getSizePadding = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return { paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md };
      case 'lg':
        return { paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl };
      case 'md':
      default:
        return { paddingVertical: spacing.md, paddingHorizontal: spacing.lg };
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'sm':
        return 13;
      case 'lg':
        return 16;
      case 'md':
      default:
        return 14;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        getContainerStyle(),
        getSizePadding(),
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.text : colors.white}
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              { color: getTextColor(), fontSize: getFontSize() },
              icon ? { marginLeft: spacing.sm } : null,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  disabled: {
    opacity: 0.5,
  },
});
