'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/context/auth-store';
import { foodClustersApi } from '@/lib/api';
import { FoodCluster } from '@/types';
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
  ChevronRight,
  Utensils,
  ShieldCheck,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: 'Open', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  filled: { label: 'Basket Full', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  ordered: { label: 'Ordered', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  ready: { label: 'Ready', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  collecting: { label: 'Collecting', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  completed: { label: 'Completed', color: 'text-gray-700', bg: 'bg-gray-100 border-gray-200' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
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
      router.push('/food-clusters');
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
      router.push('/food-clusters');
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading cluster...</p>
        </div>
      </div>
    );
  }

  if (!cluster) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
          <Utensils className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Cluster not found</h2>
        <p className="text-gray-500">This cluster may have been removed or doesn't exist.</p>
        <Link href="/food-clusters">
          <Button variant="outline" className="mt-2">Browse Clusters</Button>
        </Link>
      </div>
    );
  }

  const status = statusConfig[cluster.status] || statusConfig.open;
  const progress = Math.min(100, Math.round((cluster.currentTotal / cluster.minimumBasket) * 100));

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Back Link */}
      <Link
        href="/food-clusters"
        className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <X className="h-4 w-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto hover:bg-red-100 rounded p-1">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.color}`}>
                  {status.label}
                </span>
                {isCreator && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                    Your Cluster
                  </span>
                )}
              </div>
              <h1 className="text-xl font-semibold text-gray-900 truncate">{cluster.title}</h1>
              <div className="flex items-center gap-1.5 mt-1 text-gray-600">
                <Store className="h-4 w-4 text-orange-500" />
                <span className="font-medium">{cluster.restaurant}</span>
              </div>
              {cluster.restaurantAddress && (
                <p className="text-sm text-gray-500 mt-0.5 truncate">{cluster.restaurantAddress}</p>
              )}
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="px-6 pb-5">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Basket Progress</span>
              <span className="text-sm text-gray-600">
                {formatCurrency(cluster.currentTotal)} of {formatCurrency(cluster.minimumBasket)}
              </span>
            </div>
            <div className="h-2.5 bg-white rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progress >= 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-orange-400 to-amber-400'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 text-sm">
              {(cluster.amountNeeded || 0) > 0 ? (
                <span className="text-orange-700">{formatCurrency(cluster.amountNeeded || 0)} more needed</span>
              ) : (
                <span className="text-emerald-700 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Minimum reached
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info Pills */}
        <div className="px-6 pb-5">
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg text-sm">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">{cluster.members?.length || 0}/{cluster.maxMembers}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg text-sm">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700 truncate max-w-[200px]">{cluster.deliveryLocation?.address}</span>
            </div>
            {cluster.deliveryTime && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">{new Date(cluster.deliveryTime).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {cluster.notes && (
          <div className="px-6 pb-5">
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 italic">"{cluster.notes}"</p>
          </div>
        )}

        {/* OTP Section for Members */}
        {isMember && !isCreator && ['ready', 'collecting'].includes(cluster.status) && myOrder && (
          <div className="px-6 pb-5">
            {myOrder.hasCollected ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                  <Check className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="font-medium text-emerald-800">Order Collected!</p>
                <p className="text-sm text-emerald-600 mt-0.5">Enjoy your meal</p>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl p-5 text-white text-center">
                <p className="text-orange-100 text-sm mb-1">Your Collection Code</p>
                <div className="flex justify-center gap-2 my-3">
                  {(myOrder.collectionOtp || '----').split('').map((digit, i) => (
                    <div key={i} className="w-12 h-14 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                      <span className="text-2xl font-bold">{digit}</span>
                    </div>
                  ))}
                </div>
                <p className="text-orange-100 text-sm">Show this to the cluster creator</p>
              </div>
            )}
          </div>
        )}

        {/* OTP Verification for Creator */}
        {isCreator && ['ready', 'collecting'].includes(cluster.status) && (
          <div className="px-6 pb-5">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="h-5 w-5 text-gray-700" />
                <span className="font-medium text-gray-900">Verify Collection</span>
                <span className="ml-auto text-sm text-gray-500">{collectedCount}/{totalMembers} collected</span>
              </div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter OTP"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  className="flex-1 text-center text-lg tracking-[0.5em] font-mono"
                />
                <Button
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp || otpInput.length !== 4}
                  className="bg-gray-900 hover:bg-gray-800"
                >
                  {verifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                </Button>
              </div>
              {otpMessage && (
                <div className={`mt-3 p-2.5 rounded-lg text-sm flex items-center gap-2 ${
                  otpMessage.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {otpMessage.type === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  {otpMessage.text}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-6">
          <div className="flex flex-wrap gap-2">
            {!isMember && cluster.status === 'open' && (
              <Button onClick={() => setShowJoinForm(true)} className="flex-1 bg-orange-500 hover:bg-orange-600">
                Join Cluster
              </Button>
            )}
            {isMember && !isCreator && ['open', 'filled'].includes(cluster.status) && (
              <Button variant="outline" onClick={handleLeave} disabled={actionLoading} className="flex-1">
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Leave'}
              </Button>
            )}
            {isCreator && ['open', 'filled'].includes(cluster.status) && (
              <>
                <Button
                  onClick={() => handleStatusUpdate('ordered')}
                  disabled={actionLoading || (cluster.amountNeeded || 0) > 0}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  Mark Ordered
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={actionLoading} className="text-red-600 border-red-200 hover:bg-red-50">
                  Cancel
                </Button>
              </>
            )}
            {isCreator && cluster.status === 'ordered' && (
              <Button onClick={() => handleStatusUpdate('ready')} disabled={actionLoading} className="flex-1 bg-purple-500 hover:bg-purple-600">
                Mark Ready for Pickup
              </Button>
            )}
            {isCreator && cluster.status === 'ready' && (
              <Button onClick={() => handleStatusUpdate('collecting')} disabled={actionLoading} className="flex-1 bg-orange-500 hover:bg-orange-600">
                Start Collection
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Join Form */}
      {showJoinForm && (
        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Add Your Order</h3>
            <p className="text-sm text-gray-500 mt-0.5">Tell us what you'd like from {cluster.restaurant}</p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Order Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={joinData.orderAmount}
                  onChange={(e) => setJoinData({ ...joinData, orderAmount: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">What do you want?</label>
              <Textarea
                placeholder="e.g., 1x Butter Chicken, 2x Naan, 1x Lassi"
                value={joinData.items}
                onChange={(e) => setJoinData({ ...joinData, items: e.target.value })}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleJoin} disabled={actionLoading} className="flex-1 bg-orange-500 hover:bg-orange-600">
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Confirm
              </Button>
              <Button variant="outline" onClick={() => setShowJoinForm(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Members</h3>
          <span className="text-sm text-gray-500">{cluster.members?.length || 0} people</span>
        </div>
        <div className="divide-y divide-gray-100">
          {cluster.members?.map((member, index) => {
            const memberIsCreator = member.user?._id === cluster.creator?._id;
            const memberIsYou = member.user?._id === user?._id;

            return (
              <div key={member.user?._id || index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.user?.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-100 to-amber-100 text-orange-700 font-medium">
                        {member.user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {['ready', 'collecting', 'completed'].includes(cluster.status) && member.hasCollected && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{member.user?.name}</span>
                      {memberIsCreator && (
                        <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">Host</span>
                      )}
                      {memberIsYou && !memberIsCreator && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">You</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{member.items}</p>
                    {member.user?.college && (
                      <p className="text-xs text-gray-400 mt-0.5">{member.user.college}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-gray-900">{formatCurrency(member.orderAmount)}</p>
                    {member.user?.phone && (
                      <a href={`tel:${member.user.phone}`} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-orange-600 mt-1">
                        <Phone className="h-3 w-3" />
                        Call
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
