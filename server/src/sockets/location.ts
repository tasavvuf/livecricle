import { Server } from 'socket.io';
import { Types } from 'mongoose';
import { AuthenticatedSocket } from '../middleware/auth';
import { LocationPing } from '../models/LocationPing';
import { Group } from '../models/Group';
import { evaluateGeofences } from '../services/geofence';
import { sendPushNotifications } from '../services/push';

export function registerLocationSocketHandlers(io: Server) {
  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.user;
    const userId = socket.userId;

    if (!user || !userId) {
      socket.disconnect(true);
      return;
    }

    console.log(`[Socket Connected] User ${user.name} (${userId})`);

    // Client emits join_group { groupId }
    socket.on('join_group', async (payload: { groupId: string }) => {
      try {
        const { groupId } = payload;
        if (!groupId || !Types.ObjectId.isValid(groupId)) {
          socket.emit('error_message', { message: 'Invalid groupId provided' });
          return;
        }

        const group = await Group.findById(groupId);
        if (!group) {
          socket.emit('error_message', { message: 'Group not found' });
          return;
        }

        const isMember = group.memberIds.some((id) => id.toString() === userId);
        if (!isMember) {
          socket.emit('error_message', { message: 'Not a member of this group' });
          return;
        }

        const roomName = `group:${groupId}`;
        socket.join(roomName);
        console.log(`[Socket] User ${user.name} joined room ${roomName}`);

        socket.emit('joined_group', { groupId, message: `Successfully joined ${group.name}` });
      } catch (err: any) {
        console.error('[Socket join_group Error]:', err);
        socket.emit('error_message', { message: 'Failed to join group room' });
      }
    });

    // Client emits leave_group { groupId }
    socket.on('leave_group', (payload: { groupId: string }) => {
      if (payload?.groupId) {
        const roomName = `group:${payload.groupId}`;
        socket.leave(roomName);
        console.log(`[Socket] User ${user.name} left room ${roomName}`);
      }
    });

    // Client emits location_update { groupId, lat, lng, accuracy, ts }
    socket.on(
      'location_update',
      async (payload: {
        groupId: string;
        lat: number;
        lng: number;
        accuracy?: number;
        ts?: string | number | Date;
      }) => {
        try {
          const { groupId, lat, lng, accuracy = 0 } = payload;
          if (!groupId || !Types.ObjectId.isValid(groupId) || lat == null || lng == null) {
            return;
          }

          const timestamp = payload.ts ? new Date(payload.ts) : new Date();

          // 1. Verify group membership
          const group = await Group.findById(groupId).populate('memberIds', 'name expoPushToken');
          if (!group) return;

          const isMember = group.memberIds.some((m: any) => m._id.toString() === userId);
          if (!isMember) return;

          // 2. Persist LocationPing (Auto-expires in 24 hours via TTL index)
          await LocationPing.create({
            userId: new Types.ObjectId(userId),
            groupId: new Types.ObjectId(groupId),
            lat,
            lng,
            accuracy,
            ts: timestamp,
          });

          // 3. Broadcast real-time location to the group room
          const roomName = `group:${groupId}`;
          io.to(roomName).emit('member_location', {
            userId,
            name: user.name,
            lat,
            lng,
            accuracy,
            ts: timestamp.toISOString(),
          });

          // 4. Evaluate geofences with 2-consecutive-reading debounce
          const { events, insideGeofenceIds } = await evaluateGeofences({
            userId,
            userName: user.name,
            groupId,
            lat,
            lng,
            ts: timestamp,
          });

          // 5. If enter/exit events fired, broadcast & send push notifications
          if (events.length > 0) {
            for (const ev of events) {
              console.log(
                `[Geofence Event] User ${ev.userName} ${ev.type.toUpperCase()} geofence "${ev.geofenceName}" in group "${group.name}"`
              );

              // Broadcast geofence_event to the group room
              io.to(roomName).emit('geofence_event', {
                userId: ev.userId,
                userName: ev.userName,
                geofenceId: ev.geofenceId,
                geofenceName: ev.geofenceName,
                type: ev.type,
                distanceMeters: ev.distanceMeters,
                ts: ev.ts.toISOString(),
              });

              // Prepare push notification for all other group members
              const otherMembers = (group.memberIds as any[]).filter(
                (m) => m._id.toString() !== userId && m.expoPushToken
              );

              const recipientTokens = otherMembers.map((m) => m.expoPushToken as string);

              if (recipientTokens.length > 0) {
                const actionText = ev.type === 'enter' ? 'entered' : 'left';
                sendPushNotifications({
                  tokens: recipientTokens,
                  title: `LiveCircle • ${group.name}`,
                  body: `${ev.userName} has ${actionText} ${ev.geofenceName}`,
                  data: {
                    type: 'geofence_event',
                    groupId,
                    geofenceId: ev.geofenceId,
                    eventType: ev.type,
                    userId,
                  },
                }).catch((e) => console.error('[Push Notification Trigger Error]:', e));
              }
            }
          }
        } catch (error) {
          console.error('[Socket location_update Error]:', error);
        }
      }
    );

    socket.on('disconnect', () => {
      console.log(`[Socket Disconnected] User ${user.name} (${userId})`);
    });
  });
}
