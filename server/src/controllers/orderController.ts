import { Response } from 'express';
import { Order } from '../models/Order.js';
import { Cluster } from '../models/Cluster.js';
import { MenuItem } from '../models/MenuItem.js';
import { User } from '../models/User.js';
import { AuthRequest } from '../types/index.js';
import { generateDeliveryOTPs } from '../utils/otp.js';
import { notifyOrderStatusChange, emitToVendor } from '../services/socket.js';
import { sendOrderConfirmation, sendDeliveryOTPNotification } from '../services/notification.js';

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { vendorId, clusterId, items } = req.body;

    // Validate items and calculate total
    const menuItems = await MenuItem.find({
      _id: { $in: items.map((i: { menuItemId: string }) => i.menuItemId) },
      vendor: vendorId,
      isAvailable: true,
    });

    if (menuItems.length !== items.length) {
      res.status(400).json({
        success: false,
        error: 'Some items are not available',
      });
      return;
    }

    const orderItems = items.map((item: { menuItemId: string; quantity: number; specialInstructions?: string }) => {
      const menuItem = menuItems.find((m) => m._id.toString() === item.menuItemId);
      return {
        menuItem: item.menuItemId,
        name: menuItem!.name,
        quantity: item.quantity,
        price: menuItem!.price * item.quantity,
        specialInstructions: item.specialInstructions,
      };
    });

    const totalAmount = orderItems.reduce((sum: number, item: { price: number }) => sum + item.price, 0);

    const order = await Order.create({
      user: userId,
      vendor: vendorId,
      cluster: clusterId,
      items: orderItems,
      totalAmount,
    });

    // If part of cluster, update cluster
    if (clusterId) {
      await Cluster.findByIdAndUpdate(clusterId, {
        $push: { orders: order._id },
        $inc: { totalAmount },
      });
    }

    // Notify vendor
    emitToVendor(vendorId, 'order:new', {
      orderId: order._id,
      userId,
      items: orderItems,
      totalAmount,
    });

    // Send confirmation email
    const user = await User.findById(userId);
    if (user) {
      await sendOrderConfirmation(
        user.email,
        order._id.toString(),
        orderItems,
        totalAmount
      );
    }

    await order.populate(['user', 'vendor']);

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
    });
  }
};

export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { status, page = 1, limit = 20 } = req.query;

    const query: Record<string, unknown> = { user: userId };
    if (status) query.status = status;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('vendor', 'businessName')
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
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
    });
  }
};

export const getOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const order = await Order.findOne({ _id: id, user: userId })
      .populate('vendor')
      .populate('cluster');

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
      });
      return;
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order',
    });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userRole = req.user!.role;

    const order = await Order.findById(id);

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
      });
      return;
    }

    // Role-based status update permissions
    const allowedTransitions: Record<string, { roles: string[]; nextStatuses: string[] }> = {
      pending: { roles: ['vendor'], nextStatuses: ['confirmed', 'cancelled'] },
      confirmed: { roles: ['vendor'], nextStatuses: ['preparing', 'cancelled'] },
      preparing: { roles: ['vendor'], nextStatuses: ['ready'] },
      ready: { roles: ['vendor', 'rider'], nextStatuses: ['delivering'] },
      delivering: { roles: ['rider'], nextStatuses: ['delivered'] },
    };

    const transition = allowedTransitions[order.status];
    if (!transition || !transition.roles.includes(userRole) || !transition.nextStatuses.includes(status)) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to make this status change',
      });
      return;
    }

    // Generate OTPs when status changes to delivering
    if (status === 'delivering') {
      const { senderOTP, receiverOTP } = generateDeliveryOTPs();
      order.senderOTP = senderOTP;
      order.receiverOTP = receiverOTP;

      // Send OTPs to user
      const user = await User.findById(order.user);
      if (user) {
        await sendDeliveryOTPNotification(user.email, senderOTP, receiverOTP);
      }
    }

    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }

    order.status = status;
    await order.save();

    // Notify user
    notifyOrderStatusChange(order.user.toString(), id, status);

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order status',
    });
  }
};

export const verifySenderOTP = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    const order = await Order.findById(id).select('+senderOTP');

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
      });
      return;
    }

    if (order.senderOTP !== otp) {
      res.status(400).json({
        success: false,
        error: 'Invalid OTP',
      });
      return;
    }

    order.senderVerified = true;
    await order.save();

    res.json({
      success: true,
      message: 'Sender verified successfully',
    });
  } catch (error) {
    console.error('Verify sender OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'OTP verification failed',
    });
  }
};

export const verifyReceiverOTP = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    const order = await Order.findById(id).select('+receiverOTP');

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
      });
      return;
    }

    if (order.receiverOTP !== otp) {
      res.status(400).json({
        success: false,
        error: 'Invalid OTP',
      });
      return;
    }

    order.receiverVerified = true;

    // If both verified, mark as delivered
    if (order.senderVerified) {
      order.status = 'delivered';
      order.deliveredAt = new Date();
      notifyOrderStatusChange(order.user.toString(), id, 'delivered');
    }

    await order.save();

    res.json({
      success: true,
      message: order.status === 'delivered'
        ? 'Order delivered successfully'
        : 'Receiver verified. Awaiting sender verification.',
    });
  } catch (error) {
    console.error('Verify receiver OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'OTP verification failed',
    });
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const order = await Order.findOne({ _id: id, user: userId });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
      });
      return;
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      res.status(400).json({
        success: false,
        error: 'Cannot cancel order at this stage',
      });
      return;
    }

    order.status = 'cancelled';
    await order.save();

    // Update cluster if part of one
    if (order.cluster) {
      await Cluster.findByIdAndUpdate(order.cluster, {
        $pull: { orders: order._id },
        $inc: { totalAmount: -order.totalAmount },
      });
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order',
    });
  }
};
