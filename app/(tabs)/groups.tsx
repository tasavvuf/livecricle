import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar as RNStatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../src/theme';
import { useGroupStore, GroupSummary } from '../../src/store/groupStore';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { Badge } from '../../src/components/Badge';

export default function GroupsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const {
    groups,
    activeGroupId,
    isLoading,
    fetchGroups,
    selectGroup,
    createGroup,
    joinGroup,
  } = useGroupStore();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreate = async () => {
    if (!newGroupName.trim()) {
      setModalError('Please enter a circle name');
      return;
    }
    try {
      setModalLoading(true);
      setModalError(null);
      await createGroup(newGroupName.trim());
      setNewGroupName('');
      setCreateModalVisible(false);
      Alert.alert('Circle Created', 'Your private circle is ready. Share the 6-character code with your members!');
    } catch (err: any) {
      setModalError(err.message || 'Failed to create circle');
    } finally {
      setModalLoading(false);
    }
  };

  const handleJoin = async () => {
    if (joinCode.trim().length !== 6) {
      setModalError('Invite code must be exactly 6 characters');
      return;
    }
    try {
      setModalLoading(true);
      setModalError(null);
      await joinGroup(joinCode.trim().toUpperCase());
      setJoinCode('');
      setJoinModalVisible(false);
      Alert.alert('Joined Circle', 'You have joined the circle! Opening live map.');
      router.push('/(tabs)/map');
    } catch (err: any) {
      setModalError(err.message || 'Invalid or expired invite code');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Editorial Screen Header */}
        <View style={styles.header}>
          <Text style={styles.overline}>DIRECTORY</Text>
          <Text style={styles.title}>Private Circles</Text>
          <Text style={styles.subtitle}>
            Select an active circle for live map tracking, or create a new group with a unique invite code.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <Button
            title="Create Circle"
            variant="cobalt"
            onPress={() => {
              setModalError(null);
              setCreateModalVisible(true);
            }}
            style={styles.actionBtn}
            icon={<Ionicons name="add" size={16} color={colors.white} />}
          />
          <Button
            title="Join with Code"
            variant="outline"
            onPress={() => {
              setModalError(null);
              setJoinModalVisible(true);
            }}
            style={styles.actionBtn}
            icon={<Ionicons name="key-outline" size={16} color={colors.text} />}
          />
        </View>

        {/* Groups List */}
        <View style={styles.listSection}>
          <Text style={styles.sectionHeading}>
            YOUR ACTIVE CIRCLES ({groups.length})
          </Text>

          {groups.length === 0 && !isLoading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="people-outline" size={28} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No Circles Yet</Text>
              <Text style={styles.emptyDesc}>
                Create your first circle or enter a 6-character invite code from a friend to start sharing live locations.
              </Text>
            </View>
          ) : (
            groups.map((group) => {
              const isActive = activeGroupId === group._id;
              const isOwner = group.ownerId?._id === user?.id || group.ownerId === user?.id;

              return (
                <View
                  key={group._id}
                  style={[styles.card, isActive && styles.cardActive]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Text style={styles.cardTitle}>{group.name}</Text>
                      <View style={styles.cardMetaRow}>
                        <Text style={styles.cardMetaText}>
                          {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                        </Text>
                        {isOwner && (
                          <Badge label="OWNER" variant="muted" style={{ marginLeft: spacing.sm }} />
                        )}
                        {isActive && (
                          <Badge label="ACTIVE" variant="green" style={{ marginLeft: spacing.sm }} />
                        )}
                      </View>
                    </View>

                    <View style={styles.codePill}>
                      <Text style={styles.codeOverline}>CODE</Text>
                      <Text style={styles.codeText}>{group.inviteCode}</Text>
                    </View>
                  </View>

                  <View style={styles.cardActionsRow}>
                    <Button
                      title={isActive ? 'Viewing on Map' : 'Set as Active'}
                      variant={isActive ? 'ghost' : 'outline'}
                      size="sm"
                      onPress={async () => {
                        await selectGroup(group._id);
                        router.push('/(tabs)/map');
                      }}
                      style={{ flex: 1, marginRight: spacing.sm }}
                    />

                    <Button
                      title="Manage"
                      variant="primary"
                      size="sm"
                      onPress={() => router.push(`/group/${group._id}`)}
                      style={{ flex: 0.8 }}
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Create Group Modal */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBox}>
            <Text style={styles.overline}>NEW CIRCLE</Text>
            <Text style={styles.modalTitle}>Create Private Group</Text>
            <Text style={styles.modalSubtitle}>
              You will receive a unique 6-character invite code to share with your members.
            </Text>

            <Input
              label="CIRCLE NAME"
              placeholder="e.g. Family, Road Trip 2026, Campers"
              value={newGroupName}
              onChangeText={setNewGroupName}
              error={modalError || undefined}
            />

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setCreateModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Create"
                variant="cobalt"
                loading={modalLoading}
                onPress={handleCreate}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Join Group Modal */}
      <Modal
        visible={joinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBox}>
            <Text style={styles.overline}>JOIN EXISTING</Text>
            <Text style={styles.modalTitle}>Enter Invite Code</Text>
            <Text style={styles.modalSubtitle}>
              Enter the 6-character alphanumeric code provided by the circle owner.
            </Text>

            <Input
              label="6-CHARACTER CODE"
              placeholder="e.g. A8K2F9"
              value={joinCode}
              onChangeText={(t) => setJoinCode(t.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              error={modalError || undefined}
              style={{ fontSize: 18, letterSpacing: 3, fontWeight: '700' }}
            />

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setJoinModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Join Circle"
                variant="primary"
                loading={modalLoading}
                onPress={handleJoin}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
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
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  actionBtn: {
    flex: 1,
  },
  listSection: {
    marginTop: spacing.sm,
  },
  sectionHeading: {
    ...typography.overline,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardActive: {
    borderColor: colors.accent,
    backgroundColor: colors.white,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardTitle: {
    ...typography.titleSection,
    fontSize: 18,
    marginBottom: 4,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardMetaText: {
    ...typography.caption,
    fontSize: 13,
  },
  codePill: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.xs,
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  codeOverline: {
    ...typography.overline,
    fontSize: 8,
    color: colors.textMuted,
  },
  codeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 1,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  emptyContainer: {
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    ...typography.titleCard,
    marginBottom: spacing.xs,
  },
  emptyDesc: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.textMuted,
    lineHeight: 18,
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
