import { Response } from 'express';
import { FoodCluster } from '../models/FoodCluster.js';
import { AuthRequest } from '../types/index.js';
import {
  generateFoodClusterRecommendations,
  suggestFoodCluster,
  getJoinReasons,
} from '../services/foodClusterRecommendation.js';

// Generate a 4-digit OTP
const generateOTP = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Create a new food cluster
export const createFoodCluster = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const {
      title,
      restaurant,
      restaurantAddress,
      minimumBasket,
      maxMembers = 10,
      deliveryLocation,
      deliveryTime,
      notes,
      orderAmount,
      items,
    } = req.body;

    // Create cluster with creator as first member
    const foodCluster = await FoodCluster.create({
      title,
      creator: userId,
      restaurant,
      restaurantAddress,
      minimumBasket,
      currentTotal: orderAmount,
      maxMembers,
      deliveryLocation: {
        type: 'Point',
        coordinates: [deliveryLocation.longitude, deliveryLocation.latitude],
        address: deliveryLocation.address,
      },
      deliveryTime: deliveryTime ? new Date(deliveryTime) : undefined,
      notes,
      members: [
        {
          user: userId,
          orderAmount,
          items,
          joinedAt: new Date(),
          hasCollected: false,
        },
      ],
    });

    await foodCluster.populate('creator', 'name avatar phone college');
    await foodCluster.populate('members.user', 'name avatar phone college');

    res.status(201).json({
      success: true,
      data: foodCluster,
    });
  } catch (error) {
    console.error('Create food cluster error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create food cluster',
    });
  }
};

// Get all food clusters with filters
export const getFoodClusters = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      latitude,
      longitude,
      radius = 5,
      status,
      restaurant,
      page = 1,
      limit = 20,
    } = req.query;

    const query: Record<string, unknown> = {};

    // Use $geoWithin instead of $near to avoid sorting issues
    if (latitude && longitude) {
      const radiusInRadians = (parseFloat(radius as string) * 1000) / 6378100; // Convert km to radians
      query['deliveryLocation'] = {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(longitude as string), parseFloat(latitude as string)],
            radiusInRadians,
          ],
        },
      };
    }

    // Status filter
    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['open', 'filled'] };
    }

    // Restaurant search
    if (restaurant) {
      query.$or = [
        { restaurant: { $regex: restaurant, $options: 'i' } },
        { title: { $regex: restaurant, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [clusters, total] = await Promise.all([
      FoodCluster.find(query)
        .populate('creator', 'name avatar phone college')
        .populate('members.user', 'name avatar phone college')
        .skip(skip)
        .limit(parseInt(limit as string))
        .sort({ createdAt: -1 }),
      FoodCluster.countDocuments(query),
    ]);

    // Add basket progress info
    const clustersWithProgress = clusters.map((cluster) => ({
      ...cluster.toObject(),
      basketProgress: Math.min(100, Math.round((cluster.currentTotal / cluster.minimumBasket) * 100)),
      amountNeeded: Math.max(0, cluster.minimumBasket - cluster.currentTotal),
    }));

    res.json({
      success: true,
      data: clustersWithProgress,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get food clusters error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch food clusters',
    });
  }
};

// Get single food cluster
export const getFoodCluster = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const cluster = await FoodCluster.findById(id)
      .populate('creator', 'name avatar phone college')
      .populate('members.user', 'name avatar phone college');

    if (!cluster) {
      res.status(404).json({
        success: false,
        error: 'Food cluster not found',
      });
      return;
    }

    // Find the user's membership to include their OTP (only visible to them)
    const clusterObj = cluster.toObject();
    const userMember = cluster.members.find(m => m.user._id.toString() === userId.toString());

    // Only show OTP to the member themselves, not to others
    const membersWithOtp = clusterObj.members.map((member: any) => {
      const memberUserId = (member.user as Record<string, unknown>)?._id?.toString();
      if (memberUserId === userId.toString()) {
        return member; // Include OTP for current user
      }
      // Hide OTP from other members (but keep hasCollected visible)
      const { collectionOtp, ...rest } = member;
      return rest;
    });

    res.json({
      success: true,
      data: {
        ...clusterObj,
        members: membersWithOtp,
        basketProgress: Math.min(100, Math.round((cluster.currentTotal / cluster.minimumBasket) * 100)),
        amountNeeded: Math.max(0, cluster.minimumBasket - cluster.currentTotal),
      },
    });
  } catch (error) {
    console.error('Get food cluster error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch food cluster',
    });
  }
};

