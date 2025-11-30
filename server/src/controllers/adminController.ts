import { Response } from 'express';
import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { Order } from '../models/Order.js';
import { Cluster } from '../models/Cluster.js';
import { Ride } from '../models/Ride.js';
import { AuthRequest } from '../types/index.js';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      totalVendors,
      totalRiders,
      totalOrders,
      totalClusters,
      recentOrders,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'vendor' }),
      User.countDocuments({ role: 'rider' }),
      Order.countDocuments(),
      Cluster.countDocuments(),
      Order.find()
        .populate('user', 'name')
        .populate('vendor', 'businessName')
        .sort({ createdAt: -1 })
        .limit(10),
      User.find()
        .select('name email role createdAt')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalVendors,
          totalRiders,
          totalOrders,
          totalClusters,
        },
        recentOrders,
        recentUsers,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats',
    });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;

    const query: Record<string, unknown> = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .skip(skip)
        .limit(parseInt(limit as string))
        .sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user role',
    });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Clean up related data
    await Promise.all([
      Vendor.deleteOne({ user: userId }),
      Ride.deleteOne({ rider: userId }),
      Order.updateMany({ user: userId }, { $unset: { user: 1 } }),
      Cluster.updateMany(
        { members: userId },
        { $pull: { members: userId } }
      ),
    ]);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
    });
  }
};

export const getAllVendors = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { isOpen, search, page = 1, limit = 20 } = req.query;

    const query: Record<string, unknown> = {};

    if (isOpen !== undefined) {
      query.isOpen = isOpen === 'true';
    }

    if (search) {
      query.businessName = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [vendors, total] = await Promise.all([
      Vendor.find(query)
        .populate('user', 'name email')
        .skip(skip)
        .limit(parseInt(limit as string))
        .sort({ createdAt: -1 }),
      Vendor.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: vendors,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get all vendors error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendors',
    });
  }
};

export const getOrderAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const dateFilter: Record<string, unknown> = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    const matchQuery: Record<string, unknown> = {};
    if (Object.keys(dateFilter).length > 0) {
      matchQuery.createdAt = dateFilter;
    }

    let groupFormat: string;
    switch (groupBy) {
      case 'hour':
        groupFormat = '%Y-%m-%d %H:00';
        break;
      case 'week':
        groupFormat = '%Y-W%V';
        break;
      case 'month':
        groupFormat = '%Y-%m';
        break;
      default:
        groupFormat = '%Y-%m-%d';
    }

    const [ordersByTime, ordersByStatus, revenueByVendor] = await Promise.all([
      Order.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
            count: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        { $match: { ...matchQuery, status: 'delivered' } },
        {
          $group: {
            _id: '$vendor',
            totalRevenue: { $sum: '$totalAmount' },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'vendors',
            localField: '_id',
            foreignField: '_id',
            as: 'vendor',
          },
        },
        { $unwind: '$vendor' },
        {
          $project: {
            vendorName: '$vendor.businessName',
            totalRevenue: 1,
            orderCount: 1,
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        ordersByTime,
        ordersByStatus,
        revenueByVendor,
      },
    });
  } catch (error) {
    console.error('Get order analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
    });
  }
};

export const getClusterAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: Record<string, unknown> = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    const matchQuery: Record<string, unknown> = {};
    if (Object.keys(dateFilter).length > 0) {
      matchQuery.createdAt = dateFilter;
    }

    const [clustersByStatus, avgClusterSize, topVendors] = await Promise.all([
      Cluster.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Cluster.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            avgMembers: { $avg: { $size: '$members' } },
            avgOrders: { $avg: { $size: '$orders' } },
            avgTotalAmount: { $avg: '$totalAmount' },
          },
        },
      ]),
      Cluster.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$vendor',
            clusterCount: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
          },
        },
        { $sort: { clusterCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'vendors',
            localField: '_id',
            foreignField: '_id',
            as: 'vendor',
          },
        },
        { $unwind: '$vendor' },
        {
          $project: {
            vendorName: '$vendor.businessName',
            clusterCount: 1,
            totalRevenue: 1,
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        clustersByStatus,
        avgClusterSize: avgClusterSize[0] || {
          avgMembers: 0,
          avgOrders: 0,
          avgTotalAmount: 0,
        },
        topVendors,
      },
    });
  } catch (error) {
    console.error('Get cluster analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
    });
  }
};

export const getRideAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [riderStats, deliveriesByVehicle, topRiders] = await Promise.all([
      Ride.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Ride.aggregate([
        {
          $group: {
            _id: '$vehicleType',
            count: { $sum: 1 },
            totalDeliveries: { $sum: '$totalDeliveries' },
            avgRating: { $avg: '$rating' },
          },
        },
      ]),
      Ride.find()
        .populate('rider', 'name')
        .sort({ totalDeliveries: -1 })
        .limit(10)
        .select('rider totalDeliveries rating vehicleType'),
    ]);

    res.json({
      success: true,
      data: {
        riderStats,
        deliveriesByVehicle,
        topRiders,
      },
    });
  } catch (error) {
    console.error('Get ride analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
    });
  }
};
