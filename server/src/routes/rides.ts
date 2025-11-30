import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createRiderProfile,
  updateRiderLocation,
  updateRiderStatus,
  getNearbyRides,
  assignRiderToCluster,
  getRiderProfile,
  getAvailableDeliveries,
  acceptDelivery,
  completeDelivery,
  getRiderAnalytics,
} from '../controllers/rideController.js';

const router = Router();

// Validation
const createRiderValidation = [
  body('vehicleType').isIn(['bike', 'scooter', 'car']).withMessage('Valid vehicle type is required'),
  body('coordinates.latitude').isFloat().withMessage('Valid latitude is required'),
  body('coordinates.longitude').isFloat().withMessage('Valid longitude is required'),
];

const locationValidation = [
  body('latitude').isFloat().withMessage('Valid latitude is required'),
  body('longitude').isFloat().withMessage('Valid longitude is required'),
];

// Public - Find nearby rides
router.get('/nearby', authenticate, getNearbyRides);

// Rider profile management
router.post('/profile', authenticate, validate(createRiderValidation), createRiderProfile);
router.get('/profile', authenticate, authorize('rider'), getRiderProfile);
router.put('/location', authenticate, authorize('rider'), validate(locationValidation), updateRiderLocation);
router.put('/status', authenticate, authorize('rider'), updateRiderStatus);

// Delivery management
router.get('/deliveries/available', authenticate, authorize('rider'), getAvailableDeliveries);
router.post('/deliveries/:clusterId/accept', authenticate, authorize('rider'), acceptDelivery);
router.post('/deliveries/:clusterId/complete', authenticate, authorize('rider'), completeDelivery);

// Analytics
router.get('/analytics', authenticate, authorize('rider'), getRiderAnalytics);

// Admin - Assign rider to cluster
router.post('/assign', authenticate, authorize('admin'), assignRiderToCluster);

export default router;
