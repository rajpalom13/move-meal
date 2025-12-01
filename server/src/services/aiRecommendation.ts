import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/index.js';
import { ICluster, IUser, ClusterRecommendation } from '../types/index.js';
import { calculateDistance } from '../utils/location.js';

const genAI = config.gemini.apiKey ? new GoogleGenerativeAI(config.gemini.apiKey) : null;

interface ClusterWithDistance extends Partial<ICluster> {
  distance: number;
  memberCount: number;
  vendorName?: string;
  cuisineTypes?: string[];
}

export const generateClusterRecommendations = async (
  user: IUser,
  availableClusters: ClusterWithDistance[]
): Promise<ClusterRecommendation[]> => {
  if (!availableClusters.length) {
    return [];
  }

  // Score clusters based on multiple factors
  const scoredClusters = availableClusters.map((cluster) => {
    let score = 50; // Base score
    const reasons: string[] = [];
    const matchingPreferences: string[] = [];

    // Distance factor (closer is better)
    if (cluster.distance < 1) {
      score += 25;
      reasons.push('Very close to your location');
    } else if (cluster.distance < 3) {
      score += 15;
      reasons.push('Nearby location');
    } else if (cluster.distance < 5) {
      score += 5;
    }

    // Cuisine preference matching
    if (user.preferences?.cuisines && cluster.cuisineTypes) {
      const matchingCuisines = user.preferences.cuisines.filter(
        (c) => cluster.cuisineTypes?.includes(c)
      );
      if (matchingCuisines.length > 0) {
        score += matchingCuisines.length * 10;
        matchingPreferences.push(...matchingCuisines);
        reasons.push(`Matches your ${matchingCuisines.join(', ')} preference`);
      }
    }

    // Group size factor (more members = more savings)
    if (cluster.memberCount >= 5) {
      score += 15;
      reasons.push('Large group - maximum savings');
    } else if (cluster.memberCount >= 3) {
      score += 10;
      reasons.push('Good group size for savings');
    }

    // Scheduled time factor
    if (cluster.scheduledTime) {
      const timeDiff = new Date(cluster.scheduledTime).getTime() - Date.now();
      const hoursUntilDelivery = timeDiff / (1000 * 60 * 60);
      if (hoursUntilDelivery > 0 && hoursUntilDelivery < 2) {
        score += 10;
        reasons.push('Delivering soon');
      }
    }

    // Calculate estimated savings
    const baseFee = 5;
    const sharedFee = baseFee / (cluster.memberCount + 1);
    const estimatedSavings = baseFee - sharedFee;

    // Estimate delivery time based on distance
    const estimatedDeliveryTime = Math.round(15 + cluster.distance * 3);

    return {
      clusterId: cluster._id?.toString(),
      score: Math.min(score, 100),
      reasons,
      estimatedSavings: Math.round(estimatedSavings * 100) / 100,
      estimatedDeliveryTime,
      matchingPreferences,
    };
  });

  // Sort by score descending
  return scoredClusters.sort((a, b) => b.score - a.score);
};

export const suggestNewCluster = async (
  user: IUser,
  userLocation: { latitude: number; longitude: number },
  nearbyUsers: IUser[]
): Promise<{ suggestion: string; potentialMembers: number; cuisines: string[] }> => {
  // Find common preferences among nearby users
  const cuisineCount: Record<string, number> = {};

  nearbyUsers.forEach((nearbyUser) => {
    nearbyUser.preferences?.cuisines?.forEach((cuisine) => {
      cuisineCount[cuisine] = (cuisineCount[cuisine] || 0) + 1;
    });
  });

  // Add user's own preferences
  user.preferences?.cuisines?.forEach((cuisine) => {
    cuisineCount[cuisine] = (cuisineCount[cuisine] || 0) + 1;
  });

  // Find top cuisines
  const topCuisines = Object.entries(cuisineCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cuisine]) => cuisine);

  // If Gemini is configured, generate a more intelligent suggestion
  if (genAI && topCuisines.length > 0) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are a helpful assistant that suggests food ordering clusters. Based on these popular cuisine preferences: ${topCuisines.join(', ')}, suggest a cluster name and brief description for a group food order. Keep it brief and friendly. Format your response exactly as: Name | Description`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const suggestion = response.text() ||
        `${topCuisines[0]} Lovers | Join fellow ${topCuisines[0]} enthusiasts for a group order!`;

      return {
        suggestion: suggestion.trim(),
        potentialMembers: nearbyUsers.length,
        cuisines: topCuisines,
      };
    } catch (error) {
      console.error('Gemini API error:', error);
    }
  }

  // Fallback suggestion
  const defaultCuisine = topCuisines[0] || 'Food';
  return {
    suggestion: `${defaultCuisine} Group Order | Save on delivery by ordering together!`,
    potentialMembers: nearbyUsers.length,
    cuisines: topCuisines,
  };
};

export const calculateOptimalDeliveryRoute = (
  clusters: Array<{ location: { coordinates: [number, number] } }>
): number[] => {
  if (clusters.length <= 2) {
    return clusters.map((_, i) => i);
  }

  // Simple nearest neighbor algorithm for route optimization
  const visited = new Set<number>();
  const route: number[] = [0];
  visited.add(0);

  while (visited.size < clusters.length) {
    const current = route[route.length - 1];
    let nearestIdx = -1;
    let nearestDist = Infinity;

    clusters.forEach((cluster, idx) => {
      if (!visited.has(idx)) {
        const dist = calculateDistance(
          clusters[current].location.coordinates[1],
          clusters[current].location.coordinates[0],
          cluster.location.coordinates[1],
          cluster.location.coordinates[0]
        );
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = idx;
        }
      }
    });

    if (nearestIdx !== -1) {
      route.push(nearestIdx);
      visited.add(nearestIdx);
    }
  }

  return route;
};
