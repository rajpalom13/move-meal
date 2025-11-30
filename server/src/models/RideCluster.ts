import mongoose, { Schema } from 'mongoose';
import { IRideCluster, IRideClusterMember, IRideStop } from '../types/index.js';

const rideStopSchema = new Schema<IRideStop>(
  {
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
    },
    address: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: false }
);

const rideClusterMemberSchema = new Schema<IRideClusterMember>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pickupPoint: {
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
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const rideClusterSchema = new Schema<IRideCluster>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startPoint: {
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
    endPoint: {
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
    stops: [rideStopSchema],
    members: [rideClusterMemberSchema],
    seatsRequired: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
    seatsAvailable: {
      type: Number,
      required: true,
    },
    totalFare: {
      type: Number,
      required: true,
      min: 0,
    },
    farePerPerson: {
      type: Number,
      default: 0,
    },
    departureTime: {
      type: Date,
      required: true,
    },
    vehicleType: {
      type: String,
      enum: ['auto', 'cab', 'bike', 'carpool'],
      default: 'auto',
    },
    femaleOnly: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['open', 'filled', 'in_progress', 'completed', 'cancelled'],
      default: 'open',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

rideClusterSchema.index({ startPoint: '2dsphere' });
rideClusterSchema.index({ endPoint: '2dsphere' });
rideClusterSchema.index({ status: 1 });
rideClusterSchema.index({ departureTime: 1 });
rideClusterSchema.index({ femaleOnly: 1 });

// Auto-calculate fare per person
rideClusterSchema.pre('save', function (next) {
  const memberCount = this.members.length || 1;
  this.farePerPerson = Math.ceil(this.totalFare / this.seatsRequired);

  // Update seats available
  this.seatsAvailable = this.seatsRequired - this.members.length;

  // Auto-update status when filled
  if (this.seatsAvailable <= 0 && this.status === 'open') {
    this.status = 'filled';
  }

  next();
});

export const RideCluster = mongoose.model<IRideCluster>('RideCluster', rideClusterSchema);
export default RideCluster;
