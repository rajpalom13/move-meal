'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/context/auth-store';
import { ordersApi } from '@/lib/api';
import { Order } from '@/types';
import { formatCurrency, getStatusColor, formatDate } from '@/lib/utils';
import { ShoppingBag, ChevronRight } from 'lucide-react';

export default function OrdersPage() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return;

      setLoading(true);
      try {
        const params: Record<string, string> = { limit: '50' };
        if (filter !== 'all') {
          params.status = filter;
        }
        const response = await ordersApi.getAll(token, params);
        setOrders((response as { data: Order[] }).data || []);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token, filter]);

  const statusFilters = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'delivering', label: 'Delivering' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Orders</h1>
        <p className="text-gray-600 mt-1">Track and manage your food orders</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {statusFilters.map((status) => (
          <button
            key={status.value}
            className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition ${
              filter === status.value
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setFilter(status.value)}
          >
            {status.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No orders found</p>
            <p className="text-gray-400 text-sm mt-1">
              Start by joining a cluster and placing an order
            </p>
            <Link href="/clusters" className="mt-4">
              <Button>Browse Clusters</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{order.vendor?.businessName || 'Restaurant'}</h3>
                      <p className="text-sm text-gray-600">
                        {order.items.length} items - {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <Link href={`/orders/${order._id}`}>
                      <Button variant="ghost" size="icon">
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex flex-wrap gap-2">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <span key={idx} className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {item.quantity}x {item.name}
                      </span>
                    ))}
                    {order.items.length > 3 && (
                      <span className="text-sm text-gray-500">
                        +{order.items.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Cluster Info */}
                {order.cluster && (
                  <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-700">
                      Part of cluster: <span className="font-medium">{order.cluster.name}</span>
                    </p>
                  </div>
                )}

                {/* OTP Verification Status */}
                {order.status === 'delivering' && (
                  <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      Verification: Sender {order.senderVerified ? 'verified' : 'pending'} |
                      Receiver {order.receiverVerified ? 'verified' : 'pending'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
