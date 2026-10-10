import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ILocationPing extends Document {
  userId: Types.ObjectId;
  groupId: Types.ObjectId;
  lat: number;
  lng: number;
  accuracy: number;
  ts: Date;
}

const LocationPingSchema = new Schema<ILocationPing>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    ts: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// TTL index to automatically purge pings older than 24 hours (86400 seconds)
LocationPingSchema.index({ ts: 1 }, { expireAfterSeconds: 86400 });

export const LocationPing = mongoose.model<ILocationPing>('LocationPing', LocationPingSchema);
