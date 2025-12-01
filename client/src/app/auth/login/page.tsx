'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/context/auth-store';
import { authApi } from '@/lib/api';
import { InputOTP } from '@/components/ui/input-otp';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithOTP, isLoading, isAuthenticated, _hasHydrated } = useAuthStore();

  // Redirect if already logged in
  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
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
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setError('');
    setSendingOTP(true);

    try {
      await authApi.sendOTP(email);
      setShowOTPDialog(true);
      setOtp('');
      // Start countdown for resend
      setResendCountdown(60);
      const interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setSendingOTP(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCountdown > 0) return;

    setSendingOTP(true);
    try {
      await authApi.sendOTP(email);
      setOtp('');
      setResendCountdown(60);
      const interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setSendingOTP(false);
    }
  };

  const handleOTPLogin = async () => {
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setError('');

    try {
      await loginWithOTP(email, otp);
      setShowOTPDialog(false);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    }
  };

  const handleCloseOTPDialog = () => {
    setShowOTPDialog(false);
    setOtp('');
    setError('');
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
          <CardTitle className="text-2xl text-charcoal-dark">Welcome back</CardTitle>
          <CardDescription className="text-charcoal">Sign in to your MoveNmeal account</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Login Mode Toggle */}
          <div className="flex mb-6 bg-ivory-100 rounded-lg p-1">
            <button
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                mode === 'password' ? 'bg-white text-charcoal-dark shadow-sm' : 'text-charcoal hover:text-charcoal-dark'
              }`}
              onClick={() => setMode('password')}
            >
              Password
            </button>
            <button
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                mode === 'otp' ? 'bg-white text-charcoal-dark shadow-sm' : 'text-charcoal hover:text-charcoal-dark'
              }`}
              onClick={() => setMode('otp')}
            >
              OTP
            </button>
          </div>

          {error && !showOTPDialog && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-slate-blue/20">
              {error}
            </div>
          )}

          {mode === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal-dark mb-1.5">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-dark mb-1.5">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal-dark mb-1.5">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <Button
                onClick={handleSendOTP}
                className="w-full"
                disabled={!email || sendingOTP}
              >
                {sendingOTP ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send OTP
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-charcoal">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-slate-blue hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* OTP Dialog */}
      <Dialog open={showOTPDialog} onOpenChange={setShowOTPDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Enter OTP</DialogTitle>
            <DialogDescription className="text-center">
              We&apos;ve sent a 6-digit code to<br />
              <span className="font-medium text-charcoal-dark">{email}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-slate-blue/20 text-center">
                {error}
              </div>
            )}

            <InputOTP
              length={6}
              value={otp}
              onChange={setOtp}
              disabled={isLoading}
            />

            <div className="space-y-3">
              <Button
                onClick={handleOTPLogin}
                className="w-full"
                disabled={otp.length !== 6 || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Sign In'
                )}
              </Button>

              <div className="text-center">
                {resendCountdown > 0 ? (
                  <p className="text-sm text-charcoal">
                    Resend OTP in <span className="font-medium text-slate-blue-600">{resendCountdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={sendingOTP}
                    className="text-sm text-slate-blue hover:underline font-medium disabled:opacity-50"
                  >
                    {sendingOTP ? 'Sending...' : 'Resend OTP'}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleCloseOTPDialog}
                className="w-full flex items-center justify-center gap-2 text-sm text-charcoal hover:text-charcoal-dark"
              >
                <ArrowLeft className="h-4 w-4" />
                Use a different email
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
