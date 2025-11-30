import { Response } from 'express';
import { Cluster } from '../models/Cluster.js';
import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { AuthRequest } from '../types/index.js';
import { calculateDistance, calculateDeliveryFee } from '../utils/location.js';
import { generateClusterRecommendations, suggestNewCluster } from '../services/aiRecommendation.js';
import { notifyClusterUpdate, notifyMemberJoined, notifyMemberLeft } from '../services/socket.js';
import { sendClusterJoinNotification } from '../services/notification.js';

export const createCluster = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const {
      name,
      vendorId,
      maxMembers = 10,
      deliveryAddress,
      deliveryCoordinates,
      scheduledTime,
    } = req.body;

    // Verify vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      res.status(404).json({
        success: false,
        error: 'Vendor not found',
      });
      return;
    }

    // Calculate delivery fee based on distance
    const distance = calculateDistance(
      vendor.location.coordinates[1],
      vendor.location.coordinates[0],
      deliveryCoordinates.latitude,
      deliveryCoordinates.longitude
    );
    const deliveryFee = calculateDeliveryFee(distance);

    const cluster = await Cluster.create({
      name,
      creator: userId,
      members: [userId],
      maxMembers,
      vendor: vendorId,
      location: vendor.location,
      deliveryLocation: {
        type: 'Point',
        coordinates: [deliveryCoordinates.longitude, deliveryCoordinates.latitude],
        address: deliveryAddress,
      },
      scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
      deliveryFee,
    });

    await cluster.populate(['creator', 'vendor', 'members']);

    res.status(201).json({
      success: true,
      data: cluster,
    });
  } catch (error) {
    console.error('Create cluster error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create cluster',
    });
  }
};

export const getClusters = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      latitude,
      longitude,
      radius = 5,
      status,
      vendorId,
      page = 1,
      limit = 20,
    } = req.query;

    const query: Record<string, unknown> = {};

    // Location filter
    if (latitude && longitude) {
      query['deliveryLocation'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude as string), parseFloat(latitude as string)],
          },
          $maxDistance: parseFloat(radius as string) * 1000,
        },
      };
    }

    // Status filter
    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['forming', 'active'] };
    }

    // Vendor filter
    if (vendorId) {
      query.vendor = vendorId;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [clusters, total] = await Promise.all([
      Cluster.find(query)
        .populate('creator', 'name avatar')
        .populate('vendor', 'businessName cuisineTypes')
        .populate('members', 'name avatar')
        .skip(skip)
        .limit(parseInt(limit as string))
        .sort({ createdAt: -1 }),
      Cluster.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: clusters,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get clusters error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch clusters',
    });
  }
};

export const getCluster = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const cluster = await Cluster.findById(id)
      .populate('creator', 'name avatar')
      .populate('vendor')
      .populate('members', 'name avatar')
      .populate({
        path: 'orders',
        populate: { path: 'user', select: 'name avatar' },
      });

    if (!cluster) {
      res.status(404).json({
        success: false,
        error: 'Cluster not found',
      });
      return;
    }

    res.json({
      success: true,
      data: cluster,
    });
  } catch (error) {
    console.error('Get cluster error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cluster',
    });
  }
};

export const joinCluster = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const cluster = await Cluster.findById(id).populate('creator', 'email name');

    if (!cluster) {
      res.status(404).json({
        success: false,
        error: 'Cluster not found',
      });
      return;
    }

    if (cluster.status !== 'forming' && cluster.status !== 'active') {
      res.status(400).json({
        success: false,
        error: 'Cannot join this cluster',
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

    if (cluster.members.some((m) => m.toString() === userId.toString())) {
      res.status(400).json({
        success: false,
        error: 'Already a member of this cluster',
      });
      return;
    }

    cluster.members.push(userId);
    if (cluster.status === 'forming' && cluster.members.length >= 2) {
      cluster.status = 'active';
    }
    await cluster.save();

    // Notify cluster members via socket
    const user = req.user!;
    notifyMemberJoined(id, { id: userId, name: user.name, avatar: user.avatar });

    // Send email to cluster creator
    const creator = cluster.creator as { email: string; name: string };
    await sendClusterJoinNotification(creator.email, cluster.name, user.name);

    await cluster.populate('members', 'name avatar');

    res.json({
      success: true,
      data: cluster,
    });
  } catch (error) {
    console.error('Join cluster error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join cluster',
    });
  }
};

