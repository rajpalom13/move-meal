'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/context/auth-store';
import { foodClustersApi } from '@/lib/api';
import { FoodCluster } from '@/types';
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
  Utensils,
  Clock,
  Users,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  open: 'bg-emerald-100 text-emerald-700',
  filled: 'bg-blue-100 text-blue-700',
  ordered: 'bg-amber-100 text-amber-700',
  ready: 'bg-purple-100 text-purple-700',
  collecting: 'bg-orange-100 text-orange-700',
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

export default function FoodClustersPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [clusters, setClusters] = useState<FoodCluster[]>([]);
  const [myClusters, setMyClusters] = useState<FoodCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'explore' | 'mine' | 'history'>('explore');

  useEffect(() => {
    const fetchClusters = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        // Don't filter by location for explore - show all clusters
        if (searchQuery) {
          params.restaurant = searchQuery;
        }

        const [allRes, myRes] = await Promise.all([
          foodClustersApi.getAll(token, params),
          foodClustersApi.getMy(token),
        ]);

        setClusters((allRes as { data: FoodCluster[] }).data || []);
        setMyClusters((myRes as { data: FoodCluster[] }).data || []);
      } catch (error) {
        console.error('Failed to fetch clusters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClusters();
  }, [token, searchQuery]);

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
          <h1 className="text-2xl font-semibold text-charcoal-dark">Food Clusters</h1>
          <p className="text-sm text-charcoal mt-1">Pool orders together, save on delivery</p>
        </div>
        <Link href="/dashboard/food-clusters/create">
          <Button>
            <Plus className="h-4 w-4 mr-1.5" />
            New Cluster
          </Button>
        </Link>
      </div>

      {/* Search and Tabs */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search restaurants..."
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
              <span className="ml-1.5 text-xs bg-slate-blue text-white px-1.5 py-0.5 rounded-full">
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
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <LoadingSkeleton />
        ) : displayClusters.length === 0 ? (
          <div className="text-center py-16">
            <Utensils className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-charcoal-dark mb-1">
              {activeTab === 'mine' ? 'No active clusters' : activeTab === 'history' ? 'No history' : 'No clusters found'}
            </h3>
            <p className="text-sm text-charcoal mb-4 max-w-sm mx-auto">
              {activeTab === 'mine'
                ? 'Join an existing cluster or create your own'
                : activeTab === 'history'
                  ? 'Completed clusters will appear here'
                  : 'Be the first to create a food cluster'}
            </p>
            {activeTab !== 'history' && (
              <Link href="/dashboard/food-clusters/create">
                <Button size="sm">Create Cluster</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden w-full">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-gray-50/50">
                <TableHead className="text-xs font-medium text-charcoal w-[35%]">Cluster</TableHead>
                <TableHead className="text-xs font-medium text-charcoal w-[25%]">Progress</TableHead>
                <TableHead className="text-xs font-medium text-charcoal w-[12%]">Members</TableHead>
                <TableHead className="text-xs font-medium text-charcoal w-[13%]">Time</TableHead>
                <TableHead className="text-xs font-medium text-charcoal w-[15%]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayClusters.map((cluster) => {
                const progress = Math.min(100, Math.round((cluster.currentTotal / cluster.minimumBasket) * 100));
                const isOwner = cluster.creator?._id === user?._id;

                return (
                  <TableRow
                    key={cluster._id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/food-clusters/${cluster._id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getRestaurantLogo(cluster.restaurant) ? (
                          <div className="h-9 w-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 p-1">
                            <img
                              src={getRestaurantLogo(cluster.restaurant)!}
                              alt={cluster.restaurant}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="h-9 w-9 rounded-lg bg-slate-blue/10 flex items-center justify-center flex-shrink-0">
                            <Utensils className="h-4 w-4 text-slate-blue" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-charcoal-dark">{cluster.title}</span>
                            {isOwner && (
                              <span className="text-xs px-1.5 py-0.5 bg-slate-blue/10 text-slate-blue rounded">You</span>
                            )}
                          </div>
                          <span className="text-xs text-charcoal">{cluster.restaurant}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-slate-blue'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-charcoal">{progress}%</span>
                        </div>
                        <span className="text-xs text-charcoal">
                          {formatCurrency(cluster.currentTotal)} / {formatCurrency(cluster.minimumBasket)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-charcoal">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-sm">{cluster.members?.length || 0}/{cluster.maxMembers}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {cluster.deliveryTime && (
                        <div className="flex items-center gap-1 text-charcoal">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-sm">
                            {new Date(cluster.deliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColors[cluster.status] || 'bg-gray-100 text-gray-600'}`}>
                        {cluster.status}
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
