'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useLocation } from '@/hooks/useLocation';
import { vendorsApi } from '@/lib/api';
import { Vendor } from '@/types';
import { Store, Search, MapPin, Star, Clock } from 'lucide-react';

export default function VendorsPage() {
  const location = useLocation();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState<string>('all');

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
        if (cuisineFilter !== 'all') {
          params.cuisine = cuisineFilter;
        }
        const response = await vendorsApi.getAll(params);
        setVendors((response as { data: Vendor[] }).data || []);
      } catch (error) {
        console.error('Failed to fetch vendors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, [location.latitude, location.longitude, cuisineFilter]);

  const cuisineTypes = ['all', 'Italian', 'Chinese', 'Indian', 'Mexican', 'Japanese', 'Thai', 'American'];

  const filteredVendors = vendors.filter((vendor) =>
    vendor.businessName.toLowerCase().includes(search.toLowerCase()) ||
    vendor.cuisineTypes.some((c) => c.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Restaurants</h1>
        <p className="text-gray-600 mt-1">Browse restaurants and start a food cluster</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search restaurants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {cuisineTypes.map((cuisine) => (
            <button
              key={cuisine}
              className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition ${
                cuisineFilter === cuisine
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setCuisineFilter(cuisine)}
            >
              {cuisine === 'all' ? 'All Cuisines' : cuisine}
            </button>
          ))}
        </div>
      </div>

      {/* Vendors Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      ) : filteredVendors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Store className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No restaurants found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <Card key={vendor._id} className="overflow-hidden hover:shadow-md transition-shadow">
              {/* Restaurant Image Placeholder */}
              <div className="h-40 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                <Store className="h-16 w-16 text-white/50" />
              </div>

              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{vendor.businessName}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {vendor.cuisineTypes.slice(0, 3).map((cuisine) => (
                        <span key={cuisine} className="text-xs text-gray-500">
                          {cuisine}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Badge variant={vendor.isOpen ? 'default' : 'secondary'}>
                    {vendor.isOpen ? 'Open' : 'Closed'}
                  </Badge>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">{vendor.rating.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">
                    ({vendor.totalRatings} reviews)
                  </span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="truncate">{vendor.location.address}</span>
                </div>

                {/* Menu Items Count */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{vendor.menu?.length || 0} menu items</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/vendors/${vendor._id}`} className="flex-1">
                    <Button variant="outline" className="w-full">View Menu</Button>
                  </Link>
                  <Link href={`/clusters/create?vendorId=${vendor._id}`} className="flex-1">
                    <Button className="w-full">Create Cluster</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
