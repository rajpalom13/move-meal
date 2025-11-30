'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/context/auth-store';
import { useLocation } from '@/hooks/useLocation';
import { rideClustersApi } from '@/lib/api';
import { RideCluster } from '@/types';
import { formatCurrency } from '@/lib/utils';
import {
  Plus,
  MapPin,
  Users,
  Clock,
  Car,
  Bike,
  Navigation,
  Shield,
  ChevronRight,
  Sparkles,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: 'Open', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  filled: { label: 'Full', color: 'text-blue-700', bg: 'bg-blue-50' },
  in_progress: { label: 'On Route', color: 'text-orange-700', bg: 'bg-orange-50' },
  completed: { label: 'Done', color: 'text-gray-600', bg: 'bg-gray-100' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50' },
};

const vehicleConfig: Record<string, { icon: typeof Car; label: string; color: string }> = {
  auto: { icon: Car, label: 'Auto', color: 'bg-yellow-50 text-yellow-700' },
  cab: { icon: Car, label: 'Cab', color: 'bg-blue-50 text-blue-700' },
  bike: { icon: Bike, label: 'Bike', color: 'bg-green-50 text-green-700' },
  carpool: { icon: Car, label: 'Carpool', color: 'bg-purple-50 text-purple-700' },
};

export default function RideClustersPage() {
  const { token, user } = useAuthStore();
  const location = useLocation();
  const [clusters, setClusters] = useState<RideCluster[]>([]);
  const [myClusters, setMyClusters] = useState<RideCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [filterFemaleOnly, setFilterFemaleOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchClusters = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (location.latitude && location.longitude) {
          params.startLatitude = location.latitude.toString();
          params.startLongitude = location.longitude.toString();
        }
        if (filterFemaleOnly) {
          params.femaleOnly = 'true';
        }

        const [allRes, myRes] = await Promise.all([
          rideClustersApi.getAll(token, params),
          rideClustersApi.getMy(token),
        ]);

        setClusters((allRes as { data: RideCluster[] }).data || []);
        setMyClusters((myRes as { data: RideCluster[] }).data || []);
      } catch (error) {
        console.error('Failed to fetch ride clusters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClusters();
  }, [token, location.latitude, location.longitude, filterFemaleOnly]);

  const displayClusters = activeTab === 'my' ? myClusters : clusters;
  const filteredClusters = searchQuery
    ? displayClusters.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.startPoint?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.endPoint?.address?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : displayClusters;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ride Clusters</h1>
          <p className="text-gray-500 mt-1">Share rides, split fares</p>
        </div>
        <Link href="/ride-clusters/create">
          <Button className="bg-blue-500 hover:bg-blue-600 shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            New Ride
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'my'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mine
              {myClusters.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                  {myClusters.length}
                </span>
              )}
            </button>
          </div>
          {user?.gender === 'female' && (
            <button
              onClick={() => setFilterFemaleOnly(!filterFemaleOnly)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                filterFemaleOnly
                  ? 'bg-pink-500 text-white'
                  : 'bg-pink-50 text-pink-600 hover:bg-pink-100'
              }`}
            >
              <Shield className="h-4 w-4" />
              Female Only
            </button>
          )}
        </div>
      </div>

      {/* Location Notice */}
      {!location.latitude && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <MapPin className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-blue-800">Enable location</p>
            <p className="text-sm text-blue-700">Find rides near your starting point</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-10 w-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500">Finding rides...</p>
        </div>
      ) : filteredClusters.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 px-4">
          <div className="h-20 w-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <Car className="h-10 w-10 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {activeTab === 'my' ? 'No rides yet' : 'No rides found'}
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            {activeTab === 'my'
              ? "Join an existing ride or create your own"
              : 'Be the first to create a shared ride'}
          </p>
          <Link href="/ride-clusters/create">
            <Button className="bg-blue-500 hover:bg-blue-600">
              <Sparkles className="h-4 w-4 mr-2" />
              Create Ride
            </Button>
          </Link>
        </div>
      ) : (
        /* Rides List */
        <div className="space-y-3 stagger-children">
          {filteredClusters.map((ride) => {
            const status = statusConfig[ride.status] || statusConfig.open;
            const vehicle = vehicleConfig[ride.vehicleType] || vehicleConfig.cab;
            const VehicleIcon = vehicle.icon;
            const isMyRide = ride.creator?._id === user?._id;
            const seatsTaken = ride.seatsRequired - ride.seatsAvailable;

            return (
              <Link key={ride._id} href={`/ride-clusters/${ride._id}`}>
                <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-lg hover:border-blue-200 transition-all duration-300 group">
                  <div className="flex items-start gap-4">
                    {/* Vehicle Icon */}
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                      <VehicleIcon className="h-6 w-6 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {ride.title}
                          </h3>
                          {ride.femaleOnly && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-pink-50 text-pink-600 text-xs font-medium rounded-full">
                              <Shield className="h-3 w-3" />
                              Female
                            </span>
                          )}
                          {isMyRide && (
                            <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                              Yours
                            </span>
                          )}
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </div>

                      {/* Route */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                          <p className="text-sm text-gray-600 truncate">{ride.startPoint?.address}</p>
                        </div>
                        <div className="h-px w-6 bg-gray-300 flex-shrink-0" />
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
                          <p className="text-sm text-gray-600 truncate">{ride.endPoint?.address}</p>
                        </div>
                      </div>

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-xs">
                        <span className={`px-2 py-1 rounded-lg ${vehicle.color}`}>
                          {vehicle.label}
                        </span>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Users className="h-3.5 w-3.5" />
                          <span>{seatsTaken}/{ride.seatsRequired} seats</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{new Date(ride.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <span className="text-blue-600 font-semibold ml-auto">
                          {formatCurrency(ride.farePerPerson)}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                  </div>

                  {/* Footer */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={ride.creator?.avatar} />
                        <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                          {ride.creator?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-500">
                        {isMyRide ? 'You created this' : `by ${ride.creator?.name}`}
                      </span>
                    </div>
                    {ride.stops?.length > 0 && (
                      <span className="text-xs text-gray-400">
                        +{ride.stops.length} stop{ride.stops.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
