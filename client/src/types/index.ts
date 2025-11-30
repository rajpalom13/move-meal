export interface User {
  _id: string;
  email: string;
  phone: string;
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
  createdAt: string;
  updatedAt: string;
}

// ============ FOOD CLUSTER TYPES ============

export type FoodClusterStatus = 'open' | 'filled' | 'ordered' | 'ready' | 'collecting' | 'completed' | 'cancelled';

export interface FoodClusterMember {
  user: User;
  orderAmount: number;
  items: string;
  joinedAt: string;
  collectionOtp?: string; // Only visible to the member themselves
  hasCollected: boolean;
  collectedAt?: string;
}

export interface FoodCluster {
  _id: string;
  title: string;
  creator: User;
  restaurant: string;
  restaurantAddress?: string;
  minimumBasket: number;
  currentTotal: number;
  members: FoodClusterMember[];
  maxMembers: number;
  deliveryLocation: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  deliveryTime?: string;
  status: FoodClusterStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields from API
  basketProgress?: number;
  amountNeeded?: number;
  myOtp?: string; // User's own OTP (from getMyFoodClusters)
  myCollected?: boolean; // Whether current user has collected
}

// ============ RIDE CLUSTER TYPES ============

export type RideClusterStatus = 'open' | 'filled' | 'in_progress' | 'completed' | 'cancelled';

export interface RideStop {
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  address: string;
  order: number;
  user?: User;
}

export interface RideClusterMember {
  user: User;
  pickupPoint: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  joinedAt: string;
}

export interface RideCluster {
  _id: string;
  title: string;
  creator: User;
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
  stops: RideStop[];
  members: RideClusterMember[];
  seatsRequired: number;
  seatsAvailable: number;
  totalFare: number;
  farePerPerson: number;
  departureTime: string;
  vehicleType: 'auto' | 'cab' | 'bike' | 'carpool';
  femaleOnly: boolean;
  status: RideClusterStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Computed field
  distance?: number;
}

// ============ API TYPES ============

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Legacy types for backward compatibility (will be removed)
export type ClusterStatus = FoodClusterStatus;
export type Cluster = FoodCluster;
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
export interface Order {
  _id: string;
  status: OrderStatus;
  items?: { name: string }[];
  totalAmount: number;
  vendor?: { businessName: string };
}
export interface Vendor {
  _id: string;
  businessName: string;
}
export interface Ride {
  _id: string;
  rider?: User;
  vehicleType: string;
  rating?: number;
  distance?: number;
}
export interface ClusterRecommendation {
  clusterId: string;
  score: number;
  reasons: string[];
  estimatedSavings: number;
  cluster?: FoodCluster;
}
