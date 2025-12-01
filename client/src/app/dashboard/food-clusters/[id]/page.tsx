'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/context/auth-store';
import { foodClustersApi } from '@/lib/api';
import { FoodCluster } from '@/types';
import {
  joinClusterRoom,
  leaveClusterRoom,
  onClusterUpdated,
  onMemberJoined,
  onMemberLeft,
  offClusterUpdated,
  offMemberJoined,
  offMemberLeft,
  getSocket,
} from '@/lib/socket';
import { formatCurrency } from '@/lib/utils';
import {
  ArrowLeft,
  MapPin,
  Users,
  Clock,
  Phone,
  Loader2,
  Check,
  X,
  Store,
  Utensils,
  ShieldCheck,
  Edit3,
  Sparkles,
  CircleDollarSign,
  ChefHat,
  MessageSquare,
  Crown,
  CheckCircle2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  open: { label: 'Open', color: 'text-emerald-700', bg: 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200', icon: '🟢' },
  filled: { label: 'Basket Full', color: 'text-blue-700', bg: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200', icon: '🔵' },
  ordered: { label: 'Ordered', color: 'text-amber-700', bg: 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200', icon: '🟡' },
  ready: { label: 'Ready', color: 'text-purple-700', bg: 'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200', icon: '🟣' },
  collecting: { label: 'Collecting', color: 'text-orange-700', bg: 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200', icon: '🟠' },
  completed: { label: 'Completed', color: 'text-slate-700', bg: 'bg-gradient-to-r from-slate-100 to-gray-100 border-slate-200', icon: '✅' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200', icon: '🔴' },
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

export default function FoodClusterDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token, user } = useAuthStore();

  const [cluster, setCluster] = useState<FoodCluster | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinData, setJoinData] = useState({ orderAmount: '', items: '' });
  const [error, setError] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpMessage, setOtpMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState({ orderAmount: '', items: '' });
  const [editLoading, setEditLoading] = useState(false);

  const fetchCluster = async () => {
    if (!token || !id) return;
    try {
      const res = await foodClustersApi.getOne(token, id as string);
      setCluster((res as { data: FoodCluster }).data);
    } catch (error) {
      console.error('Failed to fetch cluster:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCluster();
  }, [token, id]);

  // WebSocket for real-time updates
  useEffect(() => {
    if (!id || !getSocket()) return;

    const clusterId = id as string;
    joinClusterRoom(clusterId);

    const handleClusterUpdate = (data: unknown) => {
      const updatedCluster = data as FoodCluster;
      setCluster(updatedCluster);
    };

    const handleMemberJoined = () => fetchCluster();
    const handleMemberLeft = () => fetchCluster();

    onClusterUpdated(handleClusterUpdate);
    onMemberJoined(handleMemberJoined);
    onMemberLeft(handleMemberLeft);

    return () => {
      leaveClusterRoom(clusterId);
      offClusterUpdated();
      offMemberJoined();
      offMemberLeft();
    };
  }, [id]);

  const isCreator = cluster?.creator?._id === user?._id;
  const isMember = cluster?.members?.some((m) => m.user?._id === user?._id);
  const myOrder = cluster?.members?.find((m) => m.user?._id === user?._id);
  const collectedCount = cluster?.members?.filter(m => m.hasCollected).length || 0;
  const totalMembers = cluster?.members?.length || 0;

  const handleJoin = async () => {
    if (!token || !id) return;
    if (!joinData.orderAmount || !joinData.items) {
      setError('Please fill in your order details');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await foodClustersApi.join(token, id as string, {
        orderAmount: parseFloat(joinData.orderAmount),
        items: joinData.items,
      });
      await fetchCluster();
      setShowJoinForm(false);
      setJoinData({ orderAmount: '', items: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join cluster');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!token || !id) return;
    if (!confirm('Are you sure you want to leave this cluster?')) return;
    setActionLoading(true);
    try {
      await foodClustersApi.leave(token, id as string);
      router.push('/dashboard/food-clusters');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave cluster');
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!token || !id) return;
    if (!confirm('Are you sure you want to cancel this cluster? This cannot be undone.')) return;
    setActionLoading(true);
    try {
      await foodClustersApi.cancel(token, id as string);
      router.push('/dashboard/food-clusters');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel cluster');
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    if (!token || !id) return;
    setActionLoading(true);
    try {
      await foodClustersApi.updateStatus(token, id as string, status);
      await fetchCluster();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!token || !id || !otpInput) return;
    setVerifyingOtp(true);
    setOtpMessage(null);
    try {
      const res = await foodClustersApi.verifyCollectionOtp(token, id as string, otpInput);
      setOtpMessage({ type: 'success', text: (res as { message: string }).message || 'Order collected!' });
      setOtpInput('');
      await fetchCluster();
    } catch (err) {
      setOtpMessage({ type: 'error', text: err instanceof Error ? err.message : 'Invalid OTP' });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const openEditDialog = () => {
    if (myOrder) {
      setEditData({
        orderAmount: myOrder.orderAmount.toString(),
        items: myOrder.items || '',
      });
      setShowEditDialog(true);
    }
  };

  const handleUpdateOrder = async () => {
    if (!token || !id) return;
    if (!editData.orderAmount) {
      setError('Please enter your order amount');
      return;
    }
    setEditLoading(true);
    setError('');
    try {
      await foodClustersApi.updateOrder(token, id as string, {
        orderAmount: parseFloat(editData.orderAmount),
        items: editData.items,
      });
      await fetchCluster();
      setShowEditDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-forest-100 to-emerald-100 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <ChefHat className="h-8 w-8 text-forest animate-bounce" />
            </div>
          </div>
          <p className="text-charcoal font-medium">Loading cluster details...</p>
        </div>
      </div>
    );
  }

  if (!cluster) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-ivory to-slate-100 flex items-center justify-center">
          <Utensils className="h-12 w-12 text-charcoal-light" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-charcoal-dark mb-2">Cluster Not Found</h2>
          <p className="text-charcoal">This cluster may have been removed or doesn't exist.</p>
        </div>
        <Link href="/dashboard/food-clusters">
          <Button className="bg-forest hover:bg-forest-600">Browse Clusters</Button>
        </Link>
      </div>
    );
  }

  const status = statusConfig[cluster.status] || statusConfig.open;
  const progress = Math.min(100, Math.round((cluster.currentTotal / cluster.minimumBasket) * 100));

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Back Link */}
      <Link
        href="/dashboard/food-clusters"
        className="inline-flex items-center gap-2 text-charcoal hover:text-forest text-sm mb-6 transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to Food Clusters
      </Link>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-3 animate-in slide-in-from-top">
          <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <X className="h-4 w-4" />
          </div>
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="hover:bg-red-100 rounded-full p-1.5 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Hero Card */}
      <div className="relative bg-gradient-to-br from-forest-600 via-forest to-forest-400 rounded-3xl overflow-hidden mb-6 shadow-xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative p-6 md:p-8">
          {/* Status Badge */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border backdrop-blur-sm ${status.bg} ${status.color}`}>
              <span>{status.icon}</span>
              {status.label}
            </span>
            {isCreator && (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium bg-amber-400/90 text-amber-900">
                <Crown className="h-3.5 w-3.5" />
                Your Cluster
              </span>
            )}
          </div>

          {/* Title & Restaurant */}
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">{cluster.title}</h1>
          <div className="flex items-center gap-3 text-white/90 mb-2">
            {getRestaurantLogo(cluster.restaurant) ? (
              <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-lg">
                <img
                  src={getRestaurantLogo(cluster.restaurant)!}
                  alt={cluster.restaurant}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Store className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <span className="text-lg font-semibold block">{cluster.restaurant}</span>
              {cluster.restaurantAddress && (
                <p className="text-white/70 text-sm">{cluster.restaurantAddress}</p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-3 mt-6">
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2">
              <Users className="h-4 w-4 text-white/80" />
              <span className="text-white font-medium">{cluster.members?.length || 0}/{cluster.maxMembers} members</span>
            </div>
            {cluster.deliveryTime && (
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2">
                <Clock className="h-4 w-4 text-white/80" />
                <span className="text-white font-medium">{new Date(cluster.deliveryTime).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-ivory-200 overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-forest-100 to-emerald-100 flex items-center justify-center">
              <CircleDollarSign className="h-5 w-5 text-forest" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-charcoal-dark">Basket Progress</h3>
              <p className="text-sm text-charcoal">
                {formatCurrency(cluster.currentTotal)} of {formatCurrency(cluster.minimumBasket)} minimum
              </p>
            </div>
            <div className="text-right">
              <span className={`text-2xl font-bold ${progress >= 100 ? 'text-forest' : 'text-amber-500'}`}>
                {progress}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-4 bg-ivory rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                progress >= 100
                  ? 'bg-gradient-to-r from-forest to-emerald-400'
                  : 'bg-gradient-to-r from-amber-400 to-orange-400'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Progress Message */}
          <div className="mt-4 flex items-center justify-between">
            {(cluster.amountNeeded || 0) > 0 ? (
              <div className="flex items-center gap-2 text-amber-600">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">{formatCurrency(cluster.amountNeeded || 0)} more to reach minimum</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-forest">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Minimum basket reached!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Delivery Location */}
        <div className="bg-white rounded-2xl shadow-lg border border-ivory-200 p-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-blue-100 to-slate-blue-50 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-5 w-5 text-slate-blue" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-charcoal-light uppercase tracking-wide mb-1">Delivery Location</p>
              <p className="text-charcoal-dark font-medium truncate">{cluster.deliveryLocation?.address}</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {cluster.notes && (
          <div className="bg-white rounded-2xl shadow-lg border border-ivory-200 p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-charcoal-light/20 to-charcoal/10 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-5 w-5 text-charcoal" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-charcoal-light uppercase tracking-wide mb-1">Notes</p>
                <p className="text-charcoal-dark italic">"{cluster.notes}"</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* OTP Section for Members */}
      {isMember && !isCreator && ['ready', 'collecting'].includes(cluster.status) && myOrder && (
        <div className="mb-6">
          {myOrder.hasCollected ? (
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-8 text-center">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Check className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-emerald-800 mb-1">Order Collected!</h3>
              <p className="text-emerald-600">Enjoy your delicious meal</p>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-forest via-forest-600 to-emerald-600 rounded-2xl p-8 text-center shadow-xl">
              <p className="text-forest-100 text-sm font-medium uppercase tracking-wide mb-2">Your Collection Code</p>
              <div className="flex justify-center gap-3 my-6">
                {(myOrder.collectionOtp || '----').split('').map((digit, i) => (
                  <div key={i} className="w-14 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/30">
                    <span className="text-3xl font-bold text-white">{digit}</span>
                  </div>
                ))}
              </div>
              <p className="text-forest-100">Show this code to the cluster creator to collect your order</p>
            </div>
          )}
        </div>
      )}

      {/* OTP Verification for Creator */}
      {isCreator && ['ready', 'collecting'].includes(cluster.status) && (
        <div className="bg-white rounded-2xl shadow-lg border border-ivory-200 overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-charcoal-dark to-charcoal flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-charcoal-dark">Verify Collection</h3>
                <p className="text-sm text-charcoal">Enter member's OTP to confirm pickup</p>
              </div>
              <div className="bg-ivory px-4 py-2 rounded-full">
                <span className="font-bold text-charcoal-dark">{collectedCount}</span>
                <span className="text-charcoal">/{totalMembers} collected</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Enter 4-digit OTP"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                className="flex-1 text-center text-xl tracking-[0.5em] font-mono h-12 border-2 focus:border-forest"
              />
              <Button
                onClick={handleVerifyOtp}
                disabled={verifyingOtp || otpInput.length !== 4}
                className="bg-charcoal-dark hover:bg-charcoal h-12 px-6"
              >
                {verifyingOtp ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify'}
              </Button>
            </div>

            {otpMessage && (
              <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${
                otpMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {otpMessage.type === 'success' ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                <span className="font-medium">{otpMessage.text}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        {!isMember && cluster.status === 'open' && (
          <Button
            onClick={() => setShowJoinForm(true)}
            className="flex-1 bg-forest hover:bg-forest-600 h-12 text-base shadow-lg"
          >
            Join Cluster
          </Button>
        )}
        {isMember && !isCreator && ['open', 'filled'].includes(cluster.status) && (
          <Button
            variant="outline"
            onClick={handleLeave}
            disabled={actionLoading}
            className="flex-1 h-12 border-2"
          >
            {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Leave Cluster'}
          </Button>
        )}
        {isCreator && ['open', 'filled'].includes(cluster.status) && (
          <>
            <Button
              onClick={() => handleStatusUpdate('ordered')}
              disabled={actionLoading || (cluster.amountNeeded || 0) > 0}
              className="flex-1 bg-forest hover:bg-forest-600 h-12 text-base shadow-lg"
            >
              {actionLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              Mark as Ordered
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={actionLoading}
              className="text-red-600 border-2 border-red-200 hover:bg-red-50 h-12"
            >
              Cancel Cluster
            </Button>
          </>
        )}
        {isCreator && cluster.status === 'ordered' && (
          <Button
            onClick={() => handleStatusUpdate('ready')}
            disabled={actionLoading}
            className="flex-1 bg-slate-blue hover:bg-slate-blue-600 h-12 text-base shadow-lg"
          >
            {actionLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            Mark Ready for Pickup
          </Button>
        )}
        {isCreator && cluster.status === 'ready' && (
          <Button
            onClick={() => handleStatusUpdate('collecting')}
            disabled={actionLoading}
            className="flex-1 bg-forest hover:bg-forest-600 h-12 text-base shadow-lg"
          >
            {actionLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            Start Collection
          </Button>
        )}
        {isCreator && cluster.status === 'collecting' && (
          <Button
            onClick={() => handleStatusUpdate('completed')}
            disabled={actionLoading || collectedCount < totalMembers}
            className="flex-1 bg-forest hover:bg-forest-600 h-12 text-base shadow-lg"
          >
            {collectedCount < totalMembers
              ? `${collectedCount}/${totalMembers} collected`
              : 'Mark Completed'}
          </Button>
        )}
      </div>

      {/* Join Form */}
      {showJoinForm && (
        <div className="bg-white rounded-2xl shadow-xl border border-ivory-200 overflow-hidden mb-6 animate-in slide-in-from-bottom">
          <div className="bg-gradient-to-r from-forest to-emerald-500 p-6">
            <h3 className="font-bold text-white text-lg">Add Your Order</h3>
            <p className="text-forest-100">What would you like from {cluster.restaurant}?</p>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <Label className="text-charcoal-dark font-medium mb-2 block">Order Amount *</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal font-medium">₹</span>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={joinData.orderAmount}
                  onChange={(e) => setJoinData({ ...joinData, orderAmount: e.target.value })}
                  className="pl-10 h-12 text-lg border-2 focus:border-forest"
                />
              </div>
            </div>
            <div>
              <Label className="text-charcoal-dark font-medium mb-2 block">What do you want? *</Label>
              <Textarea
                placeholder="e.g., 1x Butter Chicken, 2x Naan, 1x Lassi"
                value={joinData.items}
                onChange={(e) => setJoinData({ ...joinData, items: e.target.value })}
                rows={3}
                className="resize-none border-2 focus:border-forest"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleJoin}
                disabled={actionLoading}
                className="flex-1 bg-forest hover:bg-forest-600 h-12"
              >
                {actionLoading && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
                Confirm Order
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowJoinForm(false)}
                className="flex-1 h-12 border-2"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white rounded-2xl shadow-lg border border-ivory-200 overflow-hidden">
        <div className="p-6 border-b border-ivory-200 bg-gradient-to-r from-ivory to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-forest-100 to-emerald-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-forest" />
              </div>
              <h3 className="font-bold text-charcoal-dark text-lg">Members</h3>
            </div>
            <span className="px-4 py-2 bg-ivory rounded-full text-charcoal font-medium">
              {cluster.members?.length || 0} people
            </span>
          </div>
        </div>

        <div className="divide-y divide-ivory-200">
          {cluster.members?.map((member, index) => {
            const memberIsCreator = member.user?._id === cluster.creator?._id;
            const memberIsYou = member.user?._id === user?._id;

            return (
              <div
                key={member.user?._id || index}
                className={`p-5 transition-colors ${memberIsYou ? 'bg-forest-50/50' : 'hover:bg-ivory/50'}`}
              >
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                      <AvatarImage src={member.user?.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-forest-100 to-emerald-100 text-forest font-bold">
                        {member.user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {['ready', 'collecting', 'completed'].includes(cluster.status) && member.hasCollected && (
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-charcoal-dark">{member.user?.name}</span>
                      {memberIsCreator && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                          <Crown className="h-3 w-3" />
                          Host
                        </span>
                      )}
                      {memberIsYou && !memberIsCreator && (
                        <span className="text-xs px-2 py-0.5 bg-forest-100 text-forest rounded-full font-medium">You</span>
                      )}
                    </div>
                    <p className="text-charcoal truncate">{member.items}</p>
                    {member.user?.college && (
                      <p className="text-xs text-charcoal-light mt-1">{member.user.college}</p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-charcoal-dark">{formatCurrency(member.orderAmount)}</p>
                    <div className="flex items-center gap-3 mt-2 justify-end">
                      {memberIsYou && ['open', 'filled'].includes(cluster.status) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog();
                          }}
                          className="inline-flex items-center gap-1 text-sm text-forest hover:text-forest-600 font-medium"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      )}
                      {member.user?.phone && (
                        <a
                          href={`tel:${member.user.phone}`}
                          className="inline-flex items-center gap-1 text-sm text-charcoal hover:text-forest"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          Call
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Order Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Your Order</DialogTitle>
            <DialogDescription>
              Update your order details for {cluster?.restaurant}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount" className="font-medium">Order Amount</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal font-medium">₹</span>
                <Input
                  id="edit-amount"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={editData.orderAmount}
                  onChange={(e) => setEditData({ ...editData, orderAmount: e.target.value })}
                  className="pl-10 h-12 text-lg border-2 focus:border-forest"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-items" className="font-medium">What do you want?</Label>
              <Textarea
                id="edit-items"
                placeholder="e.g., 1x Butter Chicken, 2x Naan, 1x Lassi"
                value={editData.items}
                onChange={(e) => setEditData({ ...editData, items: e.target.value })}
                rows={3}
                className="resize-none border-2 focus:border-forest"
              />
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={editLoading}
              className="flex-1 h-11 border-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateOrder}
              disabled={editLoading}
              className="flex-1 bg-forest hover:bg-forest-600 h-11"
            >
              {editLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
