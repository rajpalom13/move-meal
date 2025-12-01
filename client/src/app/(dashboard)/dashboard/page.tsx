'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/context/auth-store';
import { useLocation } from '@/hooks/useLocation';
import { foodClustersApi, rideClustersApi } from '@/lib/api';
import { FoodCluster, RideCluster } from '@/types';
import { formatCurrency } from '@/lib/utils';
import {
  MapPin,
  Users,
  Utensils,
  Car,
  Plus,
  Clock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Zap,
  ChevronRight,
  Store,
  Navigation,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, token, updateLocation } = useAuthStore();
  const location = useLocation();

  const [myFoodClusters, setMyFoodClusters] = useState<FoodCluster[]>([]);
  const [myRideClusters, setMyRideClusters] = useState<RideCluster[]>([]);
  const [nearbyFoodClusters, setNearbyFoodClusters] = useState<FoodCluster[]>([]);
  const [nearbyRideClusters, setNearbyRideClusters] = useState<RideCluster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.latitude && location.longitude && token) {
      updateLocation(location.latitude, location.longitude);
    }
  }, [location.latitude, location.longitude, token, updateLocation]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const [myFoodRes, myRideRes] = await Promise.all([
          foodClustersApi.getMy(token),
          rideClustersApi.getMy(token),
        ]);
        setMyFoodClusters((myFoodRes as { data: FoodCluster[] }).data || []);
        setMyRideClusters((myRideRes as { data: RideCluster[] }).data || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  useEffect(() => {
    const fetchLocationData = async () => {
      if (!token || !location.latitude || !location.longitude) return;
      try {
        const [foodRes, rideRes] = await Promise.all([
          foodClustersApi.getAll(token, {
            latitude: location.latitude.toString(),
            longitude: location.longitude.toString(),
          }),
          rideClustersApi.getNearby(token, location.latitude, location.longitude),
        ]);
        setNearbyFoodClusters((foodRes as { data: FoodCluster[] }).data || []);
        setNearbyRideClusters((rideRes as { data: RideCluster[] }).data || []);
      } catch (error) {
        console.error('Failed to fetch location data:', error);
      }
    };
    fetchLocationData();
  }, [token, location.latitude, location.longitude]);

  const activeFoodClusters = myFoodClusters.filter((c) => !['completed', 'cancelled'].includes(c.status));
  const activeRideClusters = myRideClusters.filter((c) => !['completed', 'cancelled'].includes(c.status));
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 rounded-full border-[3px] border-coral border-t-transparent animate-spin" />
          <p className="text-carbon-500 animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-carbon-900 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sage/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-coral/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-carbon-400 text-sm font-medium mb-1">{greeting}</p>
              <h1 className="text-3xl font-bold mb-2 text-white">{user?.name?.split(' ')[0]}</h1>
              <p className="text-carbon-400 flex items-center gap-2">
                {location.loading ? (
                  <>
                    <span className="h-2 w-2 bg-sage/50 rounded-full animate-pulse" />
                    Detecting location...
                  </>
                ) : location.latitude ? (
                  <>
                    <MapPin className="h-4 w-4 text-sage" />
                    Location enabled
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 opacity-50" />
                    Enable location for better experience
                  </>
                )}
              </p>
            </div>
            <Avatar className="h-14 w-14 border-2 border-sage/30">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-sage/20 text-white text-xl font-semibold">
                {user?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex gap-3 mt-6">
            <Link href="/food-clusters/create">
              <Button className="bg-coral text-white hover:bg-coral-600">
                <Utensils className="h-4 w-4 mr-2" />
                Food Cluster
              </Button>
            </Link>
            <Link href="/ride-clusters/create">
              <Button variant="outline" className="border-sage/30 text-white hover:bg-sage/10">
                <Car className="h-4 w-4 mr-2" />
                Ride Cluster
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        <div className="bg-white rounded-xl p-5 border border-cream-200 hover:shadow-sm hover:border-coral/30 transition-all duration-200 group">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-coral/10 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Utensils className="h-5 w-5 text-coral" />
            </div>
            <span className="text-2xl font-bold text-carbon-900">{activeFoodClusters.length}</span>
          </div>
          <p className="text-sm text-carbon-500">Active Food</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-cream-200 hover:shadow-sm hover:border-sage/50 transition-all duration-200 group">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-sage-100 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Car className="h-5 w-5 text-sage-600" />
            </div>
            <span className="text-2xl font-bold text-carbon-900">{activeRideClusters.length}</span>
          </div>
          <p className="text-sm text-carbon-500">Active Rides</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-cream-200 hover:shadow-sm hover:border-sage/50 transition-all duration-200 group">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-cream-200 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Store className="h-5 w-5 text-carbon-600" />
            </div>
            <span className="text-2xl font-bold text-carbon-900">{nearbyFoodClusters.length}</span>
          </div>
          <p className="text-sm text-carbon-500">Nearby Food</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-cream-200 hover:shadow-sm hover:border-sage/50 transition-all duration-200 group">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-sage-100 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Navigation className="h-5 w-5 text-sage-600" />
            </div>
            <span className="text-2xl font-bold text-carbon-900">{nearbyRideClusters.length}</span>
          </div>
          <p className="text-sm text-carbon-500">Nearby Rides</p>
        </div>
      </div>

      {/* Nearby Food Clusters */}
      {nearbyFoodClusters.length > 0 && (
        <section className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-coral flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-carbon-900">Food Clusters Nearby</h2>
                <p className="text-sm text-carbon-500">Join and save on delivery</p>
              </div>
            </div>
            <Link href="/food-clusters">
              <Button variant="ghost" size="sm" className="text-coral hover:text-coral-600 hover:bg-coral/5">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
            {nearbyFoodClusters.slice(0, 3).map((cluster) => {
              const progress = Math.min(100, Math.round((cluster.currentTotal / cluster.minimumBasket) * 100));
              return (
                <Link key={cluster._id} href={`/food-clusters/${cluster._id}`}>
                  <div className="bg-white rounded-xl p-5 border border-cream-200 hover:shadow-sm hover:border-coral/30 transition-all duration-200 group cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-carbon-900 truncate group-hover:text-coral transition-colors">
                          {cluster.title}
                        </h3>
                        <p className="text-sm text-carbon-500 truncate">{cluster.restaurant}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-carbon-300 group-hover:text-coral group-hover:translate-x-1 transition-all" />
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-carbon-500">{formatCurrency(cluster.currentTotal)}</span>
                          <span className="font-medium text-carbon-700">{progress}%</span>
                        </div>
                        <div className="h-2 bg-cream-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-coral rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-carbon-500">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {cluster.members?.length}/{cluster.maxMembers}
                        </span>
                        {(cluster.amountNeeded || 0) > 0 && (
                          <span className="text-coral font-medium">
                            +{formatCurrency(cluster.amountNeeded || 0)} needed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Nearby Rides */}
      {nearbyRideClusters.length > 0 && (
        <section className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-sage flex items-center justify-center">
                <Car className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-carbon-900">Rides Nearby</h2>
                <p className="text-sm text-carbon-500">Share your commute</p>
              </div>
            </div>
            <Link href="/ride-clusters">
              <Button variant="ghost" size="sm" className="text-sage-600 hover:text-sage-700 hover:bg-sage/5">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 stagger-children">
            {nearbyRideClusters.slice(0, 4).map((ride) => (
              <Link key={ride._id} href={`/ride-clusters/${ride._id}`}>
                <div className="bg-white rounded-xl p-5 border border-cream-200 hover:shadow-sm hover:border-sage/50 transition-all duration-200 group cursor-pointer">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-sage-100 text-sage-700 text-xs font-medium rounded-lg capitalize">
                      {ride.vehicleType}
                    </span>
                    {ride.femaleOnly && (
                      <span className="px-2 py-1 bg-coral/10 text-coral text-xs font-medium rounded-lg">
                        Female only
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-carbon-900 truncate mb-1 group-hover:text-sage-600 transition-colors">
                    {ride.title}
                  </h3>
                  <p className="text-sm text-carbon-500 truncate mb-3">{ride.endPoint?.address}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-carbon-500">
                      <Clock className="h-4 w-4" />
                      {new Date(ride.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <span className="text-lg font-bold text-carbon-900">{formatCurrency(ride.farePerPerson)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* My Clusters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Food Clusters */}
        <section className="bg-white rounded-xl border border-cream-200 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="p-5 border-b border-cream-200 flex items-center justify-between">
            <h2 className="font-semibold text-carbon-900">My Food Clusters</h2>
            <Link href="/food-clusters">
              <Button variant="ghost" size="sm" className="text-carbon-500 hover:text-carbon-700">
                See all
              </Button>
            </Link>
          </div>

          {myFoodClusters.length === 0 ? (
            <div className="p-8 text-center">
              <div className="h-16 w-16 mx-auto mb-4 rounded-xl bg-coral/10 flex items-center justify-center">
                <Utensils className="h-8 w-8 text-coral/50" />
              </div>
              <p className="text-carbon-500 mb-4">No food clusters yet</p>
              <Link href="/food-clusters/create">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create one
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-cream-200">
              {myFoodClusters.slice(0, 3).map((cluster) => (
                <Link key={cluster._id} href={`/food-clusters/${cluster._id}`}>
                  <div className="p-4 hover:bg-cream-50 transition-colors group">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-carbon-900 truncate group-hover:text-coral transition-colors">
                          {cluster.title}
                        </h3>
                        <p className="text-sm text-carbon-500">
                          {cluster.restaurant} • {formatCurrency(cluster.currentTotal)}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        cluster.status === 'open' ? 'bg-sage-100 text-sage-700' :
                        cluster.status === 'collecting' ? 'bg-coral/10 text-coral' :
                        'bg-cream-100 text-carbon-600'
                      }`}>
                        {cluster.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* My Ride Clusters */}
        <section className="bg-white rounded-xl border border-cream-200 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="p-5 border-b border-cream-200 flex items-center justify-between">
            <h2 className="font-semibold text-carbon-900">My Ride Clusters</h2>
            <Link href="/ride-clusters">
              <Button variant="ghost" size="sm" className="text-carbon-500 hover:text-carbon-700">
                See all
              </Button>
            </Link>
          </div>

          {myRideClusters.length === 0 ? (
            <div className="p-8 text-center">
              <div className="h-16 w-16 mx-auto mb-4 rounded-xl bg-sage-100 flex items-center justify-center">
                <Car className="h-8 w-8 text-sage/50" />
              </div>
              <p className="text-carbon-500 mb-4">No ride clusters yet</p>
              <Link href="/ride-clusters/create">
                <Button size="sm" variant="secondary">
                  <Plus className="h-4 w-4 mr-2" />
                  Create one
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-cream-200">
              {myRideClusters.slice(0, 3).map((ride) => (
                <Link key={ride._id} href={`/ride-clusters/${ride._id}`}>
                  <div className="p-4 hover:bg-cream-50 transition-colors group">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-carbon-900 truncate group-hover:text-sage-600 transition-colors">
                          {ride.title}
                        </h3>
                        <p className="text-sm text-carbon-500">
                          {ride.seatsAvailable} seats left • {formatCurrency(ride.farePerPerson)}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        ride.status === 'open' ? 'bg-sage-100 text-sage-700' :
                        ride.status === 'in_progress' ? 'bg-coral/10 text-coral' :
                        'bg-cream-100 text-carbon-600'
                      }`}>
                        {ride.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Empty State - No nearby clusters */}
      {nearbyFoodClusters.length === 0 && nearbyRideClusters.length === 0 && !location.loading && (
        <div className="text-center py-12 animate-fade-in-up">
          <div className="h-24 w-24 mx-auto mb-6 rounded-2xl bg-cream-100 flex items-center justify-center">
            <Sparkles className="h-12 w-12 text-coral/50" />
          </div>
          <h3 className="text-xl font-semibold text-carbon-900 mb-2">No clusters nearby yet</h3>
          <p className="text-carbon-500 mb-6 max-w-sm mx-auto">
            Be the first to create a cluster in your area and start saving together!
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/food-clusters/create">
              <Button>
                <Utensils className="h-4 w-4 mr-2" />
                Create Food Cluster
              </Button>
            </Link>
            <Link href="/ride-clusters/create">
              <Button variant="outline">
                <Car className="h-4 w-4 mr-2" />
                Create Ride Cluster
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
