// Shared types between client and server

export type UserRole = 'user' | 'vendor' | 'admin' | 'rider';
export type ClusterStatus = 'forming' | 'active' | 'locked' | 'delivering' | 'completed' | 'cancelled';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
export type RideStatus = 'available' | 'assigned' | 'in_progress' | 'completed';
export type VehicleType = 'bike' | 'scooter' | 'car';

export interface GeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
}

export interface UserPreferences {
  cuisines: string[];
  dietary: string[];
  priceRange: 'low' | 'medium' | 'high';
}

export interface OperatingHours {
  day: number; // 0-6 (Sunday-Saturday)
  open: string; // HH:mm format
  close: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}
