export interface User {
  _id: string;
  id: string; // Alias for _id
  email: string;
  phone: string;
  name: string;
  college?: string;
  avatar?: string;
  isVerified: boolean;
  gender?: 'male' | 'female' | 'other';
  role?: 'user' | 'admin' | 'vendor' | 'rider';
  location?: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ============ VENDOR TYPES ============

export interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  image?: string;
  isAvailable: boolean;
}

export interface Vendor {
  _id: string;
  businessName: string;
  cuisineTypes: string[];
  isOpen: boolean;
  rating: number;
  totalRatings: number;
  location: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  menu?: MenuItem[];
  description?: string;
  phone?: string;
  email?: string;
  openingHours?: {
    open: string;
    close: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// ============ ORDER TYPES ============

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';

export interface OrderItem {
  name: string;
  quantity?: number;
  price?: number;
}

export interface Order {
  _id: string;
  status: OrderStatus;
  items?: OrderItem[];
  totalAmount: number;
  vendor?: { businessName: string };
  user?: User;
  createdAt: string;
  cluster?: {
    _id: string;
    title: string;
    name?: string;
  };
  senderVerified?: boolean;
  receiverVerified?: boolean;
}

// ============ FOOD CLUSTER TYPES ============

export type FoodClusterStatus = 'open' | 'filled' | 'ordered' | 'ready' | 'collecting' | 'completed' | 'cancelled' | 'forming' | 'active' | 'locked' | 'delivering';

export interface FoodClusterMember {
  user: User;
  orderAmount: number;
  items: string;
  joinedAt: string;
  collectionOtp?: string;
  hasCollected: boolean;
  collectedAt?: string;
}

export interface FoodCluster {
  _id: string;
  title: string;
  name?: string; // Alias for title
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
  location?: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  deliveryTime?: string;
  scheduledTime?: string;
  status: FoodClusterStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields from API
  basketProgress?: number;
  amountNeeded?: number;
  myOtp?: string;
  myCollected?: boolean;
  // Additional fields for cluster page
  vendor?: Vendor;
  orders?: Order[];
  totalAmount?: number;
  deliveryFee?: number;
  aiSuggested?: boolean;
  aiScore?: number;
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

// ============ ADMIN TYPES ============

export interface DashboardStats {
  totalUsers: number;
  totalVendors: number;
  totalRiders: number;
  totalOrders: number;
  totalClusters: number;
  totalRevenue?: number;
  activeUsers?: number;
}

// Legacy types for backward compatibility
export type ClusterStatus = FoodClusterStatus;
export type Cluster = FoodCluster;

export interface Ride {
  _id: string;
  rider?: User;
  vehicleType: string;
  rating?: number;
  distance?: number;
  status?: string;
  pickup?: { address?: string };
  dropoff?: { address?: string };
  fare?: number;
  createdAt?: string;
  totalDeliveries?: number;
  totalEarnings?: number;
}

export interface ClusterRecommendation {
  clusterId: string;
  score: number;
  reasons: string[];
  estimatedSavings: number;
  cluster?: FoodCluster;
}
