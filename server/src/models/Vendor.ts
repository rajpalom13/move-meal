import mongoose, { Schema } from 'mongoose';
import { IVendor } from '../types/index.js';

const vendorSchema = new Schema<IVendor>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    cuisineTypes: [{
      type: String,
      trim: true,
    }],
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
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    operatingHours: [{
      day: {
        type: Number,
        min: 0,
        max: 6,
      },
      open: String,
      close: String,
    }],
    menu: [{
      type: Schema.Types.ObjectId,
      ref: 'MenuItem',
    }],
  },
  {
    timestamps: true,
  }
);

vendorSchema.index({ location: '2dsphere' });
vendorSchema.index({ cuisineTypes: 1 });
vendorSchema.index({ rating: -1 });

export const Vendor = mongoose.model<IVendor>('Vendor', vendorSchema);
export default Vendor;