// Join a food cluster
export const joinFoodCluster = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;
    const { orderAmount, items } = req.body;

    if (!orderAmount || orderAmount <= 0) {
      res.status(400).json({
        success: false,
        error: 'Order amount is required and must be greater than 0',
      });
      return;
    }

    if (!items || !items.trim()) {
      res.status(400).json({
        success: false,
        error: 'Please describe what you want to order',
      });
      return;
    }

    const cluster = await FoodCluster.findById(id);

    if (!cluster) {
      res.status(404).json({
        success: false,
        error: 'Food cluster not found',
      });
      return;
    }

    if (cluster.status !== 'open' && cluster.status !== 'filled') {
      res.status(400).json({
        success: false,
        error: 'This cluster is no longer accepting new members',
      });
      return;
    }

    if (cluster.members.length >= cluster.maxMembers) {
      res.status(400).json({
        success: false,
        error: 'Cluster is full',
      });
      return;
    }

    if (cluster.members.some((m) => m.user.toString() === userId.toString())) {
      res.status(400).json({
        success: false,
        error: 'You are already a member of this cluster',
      });
      return;
    }

    // Add member with their order
    cluster.members.push({
      user: userId,
      orderAmount,
      items,
      joinedAt: new Date(),
      hasCollected: false,
    });

    // Update current total
    cluster.currentTotal += orderAmount;

    await cluster.save();
    await cluster.populate('creator', 'name avatar phone college');
    await cluster.populate('members.user', 'name avatar phone college');

    res.json({
      success: true,
      data: {
        ...cluster.toObject(),
        basketProgress: Math.min(100, Math.round((cluster.currentTotal / cluster.minimumBasket) * 100)),
        amountNeeded: Math.max(0, cluster.minimumBasket - cluster.currentTotal),
      },
    });
  } catch (error) {
    console.error('Join food cluster error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join food cluster',
    });
  }
};

// Leave a food cluster
export const leaveFoodCluster = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const cluster = await FoodCluster.findById(id);

    if (!cluster) {
      res.status(404).json({
        success: false,
        error: 'Food cluster not found',
      });
      return;
    }

    // Creator cannot leave - they must cancel the cluster
    if (cluster.creator.toString() === userId.toString()) {
      res.status(400).json({
        success: false,
        error: 'Creator cannot leave. Cancel the cluster instead.',
      });
      return;
    }

    const memberIndex = cluster.members.findIndex(
      (m) => m.user.toString() === userId.toString()
    );

    if (memberIndex === -1) {
      res.status(400).json({
        success: false,
        error: 'You are not a member of this cluster',
      });
      return;
    }

    if (!['open', 'filled'].includes(cluster.status)) {
      res.status(400).json({
        success: false,
        error: 'Cannot leave cluster after order has been placed',
      });
      return;
    }

    // Subtract order amount from total
    cluster.currentTotal -= cluster.members[memberIndex].orderAmount;
    cluster.members.splice(memberIndex, 1);

    // Reopen if was filled and now below minimum
    if (cluster.status === 'filled' && cluster.currentTotal < cluster.minimumBasket) {
      cluster.status = 'open';
    }

    await cluster.save();

    res.json({
      success: true,
      message: 'Left cluster successfully',
    });
  } catch (error) {
    console.error('Leave food cluster error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to leave food cluster',
    });
  }
};

// Update cluster status (only creator)
export const updateFoodClusterStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user!._id;

    const cluster = await FoodCluster.findById(id);

    if (!cluster) {
      res.status(404).json({
        success: false,
        error: 'Food cluster not found',
      });
      return;
    }

    if (cluster.creator.toString() !== userId.toString()) {
      res.status(403).json({
        success: false,
        error: 'Only the cluster creator can update status',
      });
      return;
    }

    // Define valid status transitions
    const validTransitions: Record<string, string[]> = {
      open: ['filled', 'ordered', 'cancelled'],
      filled: ['open', 'ordered', 'cancelled'],
      ordered: ['ready', 'cancelled'],
      ready: ['collecting', 'cancelled'],
      collecting: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[cluster.status]?.includes(status)) {
      res.status(400).json({
        success: false,
        error: `Cannot transition from ${cluster.status} to ${status}`,
      });
      return;
    }

    // When transitioning to "ready", generate OTPs for all members except creator
    if (status === 'ready') {
      cluster.members = cluster.members.map(member => {
        const isCreator = member.user.toString() === cluster.creator.toString();
        return {
          ...member,
          // Creator doesn't need OTP - they're distributing the orders
          collectionOtp: isCreator ? undefined : generateOTP(),
          // Auto-mark creator as collected since they have the order
          hasCollected: isCreator,
          collectedAt: isCreator ? new Date() : undefined,
        };
      });
    }

    cluster.status = status;
    await cluster.save();
    await cluster.populate('creator', 'name avatar phone college');
    await cluster.populate('members.user', 'name avatar phone college');

    res.json({
      success: true,
      data: {
        ...cluster.toObject(),
        basketProgress: Math.min(100, Math.round((cluster.currentTotal / cluster.minimumBasket) * 100)),
        amountNeeded: Math.max(0, cluster.minimumBasket - cluster.currentTotal),
      },
    });
  } catch (error) {
    console.error('Update food cluster status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cluster status',
    });
  }
};

