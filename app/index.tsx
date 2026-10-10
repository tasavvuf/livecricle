import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { colors, spacing, typography } from '../src/theme';

export default function IndexScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)/map');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [isLoading, isAuthenticated]);

  return (
    <View style={styles.container}>
      <View style={styles.brandContainer}>
        <View style={styles.circleGraphic}>
          <View style={styles.innerDot} />
        </View>
        <Text style={styles.overline}>REAL-TIME CIRCLE</Text>
        <Text style={styles.title}>LiveCircle</Text>
        <Text style={styles.subtitle}>Warm Editorial Group Location</Text>
      </View>
      <ActivityIndicator size="small" color={colors.accent} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  brandContainer: {
    alignItems: 'center',
  },
  circleGraphic: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  innerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.text,
  },
  overline: {
    ...typography.overline,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.titleHero,
    fontSize: 36,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  loader: {
    marginTop: spacing.xxxl,
  },
});
