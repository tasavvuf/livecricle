import { create } from 'zustand';

export interface UserCoordinate {
  lat: number;
  lng: number;
  accuracy: number;
  ts: string;
}

export interface MemberLiveLocation extends UserCoordinate {
  userId: string;
  name: string;
}

export interface GeofenceEventItem {
  id: string;
  userId: string;
  userName: string;
  geofenceId: string;
  geofenceName: string;
  type: 'enter' | 'exit';
  distanceMeters?: number;
  ts: string;
}

interface LocationState {
  isSharingLocation: boolean;
  currentLocation: UserCoordinate | null;
  memberLocations: Record<string, MemberLiveLocation>;
  geofenceEvents: GeofenceEventItem[];

  setSharingLocation: (isSharing: boolean) => void;
  updateCurrentLocation: (loc: UserCoordinate) => void;
  updateMemberLocation: (loc: MemberLiveLocation) => void;
  setInitialMemberLocations: (members: Array<{ id: string; name: string; state?: any }>) => void;
  addGeofenceEvent: (event: GeofenceEventItem) => void;
  clearGeofenceEvents: () => void;
  resetLocationState: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  isSharingLocation: true,
  currentLocation: null,
  memberLocations: {},
  geofenceEvents: [],

  setSharingLocation: (isSharingLocation: boolean) => {
    set({ isSharingLocation });
  },

  updateCurrentLocation: (currentLocation: UserCoordinate) => {
    set({ currentLocation });
  },

  updateMemberLocation: (loc: MemberLiveLocation) => {
    set((state) => ({
      memberLocations: {
        ...state.memberLocations,
        [loc.userId]: loc,
      },
    }));
  },

  setInitialMemberLocations: (members) => {
    const map: Record<string, MemberLiveLocation> = {};
    for (const m of members) {
      if (m.state && m.state.lastLat && m.state.lastLng) {
        map[m.id] = {
          userId: m.id,
          name: m.name,
          lat: m.state.lastLat,
          lng: m.state.lastLng,
          accuracy: 0,
          ts: m.state.lastTs || new Date().toISOString(),
        };
      }
    }
    set({ memberLocations: map });
  },

  addGeofenceEvent: (event: GeofenceEventItem) => {
    set((state) => ({
      // Keep up to 25 latest events
      geofenceEvents: [event, ...state.geofenceEvents].slice(0, 25),
    }));
  },

  clearGeofenceEvents: () => {
    set({ geofenceEvents: [] });
  },

  resetLocationState: () => {
    set({
      currentLocation: null,
      memberLocations: {},
      geofenceEvents: [],
    });
  },
}));
