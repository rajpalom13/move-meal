import { Request as ExpressRequest } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { Document, Types } from 'mongoose';

// User Role
export type UserRole = 'user' | 'admin' | 'vendor' | 'rider';

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
  role: UserRole;
  gender?: 'male' | 'female' | 'other';
  location?: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
  };
  preferences?: {
    cuisines?: string[];
    dietaryRestrictions?: string[];
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

// ============ CLUSTER TYPES ============

export type ClusterStatus = 'forming' | 'active' | 'locked' | 'delivering' | 'completed' | 'cancelled' | 'open' | 'filled' | 'ordered' | 'ready';

export interface IClusterMember {
  user: Types.ObjectId;
  orderAmount?: number;
  joinedAt: Date;
}

export interface ICluster extends Document {
  _id: Types.ObjectId;
  name: string;
  title?: string;
  creator: Types.ObjectId;
  vendor?: Types.ObjectId;
  members: any[];
  maxMembers: number;
  currentTotal?: number;
  minimumBasket?: number;
  location?: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  deliveryLocation: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  scheduledTime?: Date;
  status: ClusterStatus;
  notes?: string;
  orders?: Types.ObjectId[];
  totalAmount?: number;
  deliveryFee?: number;
  rider?: Types.ObjectId;
  aiSuggested?: boolean;
  aiScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClusterRecommendation {
  clusterId?: string;
  score: number;
  reasons: string[];
  estimatedSavings: number;
  estimatedDeliveryTime: number;
  matchingPreferences: string[];
}

// ============ FOOD CLUSTER TYPES ============

export type FoodClusterStatus = 'open' | 'filled' | 'ordered' | 'ready' | 'collecting' | 'completed' | 'cancelled';

export interface IFoodClusterMember {
  user: Types.ObjectId;
  orderAmount: number;
  items: string;
  joinedAt: Date;
  collectionOtp?: string;
  hasCollected: boolean;
  collectedAt?: Date;
}

export interface IFoodCluster extends Document {
  _id: Types.ObjectId;
  title: string;
  creator: Types.ObjectId;
  restaurant: string;
  restaurantAddress?: string;
  minimumBasket: number;
  currentTotal: number;
  members: IFoodClusterMember[];
  maxMembers: number;
  deliveryLocation: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  deliveryTime?: Date;
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
  order: number;
  user?: Types.ObjectId;
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
  stops: IRideStop[];
  members: IRideClusterMember[];
  seatsRequired: number;
  seatsAvailable: number;
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

// ============ VENDOR TYPES ============

export interface IMenuItem extends Document {
  _id: Types.ObjectId;
  vendor: Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
  dietary?: string[];
  preparationTime?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVendor extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  businessName: string;
  name?: string;
  email?: string;
  phone?: string;
  description?: string;
  address?: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
  };
  cuisineTypes: string[];
  rating: number;
  totalRatings?: number;
  isOpen?: boolean;
  isActive?: boolean;
  operatingHours?: Array<{
    day: number;
    open: string;
    close: string;
  }>;
  menu?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// ============ ORDER TYPES ============

export interface IOrderItem {
  menuItem: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  cluster?: Types.ObjectId;
  vendor: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
  deliveryAddress?: string;
  deliveryLocation?: {
    type: 'Point';
    coordinates: [number, number];
  };
  senderOTP?: string;
  receiverOTP?: string;
  senderVerified?: boolean;
  receiverVerified?: boolean;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============ RIDE TYPES ============

export interface IRide extends Document {
  _id: Types.ObjectId;
  rider: Types.ObjectId;
  driver?: Types.ObjectId;
  passengers?: Types.ObjectId[];
  currentLocation?: {
    type: 'Point';
    coordinates: [number, number];
  };
  startPoint?: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  endPoint?: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  assignedCluster?: Types.ObjectId;
  vehicleType?: 'bike' | 'scooter' | 'car';
  fare?: number;
  rating?: number;
  totalDeliveries?: number;
  status: 'available' | 'assigned' | 'in_progress' | 'completed' | 'pending' | 'accepted' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// Extended Request with user
export interface AuthRequest extends ExpressRequest<ParamsDictionary, unknown, unknown, ParsedQs> {
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
