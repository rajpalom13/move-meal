'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuthStore } from '@/context/auth-store';
import { GoogleMapsProvider } from '@/components/maps';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated, token, user, initializeSocket } = useAuthStore();

  useEffect(() => {
    // Wait for hydration to complete before checking auth
    if (!_hasHydrated) return;

    // If no token after hydration, redirect to login
    if (!token || !isAuthenticated) {
      router.push('/auth/login');
    } else {
      // Initialize socket connection after hydration if authenticated
      initializeSocket();
    }
  }, [_hasHydrated, token, isAuthenticated, router, initializeSocket]);

  // Show loading while hydrating
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="animate-spin h-8 w-8 border-3 border-coral border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show loading if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="animate-spin h-8 w-8 border-3 border-coral border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <GoogleMapsProvider>
      <div className="flex h-screen bg-cream-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </GoogleMapsProvider>
  );
}