export const leaveCluster = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const cluster = await Cluster.findById(id);

    if (!cluster) {
      res.status(404).json({
        success: false,
        error: 'Cluster not found',
      });
      return;
    }

    if (cluster.creator.toString() === userId.toString()) {
      res.status(400).json({
        success: false,
        error: 'Creator cannot leave. Transfer ownership or cancel the cluster.',
      });
      return;
    }

    if (!cluster.members.some((m) => m.toString() === userId.toString())) {
      res.status(400).json({
        success: false,
        error: 'Not a member of this cluster',
      });
      return;
    }

    if (cluster.status === 'locked' || cluster.status === 'delivering') {
      res.status(400).json({
        success: false,
        error: 'Cannot leave cluster during delivery',
      });
      return;
    }

    cluster.members = cluster.members.filter(
      (m) => m.toString() !== userId.toString()
    );
    await cluster.save();

    // Notify cluster members
    notifyMemberLeft(id, userId.toString());

    res.json({
      success: true,
      message: 'Left cluster successfully',
    });
  } catch (error) {
    console.error('Leave cluster error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to leave cluster',
    });
  }
};

export const updateClusterStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user!._id;

    const cluster = await Cluster.findById(id);

    if (!cluster) {
      res.status(404).json({
        success: false,
        error: 'Cluster not found',
      });
      return;
    }

    // Only creator can change status
    if (cluster.creator.toString() !== userId.toString()) {
      res.status(403).json({
        success: false,
        error: 'Only cluster creator can change status',
      });
      return;
    }

    cluster.status = status;
    await cluster.save();

    // Notify all members
    notifyClusterUpdate(id, { status });

    res.json({
      success: true,
      data: cluster,
    });
  } catch (error) {
    console.error('Update cluster status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cluster status',
    });
  }
};

export const getRecommendedClusters = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { latitude, longitude, radius = 5 } = req.query;

    if (!latitude || !longitude) {
      res.status(400).json({
        success: false,
        error: 'Location required for recommendations',
      });
      return;
    }

    const lat = parseFloat(latitude as string);
    const lon = parseFloat(longitude as string);

    // Find nearby active clusters
    const clusters = await Cluster.find({
      status: { $in: ['forming', 'active'] },
      deliveryLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lon, lat],
          },
          $maxDistance: parseFloat(radius as string) * 1000,
        },
      },
    })
      .populate('vendor', 'businessName cuisineTypes')
      .limit(20);

    // Transform clusters for recommendation engine
    const clustersWithDistance = clusters.map((cluster) => {
      const distance = calculateDistance(
        lat,
        lon,
        cluster.deliveryLocation.coordinates[1],
        cluster.deliveryLocation.coordinates[0]
      );

      const vendor = cluster.vendor as unknown as { cuisineTypes?: string[]; businessName?: string };

      return {
        ...cluster.toObject(),
        distance,
        memberCount: cluster.members.length,
        cuisineTypes: vendor?.cuisineTypes,
        vendorName: vendor?.businessName,
      };
    });

    const recommendations = await generateClusterRecommendations(user, clustersWithDistance);

    res.json({
      success: true,
      data: recommendations.map((rec, idx) => ({
        ...rec,
        cluster: clusters.find((c) => c._id.toString() === rec.clusterId) || clusters[idx],
      })),
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations',
    });
  }
};

export const getSuggestedCluster = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      res.status(400).json({
        success: false,
        error: 'Location required',
      });
      return;
    }

    const lat = parseFloat(latitude as string);
    const lon = parseFloat(longitude as string);

    // Find nearby users
    const nearbyUsers = await User.find({
      _id: { $ne: user._id },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lon, lat],
          },
          $maxDistance: 3000, // 3km radius
        },
      },
    }).limit(20);

    const suggestion = await suggestNewCluster(
      user,
      { latitude: lat, longitude: lon },
      nearbyUsers
    );

    res.json({
      success: true,
      data: suggestion,
    });
  } catch (error) {
    console.error('Get suggestion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cluster suggestion',
    });
  }
};

export const getMyClusters = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { status } = req.query;

    const query: Record<string, unknown> = {
      members: userId,
    };

    if (status) {
      query.status = status;
    }

    const clusters = await Cluster.find(query)
      .populate('creator', 'name avatar')
      .populate('vendor', 'businessName cuisineTypes')
      .populate('members', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: clusters,
    });
  } catch (error) {
    console.error('Get my clusters error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch clusters',
    });
  }
};
