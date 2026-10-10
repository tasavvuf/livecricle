import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar as RNStatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { colors, radii, spacing, typography } from '../../src/theme';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';

export default function LoginScreen() {
  const router = useRouter();
  const { login, register, isLoading } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMessage(null);
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }

    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
      }
      router.replace('/(tabs)/map');
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header & Editorial Branding */}
          <View style={styles.headerContainer}>
            <View style={styles.brandRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.overline}>LIVECIRCLE PROTOCOL</Text>
            </View>
            <Text style={styles.title}>
              {mode === 'login' ? 'Welcome back to your circle.' : 'Start your private circle.'}
            </Text>
            <Text style={styles.description}>
              {mode === 'login'
                ? 'Sign in to access your groups, live member locations, and geofence alerts.'
                : 'Create an account to track family, friends, or road trips in real time.'}
            </Text>
          </View>

          {/* Segmented Mode Picker */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              onPress={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              style={[styles.tabItem, mode === 'login' && styles.tabItemActive]}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                SIGN IN
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              style={[styles.tabItem, mode === 'register' && styles.tabItemActive]}
            >
              <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
                CREATE ACCOUNT
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Form Fields */}
          <View style={styles.formCard}>
            {mode === 'register' && (
              <Input
                label="FULL NAME"
                placeholder="Jane Doe"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            )}

            <Input
              label="EMAIL ADDRESS"
              placeholder="you@domain.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label="PASSWORD"
              placeholder="At least 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Button
              title={mode === 'login' ? 'Sign In' : 'Create Account'}
              variant="primary"
              size="lg"
              loading={isLoading}
              onPress={handleSubmit}
              style={styles.submitBtn}
            />
          </View>

          {/* Privacy Note Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerNote}>
              Opt-in privacy: Location is only shared when enabled. All coordinates auto-expire
              within 24 hours.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingTop: (Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 20) + spacing.xxl,
    paddingBottom: spacing.huge,
  },
  headerContainer: {
    marginBottom: spacing.xxl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginRight: spacing.xs + 2,
  },
  overline: {
    ...typography.overline,
    color: colors.accent,
  },
  title: {
    ...typography.titleHero,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textMuted,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  tabItem: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderRadius: radii.xs,
  },
  tabItemActive: {
    backgroundColor: colors.white,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    ...typography.overline,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.text,
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: colors.statusExitBg,
    borderColor: colors.statusExit,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.caption,
    color: colors.statusExit,
    fontWeight: '600',
  },
  formCard: {
    marginBottom: spacing.xl,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  footer: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerNote: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
