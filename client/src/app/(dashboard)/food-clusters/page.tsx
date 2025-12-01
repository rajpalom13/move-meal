'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/context/auth-store';
import { useLocation } from '@/hooks/useLocation';
import { foodClustersApi } from '@/lib/api';
import { FoodCluster } from '@/types';
import { formatCurrency } from '@/lib/utils';
import {
  Plus,
  Search,
  MapPin,
  Users,
  Clock,
  Utensils,
  Store,
  ChevronRight,
  Sparkles,
  Zap,
  TrendingUp,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: 'Open', color: 'text-sage-700', bg: 'bg-sage-100' },
  filled: { label: 'Full', color: 'text-sage-700', bg: 'bg-sage-100' },
  ordered: { label: 'Ordered', color: 'text-coral', bg: 'bg-coral/10' },
  ready: { label: 'Ready', color: 'text-sage-700', bg: 'bg-sage-100' },
  collecting: { label: 'Collecting', color: 'text-coral', bg: 'bg-coral/10' },
  completed: { label: 'Done', color: 'text-carbon-600', bg: 'bg-cream-100' },
  cancelled: { label: 'Cancelled', color: 'text-coral', bg: 'bg-coral/10' },
};

interface Recommendation {
  clusterId: string;
  score: number;
  reasons: string[];
  joinReasons: string[];
  cluster: FoodCluster;
}

