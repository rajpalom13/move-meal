'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/context/auth-store';
import { clustersApi } from '@/lib/api';
import { Cluster } from '@/types';
import { formatCurrency, getStatusColor, formatDate } from '@/lib/utils';
import {
  joinClusterRoom,
  leaveClusterRoom,
  onClusterUpdated,
  onMemberJoined,
  onMemberLeft,
  offClusterUpdated,
  offMemberJoined,
  offMemberLeft,
} from '@/lib/socket';
import {
  ArrowLeft,
  Users,
  MapPin,
  Clock,
  Store,
  Share2,
  LogOut,
  Lock,
  Truck,
} from 'lucide-react';

export default function ClusterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, user } = useAuthStore();
  const clusterId = params.id as string;

  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCluster = async () => {
    if (!token || !clusterId) return;

    try {
      const response = await clustersApi.getOne(token, clusterId);
      setCluster((response as { data: Cluster }).data);
    } catch (error) {
      console.error('Failed to fetch cluster:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCluster();

    // Join socket room for real-time updates
    if (clusterId) {
      joinClusterRoom(clusterId);

      onClusterUpdated((data) => {
        console.log('Cluster updated:', data);
        fetchCluster();
      });

      onMemberJoined((data) => {
        console.log('Member joined:', data);
        fetchCluster();
      });

      onMemberLeft((data) => {
        console.log('Member left:', data);
        fetchCluster();
      });
    }

    return () => {
      if (clusterId) {
        leaveClusterRoom(clusterId);
        offClusterUpdated();
        offMemberJoined();
        offMemberLeft();
      }
    };
  }, [token, clusterId]);

  const isCreator = cluster?.creator?._id === user?.id || cluster?.creator?.id === user?.id;
  const isMember = cluster?.members?.some(
    (m) => m._id === user?.id || m.id === user?.id
  );

  const handleJoin = async () => {
    if (!token || !clusterId) return;

    setActionLoading(true);
    try {
      await clustersApi.join(token, clusterId);
      fetchCluster();
    } catch (error) {
      console.error('Failed to join cluster:', error);
      alert('Failed to join cluster');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!token || !clusterId) return;

    if (!confirm('Are you sure you want to leave this cluster?')) return;

    setActionLoading(true);
    try {
      await clustersApi.leave(token, clusterId);
      router.push('/clusters');
    } catch (error) {
      console.error('Failed to leave cluster:', error);
      alert('Failed to leave cluster');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLockCluster = async () => {
    if (!token || !clusterId) return;

    if (!confirm('Lock the cluster? No new members can join after this.')) return;

    setActionLoading(true);
    try {
      await clustersApi.updateStatus(token, clusterId, 'locked');
      fetchCluster();
    } catch (error) {
      console.error('Failed to lock cluster:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: cluster?.name,
        text: `Join my food cluster on MoveNmeal!`,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!cluster) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Cluster not found</p>
        <Link href="/clusters">
          <Button className="mt-4">Back to Clusters</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/clusters">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{cluster.name}</h1>
            <Badge className={getStatusColor(cluster.status)}>{cluster.status}</Badge>
          </div>
          <p className="text-gray-600 mt-1">
            Created by {cluster.creator?.name || 'Unknown'}
          </p>
        </div>
        <Button variant="outline" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>

      {/* Status Banner */}
      {cluster.status === 'delivering' && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Truck className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Order is on the way!</p>
              <p className="text-sm text-green-700">Your rider is delivering the orders</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vendor Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Restaurant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Store className="h-8 w-8 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {cluster.vendor?.businessName || 'Restaurant'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {cluster.vendor?.cuisineTypes?.join(', ')}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {cluster.location?.address}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members ({cluster.members?.length || 0}/{cluster.maxMembers})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cluster.members?.map((member) => (
                  <div
                    key={member._id || member.id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <Avatar>
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="bg-orange-100 text-orange-600">
                        {member.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{member.name}</p>
                      {(member._id === cluster.creator?._id || member.id === cluster.creator?.id) && (
                        <span className="text-xs text-orange-600">Creator</span>
                      )}
                    </div>
                  </div>
                ))}

                {cluster.members?.length < cluster.maxMembers &&
                  cluster.status === 'forming' && (
                    <div className="p-3 border border-dashed rounded-lg text-center text-gray-500">
                      <p className="text-sm">
                        {cluster.maxMembers - cluster.members.length} spots available
                      </p>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>

          {/* Orders in this cluster */}
          {cluster.orders && cluster.orders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cluster.orders.map((order) => (
                    <div key={order._id} className="p-3 border rounded-lg">
                      <div className="flex justify-between">
                        <span className="font-medium">{order.user?.name || 'User'}</span>
                        <span>{formatCurrency(order.totalAmount)}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {order.items?.length || 0} items
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cluster Info */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Delivery Location</p>
                  <p className="font-medium">{cluster.deliveryLocation?.address}</p>
                </div>
              </div>

              {cluster.scheduledTime && (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Scheduled</p>
                    <p className="font-medium">{formatDate(cluster.scheduledTime)}</p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="font-semibold">{formatCurrency(cluster.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-semibold">{formatCurrency(cluster.deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Fee Per Person</span>
                  <span className="font-semibold">
                    {formatCurrency(cluster.deliveryFee / (cluster.members?.length || 1))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {!isMember && cluster.status === 'forming' && (
                <Button
                  className="w-full"
                  onClick={handleJoin}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Joining...' : 'Join Cluster'}
                </Button>
              )}

              {isMember && !isCreator && cluster.status !== 'delivering' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleLeave}
                  disabled={actionLoading}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave Cluster
                </Button>
              )}

              {isCreator && cluster.status === 'active' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleLockCluster}
                  disabled={actionLoading}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Lock Cluster
                </Button>
              )}

              {isMember && (
                <Link href={`/vendors/${cluster.vendor?._id}`}>
                  <Button variant="secondary" className="w-full">
                    <Store className="h-4 w-4 mr-2" />
                    View Menu & Order
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* AI Suggestion Badge */}
          {cluster.aiSuggested && cluster.aiScore && (
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-purple-600">AI Recommended</p>
                <p className="text-2xl font-bold text-purple-700">{cluster.aiScore}%</p>
                <p className="text-xs text-purple-500">match score</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
