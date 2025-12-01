'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/context/auth-store';
import { useLocation } from '@/hooks/useLocation';
import { foodClustersApi, rideClustersApi } from '@/lib/api';
import { FoodCluster, RideCluster } from '@/types';
import { formatCurrency } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Utensils,
  Car,
  Plus,
  ArrowRight,
  MapPin,
  Users,
  Clock,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  open: 'bg-emerald-100 text-emerald-700',
  filled: 'bg-blue-100 text-blue-700',
  ordered: 'bg-amber-100 text-amber-700',
  ready: 'bg-purple-100 text-purple-700',
  collecting: 'bg-orange-100 text-orange-700',
  in_progress: 'bg-orange-100 text-orange-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
};

// Restaurant logo mapping
const restaurantLogos: Record<string, string> = {
  'dominos pizza': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Dominos_pizza_logo.svg/1200px-Dominos_pizza_logo.svg.png',
  'mcdonalds': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/McDonald%27s_Golden_Arches.svg/1200px-McDonald%27s_Golden_Arches.svg.png',
  'subway': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Subway_2016_logo.svg/1200px-Subway_2016_logo.svg.png',
  'burger king': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Burger_King_logo_%281999%29.svg/1200px-Burger_King_logo_%281999%29.svg.png',
  'kfc': 'https://1000logos.net/wp-content/uploads/2017/03/KFC-logo.png',
  'pizza hut': 'https://upload.wikimedia.org/wikipedia/sco/thumb/d/d2/Pizza_Hut_logo.svg/1200px-Pizza_Hut_logo.svg.png',
  'starbucks': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/1200px-Starbucks_Corporation_Logo_2011.svg.png',
  'baskin robbins': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Baskin-Robbins_logo.svg/1200px-Baskin-Robbins_logo.svg.png',
  'cafe coffee day': 'https://1000logos.net/wp-content/uploads/2020/09/Cafe-Coffee-Day-Logo.png',
};

const getRestaurantLogo = (restaurant: string): string | null => {
  const key = restaurant.toLowerCase();
  for (const [name, url] of Object.entries(restaurantLogos)) {
    if (key.includes(name) || name.includes(key.split(' ')[0])) {
      return url;
    }
  }
  return null;
};

