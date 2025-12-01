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
  open: { label: 'Open', color: 'text-sage-700', bg: 'bg-sage-100' },
  filled: { label: 'Full', color: 'text-sage-700', bg: 'bg-sage-100' },
  in_progress: { label: 'On Route', color: 'text-coral', bg: 'bg-coral/10' },
  completed: { label: 'Done', color: 'text-carbon-600', bg: 'bg-cream-100' },
  cancelled: { label: 'Cancelled', color: 'text-coral', bg: 'bg-coral/10' },
};

const vehicleConfig: Record<string, { icon: typeof Car; label: string; color: string }> = {
  auto: { icon: Car, label: 'Auto', color: 'bg-cream-100 text-carbon-700' },
  cab: { icon: Car, label: 'Cab', color: 'bg-sage-100 text-sage-700' },
  bike: { icon: Bike, label: 'Bike', color: 'bg-sage-50 text-sage-600' },
  carpool: { icon: Car, label: 'Carpool', color: 'bg-coral/10 text-coral' },
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
          <h1 className="text-2xl font-bold text-carbon-900">Ride Clusters</h1>
          <p className="text-carbon-500 mt-1">Share rides, split fares</p>
        </div>
        <Link href="/ride-clusters/create">
          <Button className="bg-sage hover:bg-sage-600 shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            New Ride
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-carbon-400" />
          <Input
            placeholder="Search destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex p-1 bg-cream-100 rounded-lg">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-carbon-900 shadow-sm'
                  : 'text-carbon-500 hover:text-carbon-700'
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'my'
                  ? 'bg-white text-carbon-900 shadow-sm'
                  : 'text-carbon-500 hover:text-carbon-700'
              }`}
            >
              Mine
              {myClusters.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-sage/10 text-sage-700 rounded-full">
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
                  ? 'bg-coral text-white'
                  : 'bg-coral/10 text-coral hover:bg-coral/20'
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
        <div className="mb-6 p-4 bg-sage-50 border border-sage-200 rounded-xl flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-sage-100 flex items-center justify-center flex-shrink-0">
            <MapPin className="h-5 w-5 text-sage-600" />
          </div>
          <div>
            <p className="font-medium text-carbon-800">Enable location</p>
            <p className="text-sm text-carbon-500">Find rides near your starting point</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-10 w-10 border-3 border-sage border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-carbon-500">Finding rides...</p>
        </div>
      ) : filteredClusters.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 px-4">
          <div className="h-20 w-20 rounded-xl bg-sage/10 flex items-center justify-center mx-auto mb-4">
            <Car className="h-10 w-10 text-sage/50" />
          </div>
          <h3 className="text-lg font-semibold text-carbon-900 mb-2">
            {activeTab === 'my' ? 'No rides yet' : 'No rides found'}
          </h3>
          <p className="text-carbon-500 mb-6 max-w-sm mx-auto">
            {activeTab === 'my'
              ? "Join an existing ride or create your own"
              : 'Be the first to create a shared ride'}
          </p>
          <Link href="/ride-clusters/create">
            <Button className="bg-sage hover:bg-sage-600">
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
                <div className="bg-white rounded-xl border border-cream-200 p-4 hover:shadow-md hover:border-sage/50 transition-all duration-200 group">
                  <div className="flex items-start gap-4">
                    {/* Vehicle Icon */}
                    <div className="h-12 w-12 rounded-lg bg-sage/10 flex items-center justify-center flex-shrink-0">
                      <VehicleIcon className="h-6 w-6 text-sage" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-carbon-900 truncate group-hover:text-sage transition-colors">
                            {ride.title}
                          </h3>
                          {ride.femaleOnly && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-coral/10 text-coral text-xs font-medium rounded-full">
                              <Shield className="h-3 w-3" />
                              Female
                            </span>
                          )}
                          {isMyRide && (
                            <span className="text-xs px-1.5 py-0.5 bg-sage/10 text-sage-700 rounded">
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
                          <div className="h-2 w-2 rounded-full bg-sage flex-shrink-0" />
                          <p className="text-sm text-carbon-600 truncate">{ride.startPoint?.address}</p>
                        </div>
                        <div className="h-px w-6 bg-cream-300 flex-shrink-0" />
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="h-2 w-2 rounded-full bg-coral flex-shrink-0" />
                          <p className="text-sm text-carbon-600 truncate">{ride.endPoint?.address}</p>
                        </div>
                      </div>

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-xs">
                        <span className={`px-2 py-1 rounded-lg ${vehicle.color}`}>
                          {vehicle.label}
                        </span>
                        <div className="flex items-center gap-1 text-carbon-500">
                          <Users className="h-3.5 w-3.5" />
                          <span>{seatsTaken}/{ride.seatsRequired} seats</span>
                        </div>
                        <div className="flex items-center gap-1 text-carbon-500">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{new Date(ride.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <span className="text-sage-700 font-semibold ml-auto">
                          {formatCurrency(ride.farePerPerson)}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="h-5 w-5 text-carbon-300 group-hover:text-sage transition-colors flex-shrink-0 mt-1" />
                  </div>

                  {/* Footer */}
                  <div className="mt-3 pt-3 border-t border-cream-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={ride.creator?.avatar} />
                        <AvatarFallback className="text-xs bg-sage-100 text-sage-700">
                          {ride.creator?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-carbon-500">
                        {isMyRide ? 'You created this' : `by ${ride.creator?.name}`}
                      </span>
                    </div>
                    {ride.stops?.length > 0 && (
                      <span className="text-xs text-carbon-400">
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
