import mongoose, { Schema } from 'mongoose';
import { IMenuItem } from '../types/index.js';

const menuItemSchema = new Schema<IMenuItem>(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    dietary: [{
      type: String,
      enum: ['vegetarian', 'vegan', 'gluten-free', 'halal', 'kosher', 'dairy-free', 'nut-free'],
    }],
    preparationTime: {
      type: Number,
      default: 15, // minutes
    },
  },
  {
    timestamps: true,
  }
);

menuItemSchema.index({ vendor: 1 });
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ dietary: 1 });

export const MenuItem = mongoose.model<IMenuItem>('MenuItem', menuItemSchema);
export default MenuItem;
