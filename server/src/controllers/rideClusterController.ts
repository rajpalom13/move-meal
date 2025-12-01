import { Response } from 'express';
import { RideCluster } from '../models/RideCluster.js';
import { User } from '../models/User.js';
import { AuthRequest } from '../types/index.js';
import { calculateDistance } from '../utils/location.js';
import { sendRideClusterStatusNotification } from '../services/notification.js';
import {
  notifyClusterUpdate,
  notifyMemberJoined,
  notifyMemberLeft,
} from '../services/socket.js';

// Create a new ride cluster
export const createRideCluster = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const user = req.user!;
    const {
      title,
      startPoint,
      endPoint,
      seatsRequired,
      totalFare,
      departureTime,
      vehicleType = 'auto',
      femaleOnly = false,
      notes,
      pickupPoint, // Creator's pickup point
    } = req.body;

    // Check female-only restriction
    if (femaleOnly && user.gender !== 'female') {
      res.status(400).json({
        success: false,
        error: 'Only female users can create female-only rides',
      });
      return;
    }

    // Create the ride cluster
    const rideCluster = await RideCluster.create({
      title,
      creator: userId,
      startPoint: {
        type: 'Point',
        coordinates: [startPoint.longitude, startPoint.latitude],
        address: startPoint.address,
      },
      endPoint: {
        type: 'Point',
        coordinates: [endPoint.longitude, endPoint.latitude],
        address: endPoint.address,
      },
      stops: [],
      members: [
        {
          user: userId,
          pickupPoint: {
            type: 'Point',
            coordinates: [pickupPoint.longitude, pickupPoint.latitude],
            address: pickupPoint.address,
          },
          joinedAt: new Date(),
        },
      ],
      seatsRequired,
      seatsAvailable: seatsRequired - 1, // Creator takes one seat
      totalFare,
      farePerPerson: Math.ceil(totalFare / seatsRequired),
      departureTime: new Date(departureTime),
      vehicleType,
      femaleOnly,
      notes,
    });

    await rideCluster.populate('creator', 'name avatar phone college gender');
    await rideCluster.populate('members.user', 'name avatar phone college gender');

    res.status(201).json({
      success: true,
      data: rideCluster,
    });
  } catch (error) {
    console.error('Create ride cluster error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create ride cluster',
    });
  }
};

// Get all ride clusters with filters
export const getRideClusters = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      startLatitude,
      startLongitude,
      endLatitude,
      endLongitude,
      radius = 3,
      status,
      vehicleType,
      femaleOnly,
      page = 1,
      limit = 20,
    } = req.query;

    const query: Record<string, unknown> = {};

    // Start point location filter
    if (startLatitude && startLongitude) {
      query['startPoint'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(startLongitude as string), parseFloat(startLatitude as string)],
          },
          $maxDistance: parseFloat(radius as string) * 1000,
        },
      };
    }

    // Status filter
    if (status) {
      query.status = status;
    } else {
      query.status = 'open';
    }

    // Vehicle type filter
    if (vehicleType) {
      query.vehicleType = vehicleType;
    }

    // Female only filter
    if (femaleOnly === 'true') {
      query.femaleOnly = true;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [clusters, total] = await Promise.all([
      RideCluster.find(query)
        .populate('creator', 'name avatar phone college gender')
        .populate('members.user', 'name avatar phone college gender')
        .skip(skip)
        .limit(parseInt(limit as string))
        .sort({ departureTime: 1 }),
      RideCluster.countDocuments(query),
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
    console.error('Get ride clusters error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ride clusters',
    });
  }
};

// Get single ride cluster
export const getRideCluster = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const cluster = await RideCluster.findById(id)
      .populate('creator', 'name avatar phone college gender')
      .populate('members.user', 'name avatar phone college gender')
      .populate('stops.user', 'name avatar');

    if (!cluster) {
      res.status(404).json({
        success: false,
        error: 'Ride cluster not found',
      });
      return;
    }

    res.json({
      success: true,
      data: cluster,
    });
  } catch (error) {
    console.error('Get ride cluster error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ride cluster',
    });
  }
};

