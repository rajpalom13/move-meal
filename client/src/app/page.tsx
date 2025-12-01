'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Users, Truck, Shield, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/context/auth-store';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  // Show loading while checking auth
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <div className="animate-spin h-8 w-8 border-3 border-slate-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  // If authenticated, show loading while redirecting
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <div className="animate-spin h-8 w-8 border-3 border-slate-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-blue flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-2xl font-semibold text-charcoal-dark">MoveNmeal</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-forest-100 rounded-full text-forest-700 text-sm font-medium mb-8">
          <span className="h-2 w-2 bg-forest-500 rounded-full"></span>
          Save up to 50% on delivery fees
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-charcoal-dark mb-6 tracking-tight">
          Order Together,<br />
          <span className="text-slate-blue">Save Together</span>
        </h1>
        <p className="text-lg text-charcoal mb-10 max-w-xl mx-auto leading-relaxed">
          Join food clusters with people nearby and split delivery fees.
          AI-powered recommendations help you find the perfect group.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/auth/register">
            <Button size="lg" className="px-8">
              Start Ordering
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button size="lg" variant="outline" className="px-8">
              Learn More
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-charcoal-dark mb-4">
            How It Works
          </h2>
          <p className="text-charcoal max-w-md mx-auto">
            Four simple steps to start saving on every order
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 bg-white shadow-sm hover:shadow-md">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-forest-100 flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-forest-600" />
              </div>
              <CardTitle className="text-lg">Find Nearby</CardTitle>
              <CardDescription>
                Discover food clusters forming near you with AI-powered recommendations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 bg-white shadow-sm hover:shadow-md">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-slate-blue/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-slate-blue" />
              </div>
              <CardTitle className="text-lg">Join or Create</CardTitle>
              <CardDescription>
                Join an existing cluster or create your own and invite others
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 bg-white shadow-sm hover:shadow-md">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-ivory-200 flex items-center justify-center mb-4">
                <Truck className="h-6 w-6 text-charcoal" />
              </div>
              <CardTitle className="text-lg">Track Live</CardTitle>
              <CardDescription>
                Watch your order progress from kitchen to doorstep in real-time
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 bg-white shadow-sm hover:shadow-md">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-forest-100 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-forest-600" />
              </div>
              <CardTitle className="text-lg">Secure Pickup</CardTitle>
              <CardDescription>
                OTP-verified delivery ensures your food reaches the right hands
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-charcoal-dark py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-5xl font-bold text-slate-blue mb-2">50%</div>
              <div className="text-charcoal-light">Average Savings on Delivery</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-forest mb-2">10K+</div>
              <div className="text-charcoal-light">Active Users</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-ivory mb-2">500+</div>
              <div className="text-charcoal-light">Partner Restaurants</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl p-12 shadow-sm border border-ivory-200">
          <h2 className="text-3xl font-bold text-charcoal-dark mb-4">
            Ready to Save?
          </h2>
          <p className="text-charcoal mb-8">
            Join thousands saving money through shared deliveries.
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="px-12">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal-dark text-charcoal-light py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-lg bg-slate-blue flex items-center justify-center">
                  <span className="text-white font-bold">M</span>
                </div>
                <span className="text-xl font-semibold text-white">MoveNmeal</span>
              </div>
              <p className="text-sm text-charcoal">
                Order together, save together. The smarter way to get food delivered.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">How it works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">For Restaurants</a></li>
                <li><a href="#" className="hover:text-white transition-colors">For Riders</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-charcoal mt-12 pt-8 text-center text-sm text-charcoal">
            &copy; {new Date().getFullYear()} MoveNmeal. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
