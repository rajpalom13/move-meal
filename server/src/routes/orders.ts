import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  verifySenderOTP,
  verifyReceiverOTP,
  cancelOrder,
} from '../controllers/orderController.js';

const router = Router();

// Validation
const createOrderValidation = [
  body('vendorId').notEmpty().withMessage('Vendor ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.menuItemId').notEmpty().withMessage('Menu item ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Valid quantity is required'),
];

// Routes
router.get('/', authenticate, getOrders);
router.get('/:id', authenticate, getOrder);
router.post('/', authenticate, validate(createOrderValidation), createOrder);
router.patch('/:id/status', authenticate, authorize('vendor', 'rider', 'admin'), updateOrderStatus);
router.post('/:id/verify-sender', authenticate, authorize('rider'), verifySenderOTP);
router.post('/:id/verify-receiver', authenticate, authorize('rider'), verifyReceiverOTP);
router.post('/:id/cancel', authenticate, cancelOrder);

export default router;
