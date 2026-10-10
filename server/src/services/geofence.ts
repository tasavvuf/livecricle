import { Types } from 'mongoose';
import { Geofence, IGeofence } from '../models/Geofence';
import { MemberState, IMemberState } from '../models/MemberState';

export interface GeofenceEventResult {
  userId: string;
  userName: string;
  geofenceId: string;
  geofenceName: string;
  type: 'enter' | 'exit';
  distanceMeters: number;
  ts: Date;
}

/**
 * Calculate Great-Circle distance between two coordinates in meters
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (x: number) => (x * Math.PI) / 180;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Evaluates geofences for a location update and applies a 2-consecutive-reading debounce filter.
 */
export async function evaluateGeofences({
  userId,
  userName,
  groupId,
  lat,
  lng,
  ts = new Date(),
}: {
  userId: string;
  userName: string;
  groupId: string;
  lat: number;
  lng: number;
  ts?: Date;
}): Promise<{
  events: GeofenceEventResult[];
  insideGeofenceIds: string[];
}> {
  const geofences = await Geofence.find({ groupId: new Types.ObjectId(groupId) });

  let memberState = await MemberState.findOne({
    userId: new Types.ObjectId(userId),
    groupId: new Types.ObjectId(groupId),
  });

  if (!memberState) {
    memberState = new MemberState({
      userId: new Types.ObjectId(userId),
      groupId: new Types.ObjectId(groupId),
      lastLat: lat,
      lastLng: lng,
      lastTs: ts,
      insideGeofenceIds: [],
      debounceTracker: {},
    });
  } else {
    memberState.lastLat = lat;
    memberState.lastLng = lng;
    memberState.lastTs = ts;
  }

  const tracker = { ...(memberState.debounceTracker || {}) };
  const currentInsideIds = new Set(
    (memberState.insideGeofenceIds || []).map((id) => id.toString())
  );
  const events: GeofenceEventResult[] = [];

  for (const fence of geofences) {
    const fenceId = fence._id.toString();
    const dist = calculateHaversineDistanceMeters(lat, lng, fence.lat, fence.lng);
    const readingIsInside = dist <= fence.radiusM;
    const isCurrentlyInside = currentInsideIds.has(fenceId);

    if (readingIsInside === isCurrentlyInside) {
      // Status is steady, clear any pending jitter counter
      if (tracker[fenceId]) {
        delete tracker[fenceId];
      }
    } else {
      // Candidate flip detected
      const targetState: 'inside' | 'outside' = readingIsInside ? 'inside' : 'outside';
      const existing = tracker[fenceId];

      if (existing && existing.targetState === targetState) {
        existing.consecutiveCount += 1;
      } else {
        tracker[fenceId] = {
          targetState,
          consecutiveCount: 1,
        };
      }

      // Debounce check: require 2 consecutive readings
      if (tracker[fenceId].consecutiveCount >= 2) {
        delete tracker[fenceId];

        if (targetState === 'inside') {
          currentInsideIds.add(fenceId);
          events.push({
            userId,
            userName,
            geofenceId: fenceId,
            geofenceName: fence.name,
            type: 'enter',
            distanceMeters: Math.round(dist),
            ts,
          });
        } else {
          currentInsideIds.delete(fenceId);
          events.push({
            userId,
            userName,
            geofenceId: fenceId,
            geofenceName: fence.name,
            type: 'exit',
            distanceMeters: Math.round(dist),
            ts,
          });
        }
      }
    }
  }

  memberState.insideGeofenceIds = Array.from(currentInsideIds).map(
    (id) => new Types.ObjectId(id)
  );
  memberState.debounceTracker = tracker;
  memberState.markModified('debounceTracker');
  await memberState.save();

  return {
    events,
    insideGeofenceIds: Array.from(currentInsideIds),
  };
}
