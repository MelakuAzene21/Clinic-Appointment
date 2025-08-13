import express from 'express';
import { body } from 'express-validator';
import Doctor from '../models/Doctor.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { speciality, search, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = { isActive: true };
    
    if (speciality) {
      query.speciality = speciality;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { speciality: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    const doctors = await Doctor.find(query)
      .sort({ rating: -1, name: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Doctor.countDocuments(query);
    
    res.json({
      status: 'success',
      data: doctors,
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

// @desc    Get single doctor
// @route   GET /api/doctors/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }
    
    res.json({
      status: 'success',
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Create doctor
// @route   POST /api/doctors
// @access  Private/Admin
router.post('/', protect, authorize('admin'), [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit phone number'),
  body('speciality').isIn(['General physician', 'Gynecologist', 'Dermatologist', 'Pediatricians', 'Neurologist', 'Gastroenterologist']).withMessage('Invalid speciality'),
  body('degree').notEmpty().withMessage('Degree is required'),
  body('experience').notEmpty().withMessage('Experience is required'),
  body('about').isLength({ min: 10, max: 1000 }).withMessage('About must be between 10 and 1000 characters'),
  body('fees').isNumeric().withMessage('Fees must be a number'),
  body('image').notEmpty().withMessage('Image is required')
], async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);
    
    res.status(201).json({
      status: 'success',
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Update doctor
// @route   PUT /api/doctors/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }
    
    res.json({
      status: 'success',
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Delete doctor
// @route   DELETE /api/doctors/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }
    
    res.json({
      status: 'success',
      message: 'Doctor deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get available time slots for a doctor
// @route   GET /api/doctors/:id/slots
// @access  Public
router.get('/:id/slots', async (req, res) => {
  try {
    const { date } = req.query;
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }
    
    // Generate time slots for the given date
    const slots = [];
    const selectedDate = date ? new Date(date) : new Date();
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
    
    // Default availability: 10 AM to 9 PM, 30-minute slots
    const startHour = 10;
    const endHour = 21;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    
    res.json({
      status: 'success',
      data: {
        doctor: doctor._id,
        date: selectedDate.toISOString().split('T')[0],
        slots
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export default router;
