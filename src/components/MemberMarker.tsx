import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

interface MemberMarkerProps {
  userId: string;
  name: string;
  lat: number;
  lng: number;
  isCurrentUser?: boolean;
  lastUpdated?: string;
  insideGeofenceNames?: string[];
  onPress?: () => void;
}

export function getInitials(name: string): string {
  if (!name) return 'LC';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatLastSeen(ts?: string): string {
  if (!ts) return 'Active';
  const diffMs = Date.now() - new Date(ts).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export const MemberMarker: React.FC<MemberMarkerProps> = ({
  name,
  isCurrentUser = false,
  lastUpdated,
}) => {
  const initials = getInitials(name);
  const lastSeenText = formatLastSeen(lastUpdated);

  return (
    <View style={styles.markerContainer}>
      <View
        style={[
          styles.avatarCircle,
          isCurrentUser ? styles.currentUserCircle : styles.memberCircle,
        ]}
      >
        <Text
          style={[
            styles.avatarText,
            isCurrentUser ? styles.currentUserText : styles.memberText,
          ]}
        >
          {initials}
        </Text>
      </View>
      <View style={styles.badgeRow}>
        <Text style={styles.nameLabel} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.timeLabel}>{lastSeenText}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  currentUserCircle: {
    backgroundColor: colors.cobalt,
  },
  memberCircle: {
    backgroundColor: colors.navy,
  },
  avatarText: {
    ...typography.badge,
    fontSize: 12,
    fontWeight: '700',
  },
  currentUserText: {
    color: colors.white,
  },
  memberText: {
    color: colors.background,
  },
  badgeRow: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
    alignItems: 'center',
    elevation: 2,
  },
  nameLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
  },
  timeLabel: {
    ...typography.caption,
    fontSize: 8,
    color: colors.textMuted,
  },
});
