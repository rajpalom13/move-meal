import mongoose, { Schema } from 'mongoose';
import { IOTP } from '../types/index.js';

const otpSchema = new Schema<IOTP>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['login', 'delivery', 'verification'],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups and auto-expiry
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ userId: 1, type: 1 });

export const OTP = mongoose.model<IOTP>('OTP', otpSchema);
export default OTP;
