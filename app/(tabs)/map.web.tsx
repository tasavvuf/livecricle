import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../src/theme';
import { useAuthStore } from '../../src/store/authStore';
import { useGroupStore } from '../../src/store/groupStore';
import { useLocationStore } from '../../src/store/locationStore';
import { GeofenceModal } from '../../src/components/GeofenceModal';
import { Badge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';

export default function MapWebScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { activeGroup, fetchGroups, createGeofence } = useGroupStore();
  const {
    isSharingLocation,
    currentLocation,
    memberLocations,
    geofenceEvents,
    setSharingLocation,
  } = useLocationStore();

  const [isAddingGeofence, setIsAddingGeofence] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const activeMembers = activeGroup?.members || [];
  const latestEvent = geofenceEvents.length > 0 ? geofenceEvents[0] : null;

  const currentLat = currentLocation?.lat || 37.7749;
  const currentLng = currentLocation?.lng || -122.4194;

  const handleSaveGeofence = async (data: {
    name: string;
    lat: number;
    lng: number;
    radiusM: number;
  }) => {
    await createGeofence(data);
  };

  const handleAddZoneClick = () => {
    setSelectedCoords({ lat: currentLat, lng: currentLng });
    setModalVisible(true);
  };

  // OpenStreetMap embed URL centered on current user or active location
  const mapIframeUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${currentLng - 0.03}%2C${currentLat - 0.02}%2C${currentLng + 0.03}%2C${currentLat + 0.02}&layer=mapnik&marker=${currentLat}%2C${currentLng}`;

  return (
    <View style={styles.container}>
      {/* Top Header Card */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.circleSelector}
            onPress={() => router.push('/(tabs)/groups')}
            activeOpacity={0.7}
          >
            <Text style={styles.circleOverline}>ACTIVE CIRCLE</Text>
            <View style={styles.circleTitleRow}>
              <Text style={styles.circleTitle} numberOfLines={1}>
                {activeGroup ? activeGroup.name : 'No Circle Selected'}
              </Text>
              <Ionicons name="chevron-down" size={14} color={colors.text} style={{ marginLeft: 4 }} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[
              styles.sharePill,
              isSharingLocation ? styles.sharePillActive : styles.sharePillPaused,
            ]}
            onPress={() => setSharingLocation(!isSharingLocation)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.shareDot,
                { backgroundColor: isSharingLocation ? colors.statusEnter : colors.statusExit },
              ]}
            />
            <Text style={styles.shareText}>
              {isSharingLocation ? 'SHARING' : 'PAUSED'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Geofence Event Alert Pill */}
      {latestEvent && (
        <View style={styles.eventPill}>
          <View
            style={[
              styles.eventDot,
              {
                backgroundColor:
                  latestEvent.type === 'enter' ? colors.statusEnter : colors.statusExit,
              },
            ]}
          />
          <Text style={styles.eventText} numberOfLines={1}>
            <Text style={{ fontWeight: '700' }}>{latestEvent.userName}</Text>{' '}
            {latestEvent.type === 'enter' ? 'entered' : 'left'} {latestEvent.geofenceName}
          </Text>
        </View>
      )}

      {/* Interactive Web Map Area */}
      <View style={styles.mapArea}>
        {Platform.OS === 'web' && (
          <iframe
            src={mapIframeUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 0,
            }}
            title="LiveCircle Map"
          />
        )}

        {/* Floating Action Column */}
        <View style={styles.fabColumn}>
          <TouchableOpacity
            style={[styles.fabBtn, isAddingGeofence && styles.fabBtnActive]}
            onPress={handleAddZoneClick}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Members Drawer */}
      <View style={[styles.bottomDrawer, isPanelExpanded && styles.bottomDrawerExpanded]}>
        <TouchableOpacity
          style={styles.drawerHandleRow}
          onPress={() => setIsPanelExpanded(!isPanelExpanded)}
          activeOpacity={0.9}
        >
          <View style={styles.drawerPillHandle} />
          <View style={styles.drawerSummaryRow}>
            <Text style={styles.drawerTitle}>
              CIRCLE MEMBERS ({activeMembers.length})
            </Text>
            <Text style={styles.drawerToggleText}>
              {isPanelExpanded ? 'COLLAPSE' : 'EXPAND'}
            </Text>
          </View>
        </TouchableOpacity>

        <ScrollView
          style={styles.membersList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.lg }}
        >
          {activeMembers.length === 0 ? (
            <View style={styles.emptyMembersBox}>
              <Text style={styles.emptyMembersText}>
                No members in this circle yet. Share the invite code to begin.
              </Text>
            </View>
          ) : (
            activeMembers.map((m) => {
              const liveLoc = memberLocations[m.id];
              const isSelf = user?.id === m.id;
              const hasLocation = liveLoc != null || m.state?.lastLat != null;

              return (
                <View key={m.id} style={styles.memberRow}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {m.name.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName}>
                        {m.name} {isSelf && '(You)'}
                      </Text>
                      {hasLocation ? (
                        <Badge label="LIVE" variant="green" />
                      ) : (
                        <Badge label="OFFLINE" variant="muted" />
                      )}
                    </View>
                    <Text style={styles.memberStatusText}>
                      {hasLocation
                        ? isSelf
                          ? isSharingLocation
                            ? 'Broadcasting live coordinates'
                            : 'Sharing paused by you'
                          : `Updated ${liveLoc?.ts ? new Date(liveLoc.ts).toLocaleTimeString() : 'recently'}`
                        : 'No coordinates reported'}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* Geofence Modal */}
      <GeofenceModal
        visible={modalVisible}
        latitude={selectedCoords?.lat || currentLat}
        longitude={selectedCoords?.lng || currentLng}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveGeofence}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    position: 'absolute',
    top: 20,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  headerLeft: {
    flex: 1,
  },
  circleSelector: {
    justifyContent: 'center',
  },
  circleOverline: {
    ...typography.overline,
    fontSize: 9,
    color: colors.accent,
  },
  circleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleTitle: {
    ...typography.titleCard,
    fontSize: 15,
  },
  headerRight: {
    marginLeft: spacing.md,
  },
  sharePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  sharePillActive: {
    backgroundColor: colors.statusEnterBg,
    borderColor: colors.statusEnter,
  },
  sharePillPaused: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  shareDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  shareText: {
    ...typography.overline,
    fontSize: 10,
    color: colors.text,
  },
  eventPill: {
    position: 'absolute',
    top: 80,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9,
    backgroundColor: colors.text,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  eventText: {
    ...typography.caption,
    color: colors.white,
    flex: 1,
  },
  mapArea: {
    flex: 1,
  },
  fabColumn: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 160,
    zIndex: 10,
  },
  fabBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fabBtnActive: {
    backgroundColor: colors.accent,
  },
  bottomDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    borderTopWidth: 1,
    borderColor: colors.border,
    maxHeight: 140,
    paddingHorizontal: spacing.lg,
    zIndex: 10,
  },
  bottomDrawerExpanded: {
    maxHeight: 320,
  },
  drawerHandleRow: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  drawerPillHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.xs,
  },
  drawerSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  drawerTitle: {
    ...typography.overline,
    color: colors.textMuted,
  },
  drawerToggleText: {
    ...typography.overline,
    color: colors.accent,
    fontSize: 10,
  },
  membersList: {
    marginTop: spacing.xs,
  },
  emptyMembersBox: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyMembersText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.md,
  },
  memberAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  memberInfo: {
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
  memberStatusText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});
