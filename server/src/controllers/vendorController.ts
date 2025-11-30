import { Response } from 'express';
import { Vendor } from '../models/Vendor.js';
import { MenuItem } from '../models/MenuItem.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { AuthRequest } from '../types/index.js';

export const createVendor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const {
      businessName,
      description,
      cuisineTypes,
      address,
      coordinates,
      operatingHours,
    } = req.body;

    // Check if user already has a vendor profile
    const existingVendor = await Vendor.findOne({ user: userId });
    if (existingVendor) {
      res.status(400).json({
        success: false,
        error: 'Vendor profile already exists',
      });
      return;
    }

    // Update user role to vendor
    await User.findByIdAndUpdate(userId, { role: 'vendor' });

    const vendor = await Vendor.create({
      user: userId,
      businessName,
      description,
      cuisineTypes,
      location: {
        type: 'Point',
        coordinates: [coordinates.longitude, coordinates.latitude],
        address,
      },
      operatingHours,
    });

    res.status(201).json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create vendor profile',
    });
  }
};

export const getVendors = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      latitude,
      longitude,
      radius = 10,
      cuisine,
      isOpen,
      page = 1,
      limit = 20,
    } = req.query;

    const query: Record<string, unknown> = {};

    // Location filter
    if (latitude && longitude) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude as string), parseFloat(latitude as string)],
          },
          $maxDistance: parseFloat(radius as string) * 1000,
        },
      };
    }

    // Cuisine filter
    if (cuisine) {
      query.cuisineTypes = cuisine;
    }

    // Open status filter
    if (isOpen === 'true') {
      query.isOpen = true;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [vendors, total] = await Promise.all([
      Vendor.find(query)
        .populate('user', 'name avatar')
        .skip(skip)
        .limit(parseInt(limit as string))
        .sort({ rating: -1 }),
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
    console.error('Get vendors error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendors',
    });
  }
};

export const getVendor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findById(id)
      .populate('user', 'name avatar email')
      .populate('menu');

    if (!vendor) {
      res.status(404).json({
        success: false,
        error: 'Vendor not found',
      });
      return;
    }

    res.json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    console.error('Get vendor error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor',
    });
  }
};

export const updateVendor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { businessName, description, cuisineTypes, isOpen, operatingHours } = req.body;

    const vendor = await Vendor.findOneAndUpdate(
      { user: userId },
      { businessName, description, cuisineTypes, isOpen, operatingHours },
      { new: true, runValidators: true }
    );

    if (!vendor) {
      res.status(404).json({
        success: false,
        error: 'Vendor profile not found',
      });
      return;
    }

    res.json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update vendor profile',
    });
  }
};

export const getMyVendorProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;

    const vendor = await Vendor.findOne({ user: userId }).populate('menu');

    if (!vendor) {
      res.status(404).json({
        success: false,
        error: 'Vendor profile not found',
      });
      return;
    }

    res.json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    console.error('Get my vendor profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor profile',
    });
  }
};

// Menu management
export const addMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { name, description, price, category, image, dietary, preparationTime } = req.body;

    const vendor = await Vendor.findOne({ user: userId });

    if (!vendor) {
      res.status(404).json({
        success: false,
        error: 'Vendor profile not found',
      });
      return;
    }

    const menuItem = await MenuItem.create({
      vendor: vendor._id,
      name,
      description,
      price,
      category,
      image,
      dietary,
      preparationTime,
    });

    vendor.menu.push(menuItem._id);
    await vendor.save();

    res.status(201).json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    console.error('Add menu item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add menu item',
    });
  }
};

export const updateMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { itemId } = req.params;
    const updates = req.body;

    const vendor = await Vendor.findOne({ user: userId });

    if (!vendor) {
      res.status(404).json({
        success: false,
        error: 'Vendor profile not found',
      });
      return;
    }

    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: itemId, vendor: vendor._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!menuItem) {
      res.status(404).json({
        success: false,
        error: 'Menu item not found',
      });
      return;
    }

    res.json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update menu item',
    });
  }
};

export const deleteMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { itemId } = req.params;

    const vendor = await Vendor.findOne({ user: userId });

    if (!vendor) {
      res.status(404).json({
        success: false,
        error: 'Vendor profile not found',
      });
      return;
    }

    const menuItem = await MenuItem.findOneAndDelete({ _id: itemId, vendor: vendor._id });

    if (!menuItem) {
      res.status(404).json({
        success: false,
        error: 'Menu item not found',
      });
      return;
    }

    vendor.menu = vendor.menu.filter((m) => m.toString() !== itemId);
    await vendor.save();

    res.json({
      success: true,
      message: 'Menu item deleted successfully',
    });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete menu item',
    });
  }
};

export const getVendorOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { status, page = 1, limit = 20 } = req.query;

    const vendor = await Vendor.findOne({ user: userId });

    if (!vendor) {
      res.status(404).json({
        success: false,
        error: 'Vendor profile not found',
      });
      return;
    }

    const query: Record<string, unknown> = { vendor: vendor._id };
    if (status) query.status = status;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name phone')
        .populate('cluster', 'name')
        .skip(skip)
        .limit(parseInt(limit as string))
        .sort({ createdAt: -1 }),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get vendor orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
    });
  }
};

export const getVendorAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { startDate, endDate } = req.query;

    const vendor = await Vendor.findOne({ user: userId });

    if (!vendor) {
      res.status(404).json({
        success: false,
        error: 'Vendor profile not found',
      });
      return;
    }

    const dateFilter: Record<string, unknown> = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    const matchQuery: Record<string, unknown> = { vendor: vendor._id };
    if (Object.keys(dateFilter).length > 0) {
      matchQuery.createdAt = dateFilter;
    }

    const [orderStats, topItems] = await Promise.all([
      Order.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
          },
        },
      ]),
      Order.aggregate([
        { $match: { ...matchQuery, status: 'delivered' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.name',
            totalQuantity: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.price' },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const totalOrders = orderStats.reduce((sum, s) => sum + s.count, 0);
    const totalRevenue = orderStats
      .filter((s) => s._id === 'delivered')
      .reduce((sum, s) => sum + s.totalAmount, 0);

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        ordersByStatus: orderStats,
        topItems,
        rating: vendor.rating,
        totalRatings: vendor.totalRatings,
      },
    });
  } catch (error) {
    console.error('Get vendor analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
    });
  }
};
