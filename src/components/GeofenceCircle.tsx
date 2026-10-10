import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Circle, Marker } from 'react-native-maps';
import { colors, radii, spacing, typography } from '../theme';

interface GeofenceCircleProps {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusM: number;
}

export const GeofenceCircle: React.FC<GeofenceCircleProps> = ({
  id,
  name,
  lat,
  lng,
  radiusM,
}) => {
  return (
    <>
      <Circle
        center={{ latitude: lat, longitude: lng }}
        radius={radiusM}
        fillColor={colors.geofenceFill}
        strokeColor={colors.geofenceStroke}
        strokeWidth={2}
      />
      <Marker
        coordinate={{ latitude: lat, longitude: lng }}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <View style={styles.centerBadge}>
          <Text style={styles.nameText}>{name}</Text>
          <Text style={styles.radiusText}>{radiusM}m</Text>
        </View>
      </Marker>
    </>
  );
};

const styles = StyleSheet.create({
  centerBadge: {
    backgroundColor: 'rgba(23, 36, 61, 0.85)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.white,
  },
  nameText: {
    ...typography.overline,
    color: colors.white,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  radiusText: {
    fontSize: 8,
    color: colors.accentSecondary,
    fontWeight: '500',
  },
});
