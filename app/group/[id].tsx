import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../src/theme';
import { useGroupStore } from '../../src/store/groupStore';
import { useLocationStore } from '../../src/store/locationStore';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';
import { GeofenceModal } from '../../src/components/GeofenceModal';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const { activeGroup, selectGroup, deleteGeofence, createGeofence, isLoading } = useGroupStore();
  const currentLocation = useLocationStore((s) => s.currentLocation);

  const [geofenceModalVisible, setGeofenceModalVisible] = useState(false);

  useEffect(() => {
    if (id) {
      selectGroup(id);
    }
  }, [id]);

  const handleShareInviteCode = async () => {
    if (!activeGroup) return;
    try {
      await Share.share({
        message: `Join my private circle "${activeGroup.name}" on LiveCircle! Use invite code: ${activeGroup.inviteCode}`,
      });
    } catch (err: any) {
      Alert.alert('Share', `Invite code is: ${activeGroup.inviteCode}`);
    }
  };

  const handleDeleteGeofence = (geofenceId: string, name: string) => {
    Alert.alert(
      'Remove Geofence',
      `Are you sure you want to remove the perimeter alert zone "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGeofence(geofenceId);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete geofence');
            }
          },
        },
      ]
    );
  };

  const handleCreateGeofence = async (data: {
    name: string;
    lat: number;
    lng: number;
    radiusM: number;
  }) => {
    await createGeofence(data);
    Alert.alert('Geofence Created', `Zone "${data.name}" is now monitoring group members.`);
  };

  const members = activeGroup?.members || [];
  const geofences = activeGroup?.geofences || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Navigation Bar */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backRow}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text} />
          <Text style={styles.backText}>All Circles</Text>
        </TouchableOpacity>

        {/* Editorial Screen Title */}
        <View style={styles.header}>
          <Text style={styles.overline}>CIRCLE OVERVIEW</Text>
          <Text style={styles.title}>{activeGroup?.name || 'Loading Circle...'}</Text>
          <Text style={styles.subtitle}>
            Members share real-time location. Perimeter alerts trigger push notifications on enter
            and exit.
          </Text>
        </View>

        {/* 6-Character Invite Code Editorial Banner */}
        {activeGroup && (
          <View style={styles.inviteCard}>
            <View style={styles.inviteHeader}>
              <View>
                <Text style={styles.inviteOverline}>PRIVATE ACCESS</Text>
                <Text style={styles.inviteTitle}>6-Character Invite Code</Text>
              </View>
              <Button
                title="Share"
                variant="primary"
                size="sm"
                onPress={handleShareInviteCode}
                icon={<Ionicons name="share-outline" size={14} color={colors.white} />}
              />
            </View>

            <View style={styles.codeContainer}>
              <Text style={styles.codeLetters}>{activeGroup.inviteCode}</Text>
            </View>

            <Text style={styles.inviteInstructions}>
              Any user with this code can join this private group from their Circles tab.
            </Text>
          </View>
        )}

        {/* Members Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>MEMBERS ({members.length})</Text>
            <Button
              title="View on Map"
              variant="outline"
              size="sm"
              onPress={() => router.push('/(tabs)/map')}
            />
          </View>

          <View style={styles.listCard}>
            {members.map((m, index) => {
              const isSelf = user?.id === m.id;
              const hasReported = Boolean(m.state?.lastLat);
              const insideZones = m.state?.insideGeofences || [];

              return (
                <View
                  key={m.id}
                  style={[
                    styles.memberRow,
                    index === members.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {m.name.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.memberDetails}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName}>
                        {m.name} {isSelf && '(You)'}
                      </Text>
                      {hasReported ? (
                        <Badge label="ONLINE" variant="green" />
                      ) : (
                        <Badge label="STANDBY" variant="muted" />
                      )}
                    </View>

                    <Text style={styles.memberEmail}>{m.email}</Text>

                    {insideZones.length > 0 && (
                      <View style={styles.insideRow}>
                        <Ionicons name="location-sharp" size={12} color={colors.accent} />
                        <Text style={styles.insideText}>
                          Inside: {insideZones.map((z) => z.name).join(', ')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Geofences Alert Zones Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>GEOFENCE ZONES ({geofences.length})</Text>
            <Button
              title="Add Zone"
              variant="cobalt"
              size="sm"
              onPress={() => setGeofenceModalVisible(true)}
              icon={<Ionicons name="add" size={14} color={colors.white} />}
            />
          </View>

          {geofences.length === 0 ? (
            <View style={styles.emptyGeofenceCard}>
              <Ionicons name="disc-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyGeofenceTitle}>No Alert Zones Configured</Text>
              <Text style={styles.emptyGeofenceDesc}>
                Set up perimeters like "Home" or "Campus". Circle members receive immediate push
                notifications when anyone enters or leaves.
              </Text>
              <Button
                title="Create First Geofence"
                variant="outline"
                size="sm"
                onPress={() => setGeofenceModalVisible(true)}
                style={{ marginTop: spacing.md }}
              />
            </View>
          ) : (
            <View style={styles.listCard}>
              {geofences.map((gf, index) => (
                <View
                  key={gf._id}
                  style={[
                    styles.geofenceRow,
                    index === geofences.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={styles.geofenceIconBox}>
                    <Ionicons name="radio" size={20} color={colors.accent} />
                  </View>

                  <View style={styles.geofenceInfo}>
                    <Text style={styles.geofenceName}>{gf.name}</Text>
                    <Text style={styles.geofenceDetails}>
                      Radius: {gf.radiusM}m • Center: {gf.lat.toFixed(4)}, {gf.lng.toFixed(4)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDeleteGeofence(gf._id, gf.name)}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.statusExit} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Geofence Modal */}
      <GeofenceModal
        visible={geofenceModalVisible}
        latitude={currentLocation?.lat || 37.7749}
        longitude={currentLocation?.lng || -122.4194}
        onClose={() => setGeofenceModalVisible(false)}
        onSave={handleCreateGeofence}
      />
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  header: {
    marginBottom: spacing.xl,
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
  inviteCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
  },
  inviteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  inviteOverline: {
    ...typography.overline,
    fontSize: 9,
    color: colors.accent,
  },
  inviteTitle: {
    ...typography.titleCard,
    fontSize: 16,
  },
  codeContainer: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.xs,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  codeLetters: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 6,
    color: colors.text,
  },
  inviteInstructions: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionHeading: {
    ...typography.overline,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  memberDetails: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberName: {
    ...typography.titleCard,
    fontSize: 14,
  },
  memberEmail: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
  },
  insideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  insideText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.accent,
    marginLeft: 4,
  },
  emptyGeofenceCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyGeofenceTitle: {
    ...typography.titleCard,
    fontSize: 16,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  emptyGeofenceDesc: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  geofenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  geofenceIconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.xs,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  geofenceInfo: {
    flex: 1,
  },
  geofenceName: {
    ...typography.titleCard,
    fontSize: 15,
  },
  geofenceDetails: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  deleteBtn: {
    padding: spacing.sm,
  },
});
