'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/context/auth-store';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, isAuthenticated, _hasHydrated } = useAuthStore();

  // Redirect if already logged in
  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    college: '',
    gender: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        college: formData.college || undefined,
        gender: formData.gender || undefined,
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  // Show loading while checking auth or if already authenticated
  if (!_hasHydrated || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <div className="animate-spin h-8 w-8 border-3 border-slate-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory py-12 px-4">
      <Card className="w-full max-w-md border-0 shadow-sm">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="MoveNmeal"
              width={56}
              height={56}
              className="rounded-lg"
            />
          </div>
          <CardTitle className="text-2xl text-charcoal-dark">Join MoveNmeal</CardTitle>
          <CardDescription className="text-charcoal">Create an account to share rides and food orders</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-slate-blue/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal-dark mb-1.5">Full Name *</label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-dark mb-1.5">Email *</label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@college.edu"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-dark mb-1.5">Phone Number *</label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 9876543210"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-dark mb-1.5">College / University</label>
              <Input
                name="college"
                value={formData.college}
                onChange={handleChange}
                placeholder="Your college name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-dark mb-1.5">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-md border border-ivory-200 bg-ivory/50 text-sm text-charcoal-dark transition-all duration-200 focus:border-slate-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-blue/20"
              >
                <option value="">Select gender (optional)</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <p className="text-xs text-charcoal mt-1.5">
                Required for female-only ride clusters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-dark mb-1.5">Password *</label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-dark mb-1.5">Confirm Password *</label>
              <Input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-charcoal">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-slate-blue hover:underline font-medium">
              Sign in
            </Link>
          </div>

          <p className="mt-4 text-xs text-center text-charcoal-light">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-slate-blue hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-slate-blue hover:underline">Privacy Policy</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
