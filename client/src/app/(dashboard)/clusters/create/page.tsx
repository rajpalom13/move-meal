'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/context/auth-store';
import { useLocation } from '@/hooks/useLocation';
import { clustersApi, vendorsApi } from '@/lib/api';
import { Vendor } from '@/types';
import { ArrowLeft, MapPin, Store, Users, Clock, Search } from 'lucide-react';

export default function CreateClusterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorIdParam = searchParams.get('vendorId');

  const { token } = useAuthStore();
  const location = useLocation();

  const [step, setStep] = useState(vendorIdParam ? 2 : 1);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    maxMembers: 10,
    deliveryAddress: '',
    scheduledTime: '',
  });

  // Fetch vendors
  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (location.latitude && location.longitude) {
          params.latitude = location.latitude.toString();
          params.longitude = location.longitude.toString();
          params.radius = '20';
        }
        const response = await vendorsApi.getAll(params);
        const vendorList = (response as { data: Vendor[] }).data || [];
        setVendors(vendorList);

        // If vendorId in URL, find and select it
        if (vendorIdParam) {
          const vendor = vendorList.find((v) => v._id === vendorIdParam);
          if (vendor) {
            setSelectedVendor(vendor);
            setFormData((prev) => ({
              ...prev,
              name: `${vendor.businessName} Group Order`,
            }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch vendors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, [location.latitude, location.longitude, vendorIdParam]);

  const filteredVendors = vendors.filter(
    (vendor) =>
      vendor.businessName.toLowerCase().includes(search.toLowerCase()) ||
      vendor.cuisineTypes.some((c) => c.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelectVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setFormData((prev) => ({
      ...prev,
      name: `${vendor.businessName} Group Order`,
    }));
    setStep(2);
  };

  const handleCreate = async () => {
    if (!token || !selectedVendor || !location.latitude || !location.longitude) return;

    setCreating(true);
    try {
      const response = await clustersApi.create(token, {
        name: formData.name,
        vendorId: selectedVendor._id,
        maxMembers: formData.maxMembers,
        deliveryAddress: formData.deliveryAddress || 'Current Location',
        deliveryCoordinates: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        scheduledTime: formData.scheduledTime || undefined,
      });

      const cluster = (response as { data: { _id: string } }).data;
      router.push(`/clusters/${cluster._id}`);
    } catch (error) {
      console.error('Failed to create cluster:', error);
      alert('Failed to create cluster. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/clusters">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create a Cluster</h1>
          <p className="text-gray-600 mt-1">
            {step === 1 ? 'Step 1: Select a restaurant' : 'Step 2: Configure your cluster'}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2">
        <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-orange-500' : 'bg-gray-200'}`} />
        <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-orange-500' : 'bg-gray-200'}`} />
      </div>

      {/* Step 1: Select Vendor */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select a Restaurant</CardTitle>
            <CardDescription>Choose a restaurant to create your food cluster</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search restaurants..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Vendor List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" />
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Store className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>No restaurants found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredVendors.map((vendor) => (
                  <button
                    key={vendor._id}
                    onClick={() => handleSelectVendor(vendor)}
                    className="p-4 border rounded-lg text-left hover:border-orange-300 hover:bg-orange-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <Store className="h-6 w-6 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{vendor.businessName}</h4>
                        <p className="text-sm text-gray-500 truncate">
                          {vendor.cuisineTypes.join(', ')}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-yellow-600">
                            {vendor.rating.toFixed(1)} rating
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            vendor.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {vendor.isOpen ? 'Open' : 'Closed'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Configure Cluster */}
      {step === 2 && selectedVendor && (
        <div className="space-y-6">
          {/* Selected Vendor */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Store className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-medium">{selectedVendor.businessName}</h4>
                    <p className="text-sm text-gray-500">{selectedVendor.cuisineTypes.join(', ')}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Cluster Details Form */}
          <Card>
            <CardHeader>
              <CardTitle>Cluster Details</CardTitle>
              <CardDescription>Configure your food cluster settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cluster Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Cluster Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Office Lunch Group"
                />
              </div>

              {/* Max Members */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  Maximum Members
                </label>
                <Input
                  type="number"
                  min={2}
                  max={20}
                  value={formData.maxMembers}
                  onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) || 10 })}
                />
                <p className="text-xs text-gray-500">More members = lower delivery fee per person</p>
              </div>

              {/* Delivery Address */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  Delivery Address
                </label>
                <Input
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  placeholder="Enter delivery address or use current location"
                />
                {location.latitude && location.longitude && (
                  <p className="text-xs text-green-600">
                    Using your current location for delivery
                  </p>
                )}
              </div>

              {/* Scheduled Time (Optional) */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  Scheduled Time (Optional)
                </label>
                <Input
                  type="datetime-local"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                />
                <p className="text-xs text-gray-500">Leave empty for ASAP delivery</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={creating || !formData.name || !location.latitude}
                  className="flex-1"
                >
                  {creating ? 'Creating...' : 'Create Cluster'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-orange-800 mb-2">How it works</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>1. Create a cluster and share the link with friends</li>
                <li>2. Everyone joins and adds their order</li>
                <li>3. When ready, lock the cluster to finalize orders</li>
                <li>4. A rider picks up all orders and delivers them together</li>
                <li>5. Everyone saves on delivery fees!</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
