'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/context/auth-store';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithOTP, isLoading } = useAuthStore();

  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleSendOTP = async () => {
    setError('');
    try {
      await authApi.sendOTP(email);
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    }
  };

  const handleOTPLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await loginWithOTP(email, otp);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">M</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your MoveNmeal account</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Login Mode Toggle */}
          <div className="flex mb-6 border rounded-lg p-1">
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                mode === 'password' ? 'bg-orange-500 text-white' : 'text-gray-600'
              }`}
              onClick={() => setMode('password')}
            >
              Password
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                mode === 'otp' ? 'bg-orange-500 text-white' : 'text-gray-600'
              }`}
              onClick={() => setMode('otp')}
            >
              OTP
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          {mode === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              {!otpSent ? (
                <Button
                  onClick={handleSendOTP}
                  className="w-full"
                  disabled={!email || isLoading}
                >
                  Send OTP
                </Button>
              ) : (
                <form onSubmit={handleOTPLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Enter OTP</label>
                    <Input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      OTP sent to {email}
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                  </Button>
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    className="w-full text-sm text-orange-500 hover:underline"
                  >
                    Resend OTP
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-orange-500 hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
