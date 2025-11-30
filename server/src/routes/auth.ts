import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import {
  register,
  login,
  sendLoginOTP,
  verifyLoginOTP,
  verifyEmail,
  resendVerification,
  getMe,
  updateProfile,
  updateLocation,
} from '../controllers/authController.js';

const router = Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name is required'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const otpValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Valid OTP is required'),
];

// Routes
router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.post('/otp/send', body('email').isEmail(), sendLoginOTP);
router.post('/otp/verify', validate(otpValidation), verifyLoginOTP);

// Protected routes
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/location', authenticate, updateLocation);
router.post('/verify-email', authenticate, verifyEmail);
router.post('/resend-verification', authenticate, resendVerification);

export default router;
