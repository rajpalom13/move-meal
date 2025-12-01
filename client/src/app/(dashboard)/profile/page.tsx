'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/context/auth-store';
import { authApi } from '@/lib/api';
import {
  User,
  MapPin,
  Phone,
  Mail,
  Shield,
  Settings,
  Edit3,
  Check,
  X,
  LogOut,
  ChevronRight,
  GraduationCap,
  Utensils,
  Car,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, updateUser, logout } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    college: user?.college || '',
  });
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const response = await authApi.updateProfile(token, formData);
      updateUser((response as { data: { name: string; phone: string; college?: string } }).data);
      setEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      college: user?.college || '',
    });
    setEditing(false);
  };

  const stats = [
    { label: 'Food Clusters', value: '12', icon: Utensils, color: 'bg-coral/10 text-coral' },
    { label: 'Ride Shares', value: '8', icon: Car, color: 'bg-sage-100 text-sage-700' },
    { label: 'Total Saved', value: '₹2,450', icon: Check, color: 'bg-sage-100 text-sage-700' },
  ];

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Profile Header */}
      <div className="relative mb-8">
        {/* Banner */}
        <div className="h-32 rounded-xl bg-carbon-900 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-sage/10 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-coral/10 rounded-full translate-y-1/2 -translate-x-1/4" />
        </div>

        {/* Avatar & Info */}
        <div className="px-6 pb-6 -mt-12 relative">
          <div className="flex items-end gap-4">
            <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-3xl bg-sage-100 text-sage-700 font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-carbon-900">{user?.name}</h1>
                {user?.isVerified && (
                  <div className="h-5 w-5 rounded-full bg-sage flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <p className="text-carbon-500">{user?.email}</p>
            </div>
            <Button
              variant={editing ? 'default' : 'outline'}
              size="sm"
              onClick={() => editing ? handleSave() : setEditing(true)}
              disabled={saving}
            >
              {saving ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : editing ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Save
                </>
              ) : (
                <>
                  <Edit3 className="h-4 w-4 mr-1" />
                  Edit
                </>
              )}
            </Button>
            {editing && (
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6 stagger-children">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-4 border border-cream-200 text-center hover:shadow-md hover:border-sage/30 transition-all duration-200"
          >
            <div className={`h-10 w-10 rounded-xl ${stat.color} flex items-center justify-center mx-auto mb-2`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-xl font-bold text-carbon-900">{stat.value}</p>
            <p className="text-xs text-carbon-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden mb-6 animate-fade-in-up">
        <div className="p-5 border-b border-cream-200">
          <h2 className="font-semibold text-carbon-900 flex items-center gap-2">
            <User className="h-5 w-5 text-carbon-400" />
            Personal Information
          </h2>
        </div>

        <div className="divide-y divide-cream-200">
          {/* Name */}
          <div className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-cream-100 flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-carbon-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-carbon-500 mb-0.5">Full Name</p>
              {editing ? (
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-9"
                />
              ) : (
                <p className="font-medium text-carbon-900 truncate">{user?.name}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-cream-100 flex items-center justify-center flex-shrink-0">
              <Mail className="h-5 w-5 text-carbon-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-carbon-500 mb-0.5">Email</p>
              <p className="font-medium text-carbon-900 truncate">{user?.email}</p>
            </div>
            {user?.isVerified && (
              <span className="text-xs px-2 py-1 bg-sage-100 text-sage-700 rounded-full font-medium">
                Verified
              </span>
            )}
          </div>

          {/* Phone */}
          <div className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-cream-100 flex items-center justify-center flex-shrink-0">
              <Phone className="h-5 w-5 text-carbon-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-carbon-500 mb-0.5">Phone</p>
              {editing ? (
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-9"
                />
              ) : (
                <p className="font-medium text-carbon-900 truncate">{user?.phone || 'Not set'}</p>
              )}
            </div>
          </div>

          {/* College */}
          <div className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-cream-100 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="h-5 w-5 text-carbon-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-carbon-500 mb-0.5">College</p>
              {editing ? (
                <Input
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  placeholder="Enter your college name"
                  className="h-9"
                />
              ) : (
                <p className="font-medium text-carbon-900 truncate">{user?.college || 'Not set'}</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-cream-100 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-5 w-5 text-carbon-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-carbon-500 mb-0.5">Location</p>
              <p className="font-medium text-carbon-900 truncate">
                {user?.location?.address || 'Location not set'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="p-5 border-b border-cream-200">
          <h2 className="font-semibold text-carbon-900 flex items-center gap-2">
            <Settings className="h-5 w-5 text-carbon-400" />
            Settings
          </h2>
        </div>

        <div className="divide-y divide-cream-200">
          <button className="w-full p-4 flex items-center gap-4 hover:bg-cream-50 transition-colors text-left">
            <div className="h-10 w-10 rounded-xl bg-sage-100 flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-sage-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-carbon-900">Privacy & Security</p>
              <p className="text-sm text-carbon-500">Manage your account security</p>
            </div>
            <ChevronRight className="h-5 w-5 text-carbon-300" />
          </button>

          <button className="w-full p-4 flex items-center gap-4 hover:bg-cream-50 transition-colors text-left">
            <div className="h-10 w-10 rounded-xl bg-sage-100 flex items-center justify-center flex-shrink-0">
              <Settings className="h-5 w-5 text-sage-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-carbon-900">Preferences</p>
              <p className="text-sm text-carbon-500">Customize your experience</p>
            </div>
            <ChevronRight className="h-5 w-5 text-carbon-300" />
          </button>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full bg-white rounded-2xl border border-cream-200 p-4 flex items-center gap-4 hover:bg-coral/5 hover:border-coral/30 transition-all duration-200 group animate-fade-in-up"
        style={{ animationDelay: '0.2s' }}
      >
        <div className="h-10 w-10 rounded-xl bg-coral/10 flex items-center justify-center flex-shrink-0 group-hover:bg-coral/20 transition-colors">
          <LogOut className="h-5 w-5 text-coral" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-medium text-coral">Log Out</p>
          <p className="text-sm text-coral/70">Sign out of your account</p>
        </div>
      </button>

      {/* Version */}
      <p className="text-center text-xs text-carbon-400 mt-8 pb-8">
        MoveNmeal v1.0.0
      </p>
    </div>
  );
}
