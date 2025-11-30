import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { Types } from 'mongoose';

interface TokenPayload {
  userId: string;
}

export const generateToken = (userId: Types.ObjectId): string => {
  const payload: TokenPayload = {
    userId: userId.toString(),
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
};

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
};
