import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Food cluster statuses
    open: 'bg-blue-100 text-blue-800',
    filled: 'bg-purple-100 text-purple-800',
    ordered: 'bg-yellow-100 text-yellow-800',
    ready: 'bg-indigo-100 text-indigo-800',
    collecting: 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    // Ride cluster statuses
    in_progress: 'bg-orange-100 text-orange-800',
    // Legacy
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-purple-100 text-purple-800',
    delivering: 'bg-orange-100 text-orange-800',
    forming: 'bg-gray-100 text-gray-800',
    active: 'bg-green-100 text-green-800',
    locked: 'bg-yellow-100 text-yellow-800',
    available: 'bg-green-100 text-green-800',
    assigned: 'bg-blue-100 text-blue-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
