import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { createOTP, verifyOTP } from '../utils/otp.js';
import { sendOTPEmail } from '../services/notification.js';
import { AuthRequest } from '../types/index.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, phone, password, name, college, gender } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'User with this email or phone already exists',
      });
      return;
    }

    // Create user
    const user = await User.create({
      email,
      phone,
      password,
      name,
      college,
      gender,
    });

    // Generate verification OTP
    const otp = await createOTP(user._id, 'verification');
    await sendOTPEmail(email, otp, 'verification');

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          phone: user.phone,
          name: user.name,
          college: user.college,
          gender: user.gender,
          isVerified: user.isVerified,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
      return;
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          phone: user.phone,
          name: user.name,
          college: user.college,
          gender: user.gender,
          isVerified: user.isVerified,
          avatar: user.avatar,
          location: user.location,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
};

export const sendLoginOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const otp = await createOTP(user._id, 'login');
    await sendOTPEmail(email, otp, 'login');

    res.json({
      success: true,
      message: 'OTP sent to your email',
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP',
    });
  }
};

export const verifyLoginOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const isValid = await verifyOTP(user._id, otp, 'login');

    if (!isValid) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP',
      });
      return;
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          phone: user.phone,
          name: user.name,
          college: user.college,
          gender: user.gender,
          isVerified: user.isVerified,
          location: user.location,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'OTP verification failed',
    });
  }
};

export const verifyEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { otp } = req.body;
    const userId = req.user!._id;

    const isValid = await verifyOTP(userId, otp, 'verification');

    if (!isValid) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP',
      });
      return;
    }

    await User.findByIdAndUpdate(userId, { isVerified: true });

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Email verification failed',
    });
  }
};

export const resendVerification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    if (user.isVerified) {
      res.status(400).json({
        success: false,
        error: 'Email already verified',
      });
      return;
    }

    const otp = await createOTP(user._id, 'verification');
    await sendOTPEmail(user.email, otp, 'verification');

    res.json({
      success: true,
      message: 'Verification OTP sent',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend verification',
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    res.json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        college: user.college,
        gender: user.gender,
        avatar: user.avatar,
        isVerified: user.isVerified,
        location: user.location,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user data',
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { name, phone, avatar, preferences } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { name, phone, avatar, preferences },
      { new: true, runValidators: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
};

export const updateLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { latitude, longitude, address } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude],
          address,
        },
      },
      { new: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        location: user.location,
      },
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update location',
    });
  }
};
