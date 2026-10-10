import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IGeofence extends Document {
  groupId: Types.ObjectId;
  name: string;
  lat: number;
  lng: number;
  radiusM: number;
  createdAt: Date;
  updatedAt: Date;
}

const GeofenceSchema = new Schema<IGeofence>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    radiusM: {
      type: Number,
      required: true,
      min: 10,
      max: 50000,
    },
  },
  {
    timestamps: true,
  }
);

export const Geofence = mongoose.model<IGeofence>('Geofence', GeofenceSchema);
