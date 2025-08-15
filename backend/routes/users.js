import express from 'express';
import { body } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import mongoose from 'mongoose';

const router = express.Router();

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
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

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('phone').optional().matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit phone number'),
  body('dateOfBirth').optional().isISO8601().withMessage('Valid date of birth is required'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('address.street').optional().isLength({ max: 100 }).withMessage('Street address cannot exceed 100 characters'),
  body('address.city').optional().isLength({ max: 50 }).withMessage('City cannot exceed 50 characters'),
  body('address.state').optional().isLength({ max: 50 }).withMessage('State cannot exceed 50 characters'),
  body('address.zipCode').optional().isLength({ max: 10 }).withMessage('Zip code cannot exceed 10 characters'),
  body('address.country').optional().isLength({ max: 50 }).withMessage('Country cannot exceed 50 characters')
], async (req, res) => {
  try {
    const allowedFields = ['name', 'phone', 'dateOfBirth', 'gender', 'address'];
    const updateData = {};
    
    // Only allow specific fields to be updated
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      status: 'success',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({
      status: 'success',
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Upload profile image
// @route   POST /api/users/profile-image
// @access  Private
router.post('/profile-image', protect, async (req, res) => {
  try {
    // This would typically use multer for file upload
    // For now, we'll accept a base64 image or URL
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'Image URL is required'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: imageUrl },
      { new: true }
    );
    
    res.json({
      status: 'success',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      status: 'success',
      data: users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get all patients for admin dashboard
// @route   GET /api/users/patients
// @access  Private/Admin
router.get('/patients', protect, authorize('admin'), async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    
    // Build query for patients only
    const query = { role: 'patient' };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    const patients = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      status: 'success',
      data: patients,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get admin dashboard statistics
// @route   GET /api/users/admin-stats
// @access  Private/Admin
router.get('/admin-stats', protect, authorize('admin'), async (req, res) => {
  try {
    // Import models
    const User = mongoose.model('User');
    const Doctor = mongoose.model('Doctor');
    const Appointment = mongoose.model('Appointment');
    
    // Get counts
    const totalDoctors = await Doctor.countDocuments({ isActive: true });
    const totalPatients = await User.countDocuments({ role: 'patient', isActive: true });
    const totalAppointments = await Appointment.countDocuments();
    
    // Calculate total revenue from completed appointments
    const completedAppointments = await Appointment.find({ 
      status: 'completed',
      paymentStatus: 'paid'
    });
    const totalRevenue = completedAppointments.reduce((sum, apt) => sum + apt.amount, 0);
    
    // Get recent appointments
    const recentAppointments = await Appointment.find()
      .populate('patient', 'name email')
      .populate('doctor', 'name speciality')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get appointments by status
    const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
    const confirmedAppointments = await Appointment.countDocuments({ status: 'confirmed' });
    const completedAppointmentsCount = await Appointment.countDocuments({ status: 'completed' });
    
    res.json({
      status: 'success',
      data: {
        totalDoctors,
        totalPatients,
        totalAppointments,
        totalRevenue,
        pendingAppointments,
        confirmedAppointments,
        completedAppointmentsCount,
        recentAppointments
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get user by ID (admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    res.json({
      status: 'success',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Update user by ID (admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    res.json({
      status: 'success',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    res.json({
      status: 'success',
      message: 'User deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export default router;
