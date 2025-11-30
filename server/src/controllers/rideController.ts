import { Response } from 'express';
import { Ride } from '../models/Ride.js';
import { Cluster } from '../models/Cluster.js';
import { User } from '../models/User.js';
import { AuthRequest } from '../types/index.js';
import { calculateDistance } from '../utils/location.js';
import { emitToRider, notifyDeliveryStarted } from '../services/socket.js';

export const createRiderProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { vehicleType, coordinates } = req.body;

    // Check if rider profile exists
    const existingRide = await Ride.findOne({ rider: userId });
    if (existingRide) {
      res.status(400).json({
        success: false,
        error: 'Rider profile already exists',
      });
      return;
    }

    // Update user role to rider
    await User.findByIdAndUpdate(userId, { role: 'rider' });

    const ride = await Ride.create({
      rider: userId,
      vehicleType,
      currentLocation: {
        type: 'Point',
        coordinates: [coordinates.longitude, coordinates.latitude],
      },
    });

    res.status(201).json({
      success: true,
      data: ride,
    });
  } catch (error) {
    console.error('Create rider profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create rider profile',
    });
  }
};

export const updateRiderLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { latitude, longitude } = req.body;

    const ride = await Ride.findOneAndUpdate(
      { rider: userId },
      {
        currentLocation: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
      },
      { new: true }
    );

    if (!ride) {
      res.status(404).json({
        success: false,
        error: 'Rider profile not found',
      });
      return;
    }

    res.json({
      success: true,
      data: { location: ride.currentLocation },
    });
  } catch (error) {
    console.error('Update rider location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update location',
    });
  }
};

export const updateRiderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { status } = req.body;

    const ride = await Ride.findOneAndUpdate(
      { rider: userId },
      { status },
      { new: true }
    );

    if (!ride) {
      res.status(404).json({
        success: false,
        error: 'Rider profile not found',
      });
      return;
    }

    res.json({
      success: true,
      data: ride,
    });
  } catch (error) {
    console.error('Update rider status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update status',
    });
  }
};

export const getNearbyRides = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;

    if (!latitude || !longitude) {
      res.status(400).json({
        success: false,
        error: 'Location required',
      });
      return;
    }

    const rides = await Ride.find({
      status: 'available',
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude as string), parseFloat(latitude as string)],
          },
          $maxDistance: parseFloat(radius as string) * 1000,
        },
      },
    })
      .populate('rider', 'name avatar phone')
      .limit(20);

    // Add distance to each ride
    const ridesWithDistance = rides.map((ride) => ({
      ...ride.toObject(),
      distance: calculateDistance(
        parseFloat(latitude as string),
        parseFloat(longitude as string),
        ride.currentLocation.coordinates[1],
        ride.currentLocation.coordinates[0]
      ),
    }));

    res.json({
      success: true,
      data: ridesWithDistance,
    });
  } catch (error) {
    console.error('Get nearby rides error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch nearby rides',
    });
  }
};

export const assignRiderToCluster = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { clusterId, riderId } = req.body;

    const [cluster, ride] = await Promise.all([
      Cluster.findById(clusterId),
      Ride.findOne({ rider: riderId, status: 'available' }),
    ]);

    if (!cluster) {
      res.status(404).json({
        success: false,
        error: 'Cluster not found',
      });
      return;
    }

    if (!ride) {
      res.status(404).json({
        success: false,
        error: 'Rider not available',
      });
      return;
    }

    // Update cluster
    cluster.rider = riderId;
    cluster.status = 'delivering';
    await cluster.save();

    // Update ride status
    ride.status = 'assigned';
    ride.assignedCluster = cluster._id;
    await ride.save();

    // Notify rider
    emitToRider(riderId, 'delivery:assigned', {
      clusterId: cluster._id,
      vendorLocation: cluster.location,
      deliveryLocation: cluster.deliveryLocation,
    });

    // Notify cluster members
    notifyDeliveryStarted(clusterId, riderId);

    res.json({
      success: true,
      data: { cluster, ride },
    });
  } catch (error) {
    console.error('Assign rider error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign rider',
    });
  }
};