export default function DashboardPage() {
  const { user, token, updateLocation } = useAuthStore();
  const location = useLocation();

  const [availableFoodClusters, setAvailableFoodClusters] = useState<FoodCluster[]>([]);
  const [availableRideClusters, setAvailableRideClusters] = useState<RideCluster[]>([]);
  const [myFoodClusters, setMyFoodClusters] = useState<FoodCluster[]>([]);
  const [myRideClusters, setMyRideClusters] = useState<RideCluster[]>([]);
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
        const [myFoodRes, myRideRes, allFoodRes, allRideRes] = await Promise.all([
          foodClustersApi.getMy(token),
          rideClustersApi.getMy(token),
          foodClustersApi.getAll(token, {}),
          rideClustersApi.getAll(token, {}),
        ]);

        const myFoodData = (myFoodRes as { data: FoodCluster[] }).data || [];
        const myRideData = (myRideRes as { data: RideCluster[] }).data || [];
        setMyFoodClusters(myFoodData);
        setMyRideClusters(myRideData);

        // Filter to show open clusters that user hasn't joined
        const allFood = (allFoodRes as { data: FoodCluster[] }).data || [];
        const allRides = (allRideRes as { data: RideCluster[] }).data || [];
        const myFoodIds = myFoodData.map(c => c._id);
        const myRideIds = myRideData.map(c => c._id);

        setAvailableFoodClusters(allFood.filter(c => c.status === 'open' && !myFoodIds.includes(c._id)));
        setAvailableRideClusters(allRides.filter(c => c.status === 'open' && !myRideIds.includes(c._id)));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const activeFoodClusters = myFoodClusters.filter((c) => !['completed', 'cancelled'].includes(c.status));
  const activeRideClusters = myRideClusters.filter((c) => !['completed', 'cancelled'].includes(c.status));

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-slate-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal-dark">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-charcoal mt-1 flex items-center gap-1.5">
            {location.latitude ? (
              <>
                <MapPin className="h-3.5 w-3.5 text-forest" />
                <span className="text-forest text-sm">Location enabled</span>
              </>
            ) : (
              <>
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-sm">Enable location for better recommendations</span>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/food-clusters/create">
            <Button size="sm" className="bg-forest hover:bg-forest-600">
              <Plus className="h-4 w-4 mr-1.5" />
              Food Cluster
            </Button>
          </Link>
          <Link href="/dashboard/ride-clusters/create">
            <Button size="sm" variant="outline" className="border-slate-blue text-slate-blue hover:bg-slate-blue-50">
              <Plus className="h-4 w-4 mr-1.5" />
              Ride Cluster
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-ivory-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-forest-100 flex items-center justify-center">
              <Utensils className="h-5 w-5 text-forest" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-charcoal-dark">{availableFoodClusters.length}</p>
              <p className="text-xs text-charcoal">Available Food Clusters</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-ivory-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-blue-100 flex items-center justify-center">
              <Car className="h-5 w-5 text-slate-blue" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-charcoal-dark">{availableRideClusters.length}</p>
              <p className="text-xs text-charcoal">Available Rides</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-ivory-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-charcoal/10 flex items-center justify-center">
              <Utensils className="h-5 w-5 text-charcoal" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-charcoal-dark">{activeFoodClusters.length}</p>
              <p className="text-xs text-charcoal">My Active Food</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-ivory-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-charcoal/10 flex items-center justify-center">
              <Car className="h-5 w-5 text-charcoal" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-charcoal-dark">{activeRideClusters.length}</p>
              <p className="text-xs text-charcoal">My Active Rides</p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Food Clusters */}
      <div className="bg-white rounded-lg border border-ivory-200">
        <div className="px-5 py-4 border-b border-ivory-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-forest-100 flex items-center justify-center">
              <Utensils className="h-4 w-4 text-forest" />
            </div>
            <h2 className="font-medium text-charcoal-dark">Available Food Clusters</h2>
          </div>
          <Link href="/dashboard/food-clusters">
            <Button variant="ghost" size="sm" className="text-forest hover:text-forest-600 -mr-2">
              Browse all <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
        {availableFoodClusters.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Utensils className="h-8 w-8 text-charcoal-light mx-auto mb-2" />
            <p className="text-sm text-charcoal mb-3">No open food clusters available</p>
            <Link href="/dashboard/food-clusters/create">
              <Button size="sm" className="bg-forest hover:bg-forest-600">Create one</Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-ivory/50">
                <TableHead className="text-xs font-medium text-charcoal">Cluster</TableHead>
                <TableHead className="text-xs font-medium text-charcoal">Progress</TableHead>
                <TableHead className="text-xs font-medium text-charcoal">Members</TableHead>
                <TableHead className="text-xs font-medium text-charcoal">Delivery</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {availableFoodClusters.slice(0, 5).map((cluster) => {
                const progress = Math.min(100, Math.round((cluster.currentTotal / cluster.minimumBasket) * 100));
                return (
                  <TableRow
                    key={cluster._id}
                    className="cursor-pointer hover:bg-forest-50/50"
                    onClick={() => window.location.href = `/dashboard/food-clusters/${cluster._id}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getRestaurantLogo(cluster.restaurant) ? (
                          <div className="h-8 w-8 rounded-lg bg-white border border-ivory-200 flex items-center justify-center flex-shrink-0 p-1">
                            <img
                              src={getRestaurantLogo(cluster.restaurant)!}
                              alt={cluster.restaurant}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-lg bg-forest-100 flex items-center justify-center flex-shrink-0">
                            <Utensils className="h-4 w-4 text-forest" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-charcoal-dark">{cluster.title}</p>
                          <p className="text-xs text-charcoal">{cluster.restaurant}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 bg-ivory rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${progress >= 100 ? 'bg-forest' : 'bg-forest-400'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-charcoal">{progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-charcoal">
                        <Users className="h-3.5 w-3.5" />
                        <span>{cluster.members?.length || 0}/{cluster.maxMembers}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-charcoal">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{cluster.deliveryTime ? new Date(cluster.deliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Available Rides */}
      <div className="bg-white rounded-lg border border-ivory-200">
        <div className="px-5 py-4 border-b border-ivory-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-slate-blue-100 flex items-center justify-center">
              <Car className="h-4 w-4 text-slate-blue" />
            </div>
            <h2 className="font-medium text-charcoal-dark">Available Rides</h2>
          </div>
          <Link href="/dashboard/ride-clusters">
            <Button variant="ghost" size="sm" className="text-slate-blue hover:text-slate-blue-600 -mr-2">
              Browse all <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
        {availableRideClusters.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Car className="h-8 w-8 text-charcoal-light mx-auto mb-2" />
            <p className="text-sm text-charcoal mb-3">No open rides available</p>
            <Link href="/dashboard/ride-clusters/create">
              <Button size="sm" className="bg-slate-blue hover:bg-slate-blue-600">Create one</Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-ivory/50">
                <TableHead className="text-xs font-medium text-charcoal">Ride</TableHead>
                <TableHead className="text-xs font-medium text-charcoal">Route</TableHead>
                <TableHead className="text-xs font-medium text-charcoal">Departure</TableHead>
                <TableHead className="text-xs font-medium text-charcoal">Seats</TableHead>
                <TableHead className="text-xs font-medium text-charcoal">Fare</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {availableRideClusters.slice(0, 5).map((ride) => (
                <TableRow
                  key={ride._id}
                  className="cursor-pointer hover:bg-slate-blue-50/50"
                  onClick={() => window.location.href = `/dashboard/ride-clusters/${ride._id}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-slate-blue-100 flex items-center justify-center flex-shrink-0">
                        <Car className="h-4 w-4 text-slate-blue" />
                      </div>
                      <div>
                        <p className="font-medium text-charcoal-dark">{ride.title}</p>
                        {ride.femaleOnly && (
                          <span className="text-xs px-1.5 py-0.5 bg-pink-100 text-pink-700 rounded">Female Only</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-charcoal text-sm max-w-[200px]">
                    <div className="truncate">{ride.startPoint?.address?.split(',')[0]}</div>
                    <div className="text-xs text-charcoal-light truncate">→ {ride.endPoint?.address?.split(',')[0]}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-charcoal">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{new Date(ride.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-charcoal">
                      <Users className="h-3.5 w-3.5" />
                      <span>{ride.seatsAvailable}/{ride.seatsRequired}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-forest">{formatCurrency(ride.farePerPerson)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
