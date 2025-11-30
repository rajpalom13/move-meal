import { Router } from 'express';
import authRoutes from './auth.js';
import foodClusterRoutes from './foodClusters.js';
import rideClusterRoutes from './rideClusters.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/food-clusters', foodClusterRoutes);
router.use('/ride-clusters', rideClusterRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
