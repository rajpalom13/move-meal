import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createRideCluster,
  getRideClusters,
  getRideCluster,
  joinRideCluster,
  leaveRideCluster,
  updateRideClusterStatus,
  getMyRideClusters,
  cancelRideCluster,
  getNearbyRides,
  updatePickupPoint,
} from '../controllers/rideClusterController.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get my ride clusters
router.get('/my', getMyRideClusters);

// Get nearby rides
router.get('/nearby', getNearbyRides);

// CRUD operations
router.post('/', createRideCluster);
router.get('/', getRideClusters);
router.get('/:id', getRideCluster);

// Member operations
router.post('/:id/join', joinRideCluster);
router.post('/:id/leave', leaveRideCluster);
router.put('/:id/pickup', updatePickupPoint);

// Status operations
router.patch('/:id/status', updateRideClusterStatus);
router.post('/:id/cancel', cancelRideCluster);

export default router;
