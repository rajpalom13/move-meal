'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/context/auth-store';
import { GoogleMapsProvider } from '@/components/maps';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

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
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <div className="animate-spin h-8 w-8 border-3 border-slate-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show loading if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <div className="animate-spin h-8 w-8 border-3 border-slate-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <GoogleMapsProvider>
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col gap-2 p-4 lg:p-6">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </GoogleMapsProvider>
  );
}
