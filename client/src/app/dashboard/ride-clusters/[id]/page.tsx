'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/context/auth-store';
import { rideClustersApi } from '@/lib/api';
import { RideCluster } from '@/types';
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
  Car,
  Navigation,
  Shield,
  Crown,
  CircleDot,
  MapPinned,
  Banknote,
  UserCheck,
  Route,
  X,
  CheckCircle2,
} from 'lucide-react';
import RideMapGoogle from '@/components/ride-map-google';
import { PlacesAutocomplete, useGoogleMaps } from '@/components/maps';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PickupLocation {
  latitude: number;
  longitude: number;
  address: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  open: { label: 'Open', color: 'text-emerald-700', bg: 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200', icon: '🟢' },
  filled: { label: 'Filled', color: 'text-blue-700', bg: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200', icon: '🔵' },
  in_progress: { label: 'In Progress', color: 'text-amber-700', bg: 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200', icon: '🟡' },
  completed: { label: 'Completed', color: 'text-slate-700', bg: 'bg-gradient-to-r from-slate-100 to-gray-100 border-slate-200', icon: '✅' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200', icon: '🔴' },
};

export default function RideClusterDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token, user } = useAuthStore();
  const { isLoaded } = useGoogleMaps();

  const [ride, setRide] = useState<RideCluster | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [pickupLocation, setPickupLocation] = useState<PickupLocation | null>(null);
  const [error, setError] = useState('');

  const fetchRide = async () => {
    if (!token || !id) return;
    try {
      const res = await rideClustersApi.getOne(token, id as string);
      setRide((res as { data: RideCluster }).data);
    } catch (error) {
      console.error('Failed to fetch ride:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRide();
  }, [token, id]);

  // WebSocket for real-time updates
  useEffect(() => {
    if (!id || !getSocket()) return;

    const clusterId = id as string;
    joinClusterRoom(clusterId);

    const handleClusterUpdate = (data: unknown) => {
      const updatedRide = data as RideCluster;
      setRide(updatedRide);
    };

    const handleMemberJoined = () => fetchRide();
    const handleMemberLeft = () => fetchRide();

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

  const isCreator = ride?.creator?._id === user?._id;
  const isMember = ride?.members?.some((m) => m.user?._id === user?._id);

  const handleJoin = async () => {
    if (!token || !id) return;
    if (!pickupLocation) {
      setError('Please select your pickup location');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      await rideClustersApi.join(token, id as string, {
        pickupPoint: {
          latitude: pickupLocation.latitude,
          longitude: pickupLocation.longitude,
          address: pickupLocation.address,
        },
      });
      await fetchRide();
      setShowJoinDialog(false);
      setPickupLocation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join ride');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!token || !id) return;
    if (!confirm('Are you sure you want to leave this ride?')) return;

    setActionLoading(true);
    try {
      await rideClustersApi.leave(token, id as string);
      router.push('/dashboard/ride-clusters');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave ride');
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!token || !id) return;
    if (!confirm('Are you sure you want to cancel this ride? This cannot be undone.')) return;

    setActionLoading(true);
    try {
      await rideClustersApi.cancel(token, id as string);
      router.push('/dashboard/ride-clusters');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel ride');
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    if (!token || !id) return;
    setActionLoading(true);
    try {
      await rideClustersApi.updateStatus(token, id as string, status);
      await fetchRide();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-slate-blue-100 to-indigo-100 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Car className="h-8 w-8 text-slate-blue animate-bounce" />
            </div>
          </div>
          <p className="text-charcoal font-medium">Loading ride details...</p>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-ivory to-slate-100 flex items-center justify-center">
          <Car className="h-12 w-12 text-charcoal-light" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-charcoal-dark mb-2">Ride Not Found</h2>
          <p className="text-charcoal">This ride may have been removed or doesn't exist.</p>
        </div>
        <Link href="/dashboard/ride-clusters">
          <Button className="bg-slate-blue hover:bg-slate-blue-600">Browse Rides</Button>
        </Link>
      </div>
    );
  }

  const canJoin = !isMember && ride.status === 'open' && ride.seatsAvailable > 0 &&
    (!ride.femaleOnly || user?.gender === 'female');

  const status = statusConfig[ride.status] || statusConfig.open;
  const seatsFilled = ride.seatsRequired - ride.seatsAvailable;
  const seatsProgress = Math.round((seatsFilled / ride.seatsRequired) * 100);

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Back Link */}
      <Link
        href="/dashboard/ride-clusters"
        className="inline-flex items-center gap-2 text-charcoal hover:text-slate-blue text-sm mb-6 transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to Ride Clusters
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
      <div className="relative bg-gradient-to-br from-slate-blue-600 via-slate-blue to-slate-blue-400 rounded-3xl overflow-hidden mb-6 shadow-xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative p-6 md:p-8">
          {/* Status Badge */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border backdrop-blur-sm ${status.bg} ${status.color}`}>
              <span>{status.icon}</span>
              {status.label}
            </span>
            {ride.femaleOnly && (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium bg-pink-400/90 text-white">
                <Shield className="h-3.5 w-3.5" />
                Female Only
              </span>
            )}
            {isCreator && (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium bg-amber-400/90 text-amber-900">
                <Crown className="h-3.5 w-3.5" />
                Your Ride
              </span>
            )}
          </div>

          {/* Title & Vehicle */}
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">{ride.title}</h1>
          <div className="flex items-center gap-2 text-white/90 mb-4">
            <Car className="h-5 w-5" />
            <span className="text-lg font-semibold capitalize">{ride.vehicleType}</span>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2">
              <Users className="h-4 w-4 text-white/80" />
              <span className="text-white font-medium">{seatsFilled}/{ride.seatsRequired} seats filled</span>
            </div>
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2">
              <Clock className="h-4 w-4 text-white/80" />
              <span className="text-white font-medium">{new Date(ride.departureTime).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Route Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-ivory-200 overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-blue-100 to-slate-blue-50 flex items-center justify-center">
              <Route className="h-5 w-5 text-slate-blue" />
            </div>
            <h3 className="font-bold text-charcoal-dark text-lg">Route Details</h3>
          </div>

          {/* Route Visualization */}
          <div className="flex items-stretch gap-4">
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-md" />
              <div className="flex-1 w-0.5 bg-gradient-to-b from-emerald-500 via-slate-blue to-red-500 my-2" />
              <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-md" />
            </div>
            <div className="flex-1 space-y-6">
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-1">Start Point</p>
                <p className="font-semibold text-charcoal-dark">{ride.startPoint?.address}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <p className="text-xs font-medium text-red-600 uppercase tracking-wide mb-1">Destination</p>
                <p className="font-semibold text-charcoal-dark">{ride.endPoint?.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-lg border border-ivory-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-blue-100 to-slate-blue-50 flex items-center justify-center">
              <Users className="h-5 w-5 text-slate-blue" />
            </div>
          </div>
          <p className="text-xs font-medium text-charcoal-light uppercase tracking-wide">Seats</p>
          <p className="text-xl font-bold text-charcoal-dark">{seatsFilled} / {ride.seatsRequired}</p>
          <div className="h-1.5 bg-ivory rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-slate-blue to-slate-blue-400 rounded-full transition-all"
              style={{ width: `${seatsProgress}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-ivory-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center">
              <Banknote className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <p className="text-xs font-medium text-charcoal-light uppercase tracking-wide">Total Fare</p>
          <p className="text-xl font-bold text-charcoal-dark">{formatCurrency(ride.totalFare)}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-ivory-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-forest-100 to-emerald-100 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-forest" />
            </div>
          </div>
          <p className="text-xs font-medium text-charcoal-light uppercase tracking-wide">Per Person</p>
          <p className="text-xl font-bold text-forest">{formatCurrency(ride.farePerPerson)}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-ivory-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-charcoal-light/20 to-charcoal/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-charcoal" />
            </div>
          </div>
          <p className="text-xs font-medium text-charcoal-light uppercase tracking-wide">Departure</p>
          <p className="text-lg font-bold text-charcoal-dark">{new Date(ride.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      {/* Notes */}
      {ride.notes && (
        <div className="bg-white rounded-2xl shadow-lg border border-ivory-200 p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-charcoal-light/20 to-charcoal/10 flex items-center justify-center flex-shrink-0">
              <CircleDot className="h-5 w-5 text-charcoal" />
            </div>
            <div>
              <p className="text-xs font-medium text-charcoal-light uppercase tracking-wide mb-1">Notes from host</p>
              <p className="text-charcoal-dark">"{ride.notes}"</p>
            </div>
          </div>
        </div>
      )}

      {/* Female Only Warning */}
      {!canJoin && !isMember && ride.femaleOnly && user?.gender !== 'female' && (
        <div className="bg-pink-50 border border-pink-200 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pink-100 flex items-center justify-center">
              <Shield className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="font-semibold text-pink-800">Female Passengers Only</p>
              <p className="text-sm text-pink-600">This ride is exclusively for female passengers for safety.</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        {canJoin && (
          <Button
            onClick={() => setShowJoinDialog(true)}
            className="flex-1 bg-slate-blue hover:bg-slate-blue-600 h-12 text-base shadow-lg"
          >
            Join Ride
          </Button>
        )}

        {isMember && !isCreator && ride.status === 'open' && (
          <Button
            variant="outline"
            onClick={handleLeave}
            disabled={actionLoading}
            className="flex-1 h-12 border-2"
          >
            {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Leave Ride'}
          </Button>
        )}

        {isCreator && (ride.status === 'open' || ride.status === 'filled') && (
          <>
            <Button
              onClick={() => handleStatusUpdate('in_progress')}
              disabled={actionLoading}
              className="flex-1 bg-slate-blue hover:bg-slate-blue-600 h-12 text-base shadow-lg"
            >
              {actionLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              Start Ride
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={actionLoading}
              className="text-red-600 border-2 border-red-200 hover:bg-red-50 h-12"
            >
              Cancel Ride
            </Button>
          </>
        )}

        {isCreator && ride.status === 'in_progress' && (
          <Button
            onClick={() => handleStatusUpdate('completed')}
            disabled={actionLoading}
            className="flex-1 bg-forest hover:bg-forest-600 h-12 text-base shadow-lg"
          >
            {actionLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
            Complete Ride
          </Button>
        )}
      </div>

      {/* Map */}
      <div className="bg-white rounded-2xl shadow-lg border border-ivory-200 overflow-hidden mb-6">
        <div className="p-6 border-b border-ivory-200 bg-gradient-to-r from-ivory to-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-blue-100 to-slate-blue-50 flex items-center justify-center">
              <MapPinned className="h-5 w-5 text-slate-blue" />
            </div>
            <h3 className="font-bold text-charcoal-dark text-lg">Route Map</h3>
          </div>
        </div>
        <div className="h-80">
          {isLoaded ? (
            <RideMapGoogle
              startPoint={ride.startPoint}
              endPoint={ride.endPoint}
              stops={ride.members?.map((m) => ({
                coordinates: m.pickupPoint?.coordinates,
                address: m.pickupPoint?.address,
                userName: m.user?.name,
              })) || []}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-ivory">
              <Loader2 className="h-8 w-8 animate-spin text-slate-blue" />
            </div>
          )}
        </div>
      </div>

      {/* Passengers */}
      <div className="bg-white rounded-2xl shadow-lg border border-ivory-200 overflow-hidden">
        <div className="p-6 border-b border-ivory-200 bg-gradient-to-r from-ivory to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-blue-100 to-slate-blue-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-slate-blue" />
              </div>
              <h3 className="font-bold text-charcoal-dark text-lg">Passengers</h3>
            </div>
            <span className="px-4 py-2 bg-ivory rounded-full text-charcoal font-medium">
              {ride.members?.length || 0} people
            </span>
          </div>
        </div>

        <div className="divide-y divide-ivory-200">
          {ride.members?.map((member) => {
            const memberIsCreator = member.user?._id === ride.creator?._id;
            const memberIsYou = member.user?._id === user?._id;

            return (
              <div
                key={member.user?._id}
                className={`p-5 transition-colors ${memberIsYou ? 'bg-slate-blue-50/50' : 'hover:bg-ivory/50'}`}
              >
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                    <AvatarImage src={member.user?.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-slate-blue-100 to-slate-blue-50 text-slate-blue font-bold">
                      {member.user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

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
                        <span className="text-xs px-2 py-0.5 bg-slate-blue-100 text-slate-blue rounded-full font-medium">You</span>
                      )}
                    </div>
                    {member.user?.college && (
                      <p className="text-sm text-charcoal mb-1">{member.user.college}</p>
                    )}
                    <div className="flex items-center gap-1.5 text-charcoal">
                      <MapPin className="h-3.5 w-3.5 text-slate-blue" />
                      <span className="text-sm truncate">{member.pickupPoint?.address}</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-forest">{formatCurrency(ride.farePerPerson)}</p>
                    {member.user?.phone && (
                      <a
                        href={`tel:${member.user.phone}`}
                        className="inline-flex items-center gap-1 text-sm text-charcoal hover:text-slate-blue mt-1"
                      >
                        <Phone className="h-3.5 w-3.5" />
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

      {/* Join Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Join this Ride</DialogTitle>
            <DialogDescription>
              Select your pickup location along the route
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-medium">Your Pickup Location *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-blue z-10" />
                <PlacesAutocomplete
                  placeholder="Where should you be picked up?"
                  value={pickupLocation?.address || ''}
                  onSelect={(location) => {
                    setPickupLocation({
                      latitude: location.lat,
                      longitude: location.lng,
                      address: location.address,
                    });
                  }}
                  className="pl-10"
                  showCurrentLocation
                />
              </div>
              {pickupLocation && (
                <div className="flex items-center gap-2 p-3 bg-forest-50 rounded-xl border border-forest-200">
                  <Navigation className="h-4 w-4 text-forest" />
                  <span className="text-sm text-forest-700">{pickupLocation.address}</span>
                </div>
              )}
            </div>
            <div className="bg-slate-blue-50 p-4 rounded-xl border border-slate-blue-200">
              <p className="text-sm text-slate-blue-700">
                Your fare: <span className="font-bold text-lg">{formatCurrency(ride.farePerPerson)}</span>
              </p>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setShowJoinDialog(false)} className="flex-1 h-11 border-2">
              Cancel
            </Button>
            <Button
              onClick={handleJoin}
              disabled={actionLoading || !pickupLocation}
              className="flex-1 bg-slate-blue hover:bg-slate-blue-600 h-11"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Join Ride
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
