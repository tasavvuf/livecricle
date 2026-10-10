import { create } from 'zustand';
import { api } from '../api/client';
import { joinGroupRoom, leaveGroupRoom } from '../socket/socket';
import { useLocationStore } from './locationStore';

export interface GroupSummary {
  _id: string;
  name: string;
  inviteCode: string;
  ownerId: any;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GeofenceItem {
  _id: string;
  groupId: string;
  name: string;
  lat: number;
  lng: number;
  radiusM: number;
  createdAt: string;
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  state: {
    lastLat: number;
    lastLng: number;
    lastTs: string;
    insideGeofences: Array<{ _id: string; name: string }>;
  } | null;
}

export interface GroupDetail {
  _id: string;
  name: string;
  inviteCode: string;
  ownerId: any;
  createdAt: string;
  members: GroupMember[];
  geofences: GeofenceItem[];
}

interface GroupState {
  groups: GroupSummary[];
  activeGroup: GroupDetail | null;
  activeGroupId: string | null;
  isLoading: boolean;
  error: string | null;

  fetchGroups: () => Promise<void>;
  selectGroup: (groupId: string) => Promise<void>;
  createGroup: (name: string) => Promise<GroupSummary>;
  joinGroup: (code: string) => Promise<void>;
  createGeofence: (data: { name: string; lat: number; lng: number; radiusM: number }) => Promise<GeofenceItem>;
  deleteGeofence: (geofenceId: string) => Promise<void>;
  refreshActiveGroup: () => Promise<void>;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  activeGroup: null,
  activeGroupId: null,
  isLoading: false,
  error: null,

  fetchGroups: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.getGroups();
      const groups: GroupSummary[] = res.groups || [];
      set({ groups, isLoading: false });

      // Automatically select first group if none selected
      const currentActiveId = get().activeGroupId;
      if (!currentActiveId && groups.length > 0) {
        await get().selectGroup(groups[0]._id);
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  selectGroup: async (groupId: string) => {
    const prevGroupId = get().activeGroupId;
    if (prevGroupId && prevGroupId !== groupId) {
      leaveGroupRoom(prevGroupId);
    }

    try {
      set({ isLoading: true, activeGroupId: groupId, error: null });
      const res = await api.getGroupDetail(groupId);
      const detail: GroupDetail = {
        ...res.group,
        members: res.members,
        geofences: res.geofences,
      };

      set({ activeGroup: detail, isLoading: false });

      // Connect socket to group room
      joinGroupRoom(groupId);

      // Seed location store with initial member coordinates
      useLocationStore.getState().setInitialMemberLocations(res.members || []);
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  refreshActiveGroup: async () => {
    const groupId = get().activeGroupId;
    if (!groupId) return;
    try {
      const res = await api.getGroupDetail(groupId);
      const detail: GroupDetail = {
        ...res.group,
        members: res.members,
        geofences: res.geofences,
      };
      set({ activeGroup: detail });
    } catch (err) {
      console.warn('[GroupStore] Refresh failed', err);
    }
  },

  createGroup: async (name: string) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.createGroup(name);
      await get().fetchGroups();
      if (res.group?._id) {
        await get().selectGroup(res.group._id);
      }
      return res.group;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  joinGroup: async (code: string) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.joinGroup(code);
      await get().fetchGroups();
      if (res.group?._id) {
        await get().selectGroup(res.group._id);
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  createGeofence: async (data: { name: string; lat: number; lng: number; radiusM: number }) => {
    const groupId = get().activeGroupId;
    if (!groupId) throw new Error('No active group selected');

    try {
      set({ isLoading: true });
      const res = await api.createGeofence(groupId, data);
      await get().refreshActiveGroup();
      set({ isLoading: false });
      return res.geofence;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteGeofence: async (geofenceId: string) => {
    const groupId = get().activeGroupId;
    if (!groupId) return;

    try {
      await api.deleteGeofence(groupId, geofenceId);
      await get().refreshActiveGroup();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },
}));