// Join a ride cluster
export const joinRideCluster = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;
    const user = req.user!;
    const { pickupPoint } = req.body;

    if (!pickupPoint || !pickupPoint.latitude || !pickupPoint.longitude || !pickupPoint.address) {
      res.status(400).json({
        success: false,
        error: 'Pickup point with coordinates and address is required',
      });
      return;
    }

    const cluster = await RideCluster.findById(id);

    if (!cluster) {
      res.status(404).json({
        success: false,
        error: 'Ride cluster not found',
      });
      return;
    }

    // Check female-only restriction
    if (cluster.femaleOnly && user.gender !== 'female') {
      res.status(403).json({
        success: false,
        error: 'This ride is for female passengers only',
      });
      return;
    }

    if (cluster.status !== 'open') {
      res.status(400).json({
        success: false,
        error: 'This ride is no longer accepting new members',
      });
      return;
    }

    if (cluster.seatsAvailable <= 0) {
      res.status(400).json({
        success: false,
        error: 'No seats available',
      });
      return;
    }

    if (cluster.members.some((m) => m.user.toString() === userId.toString())) {
      res.status(400).json({
        success: false,
        error: 'You are already a member of this ride',
      });
      return;
    }

    // Add member with pickup point
    cluster.members.push({
      user: userId,
      pickupPoint: {
        type: 'Point',
        coordinates: [pickupPoint.longitude, pickupPoint.latitude],
        address: pickupPoint.address,
      },
      joinedAt: new Date(),
    });

    // Decrement available seats
    cluster.seatsAvailable -= 1;

    // Auto-update status when filled
    if (cluster.seatsAvailable <= 0 && cluster.status === 'open') {
      cluster.status = 'filled';
    }

    // Add pickup point to stops
    cluster.stops.push({
      location: {
        type: 'Point',
        coordinates: [pickupPoint.longitude, pickupPoint.latitude],
      },
      address: pickupPoint.address,
      order: cluster.stops.length + 1,
      user: userId,
    });

    await cluster.save();
    await cluster.populate('creator', 'name avatar phone college gender');
    await cluster.populate('members.user', 'name avatar phone college gender');

    // Emit WebSocket events for real-time updates
    notifyClusterUpdate(cluster._id.toString(), cluster.toObject());
    notifyMemberJoined(cluster._id.toString(), {
      user: req.user,
      pickupPoint,
    });

    res.json({
      success: true,
      data: cluster,
    });
  } catch (error) {
    console.error('Join ride cluster error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join ride cluster',
    });
  }
};

// Leave a ride cluster
export const leaveRideCluster = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const cluster = await RideCluster.findById(id);

    if (!cluster) {
      res.status(404).json({
        success: false,
        error: 'Ride cluster not found',
      });
      return;
    }

    // Creator cannot leave
    if (cluster.creator.toString() === userId.toString()) {
      res.status(400).json({
        success: false,
        error: 'Creator cannot leave. Cancel the ride instead.',
      });
      return;
    }

    const memberIndex = cluster.members.findIndex(
      (m) => m.user.toString() === userId.toString()
    );

    if (memberIndex === -1) {
      res.status(400).json({
        success: false,
        error: 'You are not a member of this ride',
      });
      return;
    }

    if (cluster.status !== 'open') {
      res.status(400).json({
        success: false,
        error: 'Cannot leave ride after it has started',
      });
      return;
    }

    // Remove member
    cluster.members.splice(memberIndex, 1);

    // Increment available seats
    cluster.seatsAvailable += 1;

    // Remove their stop
    cluster.stops = cluster.stops.filter(
      (stop) => !stop.user || stop.user.toString() !== userId.toString()
    );

    await cluster.save();
    await cluster.populate('creator', 'name avatar phone college gender');
    await cluster.populate('members.user', 'name avatar phone college gender');

    // Emit WebSocket events for real-time updates
    notifyClusterUpdate(cluster._id.toString(), cluster.toObject());
    notifyMemberLeft(cluster._id.toString(), userId.toString());

    res.json({
      success: true,
      message: 'Left ride successfully',
    });
  } catch (error) {
    console.error('Leave ride cluster error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to leave ride',
    });
  }
};

// Update ride status (only creator)
export const updateRideClusterStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user!._id;

    const cluster = await RideCluster.findById(id);

    if (!cluster) {
      res.status(404).json({
        success: false,
        error: 'Ride cluster not found',
      });
      return;
    }

    if (cluster.creator.toString() !== userId.toString()) {
      res.status(403).json({
        success: false,
        error: 'Only the ride creator can update status',
      });
      return;
    }

    const validTransitions: Record<string, string[]> = {
      open: ['filled', 'in_progress', 'cancelled'],
      filled: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
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

    cluster.status = status;
    await cluster.save();
    await cluster.populate('creator', 'name avatar phone college gender email');
    await cluster.populate('members.user', 'name avatar phone college gender email');

    // Emit WebSocket event for real-time updates
    notifyClusterUpdate(cluster._id.toString(), cluster.toObject());

    // Send email notifications to all members except the creator
    const notifiableStatuses = ['filled', 'in_progress', 'completed', 'cancelled'];
    if (notifiableStatuses.includes(status)) {
      // Send notifications asynchronously (don't block the response)
      Promise.all(
        cluster.members
          .filter((member) => member.user._id.toString() !== cluster.creator._id.toString())
          .map((member) => {
            const memberUser = member.user as unknown as { email: string; name: string };
            return sendRideClusterStatusNotification(
              memberUser.email,
              memberUser.name,
              cluster.title,
              cluster.endPoint.address,
              status,
              status === 'filled' ? cluster.departureTime.toISOString() : undefined
            );
          })
      ).catch((err) => console.error('Failed to send ride status notification emails:', err));
    }

    res.json({
      success: true,
      data: cluster,
    });
  } catch (error) {
    console.error('Update ride cluster status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update ride status',
    });
  }
};

