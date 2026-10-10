import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  Alert,
  Modal,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../src/theme';
import { useAuthStore } from '../../src/store/authStore';
import { useLocationStore } from '../../src/store/locationStore';
import { getBaseUrl, setBaseUrl, resetBaseUrl, DEFAULT_HOST } from '../../src/api/client';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { Badge } from '../../src/components/Badge';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isSharingLocation, setSharingLocation } = useLocationStore();

  const [currentServerUrl, setCurrentServerUrl] = useState('');
  const [editingUrl, setEditingUrl] = useState('');
  const [urlModalVisible, setUrlModalVisible] = useState(false);

  useEffect(() => {
    getBaseUrl().then((url) => {
      setCurrentServerUrl(url);
      setEditingUrl(url);
    });
  }, []);

  const handleToggleSharing = (val: boolean) => {
    setSharingLocation(val);
    if (!val) {
      Alert.alert(
        'Location Sharing Paused',
        'Your coordinates will no longer be broadcast to any circle. Background tracking is deactivated.'
      );
    }
  };

  const handleSaveServerUrl = async () => {
    if (!editingUrl.trim()) return;
    await setBaseUrl(editingUrl.trim());
    setCurrentServerUrl(editingUrl.trim());
    setUrlModalVisible(false);
    Alert.alert('Server Updated', `API endpoint set to: ${editingUrl.trim()}`);
  };

  const handleResetServerUrl = async () => {
    const defaultUrl = await resetBaseUrl();
    setCurrentServerUrl(defaultUrl);
    setEditingUrl(defaultUrl);
    setUrlModalVisible(false);
    Alert.alert('Reset to Default', `API endpoint reset to: ${defaultUrl}`);
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of LiveCircle?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Editorial Header */}
        <View style={styles.header}>
          <Text style={styles.overline}>PREFERENCES</Text>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>
            Control your privacy, location broadcast status, and network configurations.
          </Text>
        </View>

        {/* Master Sharing Toggle Card */}
        <View style={styles.masterCard}>
          <View style={styles.masterHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.masterOverline}>MASTER BROADCAST</Text>
              <Text style={styles.masterTitle}>Live Location Sharing</Text>
            </View>
            <Switch
              value={isSharingLocation}
              onValueChange={handleToggleSharing}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.white}
            />
          </View>

          <Text style={styles.masterDesc}>
            {isSharingLocation
              ? 'Your coordinates are currently being broadcast to active circle members when moved more than 20 meters or every 10 seconds.'
              : 'Broadcasting is stopped. No background or foreground location updates are transmitted.'}
          </Text>

          <View style={styles.statusIndicatorRow}>
            <Badge
              label={isSharingLocation ? 'STATUS: BROADCASTING' : 'STATUS: PAUSED'}
              variant={isSharingLocation ? 'green' : 'terracotta'}
            />
          </View>
        </View>

        {/* User Identity Card */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>IDENTITY</Text>
          <View style={styles.card}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>NAME</Text>
              <Text style={styles.fieldValue}>{user?.name || 'Anonymous'}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>EMAIL</Text>
              <Text style={styles.fieldValue}>{user?.email || 'N/A'}</Text>
            </View>
            <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.fieldLabel}>PUSH NOTIFICATIONS</Text>
              <Badge
                label={user?.expoPushToken ? 'REGISTERED' : 'UNAVAILABLE'}
                variant={user?.expoPushToken ? 'green' : 'muted'}
              />
            </View>
          </View>
        </View>

        {/* Network & Backend Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>SERVER CONNECTION</Text>
          <View style={styles.card}>
            <View style={styles.fieldRow}>
              <View style={{ flex: 1, marginRight: spacing.md }}>
                <Text style={styles.fieldLabel}>API ENDPOINT</Text>
                <Text style={styles.fieldValue} numberOfLines={1}>
                  {currentServerUrl}
                </Text>
              </View>
              <Button
                title="Change"
                variant="outline"
                size="sm"
                onPress={() => setUrlModalVisible(true)}
              />
            </View>
          </View>
        </View>

        {/* Privacy Note */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>PRIVACY & EXPIRY ARCHITECTURE</Text>
          <View style={styles.cardMuted}>
            <View style={styles.privacyPoint}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.accent} />
              <Text style={styles.privacyText}>
                <Text style={{ fontWeight: '700' }}>24-Hour TTL Expiry:</Text> All stored location
                pings are automatically pruned after 24 hours by MongoDB index.
              </Text>
            </View>
            <View style={[styles.privacyPoint, { marginTop: spacing.md }]}>
              <Ionicons name="radio-outline" size={18} color={colors.accent} />
              <Text style={styles.privacyText}>
                <Text style={{ fontWeight: '700' }}>Jitter-Filtered Geofencing:</Text> Perimeter
                enter/exit events require 2 consecutive confirmed readings to prevent GPS jitter alerts.
              </Text>
            </View>
          </View>
        </View>

        {/* Logout Action */}
        <View style={styles.logoutSection}>
          <Button
            title="Log Out"
            variant="danger"
            onPress={handleLogout}
            icon={<Ionicons name="log-out-outline" size={18} color={colors.statusExit} />}
          />
        </View>
      </ScrollView>

      {/* Edit Server URL Modal */}
      <Modal
        visible={urlModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUrlModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.overline}>SERVER HOST</Text>
            <Text style={styles.modalTitle}>Set Backend Endpoint</Text>
            <Text style={styles.modalSubtitle}>
              Specify localhost, your LAN IP (e.g. http://192.168.1.50:4000), or your deployed Render URL.
            </Text>

            <Input
              label="BASE URL"
              value={editingUrl}
              onChangeText={setEditingUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="https://livecricle.onrender.com"
            />

            <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
              <View style={styles.modalBtnRow}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setUrlModalVisible(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Save Endpoint"
                  variant="primary"
                  onPress={handleSaveServerUrl}
                  style={{ flex: 1 }}
                />
              </View>
              <Button
                title="Reset to Default (Render)"
                variant="ghost"
                onPress={handleResetServerUrl}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingTop: (Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 20) + spacing.xl,
    paddingBottom: spacing.huge,
  },
  header: {
    marginBottom: spacing.xxl,
  },
  overline: {
    ...typography.overline,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.titleHero,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
  masterCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
  },
  masterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  masterOverline: {
    ...typography.overline,
    fontSize: 9,
    color: colors.accent,
  },
  masterTitle: {
    ...typography.titleSection,
    fontSize: 18,
  },
  masterDesc: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeading: {
    ...typography.overline,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fieldLabel: {
    ...typography.overline,
    fontSize: 10,
    color: colors.textMuted,
  },
  fieldValue: {
    ...typography.bodyMedium,
    fontSize: 14,
    color: colors.text,
  },
  cardMuted: {
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  privacyPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  privacyText: {
    ...typography.caption,
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.text,
    lineHeight: 18,
  },
  logoutSection: {
    marginTop: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 36, 61, 0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalBox: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    ...typography.titleSection,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
