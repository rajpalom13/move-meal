import mongoose, { Schema } from 'mongoose';
import { IRide } from '../types/index.js';

const rideSchema = new Schema<IRide>(
  {
    rider: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    status: {
      type: String,
      enum: ['available', 'assigned', 'in_progress', 'completed'],
      default: 'available',
    },
    assignedCluster: {
      type: Schema.Types.ObjectId,
      ref: 'Cluster',
    },
    vehicleType: {
      type: String,
      enum: ['bike', 'scooter', 'car'],
      default: 'bike',
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalDeliveries: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

rideSchema.index({ currentLocation: '2dsphere' });
rideSchema.index({ status: 1 });

export const Ride = mongoose.model<IRide>('Ride', rideSchema);
export default Ride;
