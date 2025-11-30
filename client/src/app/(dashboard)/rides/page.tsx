'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/context/auth-store';
import { useLocation } from '@/hooks/useLocation';
import { ridesApi } from '@/lib/api';
import { Ride } from '@/types';
import { formatDistance, getStatusColor } from '@/lib/utils';
import { Bike, MapPin, Star, RefreshCw, Navigation } from 'lucide-react';

export default function RidesPage() {
  const { token } = useAuthStore();
  const location = useLocation();

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(5);

  const fetchRides = async () => {
    if (!token || !location.latitude || !location.longitude) return;

    setLoading(true);
    try {
      const response = await ridesApi.getNearby(
        token,
        location.latitude,
        location.longitude,
        radius
      );
      setRides((response as { data: Ride[] }).data || []);
    } catch (error) {
      console.error('Failed to fetch rides:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, [token, location.latitude, location.longitude, radius]);

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'bike':
        return '🚲';
      case 'scooter':
        return '🛵';
      case 'car':
        return '🚗';
      default:
        return '🚲';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nearby Riders</h1>
          <p className="text-gray-600 mt-1">
            {location.latitude
              ? 'Available delivery riders in your area'
              : 'Enable location to see nearby riders'}
          </p>
        </div>
        <Button onClick={fetchRides} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Location Status */}
      {!location.latitude && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 flex items-center gap-3">
            <MapPin className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">Location Required</p>
              <p className="text-sm text-yellow-700">
                Please enable location services to see nearby riders
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => location.refresh()}
              className="ml-auto"
            >
              Enable Location
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Radius Filter */}
      {location.latitude && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Navigation className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium">Search Radius:</span>
              <div className="flex gap-2">
                {[1, 3, 5, 10].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    className={`px-3 py-1 text-sm rounded-full transition ${
                      radius === r
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
              <span className="ml-auto text-sm text-gray-500">
                Found {rides.length} riders
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Riders Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      ) : rides.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bike className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No riders available nearby</p>
            <p className="text-gray-400 text-sm mt-1">
              Try increasing the search radius or check back later
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rides.map((ride) => (
            <Card key={ride._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-2xl">
                      {getVehicleIcon(ride.vehicleType)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{ride.rider?.name || 'Rider'}</CardTitle>
                      <p className="text-sm text-gray-500 capitalize">{ride.vehicleType}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(ride.status)}>
                    {ride.status === 'available' ? 'Available' : ride.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-orange-500">
                      {formatDistance(ride.distance || 0)}
                    </p>
                    <p className="text-xs text-gray-500">Away</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-2xl font-bold">{ride.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-gray-500">Rating</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{ride.totalDeliveries}</p>
                    <p className="text-xs text-gray-500">Deliveries</p>
                  </div>
                </div>

                {/* Contact Info */}
                {ride.rider?.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t">
                    <span>Contact:</span>
                    <span className="font-medium">{ride.rider.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Become a Rider CTA */}
      <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Want to earn money delivering?</h3>
            <p className="text-orange-100">
              Join our rider network and start earning today
            </p>
          </div>
          <Button variant="secondary" size="lg">
            Become a Rider
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
