import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    open: 'bg-forest-100 text-forest-700',
    filled: 'bg-blue-100 text-blue-700',
    ordered: 'bg-amber-100 text-amber-700',
    ready: 'bg-purple-100 text-purple-700',
    collecting: 'bg-orange-100 text-orange-700',
    in_progress: 'bg-slate-blue/10 text-slate-blue',
    completed: 'bg-gray-100 text-charcoal',
    cancelled: 'bg-red-100 text-red-700',
  }
  return statusColors[status] || 'bg-gray-100 text-gray-700'
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}
