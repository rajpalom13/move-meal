'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/context/auth-store';
import { rideClustersApi } from '@/lib/api';
import { ArrowLeft, MapPin, Loader2, Car, Bike, Users, Shield, Plus, X, Navigation } from 'lucide-react';
import Link from 'next/link';
import { LocationPickerMap, PlacesAutocomplete, useGoogleMaps } from '@/components/maps';

interface LocationPoint {
  latitude: number;
  longitude: number;
  address: string;
}

interface Stop {
  id: string;
  location: LocationPoint | null;
}

const vehicleTypes = [
  { value: 'auto', label: 'Auto', icon: Car },
  { value: 'cab', label: 'Cab', icon: Car },
  { value: 'bike', label: 'Bike', icon: Bike },
  { value: 'carpool', label: 'Carpool', icon: Users },
];

export default function CreateRideClusterPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const { isLoaded } = useGoogleMaps();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Location states
  const [startPoint, setStartPoint] = useState<LocationPoint | null>(null);
  const [endPoint, setEndPoint] = useState<LocationPoint | null>(null);
  const [pickupPoint, setPickupPoint] = useState<LocationPoint | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    seatsRequired: '4',
    totalFare: '',
    departureTime: '',
    vehicleType: 'auto',
    femaleOnly: false,
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // Add a new stop
  const addStop = useCallback(() => {
    setStops(prev => [...prev, { id: Date.now().toString(), location: null }]);
  }, []);

  // Remove a stop
  const removeStop = useCallback((id: string) => {
    setStops(prev => prev.filter(stop => stop.id !== id));
  }, []);

  // Update a stop's location
  const updateStop = useCallback((id: string, location: LocationPoint | null) => {
    setStops(prev => prev.map(stop =>
      stop.id === id ? { ...stop, location } : stop
    ));
  }, []);

  // Get all waypoints for the map
  const getWaypoints = useCallback(() => {
    const waypoints: Array<{ lat: number; lng: number }> = [];
    stops.forEach(stop => {
      if (stop.location) {
        waypoints.push({ lat: stop.location.latitude, lng: stop.location.longitude });
      }
    });
    return waypoints;
  }, [stops]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) return;

    if (!formData.title || !startPoint || !endPoint || !pickupPoint || !formData.totalFare || !formData.departureTime) {
      setError('Please fill in all required fields including locations');
      return;
    }

    // Female-only rides can only be created by female users
    if (formData.femaleOnly && user?.gender !== 'female') {
      setError('Only female users can create female-only rides');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Build stops array for API
      const validStops = stops
        .filter(stop => stop.location)
        .map(stop => ({
          latitude: stop.location!.latitude,
          longitude: stop.location!.longitude,
          address: stop.location!.address,
        }));

      await rideClustersApi.create(token, {
        title: formData.title,
        startPoint: {
          latitude: startPoint.latitude,
          longitude: startPoint.longitude,
          address: startPoint.address,
        },
        endPoint: {
          latitude: endPoint.latitude,
          longitude: endPoint.longitude,
          address: endPoint.address,
        },
        pickupPoint: {
          latitude: pickupPoint.latitude,
          longitude: pickupPoint.longitude,
          address: pickupPoint.address,
        },
        stops: validStops.length > 0 ? validStops : undefined,
        seatsRequired: parseInt(formData.seatsRequired),
        totalFare: parseFloat(formData.totalFare),
        departureTime: formData.departureTime,
        vehicleType: formData.vehicleType as 'auto' | 'cab' | 'bike' | 'carpool',
        femaleOnly: formData.femaleOnly,
        notes: formData.notes || undefined,
      });

      router.push('/ride-clusters');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/ride-clusters" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Ride Clusters
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create Shared Ride</CardTitle>
          <CardDescription>
            Start a ride cluster and share the fare with other students going the same way.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Ride Info */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Ride Details</h3>

              <div className="space-y-2">
                <Label htmlFor="title">Ride Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Morning commute to college"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Vehicle Type */}
              <div className="space-y-2">
                <Label>Vehicle Type *</Label>
                <div className="grid grid-cols-4 gap-2">
                  {vehicleTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        className={`p-3 border rounded-lg flex flex-col items-center gap-1 transition-colors ${
                          formData.vehicleType === type.value
                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setFormData({ ...formData, vehicleType: type.value })}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Route */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium text-gray-900">Route</h3>

              {/* Interactive Map */}
              {isLoaded && (
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <LocationPickerMap
                    mode="route-with-stops"
                    startLocation={startPoint ? { lat: startPoint.latitude, lng: startPoint.longitude } : undefined}
                    endLocation={endPoint ? { lat: endPoint.latitude, lng: endPoint.longitude } : undefined}
                    stops={getWaypoints()}
                    height="300px"
                    showCurrentLocationButton
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Start Point *</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 w-3 h-3 rounded-full bg-green-500 z-10"></div>
                    <PlacesAutocomplete
                      placeholder="Starting location address"
                      value={startPoint?.address || ''}
                      onSelect={(location) => {
                        setStartPoint({
                          latitude: location.lat,
                          longitude: location.lng,
                          address: location.address,
                        });
                      }}
                      className="pl-10"
                      showCurrentLocation
                    />
                  </div>
                  {startPoint && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Navigation className="h-3 w-3" />
                      {startPoint.address}
                    </p>
                  )}
                </div>

                {/* Stops Section */}
                {stops.length > 0 && (
                  <div className="space-y-3 pl-4 border-l-2 border-dashed border-gray-300">
                    <Label className="text-sm text-gray-600">Intermediate Stops</Label>
                    {stops.map((stop, index) => (
                      <div key={stop.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 relative">
                            <div className="absolute left-3 top-3 w-3 h-3 rounded-full bg-amber-500 z-10"></div>
                            <PlacesAutocomplete
                              placeholder={`Stop ${index + 1} address`}
                              value={stop.location?.address || ''}
                              onSelect={(location) => {
                                updateStop(stop.id, {
                                  latitude: location.lat,
                                  longitude: location.lng,
                                  address: location.address,
                                });
                              }}
                              className="pl-10"
                              showCurrentLocation
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStop(stop.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {stop.location && (
                          <p className="text-xs text-amber-600 flex items-center gap-1 pl-10">
                            <MapPin className="h-3 w-3" />
                            {stop.location.address}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Stop Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addStop}
                  className="w-full border-dashed"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stop
                </Button>

                <div className="space-y-2">
                  <Label>End Point *</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 w-3 h-3 rounded-full bg-red-500 z-10"></div>
                    <PlacesAutocomplete
                      placeholder="Destination address"
                      value={endPoint?.address || ''}
                      onSelect={(location) => {
                        setEndPoint({
                          latitude: location.lat,
                          longitude: location.lng,
                          address: location.address,
                        });
                      }}
                      className="pl-10"
                      showCurrentLocation
                    />
                  </div>
                  {endPoint && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <Navigation className="h-3 w-3" />
                      {endPoint.address}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Your Pickup Point *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-coral z-10" />
                    <PlacesAutocomplete
                      placeholder="Where should you be picked up?"
                      value={pickupPoint?.address || ''}
                      onSelect={(location) => {
                        setPickupPoint({
                          latitude: location.lat,
                          longitude: location.lng,
                          address: location.address,
                        });
                      }}
                      className="pl-10"
                      showCurrentLocation
                    />
                  </div>
                  {pickupPoint && (
                    <p className="text-xs text-coral flex items-center gap-1">
                      <Navigation className="h-3 w-3" />
                      {pickupPoint.address}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Fare & Seats */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium text-gray-900">Fare & Capacity</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seatsRequired">Total Seats Needed *</Label>
                  <Input
                    id="seatsRequired"
                    name="seatsRequired"
                    type="number"
                    min="2"
                    max="6"
                    value={formData.seatsRequired}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-xs text-gray-500">Including yourself</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalFare">Total Fare (₹) *</Label>
                  <Input
                    id="totalFare"
                    name="totalFare"
                    type="number"
                    min="0"
                    placeholder="e.g., 200"
                    value={formData.totalFare}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="departureTime">Departure Time *</Label>
                <Input
                  id="departureTime"
                  name="departureTime"
                  type="datetime-local"
                  value={formData.departureTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Female Only Option */}
            {user?.gender === 'female' && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-pink-500" />
                      Female Only Ride
                    </Label>
                    <p className="text-sm text-gray-500">
                      Only female users can join this ride
                    </p>
                  </div>
                  <Switch
                    checked={formData.femaleOnly}
                    onCheckedChange={(checked) => setFormData({ ...formData, femaleOnly: checked })}
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Any additional info for fellow riders..."
                value={formData.notes}
                onChange={handleChange}
                rows={2}
              />
            </div>

            {/* Summary */}
            {formData.totalFare && formData.seatsRequired && (
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-2">Fare Summary</h4>
                <div className="text-sm text-orange-700 space-y-1">
                  <p>Total fare: ₹{formData.totalFare}</p>
                  <p>Seats required: {formData.seatsRequired}</p>
                  <p className="font-medium text-lg">
                    Fare per person: ₹{Math.ceil(parseFloat(formData.totalFare) / parseInt(formData.seatsRequired))}
                  </p>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Ride'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