// Get my ride clusters
export const getMyRideClusters = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { status, type } = req.query;

    const query: Record<string, unknown> = {
      'members.user': userId,
    };

    if (status) {
      query.status = status;
    }

    if (type === 'created') {
      query.creator = userId;
    }

    const clusters = await RideCluster.find(query)
      .populate('creator', 'name avatar phone college gender')
      .populate('members.user', 'name avatar phone college gender')
      .sort({ departureTime: -1 });

    res.json({
      success: true,
      data: clusters,
    });
  } catch (error) {
    console.error('Get my ride clusters error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ride clusters',
    });
  }
};

// Cancel a ride cluster (only creator)
export const cancelRideCluster = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const cluster = await RideCluster.findById(id);

    if (!cluster) {
      res.status(404).json({
        success: false,
        error: 'Ride cluster not found',
      });
      return;
    }

    if (cluster.creator.toString() !== userId.toString()) {
      res.status(403).json({
        success: false,
        error: 'Only the ride creator can cancel it',
      });
      return;
    }

    if (['completed', 'cancelled'].includes(cluster.status)) {
      res.status(400).json({
        success: false,
        error: 'Cannot cancel a completed or already cancelled ride',
      });
      return;
    }

    cluster.status = 'cancelled';
    await cluster.save();
    await cluster.populate('creator', 'name avatar phone college gender email');
    await cluster.populate('members.user', 'name avatar phone college gender email');

    // Emit WebSocket event for real-time updates
    notifyClusterUpdate(cluster._id.toString(), cluster.toObject());

    // Send cancellation email to all members except creator
    Promise.all(
      cluster.members
        .filter((member) => member.user._id.toString() !== cluster.creator._id.toString())
        .map((member) => {
          const memberUser = member.user as unknown as { email: string; name: string };
          return sendRideClusterStatusNotification(
            memberUser.email,
            memberUser.name,
            cluster.title,
            cluster.endPoint.address,
            'cancelled'
          );
        })
    ).catch((err) => console.error('Failed to send ride cancellation emails:', err));

    res.json({
      success: true,
      message: 'Ride cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel ride cluster error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel ride',
    });
  }
};

// Get nearby rides (for dashboard)
export const getNearbyRides = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;
    const user = req.user!;

    if (!latitude || !longitude) {
      res.status(400).json({
        success: false,
        error: 'Location is required',
      });
      return;
    }

    const query: Record<string, unknown> = {
      status: 'open',
      seatsAvailable: { $gt: 0 },
      departureTime: { $gt: new Date() },
      startPoint: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude as string), parseFloat(latitude as string)],
          },
          $maxDistance: parseFloat(radius as string) * 1000,
        },
      },
    };

    // If user is male, exclude female-only rides
    if (user.gender !== 'female') {
      query.femaleOnly = false;
    }

    const rides = await RideCluster.find(query)
      .populate('creator', 'name avatar phone college gender')
      .limit(10)
      .sort({ departureTime: 1 });

    // Calculate distance for each ride
    const ridesWithDistance = rides.map((ride) => ({
      ...ride.toObject(),
      distance: calculateDistance(
        parseFloat(latitude as string),
        parseFloat(longitude as string),
        ride.startPoint.coordinates[1],
        ride.startPoint.coordinates[0]
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

// Update pickup point
export const updatePickupPoint = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;
    const { pickupPoint } = req.body;

    const cluster = await RideCluster.findById(id);

    if (!cluster) {
      res.status(404).json({
        success: false,
        error: 'Ride cluster not found',
      });
      return;
    }

    if (cluster.status !== 'open') {
      res.status(400).json({
        success: false,
        error: 'Cannot update pickup after ride has started',
      });
      return;
    }

    const memberIndex = cluster.members.findIndex(
      (m) => m.user.toString() === userId.toString()
    );

    if (memberIndex === -1) {
      res.status(400).json({
        success: false,
        error: 'You are not a member of this ride',
      });
      return;
    }

    // Update member's pickup point
    cluster.members[memberIndex].pickupPoint = {
      type: 'Point',
      coordinates: [pickupPoint.longitude, pickupPoint.latitude],
      address: pickupPoint.address,
    };

    // Update corresponding stop
    const stopIndex = cluster.stops.findIndex(
      (s) => s.user && s.user.toString() === userId.toString()
    );
    if (stopIndex !== -1) {
      cluster.stops[stopIndex].location = {
        type: 'Point',
        coordinates: [pickupPoint.longitude, pickupPoint.latitude],
      };
      cluster.stops[stopIndex].address = pickupPoint.address;
    }

    await cluster.save();
    await cluster.populate('creator', 'name avatar phone college gender');
    await cluster.populate('members.user', 'name avatar phone college gender');

    // Emit WebSocket event for real-time updates
    notifyClusterUpdate(cluster._id.toString(), cluster.toObject());

    res.json({
      success: true,
      data: cluster,
    });
  } catch (error) {
    console.error('Update pickup point error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update pickup point',
    });
  }
};
