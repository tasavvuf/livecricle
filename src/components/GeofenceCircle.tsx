import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

interface GeofenceCircleProps {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusM: number;
}

export const GeofenceCircle: React.FC<GeofenceCircleProps> = ({
  name,
  radiusM,
}) => {
  return (
    <View style={styles.pillContainer}>
      <Text style={styles.icon}>📍</Text>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.radius}>{radiusM}m</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
  },
  icon: {
    fontSize: 10,
    marginRight: 4,
  },
  name: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
  },
  radius: {
    ...typography.caption,
    fontSize: 9,
    color: colors.textMuted,
    marginLeft: 4,
  },
});
