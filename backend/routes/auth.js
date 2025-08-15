import express from 'express';
import { body } from 'express-validator';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validationResult } from 'express-validator';
import Doctor from '../models/Doctor.js';

const router = express.Router();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit phone number')
], async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone
    });

    if (user) {
      res.status(201).json({
        status: 'success',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          token: generateToken(user._id)
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      status: 'success',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      status: 'success',
      data: req.user
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    res.json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Register doctor (admin only)
router.post('/register-doctor', protect, authorize('admin'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('speciality').notEmpty().withMessage('Speciality is required'),
  body('degree').notEmpty().withMessage('Degree is required'),
  body('experience').notEmpty().withMessage('Experience is required'),
  body('about').notEmpty().withMessage('About is required'),
  body('fees').isNumeric().withMessage('Fees must be a number'),
  body('image').notEmpty().withMessage('Image is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: errors.array()[0].msg
      });
    }

    const { name, email, password, phone, speciality, degree, experience, about, fees, image, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Create doctor user
    const doctorUser = await User.create({
      name,
      email,
      password,
      phone,
      role: 'doctor',
      isEmailVerified: true
    });

    // Create doctor profile
    const doctor = await Doctor.create({
      name,
      email,
      phone,
      speciality,
      degree,
      experience,
      about,
      fees,
      image,
      address: address || {
        line1: '',
        line2: '',
        city: '',
        state: '',
        zipCode: ''
      },
      rating: 0,
      totalReviews: 0,
      isVerified: true
    });

    const token = generateToken(doctorUser._id);

    res.status(201).json({
      status: 'success',
      data: {
        token,
        user: doctorUser,
        doctor: doctor
      },
      message: `Doctor registered successfully! Login credentials: Email: ${email}, Password: ${password}`
    });
  } catch (error) {
    console.error('Doctor registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

export default router;