// Verify member collection OTP (only creator can do this)
export const verifyCollectionOtp = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { otp } = req.body;
    const userId = req.user!._id;

    if (!otp) {
      res.status(400).json({
        success: false,
        error: 'OTP is required',
      });
      return;
    }

    const cluster = await FoodCluster.findById(id);

    if (!cluster) {
      res.status(404).json({
        success: false,
        error: 'Food cluster not found',
      });
      return;
    }

    // Only creator can verify OTPs
    if (cluster.creator.toString() !== userId.toString()) {
      res.status(403).json({
        success: false,
        error: 'Only the cluster creator can verify collection OTPs',
      });
      return;
    }

    if (!['ready', 'collecting'].includes(cluster.status)) {
      res.status(400).json({
        success: false,
        error: 'Order is not ready for collection yet',
      });
      return;
    }

    // Find member with matching OTP
    const memberIndex = cluster.members.findIndex(m => m.collectionOtp === otp);

    if (memberIndex === -1) {
      res.status(400).json({
        success: false,
        error: 'Invalid OTP',
      });
      return;
    }

    if (cluster.members[memberIndex].hasCollected) {
      res.status(400).json({
        success: false,
        error: 'This member has already collected their order',
      });
      return;
    }

    // Mark member as collected
    cluster.members[memberIndex].hasCollected = true;
    cluster.members[memberIndex].collectedAt = new Date();

    // Update status to collecting if it was ready
    if (cluster.status === 'ready') {
      cluster.status = 'collecting';
    }

    await cluster.save();
    await cluster.populate('creator', 'name avatar phone college');
    await cluster.populate('members.user', 'name avatar phone college');

    // Get the member's name for the response
    const collectedMember = cluster.members[memberIndex];
    const memberUser = collectedMember.user as unknown as { name: string };

    res.json({
      success: true,
      message: `Order collected by ${memberUser.name}`,
      data: {
        ...cluster.toObject(),
        basketProgress: Math.min(100, Math.round((cluster.currentTotal / cluster.minimumBasket) * 100)),
        amountNeeded: Math.max(0, cluster.minimumBasket - cluster.currentTotal),
      },
    });
  } catch (error) {
    console.error('Verify collection OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP',
    });
  }
};

// Get my food clusters
export const getMyFoodClusters = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { status, type } = req.query;

    const query: Record<string, unknown> = {
      'members.user': userId,
    };

    if (status) {
      query.status = status;
    }

    // Filter by created vs joined
    if (type === 'created') {
      query.creator = userId;
    }

    const clusters = await FoodCluster.find(query)
      .populate('creator', 'name avatar phone college')
      .populate('members.user', 'name avatar phone college')
      .sort({ createdAt: -1 });

    const clustersWithProgress = clusters.map((cluster) => {
      const clusterObj = cluster.toObject();
      // Find user's membership to include their OTP
      const userMember = cluster.members.find(m => m.user._id.toString() === userId.toString());

      return {
        ...clusterObj,
        myOtp: userMember?.collectionOtp, // Include user's own OTP
        myCollected: userMember?.hasCollected,
        basketProgress: Math.min(100, Math.round((cluster.currentTotal / cluster.minimumBasket) * 100)),
        amountNeeded: Math.max(0, cluster.minimumBasket - cluster.currentTotal),
      };
    });

    res.json({
      success: true,
      data: clustersWithProgress,
    });
  } catch (error) {
    console.error('Get my food clusters error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch food clusters',
    });
  }
};

// Cancel a food cluster (only creator)
export const cancelFoodCluster = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const cluster = await FoodCluster.findById(id);

    if (!cluster) {
      res.status(404).json({
        success: false,
        error: 'Food cluster not found',
      });
      return;
    }

    if (cluster.creator.toString() !== userId.toString()) {
      res.status(403).json({
        success: false,
        error: 'Only the cluster creator can cancel it',
      });
      return;
    }

    if (['completed', 'cancelled'].includes(cluster.status)) {
      res.status(400).json({
        success: false,
        error: 'Cannot cancel a completed or already cancelled cluster',
      });
      return;
    }

    cluster.status = 'cancelled';
    await cluster.save();

    res.json({
      success: true,
      message: 'Cluster cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel food cluster error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel cluster',
    });
  }
};