export default function FoodClustersPage() {
  const { token, user } = useAuthStore();
  const location = useLocation();
  const [clusters, setClusters] = useState<FoodCluster[]>([]);
  const [myClusters, setMyClusters] = useState<FoodCluster[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'recommended'>('recommended');

  useEffect(() => {
    const fetchClusters = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (location.latitude && location.longitude) {
          params.latitude = location.latitude.toString();
          params.longitude = location.longitude.toString();
        }
        if (searchQuery) {
          params.restaurant = searchQuery;
        }

        const [allRes, myRes, recRes] = await Promise.all([
          foodClustersApi.getAll(token, params),
          foodClustersApi.getMy(token),
          location.latitude && location.longitude
            ? foodClustersApi.getRecommended(token, location.latitude, location.longitude, 5)
            : Promise.resolve({ data: [] }),
        ]);

        setClusters((allRes as { data: FoodCluster[] }).data || []);
        setMyClusters((myRes as { data: FoodCluster[] }).data || []);
        setRecommendations((recRes as { data: Recommendation[] }).data || []);
      } catch (error) {
        console.error('Failed to fetch clusters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClusters();
  }, [token, location.latitude, location.longitude, searchQuery]);

  const displayClusters = activeTab === 'my' ? myClusters : clusters;

  const ClusterCard = ({ cluster, isRecommended = false, recommendation }: {
    cluster: FoodCluster;
    isRecommended?: boolean;
    recommendation?: Recommendation;
  }) => {
    const status = statusConfig[cluster.status] || statusConfig.open;
    const progress = Math.min(100, Math.round((cluster.currentTotal / cluster.minimumBasket) * 100));
    const isMyCluster = cluster.creator?._id === user?._id;

    return (
      <Link href={`/food-clusters/${cluster._id}`}>
        <div className={`bg-white rounded-xl border p-4 hover:shadow-sm transition-all duration-200 group ${
          isRecommended ? 'border-coral/30 ring-1 ring-coral/10' : 'border-cream-200 hover:border-sage/50'
        }`}>
          {/* Recommendation Badge */}
          {isRecommended && recommendation && (
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-coral/10">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-coral text-white text-xs font-medium rounded-full">
                <Zap className="h-3 w-3" />
                {recommendation.score}% match
              </div>
              {recommendation.joinReasons?.slice(0, 2).map((reason, i) => (
                <span key={i} className="text-xs text-coral bg-coral/10 px-2 py-1 rounded-full">
                  {reason}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-start gap-4">
            {/* Restaurant Icon */}
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isRecommended
                ? 'bg-coral'
                : 'bg-coral/10'
            }`}>
              <Store className={`h-6 w-6 ${isRecommended ? 'text-white' : 'text-coral'}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-carbon-900 truncate group-hover:text-coral transition-colors">{cluster.title}</h3>
                    {isMyCluster && (
                      <span className="text-xs px-1.5 py-0.5 bg-coral/10 text-coral rounded flex-shrink-0">
                        Yours
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-carbon-500">{cluster.restaurant}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${status.bg} ${status.color}`}>
                  {status.label}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 mb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-carbon-500">
                    {formatCurrency(cluster.currentTotal)} of {formatCurrency(cluster.minimumBasket)}
                  </span>
                  <span className="font-medium text-carbon-700">{progress}%</span>
                </div>
                <div className="h-1.5 bg-cream-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      progress >= 100 ? 'bg-sage' : 'bg-coral'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Meta Info */}
              <div className="flex items-center gap-4 text-xs text-carbon-500">
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <span>{cluster.members?.length || 0}/{cluster.maxMembers}</span>
                </div>
                {cluster.deliveryTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{new Date(cluster.deliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{cluster.deliveryLocation?.address}</span>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <ChevronRight className="h-5 w-5 text-carbon-300 group-hover:text-coral transition-colors flex-shrink-0 mt-1" />
          </div>

          {/* Creator Footer */}
          <div className="mt-3 pt-3 border-t border-cream-200 flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={cluster.creator?.avatar} />
              <AvatarFallback className="text-xs bg-sage-100 text-sage-700">
                {cluster.creator?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-carbon-500">
              {isMyCluster ? 'You created this' : `by ${cluster.creator?.name}`}
            </span>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-carbon-900">Food Clusters</h1>
          <p className="text-carbon-500 mt-1">Pool orders together, save on delivery</p>
        </div>
        <Link href="/food-clusters/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Cluster
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-carbon-400" />
          <Input
            placeholder="Search by restaurant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex p-1 bg-cream-100 rounded-lg">
          <button
            onClick={() => setActiveTab('recommended')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'recommended'
                ? 'bg-white text-carbon-900 shadow-sm'
                : 'text-carbon-500 hover:text-carbon-700'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            For You
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'all'
                ? 'bg-white text-carbon-900 shadow-sm'
                : 'text-carbon-500 hover:text-carbon-700'
            }`}
          >
            Explore
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'my'
                ? 'bg-white text-carbon-900 shadow-sm'
                : 'text-carbon-500 hover:text-carbon-700'
            }`}
          >
            Mine
            {myClusters.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-coral/10 text-coral rounded-full">
                {myClusters.length}
              </span>
            )}
          </button>
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
            <p className="text-sm text-carbon-500">Get personalized recommendations and see clusters near you</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-10 w-10 border-3 border-coral border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-carbon-500">Finding clusters...</p>
        </div>
      ) : activeTab === 'recommended' ? (
        /* Recommendations Tab */
        <div className="space-y-6">
          {/* AI Recommendations Section */}
          {recommendations.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-coral flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-carbon-900">Recommended for you</h2>
                  <p className="text-xs text-carbon-500">Based on your location and preferences</p>
                </div>
              </div>
              <div className="space-y-3 stagger-children">
                {recommendations.map((rec) => (
                  <ClusterCard
                    key={rec.clusterId}
                    cluster={rec.cluster}
                    isRecommended
                    recommendation={rec}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Clusters */}
          {clusters.length > 0 && (
            <div>
              <h2 className="font-semibold text-carbon-900 mb-4">More clusters nearby</h2>
              <div className="space-y-3 stagger-children">
                {clusters
                  .filter(c => !recommendations.some(r => r.clusterId === c._id))
                  .slice(0, 10)
                  .map((cluster) => (
                    <ClusterCard key={cluster._id} cluster={cluster} />
                  ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {recommendations.length === 0 && clusters.length === 0 && (
            <div className="text-center py-16 px-4">
              <div className="h-20 w-20 rounded-xl bg-coral/10 flex items-center justify-center mx-auto mb-4">
                <Utensils className="h-10 w-10 text-coral/50" />
              </div>
              <h3 className="text-lg font-semibold text-carbon-900 mb-2">No clusters yet</h3>
              <p className="text-carbon-500 mb-6 max-w-sm mx-auto">
                Be the first to create a food cluster in your area
              </p>
              <Link href="/food-clusters/create">
                <Button>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Cluster
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : displayClusters.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 px-4">
          <div className="h-20 w-20 rounded-xl bg-coral/10 flex items-center justify-center mx-auto mb-4">
            <Utensils className="h-10 w-10 text-coral/50" />
          </div>
          <h3 className="text-lg font-semibold text-carbon-900 mb-2">
            {activeTab === 'my' ? 'No clusters yet' : 'No clusters found'}
          </h3>
          <p className="text-carbon-500 mb-6 max-w-sm mx-auto">
            {activeTab === 'my'
              ? "Join an existing cluster or create your own to start saving"
              : 'Be the first to create a food cluster in your area'}
          </p>
          <Link href="/food-clusters/create">
            <Button>
              <Sparkles className="h-4 w-4 mr-2" />
              Create Cluster
            </Button>
          </Link>
        </div>
      ) : (
        /* Regular Clusters List */
        <div className="space-y-3 stagger-children">
          {displayClusters.map((cluster) => (
            <ClusterCard key={cluster._id} cluster={cluster} />
          ))}
        </div>
      )}
    </div>
  );
}
