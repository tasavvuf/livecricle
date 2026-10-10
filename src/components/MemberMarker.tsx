import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
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

function getInitials(name: string): string {
  if (!name) return 'LC';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatLastSeen(ts?: string): string {
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
  userId,
  name,
  lat,
  lng,
  isCurrentUser = false,
  lastUpdated,
  insideGeofenceNames = [],
  onPress,
}) => {
  const initials = getInitials(name);
  const lastSeenText = formatLastSeen(lastUpdated);

  return (
    <Marker
      coordinate={{ latitude: lat, longitude: lng }}
      title={name}
      description={lastSeenText}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
    >
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

        {/* Pulse / Live indicator dot */}
        <View style={styles.liveDot} />
      </View>

      <Callout tooltip>
        <View style={styles.calloutBubble}>
          <Text style={styles.calloutName}>{name}</Text>
          <Text style={styles.calloutStatus}>{lastSeenText}</Text>
          {insideGeofenceNames.length > 0 && (
            <Text style={styles.calloutGeofence}>
              At: {insideGeofenceNames.join(', ')}
            </Text>
          )}
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  currentUserCircle: {
    backgroundColor: colors.accent,
    borderColor: colors.white,
  },
  memberCircle: {
    backgroundColor: colors.text,
    borderColor: colors.surface,
  },
  avatarText: {
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: -0.2,
  },
  currentUserText: {
    color: colors.white,
  },
  memberText: {
    color: colors.background,
  },
  liveDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.statusEnter,
    borderWidth: 2,
    borderColor: colors.white,
  },
  calloutBubble: {
    backgroundColor: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    minWidth: 120,
    alignItems: 'center',
  },
  calloutName: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  calloutStatus: {
    ...typography.caption,
    color: colors.border,
    fontSize: 11,
    marginTop: 2,
  },
  calloutGeofence: {
    ...typography.caption,
    color: colors.accentSecondary,
    fontSize: 11,
    marginTop: 2,
  },
});