export const getRiderProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;

    const ride = await Ride.findOne({ rider: userId }).populate('assignedCluster');

    if (!ride) {
      res.status(404).json({
        success: false,
        error: 'Rider profile not found',
      });
      return;
    }

    res.json({
      success: true,
      data: ride,
    });
  } catch (error) {
    console.error('Get rider profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rider profile',
    });
  }
};

export const getAvailableDeliveries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { latitude, longitude, radius = 10 } = req.query;

    const ride = await Ride.findOne({ rider: userId });

    if (!ride) {
      res.status(404).json({
        success: false,
        error: 'Rider profile not found',
      });
      return;
    }

    const lat = latitude ? parseFloat(latitude as string) : ride.currentLocation.coordinates[1];
    const lon = longitude ? parseFloat(longitude as string) : ride.currentLocation.coordinates[0];

    const clusters = await Cluster.find({
      status: 'locked',
      rider: { $exists: false },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lon, lat],
          },
          $maxDistance: parseFloat(radius as string) * 1000,
        },
      },
    })
      .populate('vendor', 'businessName')
      .populate('orders')
      .limit(20);

    const clustersWithDetails = clusters.map((cluster) => ({
      ...cluster.toObject(),
      distance: calculateDistance(
        lat,
        lon,
        cluster.location.coordinates[1],
        cluster.location.coordinates[0]
      ),
      orderCount: cluster.orders.length,
    }));

    res.json({
      success: true,
      data: clustersWithDetails,
    });
  } catch (error) {
    console.error('Get available deliveries error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available deliveries',
    });
  }
};

export const acceptDelivery = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { clusterId } = req.params;

    const [ride, cluster] = await Promise.all([
      Ride.findOne({ rider: userId, status: 'available' }),
      Cluster.findOne({ _id: clusterId, status: 'locked', rider: { $exists: false } }),
    ]);

    if (!ride) {
      res.status(400).json({
        success: false,
        error: 'Rider not available',
      });
      return;
    }

    if (!cluster) {
      res.status(404).json({
        success: false,
        error: 'Delivery not available',
      });
      return;
    }

    // Update cluster
    cluster.rider = userId;
    cluster.status = 'delivering';
    await cluster.save();

    // Update ride
    ride.status = 'in_progress';
    ride.assignedCluster = cluster._id;
    await ride.save();

    // Notify cluster members
    notifyDeliveryStarted(clusterId, userId.toString());

    await cluster.populate(['vendor', 'members', 'orders']);

    res.json({
      success: true,
      data: cluster,
    });
  } catch (error) {
    console.error('Accept delivery error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept delivery',
    });
  }
};

export const completeDelivery = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { clusterId } = req.params;

    const [ride, cluster] = await Promise.all([
      Ride.findOne({ rider: userId }),
      Cluster.findOne({ _id: clusterId, rider: userId, status: 'delivering' }),
    ]);

    if (!ride || !cluster) {
      res.status(404).json({
        success: false,
        error: 'Delivery not found',
      });
      return;
    }

    // Update cluster
    cluster.status = 'completed';
    await cluster.save();

    // Update ride
    ride.status = 'available';
    ride.assignedCluster = undefined;
    ride.totalDeliveries += 1;
    await ride.save();

    res.json({
      success: true,
      message: 'Delivery completed successfully',
    });
  } catch (error) {
    console.error('Complete delivery error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete delivery',
    });
  }
};

export const getRiderAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { startDate, endDate } = req.query;

    const ride = await Ride.findOne({ rider: userId });

    if (!ride) {
      res.status(404).json({
        success: false,
        error: 'Rider profile not found',
      });
      return;
    }

    const dateFilter: Record<string, unknown> = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    const matchQuery: Record<string, unknown> = {
      rider: userId,
      status: 'completed',
    };
    if (Object.keys(dateFilter).length > 0) {
      matchQuery.updatedAt = dateFilter;
    }

    const [deliveryStats] = await Cluster.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          totalEarnings: { $sum: '$deliveryFee' },
          avgDeliveryFee: { $avg: '$deliveryFee' },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalDeliveries: ride.totalDeliveries,
        rating: ride.rating,
        vehicleType: ride.vehicleType,
        ...deliveryStats,
      },
    });
  } catch (error) {
    console.error('Get rider analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
    });
  }
};
