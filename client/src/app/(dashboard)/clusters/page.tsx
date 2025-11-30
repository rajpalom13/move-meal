'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/context/auth-store';
import { useLocation } from '@/hooks/useLocation';
import { clustersApi } from '@/lib/api';
import { Cluster } from '@/types';
import { formatCurrency, getStatusColor, formatDate } from '@/lib/utils';
import { Users, Plus, Search, MapPin, Clock } from 'lucide-react';

export default function ClustersPage() {
  const { token } = useAuthStore();
  const location = useLocation();

  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [myClusters, setMyClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'nearby' | 'my'>('nearby');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchClusters = async () => {
      if (!token) return;

      setLoading(true);
      try {
        const [nearbyClusters, myClustersList] = await Promise.all([
          location.latitude && location.longitude
            ? clustersApi.getAll(token, {
                latitude: location.latitude.toString(),
                longitude: location.longitude.toString(),
                radius: '10',
              })
            : clustersApi.getAll(token),
          clustersApi.getMy(token),
        ]);

        setClusters((nearbyClusters as { data: Cluster[] }).data || []);
        setMyClusters((myClustersList as { data: Cluster[] }).data || []);
      } catch (error) {
        console.error('Failed to fetch clusters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClusters();
  }, [token, location.latitude, location.longitude]);

  const displayClusters = activeTab === 'my' ? myClusters : clusters;
  const filteredClusters = displayClusters.filter((cluster) =>
    cluster.name.toLowerCase().includes(search.toLowerCase()) ||
    cluster.vendor?.businessName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleJoinCluster = async (clusterId: string) => {
    if (!token) return;
    try {
      await clustersApi.join(token, clusterId);
      // Refresh clusters
      const [nearbyClusters, myClustersList] = await Promise.all([
        clustersApi.getAll(token),
        clustersApi.getMy(token),
      ]);
      setClusters((nearbyClusters as { data: Cluster[] }).data || []);
      setMyClusters((myClustersList as { data: Cluster[] }).data || []);
    } catch (error) {
      console.error('Failed to join cluster:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Food Clusters</h1>
          <p className="text-gray-600 mt-1">Join or create clusters to share delivery costs</p>
        </div>
        <Link href="/clusters/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Cluster
          </Button>
        </Link>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex border rounded-lg p-1 bg-white">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${
              activeTab === 'nearby' ? 'bg-orange-500 text-white' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('nearby')}
          >
            Nearby Clusters
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${
              activeTab === 'my' ? 'bg-orange-500 text-white' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('my')}
          >
            My Clusters
          </button>
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search clusters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Clusters Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      ) : filteredClusters.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No clusters found</p>
            <p className="text-gray-400 text-sm mt-1">
              {activeTab === 'my' ? 'You haven\'t joined any clusters yet' : 'Be the first to create one!'}
            </p>
            <Link href="/clusters/create" className="mt-4">
              <Button>Create a Cluster</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClusters.map((cluster) => (
            <Card key={cluster._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{cluster.name}</CardTitle>
                    <p className="text-sm text-gray-600">{cluster.vendor?.businessName}</p>
                  </div>
                  <Badge className={getStatusColor(cluster.status)}>
                    {cluster.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Members */}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {cluster.members.length} / {cluster.maxMembers} members
                  </span>
                  <div className="flex -space-x-2 ml-auto">
                    {cluster.members.slice(0, 3).map((member, idx) => (
                      <div
                        key={idx}
                        className="h-6 w-6 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center text-xs font-medium text-orange-600"
                      >
                        {member.name?.charAt(0)}
                      </div>
                    ))}
                    {cluster.members.length > 3 && (
                      <div className="h-6 w-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                        +{cluster.members.length - 3}
                      </div>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="truncate">{cluster.deliveryLocation.address}</span>
                </div>

                {/* Scheduled Time */}
                {cluster.scheduledTime && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{formatDate(cluster.scheduledTime)}</span>
                  </div>
                )}

                {/* Total & Fee */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div>
                    <p className="text-xs text-gray-500">Total Amount</p>
                    <p className="font-semibold">{formatCurrency(cluster.totalAmount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Delivery Fee</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(cluster.deliveryFee / cluster.members.length)} each
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/clusters/${cluster._id}`} className="flex-1">
                    <Button variant="outline" className="w-full">View Details</Button>
                  </Link>
                  {activeTab === 'nearby' && cluster.status === 'forming' && (
                    <Button
                      className="flex-1"
                      onClick={() => handleJoinCluster(cluster._id)}
                    >
                      Join
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