// Update member's order in cluster
export const updateMemberOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;
    const { orderAmount, items } = req.body;

    const cluster = await FoodCluster.findById(id);

    if (!cluster) {
      res.status(404).json({
        success: false,
        error: 'Food cluster not found',
      });
      return;
    }

    if (!['open', 'filled'].includes(cluster.status)) {
      res.status(400).json({
        success: false,
        error: 'Cannot update order after cluster is closed',
      });
      return;
    }

    const memberIndex = cluster.members.findIndex(
      (m) => m.user.toString() === userId.toString()
    );

    if (memberIndex === -1) {
      res.status(400).json({
        success: false,
        error: 'You are not a member of this cluster',
      });
      return;
    }

    // Update total
    const oldAmount = cluster.members[memberIndex].orderAmount;
    cluster.currentTotal = cluster.currentTotal - oldAmount + orderAmount;

    // Update member's order
    cluster.members[memberIndex].orderAmount = orderAmount;
    if (items) {
      cluster.members[memberIndex].items = items;
    }

    await cluster.save();
    await cluster.populate('creator', 'name avatar phone college');
    await cluster.populate('members.user', 'name avatar phone college');

    res.json({
      success: true,
      data: {
        ...cluster.toObject(),
        basketProgress: Math.min(100, Math.round((cluster.currentTotal / cluster.minimumBasket) * 100)),
        amountNeeded: Math.max(0, cluster.minimumBasket - cluster.currentTotal),
      },
    });
  } catch (error) {
    console.error('Update member order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order',
    });
  }
};

// Get recommended food clusters for user
export const getRecommendedFoodClusters = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { latitude, longitude, limit = 10 } = req.query;

    const userLocation = latitude && longitude
      ? { latitude: parseFloat(latitude as string), longitude: parseFloat(longitude as string) }
      : undefined;

    // Build query for active clusters
    const query: Record<string, unknown> = {
      status: { $in: ['open', 'filled'] },
    };

    // If location provided, filter by proximity
    if (userLocation) {
      const radiusInRadians = (10 * 1000) / 6378100; // 10km radius
      query['deliveryLocation'] = {
        $geoWithin: {
          $centerSphere: [
            [userLocation.longitude, userLocation.latitude],
            radiusInRadians,
          ],
        },
      };
    }

    // Exclude clusters user is already a member of
    query['members.user'] = { $ne: user._id };

    const clusters = await FoodCluster.find(query)
      .populate('creator', 'name avatar college')
      .populate('members.user', 'name avatar college')
      .sort({ createdAt: -1 })
      .limit(50);

    // Generate recommendations with scores
    const recommendations = await generateFoodClusterRecommendations(
      user,
      clusters.map(c => c.toObject()),
      userLocation
    );

    // Add join reasons to each recommendation
    const enrichedRecommendations = recommendations
      .slice(0, parseInt(limit as string))
      .map(rec => {
        const cluster = clusters.find(c => c._id.toString() === rec.clusterId);
        return {
          ...rec,
          joinReasons: cluster ? getJoinReasons(cluster, user) : [],
          cluster: cluster ? {
            ...cluster.toObject(),
            basketProgress: Math.min(100, Math.round((cluster.currentTotal / cluster.minimumBasket) * 100)),
            amountNeeded: Math.max(0, cluster.minimumBasket - cluster.currentTotal),
          } : undefined,
        };
      });

    res.json({
      success: true,
      data: enrichedRecommendations,
    });
  } catch (error) {
    console.error('Get recommended food clusters error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations',
    });
  }
};

// Get AI suggestion for creating a new cluster
export const getSuggestedFoodCluster = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      res.status(400).json({
        success: false,
        error: 'Location is required',
      });
      return;
    }

    const userLocation = {
      latitude: parseFloat(latitude as string),
      longitude: parseFloat(longitude as string),
    };

    // Get recent popular restaurants from existing clusters
    const recentClusters = await FoodCluster.find({
      status: { $in: ['open', 'filled', 'ordered', 'completed'] },
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
    })
      .select('restaurant')
      .sort({ createdAt: -1 })
      .limit(20);

    const recentRestaurants = [...new Set(recentClusters.map(c => c.restaurant))].slice(0, 5);

    const suggestion = await suggestFoodCluster(user, userLocation, recentRestaurants);

    res.json({
      success: true,
      data: suggestion,
    });
  } catch (error) {
    console.error('Get suggested food cluster error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestion',
    });
  }
};
