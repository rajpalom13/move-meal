import OpenAI from 'openai';
import config from '../config/index.js';
import { IFoodCluster, IUser } from '../types/index.js';
import { calculateDistance } from '../utils/location.js';

const openai = config.openai?.apiKey ? new OpenAI({ apiKey: config.openai.apiKey }) : null;

export interface FoodClusterRecommendation {
  clusterId: string;
  score: number;
  reasons: string[];
  estimatedSavings: number;
  matchScore: number;
  cluster?: IFoodCluster;
}

interface FoodClusterWithDistance extends Partial<IFoodCluster> {
  distance?: number;
}

/**
 * Generate smart recommendations for food clusters based on multiple factors
 */
export const generateFoodClusterRecommendations = async (
  user: IUser,
  availableClusters: FoodClusterWithDistance[],
  userLocation?: { latitude: number; longitude: number }
): Promise<FoodClusterRecommendation[]> => {
  if (!availableClusters.length) {
    return [];
  }

  const scoredClusters = availableClusters.map((cluster) => {
    let score = 40; // Base score
    const reasons: string[] = [];

    // Calculate distance if user location is provided
    let distance = cluster.distance;
    if (!distance && userLocation && cluster.deliveryLocation?.coordinates) {
      distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        cluster.deliveryLocation.coordinates[1],
        cluster.deliveryLocation.coordinates[0]
      );
    }

    // 1. Distance factor (up to 25 points)
    if (distance !== undefined) {
      if (distance < 0.5) {
        score += 25;
        reasons.push('Very close to you');
      } else if (distance < 1) {
        score += 20;
        reasons.push('Walking distance');
      } else if (distance < 2) {
        score += 15;
        reasons.push('Nearby');
      } else if (distance < 5) {
        score += 8;
      }
    }

    // 2. Basket progress factor (up to 20 points)
    // Clusters closer to completion are more attractive
    const basketProgress = cluster.minimumBasket
      ? (cluster.currentTotal || 0) / cluster.minimumBasket
      : 0;

    if (basketProgress >= 0.8) {
      score += 20;
      reasons.push('Almost ready to order!');
    } else if (basketProgress >= 0.5) {
      score += 12;
      reasons.push('Halfway there');
    } else if (basketProgress >= 0.3) {
      score += 5;
    }

    // 3. Member count factor (up to 15 points)
    // More members = more social proof and better savings
    const memberCount = cluster.members?.length || 0;
    if (memberCount >= 5) {
      score += 15;
      reasons.push('Popular cluster');
    } else if (memberCount >= 3) {
      score += 10;
      reasons.push('Active group');
    } else if (memberCount >= 2) {
      score += 5;
    }

    // 4. Timing factor (up to 15 points)
    if (cluster.deliveryTime) {
      const timeDiff = new Date(cluster.deliveryTime).getTime() - Date.now();
      const hoursUntilDelivery = timeDiff / (1000 * 60 * 60);

      if (hoursUntilDelivery > 0 && hoursUntilDelivery < 1) {
        score += 15;
        reasons.push('Ordering soon');
      } else if (hoursUntilDelivery > 0 && hoursUntilDelivery < 3) {
        score += 10;
        reasons.push('Good timing');
      }
    }

    // 5. College match (up to 10 points)
    if (user.college && cluster.members?.some(m => {
      const memberUser = m.user as unknown as IUser;
      return memberUser?.college === user.college;
    })) {
      score += 10;
      reasons.push('Students from your college');
    }

    // 6. Freshness bonus (up to 5 points)
    // Recently created clusters get a small boost
    if (cluster.createdAt) {
      const hoursOld = (Date.now() - new Date(cluster.createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursOld < 1) {
        score += 5;
        reasons.push('Just created');
      } else if (hoursOld < 3) {
        score += 3;
      }
    }

    // Calculate estimated savings
    const amountNeeded = Math.max(0, (cluster.minimumBasket || 0) - (cluster.currentTotal || 0));
    const estimatedSavings = amountNeeded > 0
      ? Math.min(50, Math.round(amountNeeded / (memberCount + 1)))
      : 0;

    return {
      clusterId: cluster._id?.toString() || '',
      score: Math.min(score, 100),
      reasons: reasons.slice(0, 3), // Top 3 reasons
      estimatedSavings,
      matchScore: Math.round(score),
      cluster: cluster as IFoodCluster,
    };
  });

  // Sort by score descending
  return scoredClusters
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score);
};

