import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllVendors,
  getOrderAnalytics,
  getClusterAnalytics,
  getRideAnalytics,
} from '../controllers/adminController.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, authorize('admin'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// User management
router.get('/users', getAllUsers);
router.patch('/users/:userId/role', updateUserRole);
router.delete('/users/:userId', deleteUser);

// Vendor management
router.get('/vendors', getAllVendors);

// Analytics
router.get('/analytics/orders', getOrderAnalytics);
router.get('/analytics/clusters', getClusterAnalytics);
router.get('/analytics/rides', getRideAnalytics);

export default router;
