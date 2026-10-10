import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { emitLocationUpdate } from '../socket/socket';
import { useLocationStore } from '../store/locationStore';
import { useGroupStore } from '../store/groupStore';

export const LOCATION_TASK_NAME = 'LIVE_CIRCLE_BACKGROUND_TRACKING';

// Local cache for throttling
let lastSentLat: number | null = null;
let lastSentLng: number | null = null;
let lastSentTimestamp = 0;

let foregroundSubscription: Location.LocationSubscription | null = null;

/**
 * Calculates distance in meters between two lat/lng points
 */
function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Checks throttle condition: send only if moved > 20 meters OR > 10 seconds elapsed.
 */
function shouldSendLocation(lat: number, lng: number, now: number): boolean {
  if (lastSentLat === null || lastSentLng === null) {
    return true;
  }

  const timeDiffMs = now - lastSentTimestamp;
  if (timeDiffMs >= 10000) {
    return true;
  }

  const distance = calculateDistanceMeters(lastSentLat, lastSentLng, lat, lng);
  if (distance >= 20) {
    return true;
  }

  return false;
}

/**
 * Processes incoming raw location from either foreground or background provider
 */
export function handleIncomingLocation(location: Location.LocationObject): void {
  const isSharing = useLocationStore.getState().isSharingLocation;
  if (!isSharing) {
    // Privacy rule: sharing off means no updates sent
    return;
  }

  const activeGroupId = useGroupStore.getState().activeGroupId;
  const { latitude, longitude, accuracy } = location.coords;
  const now = location.timestamp || Date.now();

  // Update local current location store immediately for smooth UI
  useLocationStore.getState().updateCurrentLocation({
    lat: latitude,
    lng: longitude,
    accuracy: accuracy || 0,
    ts: new Date(now).toISOString(),
  });

  // Evaluate throttle: > 20 m or > 10 s passed
  if (!shouldSendLocation(latitude, longitude, now)) {
    return;
  }

  // Update throttle markers
  lastSentLat = latitude;
  lastSentLng = longitude;
  lastSentTimestamp = now;

  // Emit to active group if available
  if (activeGroupId) {
    emitLocationUpdate({
      groupId: activeGroupId,
      lat: latitude,
      lng: longitude,
      accuracy: accuracy || 0,
      ts: new Date(now).toISOString(),
    });
  }
}

// Register background task with TaskManager
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.warn('[TaskManager] Location error in background task:', error.message);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    if (locations && locations.length > 0) {
      // Process newest location reading
      const latest = locations[locations.length - 1];
      handleIncomingLocation(latest);
    }
  }
});

/**
 * Start foreground and background tracking
 */
export async function startTracking(): Promise<{ granted: boolean; error?: string }> {
  try {
    // 1. Request foreground permission
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') {
      return {
        granted: false,
        error: 'Permission to access foreground location was denied',
      };
    }

    // 2. Request background permission on native platforms
    if (Platform.OS !== 'web') {
      try {
        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
        if (bgStatus === 'granted') {
          const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
          if (!isRegistered) {
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 10000,
              distanceInterval: 20,
              showsBackgroundLocationIndicator: true,
              foregroundService: {
                notificationTitle: 'LiveCircle Active',
                notificationBody: 'Sharing live circle location with your group',
                notificationColor: '#3158D8',
              },
            });
            console.log('[LocationTracker] Background location updates started');
          }
        } else {
          console.log('[LocationTracker] Background location not granted, using foreground only');
        }
      } catch (bgErr) {
        console.warn('[LocationTracker] Background location initialization issue:', bgErr);
      }
    }

    // 3. Start foreground watcher
    if (!foregroundSubscription) {
      foregroundSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000,
          distanceInterval: 20,
        },
        (loc) => {
          handleIncomingLocation(loc);
        }
      );
      console.log('[LocationTracker] Foreground location watcher active');
    }

    // Also get immediate one-off location to seed UI instantly
    const initialLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    handleIncomingLocation(initialLocation);

    return { granted: true };
  } catch (error: any) {
    console.error('[LocationTracker] Error starting tracking:', error);
    return { granted: false, error: error.message };
  }
}

/**
 * Stop tracking immediately (e.g. When sharing toggled OFF or user logs out)
 */
export async function stopTracking(): Promise<void> {
  try {
    if (foregroundSubscription) {
      foregroundSubscription.remove();
      foregroundSubscription = null;
      console.log('[LocationTracker] Foreground subscription stopped');
    }

    if (Platform.OS !== 'web') {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
      if (isRegistered) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        console.log('[LocationTracker] Background task stopped');
      }
    }
  } catch (err) {
    console.warn('[LocationTracker] Error stopping tracking:', err);
  }
}
