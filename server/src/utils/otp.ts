import crypto from 'crypto';
import { OTP } from '../models/OTP.js';
import config from '../config/index.js';
import { Types } from 'mongoose';

export const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

export const createOTP = async (
  userId: Types.ObjectId,
  type: 'login' | 'delivery' | 'verification'
): Promise<string> => {
  // Invalidate existing OTPs of same type
  await OTP.updateMany(
    { userId, type, isUsed: false },
    { isUsed: true }
  );

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + config.otp.expiresIn * 60 * 1000);

  await OTP.create({
    userId,
    code,
    type,
    expiresAt,
  });

  return code;
};

export const verifyOTP = async (
  userId: Types.ObjectId,
  code: string,
  type: 'login' | 'delivery' | 'verification'
): Promise<boolean> => {
  const otp = await OTP.findOne({
    userId,
    code,
    type,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });

  if (!otp) {
    return false;
  }

  otp.isUsed = true;
  await otp.save();

  return true;
};

export const generateDeliveryOTPs = (): { senderOTP: string; receiverOTP: string } => {
  return {
    senderOTP: generateOTP(),
    receiverOTP: generateOTP(),
  };
};
