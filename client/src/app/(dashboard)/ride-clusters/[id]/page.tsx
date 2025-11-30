'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/context/auth-store';
import { useLocation } from '@/hooks/useLocation';
import { rideClustersApi } from '@/lib/api';
import { RideCluster } from '@/types';
import { formatCurrency, getStatusColor } from '@/lib/utils';
import {
  ArrowLeft,
  MapPin,
  Users,
  Clock,
  Phone,
  Loader2,
  AlertCircle,
  Car,
  Navigation,
  Shield,
} from 'lucide-react';

// Dynamic import for map to avoid SSR issues
const RideMap = dynamic(() => import('@/components/ride-map'), { ssr: false });

export default function RideClusterDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token, user } = useAuthStore();
  const userLocation = useLocation();

  const [ride, setRide] = useState<RideCluster | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [pickupAddress, setPickupAddress] = useState('');
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

  const isCreator = ride?.creator?._id === user?._id;
  const isMember = ride?.members?.some((m) => m.user?._id === user?._id);
  const myMembership = ride?.members?.find((m) => m.user?._id === user?._id);

  const handleJoin = async () => {
    if (!token || !id) return;

    if (!pickupAddress) {
      setError('Please enter your pickup address');
      return;
    }

    if (!userLocation.latitude || !userLocation.longitude) {
      setError('Location is required. Please enable location services.');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      await rideClustersApi.join(token, id as string, {
        pickupPoint: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          address: pickupAddress,
        },
      });
      await fetchRide();
      setShowJoinForm(false);
      setPickupAddress('');
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
      router.push('/ride-clusters');
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
      router.push('/ride-clusters');
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Ride not found</h2>
        <Link href="/ride-clusters">
          <Button variant="outline">Back to Rides</Button>
        </Link>
      </div>
    );
  }

  // Check if user can join (gender restriction)
  const canJoin = !isMember && ride.status === 'open' && ride.seatsAvailable > 0 &&
    (!ride.femaleOnly || user?.gender === 'female');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/ride-clusters" className="inline-flex items-center text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Ride Clusters
      </Link>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                {ride.title}
                {ride.femaleOnly && (
                  <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                    <Shield className="h-3 w-3 mr-1" />
                    Female Only
                  </Badge>
                )}
              </CardTitle>
              <p className="text-gray-600 mt-1 capitalize flex items-center gap-1">
                <Car className="h-4 w-4" />
                {ride.vehicleType}
              </p>
            </div>
            <Badge className={getStatusColor(ride.status)} style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
              {ride.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Route Display */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow"></div>
                <div className="w-0.5 h-12 bg-gray-300"></div>
                <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow"></div>
              </div>
              <div className="flex-1 space-y-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Start Point</p>
                  <p className="font-medium">{ride.startPoint?.address}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">End Point</p>
                  <p className="font-medium">{ride.endPoint?.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-b">
            <div>
              <p className="text-sm text-gray-500">Seats</p>
              <p className="font-semibold flex items-center gap-1">
                <Users className="h-4 w-4" />
                {ride.seatsRequired - ride.seatsAvailable} / {ride.seatsRequired}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Fare</p>
              <p className="font-semibold">{formatCurrency(ride.totalFare)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Per Person</p>
              <p className="font-semibold text-green-600 flex items-center gap-1">
                <Navigation className="h-4 w-4" />
                {formatCurrency(ride.farePerPerson)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Departure</p>
              <p className="font-semibold flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(ride.departureTime).toLocaleString()}
              </p>
            </div>
          </div>

          {ride.notes && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">{ride.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {canJoin && (
              <Button onClick={() => setShowJoinForm(true)}>
                Join Ride
              </Button>
            )}

            {!canJoin && !isMember && ride.femaleOnly && user?.gender !== 'female' && (
              <p className="text-sm text-pink-600 flex items-center gap-1">
                <Shield className="h-4 w-4" />
                This ride is for female passengers only
              </p>
            )}

            {isMember && !isCreator && ride.status === 'open' && (
              <Button variant="outline" onClick={handleLeave} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Leave Ride'}
              </Button>
            )}

            {isCreator && (ride.status === 'open' || ride.status === 'filled') && (
              <>
                <Button
                  onClick={() => handleStatusUpdate('in_progress')}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Start Ride
                </Button>
                <Button variant="destructive" onClick={handleCancel} disabled={actionLoading}>
                  Cancel Ride
                </Button>
              </>
            )}

            {isCreator && ride.status === 'in_progress' && (
              <Button onClick={() => handleStatusUpdate('completed')} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Complete Ride
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Join Form */}
      {showJoinForm && (
        <Card>
          <CardHeader>
            <CardTitle>Join this Ride</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pickupAddress">Your Pickup Address *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="pickupAddress"
                  placeholder="Where should you be picked up?"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="pl-10"
                />
              </div>
              {userLocation.latitude && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Using your current location coordinates
                </p>
              )}
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <p className="text-sm text-orange-700">
                Your share: <span className="font-semibold">{formatCurrency(ride.farePerPerson)}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleJoin} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Join Ride
              </Button>
              <Button variant="outline" onClick={() => setShowJoinForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle>Route Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 rounded-lg overflow-hidden">
            <RideMap
              startPoint={ride.startPoint}
              endPoint={ride.endPoint}
              stops={ride.members?.map((m) => ({
                coordinates: m.pickupPoint?.coordinates,
                address: m.pickupPoint?.address,
                userName: m.user?.name,
              })) || []}
            />
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle>Passengers ({ride.members?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ride.members?.map((member) => (
              <div
                key={member.user?._id}
                className="flex items-start justify-between p-4 border rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarImage src={member.user?.avatar} />
                    <AvatarFallback className="bg-orange-100 text-orange-600">
                      {member.user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{member.user?.name}</p>
                      {member.user?._id === ride.creator?._id && (
                        <Badge variant="secondary" className="text-xs">Creator</Badge>
                      )}
                      {member.user?._id === user?._id && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </div>
                    {member.user?.college && (
                      <p className="text-sm text-gray-500">{member.user.college}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {member.pickupPoint?.address}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">{formatCurrency(ride.farePerPerson)}</p>
                  {member.user?.phone && (
                    <a
                      href={`tel:${member.user.phone}`}
                      className="text-sm text-gray-500 flex items-center gap-1 mt-1 hover:text-gray-700"
                    >
                      <Phone className="h-3 w-3" />
                      {member.user.phone}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
