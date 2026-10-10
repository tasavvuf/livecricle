import { io, Socket } from 'socket.io-client';
import { getBaseUrl, getStoredToken } from '../api/client';
import { useLocationStore } from '../store/locationStore';

let socket: Socket | null = null;
let currentJoinedGroupId: string | null = null;

export async function initSocket(): Promise<Socket | null> {
  const token = await getStoredToken();
  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    return null;
  }

  const baseUrl = await getBaseUrl();

  if (socket && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(baseUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1500,
  });

  socket.on('connect', () => {
    console.log('[Socket Connected] ID:', socket?.id);
    if (currentJoinedGroupId) {
      socket?.emit('join_group', { groupId: currentJoinedGroupId });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket Disconnected] Reason:', reason);
  });

  socket.on('member_location', (data: {
    userId: string;
    name: string;
    lat: number;
    lng: number;
    accuracy?: number;
    ts: string;
  }) => {
    useLocationStore.getState().updateMemberLocation({
      userId: data.userId,
      name: data.name,
      lat: data.lat,
      lng: data.lng,
      accuracy: data.accuracy || 0,
      ts: data.ts,
    });
  });

  socket.on('geofence_event', (data: {
    userId: string;
    userName: string;
    geofenceId: string;
    geofenceName: string;
    type: 'enter' | 'exit';
    distanceMeters?: number;
    ts: string;
  }) => {
    useLocationStore.getState().addGeofenceEvent({
      id: `${data.userId}-${data.geofenceId}-${Date.now()}`,
      userId: data.userId,
      userName: data.userName,
      geofenceId: data.geofenceId,
      geofenceName: data.geofenceName,
      type: data.type,
      distanceMeters: data.distanceMeters,
      ts: data.ts,
    });
  });

  socket.on('error_message', (err: { message: string }) => {
    console.warn('[Socket Server Error]:', err.message);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentJoinedGroupId = null;
  }
}

export function joinGroupRoom(groupId: string): void {
  currentJoinedGroupId = groupId;
  if (socket && socket.connected) {
    socket.emit('join_group', { groupId });
  }
}

export function leaveGroupRoom(groupId: string): void {
  if (currentJoinedGroupId === groupId) {
    currentJoinedGroupId = null;
  }
  if (socket && socket.connected) {
    socket.emit('leave_group', { groupId });
  }
}

export function emitLocationUpdate(payload: {
  groupId: string;
  lat: number;
  lng: number;
  accuracy?: number;
  ts?: string | number | Date;
}): void {
  if (socket && socket.connected) {
    socket.emit('location_update', payload);
  }
}

export function getSocket(): Socket | null {
  return socket;
}
