import mongoose, { Schema } from 'mongoose';
import { ICluster } from '../types/index.js';

const clusterSchema = new Schema<ICluster>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    maxMembers: {
      type: Number,
      default: 10,
      min: 2,
      max: 20,
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
    deliveryLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
    status: {
      type: String,
      enum: ['forming', 'active', 'locked', 'delivering', 'completed', 'cancelled'],
      default: 'forming',
    },
    scheduledTime: {
      type: Date,
    },
    orders: [{
      type: Schema.Types.ObjectId,
      ref: 'Order',
    }],
    totalAmount: {
      type: Number,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    rider: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    aiSuggested: {
      type: Boolean,
      default: false,
    },
    aiScore: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

clusterSchema.index({ location: '2dsphere' });
clusterSchema.index({ deliveryLocation: '2dsphere' });
clusterSchema.index({ status: 1 });
clusterSchema.index({ vendor: 1 });
clusterSchema.index({ scheduledTime: 1 });

export const Cluster = mongoose.model<ICluster>('Cluster', clusterSchema);
export default Cluster;
