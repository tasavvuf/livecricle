import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDebounceStatus {
  targetState: 'inside' | 'outside';
  consecutiveCount: number;
}

export interface IMemberState extends Document {
  userId: Types.ObjectId;
  groupId: Types.ObjectId;
  lastLat: number;
  lastLng: number;
  lastTs: Date;
  insideGeofenceIds: Types.ObjectId[];
  // Map of geofenceId string -> { targetState, consecutiveCount }
  debounceTracker: Record<string, IDebounceStatus>;
  updatedAt: Date;
}

const MemberStateSchema = new Schema<IMemberState>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    lastLat: {
      type: Number,
      required: true,
    },
    lastLng: {
      type: Number,
      required: true,
    },
    lastTs: {
      type: Date,
      default: Date.now,
      required: true,
    },
    insideGeofenceIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Geofence',
      },
    ],
    debounceTracker: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

MemberStateSchema.index({ userId: 1, groupId: 1 }, { unique: true });

export const MemberState = mongoose.model<IMemberState>('MemberState', MemberStateSchema);
