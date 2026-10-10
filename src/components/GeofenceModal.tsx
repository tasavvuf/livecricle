import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { Button } from './Button';
import { Input } from './Input';

interface GeofenceModalProps {
  visible: boolean;
  latitude: number | null;
  longitude: number | null;
  onClose: () => void;
  onSave: (data: { name: string; lat: number; lng: number; radiusM: number }) => Promise<void>;
}

const RADIUS_OPTIONS = [50, 100, 200, 500, 1000];

export const GeofenceModal: React.FC<GeofenceModalProps> = ({
  visible,
  latitude,
  longitude,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [radiusM, setRadiusM] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please provide a name for this geofence');
      return;
    }
    if (latitude == null || longitude == null) {
      setError('Coordinates are missing');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        name: name.trim(),
        lat: latitude,
        lng: longitude,
        radiusM,
      });
      setName('');
      setRadiusM(100);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create geofence');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheetContainer}>
          <Text style={styles.overline}>NEW GEOFENCE</Text>
          <Text style={styles.title}>Define Alert Zone</Text>
          <Text style={styles.subtitle}>
            Members will receive a push alert when someone enters or leaves this perimeter.
          </Text>

          <Input
            label="ZONE NAME"
            placeholder="e.g. Home, University, Coffee House"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (error) setError(null);
            }}
            error={error || undefined}
          />

          <Text style={styles.radiusLabel}>RADIUS (METERS)</Text>
          <View style={styles.radiusRow}>
            {RADIUS_OPTIONS.map((val) => {
              const isSelected = radiusM === val;
              return (
                <TouchableOpacity
                  key={val}
                  onPress={() => setRadiusM(val)}
                  style={[
                    styles.radiusPill,
                    isSelected ? styles.radiusPillActive : styles.radiusPillInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.radiusText,
                      isSelected ? styles.radiusTextActive : styles.radiusTextInactive,
                    ]}
                  >
                    {val}m
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {latitude != null && longitude != null && (
            <View style={styles.coordsCard}>
              <Text style={styles.coordsText}>
                Center: {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </Text>
            </View>
          )}

          <View style={styles.actionsRow}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={onClose}
              style={styles.actionBtn}
            />
            <Button
              title="Create Zone"
              variant="cobalt"
              loading={isSubmitting}
              onPress={handleSave}
              style={styles.actionBtn}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 36, 61, 0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheetContainer: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  overline: {
    ...typography.overline,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.titleSection,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  radiusLabel: {
    ...typography.overline,
    marginBottom: spacing.xs + 2,
  },
  radiusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  radiusPill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.sm,
    borderWidth: 1.5,
  },
  radiusPillActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  radiusPillInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  radiusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  radiusTextActive: {
    color: colors.white,
  },
  radiusTextInactive: {
    color: colors.text,
  },
  coordsCard: {
    backgroundColor: colors.surface,
    padding: spacing.sm + 2,
    borderRadius: radii.xs,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  coordsText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
});
