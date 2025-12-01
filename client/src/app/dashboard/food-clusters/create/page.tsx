'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { useAuthStore } from '@/context/auth-store';
import { foodClustersApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft,
  MapPin,
  Loader2,
  Utensils,
  Store,
  Users,
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

  // Restaurant logo state
  const [restaurantLogo, setRestaurantLogo] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(false);

  // Popular restaurant logo mappings
  const restaurantLogos: Record<string, string> = {
    "domino's": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Dominos_pizza_logo.svg/1200px-Dominos_pizza_logo.svg.png",
    "dominos": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Dominos_pizza_logo.svg/1200px-Dominos_pizza_logo.svg.png",
    "pizza hut": "https://upload.wikimedia.org/wikipedia/sco/thumb/d/d2/Pizza_Hut_logo.svg/1200px-Pizza_Hut_logo.svg.png",
    "mcdonald's": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/McDonald%27s_Golden_Arches.svg/1200px-McDonald%27s_Golden_Arches.svg.png",
    "mcdonalds": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/McDonald%27s_Golden_Arches.svg/1200px-McDonald%27s_Golden_Arches.svg.png",
    "kfc": "https://upload.wikimedia.org/wikipedia/sco/thumb/b/bf/KFC_logo.svg/1200px-KFC_logo.svg.png",
    "burger king": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Burger_King_logo_%281999%29.svg/1200px-Burger_King_logo_%281999%29.svg.png",
    "subway": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Subway_2016_logo.svg/1200px-Subway_2016_logo.svg.png",
    "starbucks": "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/1200px-Starbucks_Corporation_Logo_2011.svg.png",
    "dunkin": "https://upload.wikimedia.org/wikipedia/en/thumb/b/b8/Dunkin%27_Donuts_logo.svg/1200px-Dunkin%27_Donuts_logo.svg.png",
    "dunkin donuts": "https://upload.wikimedia.org/wikipedia/en/thumb/b/b8/Dunkin%27_Donuts_logo.svg/1200px-Dunkin%27_Donuts_logo.svg.png",
    "swiggy": "https://upload.wikimedia.org/wikipedia/en/thumb/1/12/Swiggy_logo.svg/1200px-Swiggy_logo.svg.png",
    "zomato": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Zomato_logo.png/1200px-Zomato_logo.png",
    "haldiram": "https://upload.wikimedia.org/wikipedia/en/thumb/8/80/Haldiram%27s_Logo.svg/1200px-Haldiram%27s_Logo.svg.png",
    "haldiram's": "https://upload.wikimedia.org/wikipedia/en/thumb/8/80/Haldiram%27s_Logo.svg/1200px-Haldiram%27s_Logo.svg.png",
    "bikanervala": "https://bfrbrands.com/wp-content/uploads/2020/12/Bikanervala-Logo.png",
    "wow momo": "https://upload.wikimedia.org/wikipedia/en/thumb/2/2f/Wow%21_Momo_logo.png/220px-Wow%21_Momo_logo.png",
    "behrouz biryani": "https://res.cloudinary.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_100,h_100,c_fill/behrouz_logo_rxdyhi",
    "faasos": "https://res.cloudinary.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_100,h_100,c_fill/faasos_logo_ohycr1",
    "box8": "https://res.cloudinary.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_100,h_100,c_fill/box8_logo",
    "cafe coffee day": "https://upload.wikimedia.org/wikipedia/en/thumb/e/e5/Cafe_Coffee_Day_logo.svg/1200px-Cafe_Coffee_Day_logo.svg.png",
    "ccd": "https://upload.wikimedia.org/wikipedia/en/thumb/e/e5/Cafe_Coffee_Day_logo.svg/1200px-Cafe_Coffee_Day_logo.svg.png",
    "baskin robbins": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Baskin-Robbins_logo.svg/1200px-Baskin-Robbins_logo.svg.png",
    "naturals": "https://naturalsfarm.in/wp-content/uploads/2022/06/naturals-logo.png",
    "la pino'z": "https://lapinozpizza.in/cdn/shop/files/logo.png",
    "lapinoz": "https://lapinozpizza.in/cdn/shop/files/logo.png",
    "mojo pizza": "https://res.cloudinary.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_100,h_100,c_fill/mojo_pizza_logo",
    "oven story": "https://res.cloudinary.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_100,h_100,c_fill/oven_story_logo",
    "chaayos": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Chaayos_Logo.svg/1200px-Chaayos_Logo.svg.png",
  };

  // Fetch restaurant logo when name changes
  useEffect(() => {
    const fetchLogo = async () => {
      const restaurantName = formData.restaurant.toLowerCase().trim();
      if (!restaurantName || restaurantName.length < 2) {
        setRestaurantLogo(null);
        return;
      }

      setLogoLoading(true);

      // Check predefined logos first
      for (const [key, url] of Object.entries(restaurantLogos)) {
        if (restaurantName.includes(key) || key.includes(restaurantName)) {
          setRestaurantLogo(url);
          setLogoLoading(false);
          return;
        }
      }

      // Try Clearbit Logo API with common domain patterns
      const cleanName = restaurantName.replace(/[^a-z0-9]/g, '');
      const domainPatterns = [
        `${cleanName}.com`,
        `${cleanName}.in`,
        `${cleanName}india.com`,
        `${cleanName}.co.in`,
      ];

      for (const domain of domainPatterns) {
        try {
          const logoUrl = `https://logo.clearbit.com/${domain}`;
          const response = await fetch(logoUrl, { method: 'HEAD' });
          if (response.ok) {
            setRestaurantLogo(logoUrl);
            setLogoLoading(false);
            return;
          }
        } catch {
          // Continue to next pattern
        }
      }

      setRestaurantLogo(null);
      setLogoLoading(false);
    };

    const timeoutId = setTimeout(fetchLogo, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [formData.restaurant]);

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

      toast.success('Food cluster created successfully!');
      router.push('/dashboard/food-clusters');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create cluster';
      setError(errorMessage);
      toast.error(errorMessage);
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
          href="/dashboard/food-clusters"
          className="inline-flex items-center gap-2 text-charcoal hover:text-charcoal-dark text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <h1 className="text-2xl font-bold text-charcoal-dark">Create Food Cluster</h1>
        <p className="text-charcoal mt-1">Pool orders together to meet minimum basket requirements</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <button
                onClick={() => currentStep > step.number && setCurrentStep(step.number)}
                className={`flex items-center gap-2 ${
                  currentStep >= step.number ? 'text-forest-600' : 'text-charcoal/50'
                } ${currentStep > step.number ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentStep > step.number
                    ? 'bg-forest text-white'
                    : currentStep === step.number
                    ? 'bg-forest-100 text-forest-600 ring-2 ring-forest ring-offset-2'
                    : 'bg-ivory text-charcoal/40'
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
                  currentStep > step.number ? 'bg-forest' : 'bg-ivory-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Suggestion */}
      {suggestion && currentStep === 1 && !formData.title && (
        <div className="mb-6 p-4 bg-gradient-to-r from-slate-blue-50 to-forest-50 border border-slate-blue-200 rounded-2xl animate-fade-in-up">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-blue to-forest flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-charcoal-dark mb-1">AI Suggestion</p>
              <p className="text-sm text-charcoal mb-3">
                <span className="font-medium">{suggestion.title}</span> from {suggestion.restaurant}
              </p>
              <Button
                type="button"
                size="sm"
                onClick={applySuggestion}
                className="bg-forest hover:bg-forest-600"
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
        <div className="bg-white rounded-2xl border border-ivory-200 shadow-sm overflow-hidden">
          {/* Step 1: Cluster Details */}
          {currentStep === 1 && (
            <div className="p-6 space-y-5 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
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
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Restaurant
                  </label>
                  <div className="relative">
                    {restaurantLogo ? (
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded overflow-hidden bg-white flex items-center justify-center">
                        <img
                          src={restaurantLogo}
                          alt=""
                          className="h-full w-full object-contain"
                          onError={() => setRestaurantLogo(null)}
                        />
                      </div>
                    ) : logoLoading ? (
                      <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-forest animate-spin" />
                    ) : (
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-charcoal/40" />
                    )}
                    <Input
                      name="restaurant"
                      placeholder="e.g., Domino's Pizza"
                      value={formData.restaurant}
                      onChange={handleChange}
                      className="h-12 pl-11"
                    />
                    {restaurantLogo && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Check className="h-4 w-4 text-forest" />
                      </div>
                    )}
                  </div>
                  {restaurantLogo && (
                    <p className="text-xs text-forest-600 mt-1 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Restaurant logo found
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Restaurant Address <span className="text-charcoal/40">(optional)</span>
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
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Minimum Basket
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal font-medium">₹</span>
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
                  <p className="text-xs text-charcoal/60 mt-1">Restaurant&apos;s minimum order requirement</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Max Members
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-charcoal/40" />
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
                <div className="rounded-lg overflow-hidden border border-ivory-200">
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
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Delivery / Pickup Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-forest z-10" />
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
                  <p className="text-xs text-forest-600 flex items-center gap-1 mt-2">
                    <Navigation className="h-3 w-3" />
                    {deliveryLocation.address}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Preferred Delivery Time <span className="text-charcoal/40">(optional)</span>
                </label>
                <DateTimePicker
                  value={formData.deliveryTime}
                  onChange={(value) => setFormData({ ...formData, deliveryTime: value })}
                  minValue={new Date()}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Notes for the group <span className="text-charcoal/40">(optional)</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-5 w-5 text-charcoal/40" />
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
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Your Order Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal font-medium">₹</span>
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
                <label className="block text-sm font-medium text-charcoal mb-2">
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
                <div className="bg-gradient-to-r from-forest-50 to-slate-blue-50 p-5 rounded-xl border border-forest-200">
                  <h4 className="font-semibold text-charcoal-dark mb-3">Order Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-charcoal">Minimum basket</span>
                      <span className="font-medium text-charcoal-dark">₹{formData.minimumBasket}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal">Your order</span>
                      <span className="font-medium text-charcoal-dark">₹{formData.orderAmount}</span>
                    </div>
                    <div className="border-t border-forest-200 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-forest-700 font-medium">Still needed</span>
                        <span className="font-bold text-forest-600">
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
          <div className="p-6 bg-ivory border-t border-ivory-200 flex items-center justify-between">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="border-charcoal/20 text-charcoal hover:bg-charcoal/5"
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
                className="bg-forest hover:bg-forest-600"
              >
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={loading || !formData.orderAmount || !formData.items}
                className="bg-forest hover:bg-forest-600 min-w-[140px]"
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
