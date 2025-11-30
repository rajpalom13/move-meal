import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createVendor,
  getVendors,
  getVendor,
  updateVendor,
  getMyVendorProfile,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getVendorOrders,
  getVendorAnalytics,
} from '../controllers/vendorController.js';

const router = Router();

// Validation
const createVendorValidation = [
  body('businessName').notEmpty().withMessage('Business name is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('coordinates.latitude').isFloat().withMessage('Valid latitude is required'),
  body('coordinates.longitude').isFloat().withMessage('Valid longitude is required'),
];

const menuItemValidation = [
  body('name').notEmpty().withMessage('Item name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('category').notEmpty().withMessage('Category is required'),
];

// Public routes
router.get('/', getVendors);
router.get('/:id', getVendor);

// Protected routes - Vendor only
router.post('/', authenticate, validate(createVendorValidation), createVendor);
router.get('/profile/me', authenticate, authorize('vendor'), getMyVendorProfile);
router.put('/profile', authenticate, authorize('vendor'), updateVendor);
router.get('/orders/all', authenticate, authorize('vendor'), getVendorOrders);
router.get('/analytics/dashboard', authenticate, authorize('vendor'), getVendorAnalytics);

// Menu management
router.post('/menu', authenticate, authorize('vendor'), validate(menuItemValidation), addMenuItem);
router.put('/menu/:itemId', authenticate, authorize('vendor'), updateMenuItem);
router.delete('/menu/:itemId', authenticate, authorize('vendor'), deleteMenuItem);

export default router;
