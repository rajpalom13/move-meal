import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createFoodCluster,
  getFoodClusters,
  getFoodCluster,
  joinFoodCluster,
  leaveFoodCluster,
  updateFoodClusterStatus,
  getMyFoodClusters,
  cancelFoodCluster,
  updateMemberOrder,
  verifyCollectionOtp,
  getRecommendedFoodClusters,
  getSuggestedFoodCluster,
} from '../controllers/foodClusterController.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get my food clusters
router.get('/my', getMyFoodClusters);

// AI recommendations
router.get('/recommended', getRecommendedFoodClusters);
router.get('/suggest', getSuggestedFoodCluster);

// CRUD operations
router.post('/', createFoodCluster);
router.get('/', getFoodClusters);
router.get('/:id', getFoodCluster);

// Member operations
router.post('/:id/join', joinFoodCluster);
router.post('/:id/leave', leaveFoodCluster);
router.put('/:id/order', updateMemberOrder);

// Status operations
router.patch('/:id/status', updateFoodClusterStatus);
router.post('/:id/cancel', cancelFoodCluster);

// OTP verification for collection
router.post('/:id/verify-otp', verifyCollectionOtp);

export default router;
