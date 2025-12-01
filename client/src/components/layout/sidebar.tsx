'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/context/auth-store';
import {
  Home,
  UtensilsCrossed,
  Car,
  User,
  LogOut,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Student platform navigation - no admin/vendor roles
const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/food-clusters', label: 'Food Clusters', icon: UtensilsCrossed },
  { href: '/ride-clusters', label: 'Ride Clusters', icon: Car },
  { href: '/profile', label: 'Profile', icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <div className="flex flex-col h-full w-64 bg-white border-r border-cream-200">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-cream-200">
        <div className="h-9 w-9 rounded-lg bg-coral flex items-center justify-center">
          <span className="text-white font-bold text-lg">M</span>
        </div>
        <span className="text-xl font-semibold text-carbon-900">MoveNmeal</span>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-cream-200">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-cream-50">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="bg-sage-100 text-sage-700 font-medium">
              {user?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-carbon-900 truncate">{user?.name}</p>
            <p className="text-xs text-carbon-500">{user?.college || 'Student'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-coral/10 text-coral border-l-2 border-coral'
                  : 'text-carbon-600 hover:bg-cream-100 hover:text-carbon-900'
              )}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-cream-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-coral hover:bg-coral/10 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
