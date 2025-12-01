'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/context/auth-store';
import { rideClustersApi } from '@/lib/api';
import { RideCluster } from '@/types';
import { formatCurrency } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Search,
  Car,
  Clock,
  Users,
  Shield,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  open: 'bg-emerald-100 text-emerald-700',
  filled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-orange-100 text-orange-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
};

const vehicleLabels: Record<string, string> = {
  auto: 'Auto',
  cab: 'Cab',
  bike: 'Bike',
  carpool: 'Carpool',
};

export default function RideClustersPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [clusters, setClusters] = useState<RideCluster[]>([]);
  const [myClusters, setMyClusters] = useState<RideCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'explore' | 'mine' | 'history'>('explore');
  const [filterFemaleOnly, setFilterFemaleOnly] = useState(false);

  useEffect(() => {
    const fetchClusters = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        // Don't filter by location for explore - show all rides
        if (filterFemaleOnly) {
          params.femaleOnly = 'true';
        }
        if (searchQuery) {
          params.search = searchQuery;
        }

        const [allRes, myRes] = await Promise.all([
          rideClustersApi.getAll(token, params),
          rideClustersApi.getMy(token),
        ]);

        setClusters((allRes as { data: RideCluster[] }).data || []);
        setMyClusters((myRes as { data: RideCluster[] }).data || []);
      } catch (error) {
        console.error('Failed to fetch clusters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClusters();
  }, [token, filterFemaleOnly, searchQuery]);

  const displayClusters = activeTab === 'mine'
    ? myClusters.filter(c => !['completed', 'cancelled'].includes(c.status))
    : activeTab === 'history'
      ? myClusters.filter(c => ['completed', 'cancelled'].includes(c.status))
      : clusters;

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal-dark">Ride Clusters</h1>
          <p className="text-sm text-charcoal mt-1">Share rides, split fares</p>
        </div>
        <Link href="/dashboard/ride-clusters/create">
          <Button>
            <Plus className="h-4 w-4 mr-1.5" />
            New Ride
          </Button>
        </Link>
      </div>

      {/* Search and Tabs */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search destinations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'explore' ? 'bg-white text-charcoal-dark shadow-sm' : 'text-charcoal hover:text-charcoal-dark'
            }`}
          >
            Explore
          </button>
          <button
            onClick={() => setActiveTab('mine')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'mine' ? 'bg-white text-charcoal-dark shadow-sm' : 'text-charcoal hover:text-charcoal-dark'
            }`}
          >
            Mine
            {myClusters.filter(c => !['completed', 'cancelled'].includes(c.status)).length > 0 && (
              <span className="ml-1.5 text-xs bg-forest text-white px-1.5 py-0.5 rounded-full">
                {myClusters.filter(c => !['completed', 'cancelled'].includes(c.status)).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'history' ? 'bg-white text-charcoal-dark shadow-sm' : 'text-charcoal hover:text-charcoal-dark'
            }`}
          >
            History
          </button>
        </div>
        {user?.gender === 'female' && (
          <button
            onClick={() => setFilterFemaleOnly(!filterFemaleOnly)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              filterFemaleOnly
                ? 'bg-pink-500 text-white'
                : 'bg-pink-50 text-pink-600 hover:bg-pink-100'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            Female Only
          </button>
        )}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <LoadingSkeleton />
        ) : displayClusters.length === 0 ? (
          <div className="text-center py-16">
            <Car className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-charcoal-dark mb-1">
              {activeTab === 'mine' ? 'No active rides' : activeTab === 'history' ? 'No history' : 'No rides found'}
            </h3>
            <p className="text-sm text-charcoal mb-4 max-w-sm mx-auto">
              {activeTab === 'mine'
                ? 'Join an existing ride or create your own'
                : activeTab === 'history'
                  ? 'Completed rides will appear here'
                  : 'Be the first to create a ride cluster'}
            </p>
            {activeTab !== 'history' && (
              <Link href="/dashboard/ride-clusters/create">
                <Button size="sm">Create Ride</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden w-full">
            <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-gray-50/50">
                <TableHead className="text-xs font-medium text-charcoal w-[28%]">Ride</TableHead>
                <TableHead className="text-xs font-medium text-charcoal w-[22%]">Route</TableHead>
                <TableHead className="text-xs font-medium text-charcoal w-[10%]">Seats</TableHead>
                <TableHead className="text-xs font-medium text-charcoal w-[12%]">Time</TableHead>
                <TableHead className="text-xs font-medium text-charcoal w-[13%]">Fare</TableHead>
                <TableHead className="text-xs font-medium text-charcoal w-[15%]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayClusters.map((ride) => {
                const isOwner = ride.creator?._id === user?._id;
                const seatsTaken = ride.seatsRequired - ride.seatsAvailable;

                return (
                  <TableRow
                    key={ride._id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/ride-clusters/${ride._id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-forest/10 flex items-center justify-center flex-shrink-0">
                          <Car className="h-4 w-4 text-forest" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-charcoal-dark">{ride.title}</span>
                            {ride.femaleOnly && (
                              <span className="text-xs px-1.5 py-0.5 bg-pink-100 text-pink-700 rounded">F</span>
                            )}
                            {isOwner && (
                              <span className="text-xs px-1.5 py-0.5 bg-forest/10 text-forest rounded">You</span>
                            )}
                          </div>
                          <span className="text-xs text-charcoal">{vehicleLabels[ride.vehicleType] || 'Cab'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5 max-w-[180px]">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          <span className="text-xs text-charcoal truncate">{ride.startPoint?.address?.split(',')[0]}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-slate-blue flex-shrink-0" />
                          <span className="text-xs text-charcoal truncate">{ride.endPoint?.address?.split(',')[0]}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-charcoal">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-sm">{seatsTaken}/{ride.seatsRequired}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-charcoal">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-sm">
                          {new Date(ride.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-charcoal-dark">{formatCurrency(ride.farePerPerson)}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColors[ride.status] || 'bg-gray-100 text-gray-600'}`}>
                        {ride.status.replace('_', ' ')}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        )}
      </div>
    </div>
  );
}
