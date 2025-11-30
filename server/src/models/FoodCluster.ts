import mongoose, { Schema } from 'mongoose';
import { IFoodCluster, IFoodClusterMember } from '../types/index.js';

const foodClusterMemberSchema = new Schema<IFoodClusterMember>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    items: {
      type: String,
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    collectionOtp: {
      type: String,
    },
    hasCollected: {
      type: Boolean,
      default: false,
    },
    collectedAt: {
      type: Date,
    },
  },
  { _id: false }
);

const foodClusterSchema = new Schema<IFoodCluster>(
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
    restaurant: {
      type: String,
      required: true,
      trim: true,
    },
    restaurantAddress: {
      type: String,
      trim: true,
    },
    minimumBasket: {
      type: Number,
      required: true,
      min: 0,
    },
    currentTotal: {
      type: Number,
      default: 0,
    },
    members: [foodClusterMemberSchema],
    maxMembers: {
      type: Number,
      default: 10,
      min: 2,
      max: 20,
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
    deliveryTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['open', 'filled', 'ordered', 'ready', 'collecting', 'completed', 'cancelled'],
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

foodClusterSchema.index({ deliveryLocation: '2dsphere' });
foodClusterSchema.index({ status: 1 });
foodClusterSchema.index({ restaurant: 'text', title: 'text' });

// Auto-update status when basket is filled
foodClusterSchema.pre('save', function (next) {
  if (this.currentTotal >= this.minimumBasket && this.status === 'open') {
    this.status = 'filled';
  }

  // Check if all members have collected - mark as completed
  if (this.status === 'collecting') {
    const allCollected = this.members.every(m => m.hasCollected);
    if (allCollected) {
      this.status = 'completed';
    }
  }

  next();
});

export const FoodCluster = mongoose.model<IFoodCluster>('FoodCluster', foodClusterSchema);
export default FoodCluster;