/**
 * Generate AI-powered suggestions for new clusters
 */
export const suggestFoodCluster = async (
  user: IUser,
  userLocation: { latitude: number; longitude: number },
  recentRestaurants?: string[]
): Promise<{
  title: string;
  restaurant: string;
  description: string;
  minimumBasket: number;
}> => {
  // Default suggestions based on time of day
  const hour = new Date().getHours();
  let mealType = 'lunch';
  let defaultRestaurants = ['Dominos', 'McDonald\'s', 'KFC'];

  if (hour >= 6 && hour < 11) {
    mealType = 'breakfast';
    defaultRestaurants = ['Chai Point', 'Starbucks', 'McDonald\'s'];
  } else if (hour >= 15 && hour < 18) {
    mealType = 'snacks';
    defaultRestaurants = ['Chai Point', 'Starbucks', 'Baskin Robbins'];
  } else if (hour >= 18 || hour < 6) {
    mealType = 'dinner';
    defaultRestaurants = ['Dominos', 'Behrouz Biryani', 'KFC'];
  }

  // If OpenAI is available, generate a creative suggestion
  if (openai) {
    try {
      const prompt = `Suggest a food cluster for college students in India for ${mealType}.
Recent popular restaurants: ${recentRestaurants?.join(', ') || defaultRestaurants.join(', ')}.
User's college: ${user.college || 'local college'}

Respond in this exact JSON format only:
{"title": "catchy cluster name", "restaurant": "restaurant name", "description": "short 10 word description", "minimumBasket": 250}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You suggest food ordering groups for college students. Be fun and relatable. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.8,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (content) {
        try {
          const suggestion = JSON.parse(content);
          return {
            title: suggestion.title || `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Squad`,
            restaurant: suggestion.restaurant || defaultRestaurants[0],
            description: suggestion.description || `Let's order ${mealType} together!`,
            minimumBasket: suggestion.minimumBasket || 250,
          };
        } catch {
          // JSON parsing failed, use fallback
        }
      }
    } catch (error) {
      console.error('OpenAI suggestion error:', error);
    }
  }

  // Fallback suggestion
  const randomRestaurant = defaultRestaurants[Math.floor(Math.random() * defaultRestaurants.length)];
  const titles = [
    `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Gang`,
    `${randomRestaurant} Run`,
    `Foodie Squad`,
    `Hunger Heroes`,
  ];

  return {
    title: titles[Math.floor(Math.random() * titles.length)],
    restaurant: randomRestaurant,
    description: `Save on delivery by ordering ${mealType} together!`,
    minimumBasket: 250,
  };
};

/**
 * Get personalized reasons why a user should join a cluster
 */
export const getJoinReasons = (
  cluster: IFoodCluster,
  user: IUser,
  distance?: number
): string[] => {
  const reasons: string[] = [];

  // Amount needed
  const amountNeeded = Math.max(0, cluster.minimumBasket - cluster.currentTotal);
  if (amountNeeded > 0 && amountNeeded < 100) {
    reasons.push(`Only ₹${amountNeeded} more needed!`);
  }

  // Members from same college
  const sameCollegeCount = cluster.members?.filter(m => {
    const memberUser = m.user as unknown as IUser;
    return user.college && memberUser?.college === user.college;
  }).length || 0;

  if (sameCollegeCount > 0) {
    reasons.push(`${sameCollegeCount} student${sameCollegeCount > 1 ? 's' : ''} from your college`);
  }

  // Distance
  if (distance !== undefined && distance < 1) {
    reasons.push('Pickup point nearby');
  }

  // Timing
  if (cluster.deliveryTime) {
    const timeDiff = new Date(cluster.deliveryTime).getTime() - Date.now();
    const minsUntil = Math.round(timeDiff / (1000 * 60));
    if (minsUntil > 0 && minsUntil < 60) {
      reasons.push(`Ordering in ${minsUntil} mins`);
    }
  }

  return reasons.slice(0, 3);
};
