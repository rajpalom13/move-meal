import { Request } from 'express';
import { Document, Types } from 'mongoose';

// User types
export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  phone: string;
  password: string;
  name: string;
  college?: string;
  avatar?: string;
  isVerified: boolean;
  gender?: 'male' | 'female' | 'other';
  location?: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// OTP types
export interface IOTP extends Document {
  userId: Types.ObjectId;
  code: string;
  type: 'login' | 'verification';
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

// ============ FOOD CLUSTER TYPES ============

export type FoodClusterStatus = 'open' | 'filled' | 'ordered' | 'ready' | 'collecting' | 'completed' | 'cancelled';

export interface IFoodClusterMember {
  user: Types.ObjectId;
  orderAmount: number;
  items: string; // Description of what they want to order
  joinedAt: Date;
  collectionOtp?: string; // Unique OTP for collection verification
  hasCollected: boolean; // Whether this member has collected their order
  collectedAt?: Date; // When they collected
}

export interface IFoodCluster extends Document {
  _id: Types.ObjectId;
  title: string;
  creator: Types.ObjectId;
  restaurant: string;
  restaurantAddress?: string;
  minimumBasket: number; // e.g., 250
  currentTotal: number; // Sum of all member order amounts
  members: IFoodClusterMember[];
  maxMembers: number;
  deliveryLocation: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  deliveryTime?: Date; // Preferred delivery time
  status: FoodClusterStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============ RIDE CLUSTER TYPES ============

export type RideClusterStatus = 'open' | 'filled' | 'in_progress' | 'completed' | 'cancelled';

export interface IRideStop {
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  address: string;
  order: number; // Stop order in route
  user?: Types.ObjectId; // Which user gets picked up here
}

export interface IRideClusterMember {
  user: Types.ObjectId;
  pickupPoint: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  joinedAt: Date;
}

export interface IRideCluster extends Document {
  _id: Types.ObjectId;
  title: string;
  creator: Types.ObjectId;
  startPoint: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  endPoint: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  stops: IRideStop[]; // Intermediate pickup points
  members: IRideClusterMember[];
  seatsRequired: number; // Total seats needed
  seatsAvailable: number; // Seats still available
  totalFare: number;
  farePerPerson: number;
  departureTime: Date;
  vehicleType: 'auto' | 'cab' | 'bike' | 'carpool';
  femaleOnly: boolean;
  status: RideClusterStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Extended Request with user
export interface AuthRequest extends Request {
  user?: IUser;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Pagination
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
