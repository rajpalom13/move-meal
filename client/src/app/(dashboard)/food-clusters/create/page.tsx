'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/context/auth-store';
import { foodClustersApi } from '@/lib/api';
import {
  ArrowLeft,
  MapPin,
  Loader2,
  Utensils,
  Store,
  Users,
  Clock,
  FileText,
  Sparkles,
  ChevronRight,
  Check,
  AlertCircle,
  Navigation,
} from 'lucide-react';
import Link from 'next/link';
import { LocationPickerMap, PlacesAutocomplete, useGoogleMaps } from '@/components/maps';

interface LocationPoint {
  latitude: number;
  longitude: number;
  address: string;
}

export default function CreateFoodClusterPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { isLoaded } = useGoogleMaps();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [suggestion, setSuggestion] = useState<{
    title: string;
    restaurant: string;
    description: string;
    minimumBasket: number;
  } | null>(null);

  // Location state
  const [deliveryLocation, setDeliveryLocation] = useState<LocationPoint | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    restaurant: '',
    restaurantAddress: '',
    minimumBasket: '',
    maxMembers: '10',
    deliveryTime: '',
    notes: '',
    orderAmount: '',
    items: '',
  });

  // Get current location for API calls
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  // Fetch AI suggestion
  useEffect(() => {
    const fetchSuggestion = async () => {
      if (!token || !currentLocation) return;
      try {
        const res = await foodClustersApi.getSuggestion(token, currentLocation.lat, currentLocation.lng);
        setSuggestion((res as { data: typeof suggestion }).data);
      } catch (err) {
        console.error('Failed to get suggestion:', err);
      }
    };
    fetchSuggestion();
  }, [token, currentLocation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const applySuggestion = () => {
    if (!suggestion) return;
    setFormData({
      ...formData,
      title: suggestion.title,
      restaurant: suggestion.restaurant,
      minimumBasket: suggestion.minimumBasket.toString(),
      notes: suggestion.description,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) return;

    if (!formData.title || !formData.restaurant || !formData.minimumBasket || !formData.orderAmount || !formData.items) {
      setError('Please fill in all required fields');
      return;
    }

    if (!deliveryLocation) {
      setError('Please select a delivery location');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await foodClustersApi.create(token, {
        title: formData.title,
        restaurant: formData.restaurant,
        restaurantAddress: formData.restaurantAddress || undefined,
        minimumBasket: parseFloat(formData.minimumBasket),
        maxMembers: parseInt(formData.maxMembers) || 10,
        deliveryLocation: {
          latitude: deliveryLocation.latitude,
          longitude: deliveryLocation.longitude,
          address: deliveryLocation.address,
        },
        deliveryTime: formData.deliveryTime || undefined,
        notes: formData.notes || undefined,
        orderAmount: parseFloat(formData.orderAmount),
        items: formData.items,
      });

      router.push('/food-clusters');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create cluster');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Cluster', icon: Store },
    { number: 2, title: 'Delivery', icon: MapPin },
    { number: 3, title: 'Your Order', icon: Utensils },
  ];

  const canProceed = () => {
    if (currentStep === 1) {
      return formData.title && formData.restaurant && formData.minimumBasket;
    }
    if (currentStep === 2) {
      return deliveryLocation !== null;
    }
    return true;
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/food-clusters"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <h1 className="text-2xl font-bold text-gray-900">Create Food Cluster</h1>
        <p className="text-gray-500 mt-1">Pool orders together to meet minimum basket requirements</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <button
                onClick={() => currentStep > step.number && setCurrentStep(step.number)}
                className={`flex items-center gap-2 ${
                  currentStep >= step.number ? 'text-orange-600' : 'text-gray-400'
                } ${currentStep > step.number ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentStep > step.number
                    ? 'bg-orange-500 text-white'
                    : currentStep === step.number
                    ? 'bg-orange-100 text-orange-600 ring-2 ring-orange-500 ring-offset-2'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {currentStep > step.number ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium">{step.title}</span>
              </button>
              {index < steps.length - 1 && (
                <div className={`h-0.5 w-12 sm:w-20 mx-2 transition-colors duration-300 ${
                  currentStep > step.number ? 'bg-orange-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Suggestion */}
      {suggestion && currentStep === 1 && !formData.title && (
        <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl animate-fade-in-up">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 mb-1">AI Suggestion</p>
              <p className="text-sm text-gray-600 mb-3">
                <span className="font-medium">{suggestion.title}</span> from {suggestion.restaurant}
              </p>
              <Button
                type="button"
                size="sm"
                onClick={applySuggestion}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Use this suggestion
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3 animate-fade-in">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Step 1: Cluster Details */}
          {currentStep === 1 && (
            <div className="p-6 space-y-5 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cluster Title
                </label>
                <Input
                  name="title"
                  placeholder="e.g., Lunch order from Dominos"
                  value={formData.title}
                  onChange={handleChange}
                  className="h-12"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Restaurant
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      name="restaurant"
                      placeholder="e.g., Domino's Pizza"
                      value={formData.restaurant}
                      onChange={handleChange}
                      className="h-12 pl-11"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Restaurant Address <span className="text-gray-400">(optional)</span>
                  </label>
                  <Input
                    name="restaurantAddress"
                    placeholder="Optional"
                    value={formData.restaurantAddress}
                    onChange={handleChange}
                    className="h-12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Basket
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                    <Input
                      name="minimumBasket"
                      type="number"
                      min="0"
                      placeholder="250"
                      value={formData.minimumBasket}
                      onChange={handleChange}
                      className="h-12 pl-8"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Restaurant's minimum order requirement</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Members
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      name="maxMembers"
                      type="number"
                      min="2"
                      max="20"
                      value={formData.maxMembers}
                      onChange={handleChange}
                      className="h-12 pl-11"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Delivery Details */}
          {currentStep === 2 && (
            <div className="p-6 space-y-5 animate-fade-in">
              {/* Interactive Map */}
              {isLoaded && (
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <LocationPickerMap
                    mode="single"
                    currentLocation={deliveryLocation ? { lat: deliveryLocation.latitude, lng: deliveryLocation.longitude } : undefined}
                    onLocationSelect={(location) => {
                      setDeliveryLocation({
                        latitude: location.lat,
                        longitude: location.lng,
                        address: location.address || 'Selected location',
                      });
                    }}
                    height="250px"
                    showCurrentLocationButton
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery / Pickup Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-coral z-10" />
                  <PlacesAutocomplete
                    placeholder="e.g., College Main Gate"
                    value={deliveryLocation?.address || ''}
                    onSelect={(location) => {
                      setDeliveryLocation({
                        latitude: location.lat,
                        longitude: location.lng,
                        address: location.address,
                      });
                    }}
                    className="h-12 pl-11"
                    showCurrentLocation
                  />
                </div>
                {deliveryLocation && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1 mt-2">
                    <Navigation className="h-3 w-3" />
                    {deliveryLocation.address}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Delivery Time <span className="text-gray-400">(optional)</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    name="deliveryTime"
                    type="datetime-local"
                    value={formData.deliveryTime}
                    onChange={handleChange}
                    className="h-12 pl-11"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes for the group <span className="text-gray-400">(optional)</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Textarea
                    name="notes"
                    placeholder="Any additional info..."
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="pl-11 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Your Order */}
          {currentStep === 3 && (
            <div className="p-6 space-y-5 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Order Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <Input
                    name="orderAmount"
                    type="number"
                    min="0"
                    placeholder="100"
                    value={formData.orderAmount}
                    onChange={handleChange}
                    className="h-12 pl-8"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What do you want to order?
                </label>
                <Textarea
                  name="items"
                  placeholder="e.g., 1x Margherita Pizza, 1x Garlic Bread"
                  value={formData.items}
                  onChange={handleChange}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Summary */}
              {formData.minimumBasket && formData.orderAmount && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-5 rounded-xl border border-orange-100">
                  <h4 className="font-semibold text-gray-900 mb-3">Order Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Minimum basket</span>
                      <span className="font-medium text-gray-900">₹{formData.minimumBasket}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Your order</span>
                      <span className="font-medium text-gray-900">₹{formData.orderAmount}</span>
                    </div>
                    <div className="border-t border-orange-200 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-orange-700 font-medium">Still needed</span>
                        <span className="font-bold text-orange-600">
                          ₹{Math.max(0, parseFloat(formData.minimumBasket) - parseFloat(formData.orderAmount))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={loading || !formData.orderAmount || !formData.items}
                className="bg-orange-500 hover:bg-orange-600 min-w-[140px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Cluster
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
