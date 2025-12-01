'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/context/auth-store';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  User,
  Phone,
  Mail,
  Edit3,
  Check,
  LogOut,
  GraduationCap,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, updateUser, logout } = useAuthStore();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    college: user?.college || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/auth/login');
  };

  const openEditDialog = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      college: user?.college || '',
    });
    setError('');
    setShowEditDialog(true);
  };

  const handleSave = async () => {
    if (!token) return;

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await authApi.updateProfile(token, formData);
      updateUser((response as { data: { name: string; phone: string; college?: string } }).data);
      setShowEditDialog(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseDialog = () => {
    if (!saving) {
      setShowEditDialog(false);
      setError('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-charcoal-dark">Profile</h1>
        <p className="text-sm text-charcoal mt-1">Manage your account details</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="text-2xl bg-slate-blue/10 text-slate-blue font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-charcoal-dark">{user?.name}</h2>
              {user?.isVerified && (
                <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <p className="text-charcoal text-sm">{user?.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={openEditDialog}>
            <Edit3 className="h-4 w-4 mr-1.5" />
            Edit
          </Button>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-medium text-charcoal-dark">Personal Information</h3>
        </div>
        <div className="divide-y divide-gray-100">
          <div className="px-6 py-4 flex items-center gap-4">
            <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-charcoal">Full Name</p>
              <p className="text-sm font-medium text-charcoal-dark">{user?.name || 'Not set'}</p>
            </div>
          </div>

          <div className="px-6 py-4 flex items-center gap-4">
            <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Mail className="h-4 w-4 text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-charcoal">Email</p>
              <p className="text-sm font-medium text-charcoal-dark">{user?.email}</p>
            </div>
            {user?.isVerified && (
              <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                Verified
              </span>
            )}
          </div>

          <div className="px-6 py-4 flex items-center gap-4">
            <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Phone className="h-4 w-4 text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-charcoal">Phone</p>
              <p className="text-sm font-medium text-charcoal-dark">{user?.phone || 'Not set'}</p>
            </div>
          </div>

          <div className="px-6 py-4 flex items-center gap-4">
            <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="h-4 w-4 text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-charcoal">College</p>
              <p className="text-sm font-medium text-charcoal-dark">{user?.college || 'Not set'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-medium text-charcoal-dark">Quick Links</h3>
        </div>
        <div className="divide-y divide-gray-100">
          <Link
            href="/dashboard/help"
            className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
          >
            <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="h-4 w-4 text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-charcoal-dark">Help & FAQ</p>
              <p className="text-xs text-charcoal">Get answers to common questions</p>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full px-6 py-4 flex items-center gap-4 hover:bg-red-50 transition-colors text-left"
          >
            <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <LogOut className="h-4 w-4 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-600">Log Out</p>
              <p className="text-xs text-red-400">Sign out of your account</p>
            </div>
          </button>
        </div>
      </div>

      {/* Version */}
      <p className="text-center text-xs text-charcoal-light pb-4">
        MoveNmeal v1.0.0
      </p>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal information.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-college">College</Label>
              <Input
                id="edit-college"
                value={formData.college}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                placeholder="Enter your college name"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDialog}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
