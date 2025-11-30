const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface RequestOptions extends RequestInit {
  token?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// Auth API
export const authApi = {
  register: (data: { email: string; phone: string; password: string; name: string; college?: string; gender?: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  sendOTP: (email: string) =>
    request('/auth/otp/send', { method: 'POST', body: JSON.stringify({ email }) }),

  verifyOTP: (email: string, otp: string) =>
    request('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ email, otp }) }),

  getMe: (token: string) =>
    request('/auth/me', { token }),

  updateProfile: (token: string, data: Record<string, unknown>) =>
    request('/auth/profile', { method: 'PUT', token, body: JSON.stringify(data) }),

  updateLocation: (token: string, data: { latitude: number; longitude: number; address?: string }) =>
    request('/auth/location', { method: 'PUT', token, body: JSON.stringify(data) }),
};

// Food Clusters API
export const foodClustersApi = {
  getAll: (token: string, params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return request(`/food-clusters${query}`, { token });
  },

  getMy: (token: string, params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return request(`/food-clusters/my${query}`, { token });
  },

  getOne: (token: string, id: string) =>
    request(`/food-clusters/${id}`, { token }),

  create: (token: string, data: {
    title: string;
    restaurant: string;
    restaurantAddress?: string;
    minimumBasket: number;
    maxMembers?: number;
    deliveryLocation: { latitude: number; longitude: number; address: string };
    deliveryTime?: string;
    notes?: string;
    orderAmount: number;
    items: string;
  }) =>
    request('/food-clusters', { method: 'POST', token, body: JSON.stringify(data) }),

  join: (token: string, id: string, data: { orderAmount: number; items: string }) =>
    request(`/food-clusters/${id}/join`, { method: 'POST', token, body: JSON.stringify(data) }),

  leave: (token: string, id: string) =>
    request(`/food-clusters/${id}/leave`, { method: 'POST', token }),

  updateOrder: (token: string, id: string, data: { orderAmount: number; items?: string }) =>
    request(`/food-clusters/${id}/order`, { method: 'PUT', token, body: JSON.stringify(data) }),

  updateStatus: (token: string, id: string, status: string) =>
    request(`/food-clusters/${id}/status`, { method: 'PATCH', token, body: JSON.stringify({ status }) }),

  cancel: (token: string, id: string) =>
    request(`/food-clusters/${id}/cancel`, { method: 'POST', token }),

  verifyCollectionOtp: (token: string, id: string, otp: string) =>
    request(`/food-clusters/${id}/verify-otp`, { method: 'POST', token, body: JSON.stringify({ otp }) }),

  getRecommended: (token: string, latitude?: number, longitude?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (latitude) params.append('latitude', latitude.toString());
    if (longitude) params.append('longitude', longitude.toString());
    if (limit) params.append('limit', limit.toString());
    return request(`/food-clusters/recommended?${params}`, { token });
  },

  getSuggestion: (token: string, latitude: number, longitude: number) =>
    request(`/food-clusters/suggest?latitude=${latitude}&longitude=${longitude}`, { token }),
};

// Ride Clusters API
export const rideClustersApi = {
  getAll: (token: string, params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return request(`/ride-clusters${query}`, { token });
  },

  getMy: (token: string, params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return request(`/ride-clusters/my${query}`, { token });
  },

  getNearby: (token: string, latitude: number, longitude: number, radius?: number) => {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      ...(radius && { radius: radius.toString() }),
    });
    return request(`/ride-clusters/nearby?${params}`, { token });
  },

  getOne: (token: string, id: string) =>
    request(`/ride-clusters/${id}`, { token }),

  create: (token: string, data: {
    title: string;
    startPoint: { latitude: number; longitude: number; address: string };
    endPoint: { latitude: number; longitude: number; address: string };
    pickupPoint: { latitude: number; longitude: number; address: string };
    seatsRequired: number;
    totalFare: number;
    departureTime: string;
    vehicleType?: 'auto' | 'cab' | 'bike' | 'carpool';
    femaleOnly?: boolean;
    notes?: string;
  }) =>
    request('/ride-clusters', { method: 'POST', token, body: JSON.stringify(data) }),

  join: (token: string, id: string, data: { pickupPoint: { latitude: number; longitude: number; address: string } }) =>
    request(`/ride-clusters/${id}/join`, { method: 'POST', token, body: JSON.stringify(data) }),

  leave: (token: string, id: string) =>
    request(`/ride-clusters/${id}/leave`, { method: 'POST', token }),

  updatePickup: (token: string, id: string, pickupPoint: { latitude: number; longitude: number; address: string }) =>
    request(`/ride-clusters/${id}/pickup`, { method: 'PUT', token, body: JSON.stringify({ pickupPoint }) }),

  updateStatus: (token: string, id: string, status: string) =>
    request(`/ride-clusters/${id}/status`, { method: 'PATCH', token, body: JSON.stringify({ status }) }),

  cancel: (token: string, id: string) =>
    request(`/ride-clusters/${id}/cancel`, { method: 'POST', token }),
};

// Legacy APIs for backward compatibility - redirect to new APIs
export const clustersApi = {
  getAll: foodClustersApi.getAll,
  getMy: foodClustersApi.getMy,
  getRecommended: (token: string, latitude: number, longitude: number) =>
    foodClustersApi.getAll(token, { latitude: latitude.toString(), longitude: longitude.toString() }),
  getSuggestion: (token: string, latitude: number, longitude: number) =>
    foodClustersApi.getAll(token, { latitude: latitude.toString(), longitude: longitude.toString() }),
  getOne: foodClustersApi.getOne,
  create: (token: string, data: Record<string, unknown>) =>
    foodClustersApi.create(token, data as Parameters<typeof foodClustersApi.create>[1]),
  join: (token: string, id: string) =>
    foodClustersApi.join(token, id, { orderAmount: 0, items: '' }),
  leave: foodClustersApi.leave,
  updateStatus: foodClustersApi.updateStatus,
};

export const ridesApi = {
  getNearby: rideClustersApi.getNearby,
};

export const ordersApi = {
  getAll: (token: string, params?: Record<string, string>) =>
    Promise.resolve({ success: true, data: [] }),
};
