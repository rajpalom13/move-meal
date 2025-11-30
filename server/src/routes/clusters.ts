import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import {
  createCluster,
  getClusters,
  getCluster,
  joinCluster,
  leaveCluster,
  updateClusterStatus,
  getRecommendedClusters,
  getSuggestedCluster,
  getMyClusters,
} from '../controllers/clusterController.js';

const router = Router();

// Validation
const createClusterValidation = [
  body('name').notEmpty().withMessage('Cluster name is required'),
  body('vendorId').notEmpty().withMessage('Vendor ID is required'),
  body('deliveryAddress').notEmpty().withMessage('Delivery address is required'),
  body('deliveryCoordinates.latitude').isFloat().withMessage('Valid latitude is required'),
  body('deliveryCoordinates.longitude').isFloat().withMessage('Valid longitude is required'),
];

// Routes
router.get('/', authenticate, getClusters);
router.get('/my', authenticate, getMyClusters);
router.get('/recommended', authenticate, getRecommendedClusters);
router.get('/suggest', authenticate, getSuggestedCluster);
router.get('/:id', authenticate, getCluster);
router.post('/', authenticate, validate(createClusterValidation), createCluster);
router.post('/:id/join', authenticate, joinCluster);
router.post('/:id/leave', authenticate, leaveCluster);
router.patch('/:id/status', authenticate, updateClusterStatus);

export default router;
