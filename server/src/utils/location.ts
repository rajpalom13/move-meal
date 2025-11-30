// Haversine formula for calculating distance between two points
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in kilometers
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Create a GeoJSON Point
export const createPoint = (longitude: number, latitude: number) => ({
  type: 'Point' as const,
  coordinates: [longitude, latitude],
});

// MongoDB geospatial query for finding nearby documents
export const getNearbyQuery = (
  longitude: number,
  latitude: number,
  maxDistanceKm: number
) => ({
  $near: {
    $geometry: {
      type: 'Point',
      coordinates: [longitude, latitude],
    },
    $maxDistance: maxDistanceKm * 1000, // Convert to meters
  },
});

// Calculate delivery fee based on distance
export const calculateDeliveryFee = (distanceKm: number): number => {
  const baseFee = 2.0;
  const perKmRate = 0.5;
  const minFee = 2.0;
  const maxFee = 15.0;

  const fee = baseFee + distanceKm * perKmRate;
  return Math.min(Math.max(fee, minFee), maxFee);
};

// Estimate delivery time based on distance
export const estimateDeliveryTime = (distanceKm: number): number => {
  const baseTime = 15; // Base preparation/pickup time in minutes
  const avgSpeedKmh = 25; // Average delivery speed

  const travelTime = (distanceKm / avgSpeedKmh) * 60; // Convert to minutes
  return Math.round(baseTime + travelTime);
};
