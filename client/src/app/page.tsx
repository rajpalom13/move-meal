'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Users, Truck, Shield, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-coral flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-2xl font-semibold text-carbon-900">MoveNmeal</span>
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
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-sage-100 rounded-full text-sage-700 text-sm font-medium mb-8">
          <span className="h-2 w-2 bg-sage-500 rounded-full"></span>
          Save up to 50% on delivery fees
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-carbon-900 mb-6 tracking-tight">
          Order Together,<br />
          <span className="text-coral">Save Together</span>
        </h1>
        <p className="text-lg text-carbon-500 mb-10 max-w-xl mx-auto leading-relaxed">
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
          <h2 className="text-3xl font-bold text-carbon-900 mb-4">
            How It Works
          </h2>
          <p className="text-carbon-500 max-w-md mx-auto">
            Four simple steps to start saving on every order
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 bg-white shadow-sm hover:shadow-md">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-sage-100 flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-sage-600" />
              </div>
              <CardTitle className="text-lg">Find Nearby</CardTitle>
              <CardDescription>
                Discover food clusters forming near you with AI-powered recommendations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 bg-white shadow-sm hover:shadow-md">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-coral/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-coral" />
              </div>
              <CardTitle className="text-lg">Join or Create</CardTitle>
              <CardDescription>
                Join an existing cluster or create your own and invite others
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 bg-white shadow-sm hover:shadow-md">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-cream-200 flex items-center justify-center mb-4">
                <Truck className="h-6 w-6 text-carbon-600" />
              </div>
              <CardTitle className="text-lg">Track Live</CardTitle>
              <CardDescription>
                Watch your order progress from kitchen to doorstep in real-time
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 bg-white shadow-sm hover:shadow-md">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-sage-100 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-sage-600" />
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
      <section className="bg-carbon-900 py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-5xl font-bold text-coral mb-2">50%</div>
              <div className="text-carbon-400">Average Savings on Delivery</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-sage mb-2">10K+</div>
              <div className="text-carbon-400">Active Users</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-cream mb-2">500+</div>
              <div className="text-carbon-400">Partner Restaurants</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl p-12 shadow-sm border border-cream-200">
          <h2 className="text-3xl font-bold text-carbon-900 mb-4">
            Ready to Save?
          </h2>
          <p className="text-carbon-500 mb-8">
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
      <footer className="bg-carbon-900 text-carbon-400 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-lg bg-coral flex items-center justify-center">
                  <span className="text-white font-bold">M</span>
                </div>
                <span className="text-xl font-semibold text-white">MoveNmeal</span>
              </div>
              <p className="text-sm text-carbon-500">
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
          <div className="border-t border-carbon-800 mt-12 pt-8 text-center text-sm text-carbon-500">
            &copy; {new Date().getFullYear()} MoveNmeal. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
