import express from 'express';
import Doctor from '../models/Doctor.js';

const router = express.Router();

// @desc    Get all specialities
// @route   GET /api/specialities
// @access  Public
router.get('/', async (req, res) => {
  try {
    const specialities = [
      {
        name: 'General physician',
        description: 'Primary care physicians who provide general medical care',
        icon: 'General_physician.svg'
      },
      {
        name: 'Gynecologist',
        description: 'Specialists in women\'s reproductive health',
        icon: 'Gynecologist.svg'
      },
      {
        name: 'Dermatologist',
        description: 'Specialists in skin, hair, and nail conditions',
        icon: 'Dermatologist.svg'
      },
      {
        name: 'Pediatricians',
        description: 'Specialists in children\'s health and development',
        icon: 'Pediatricians.svg'
      },
      {
        name: 'Neurologist',
        description: 'Specialists in nervous system disorders',
        icon: 'Neurologist.svg'
      },
      {
        name: 'Gastroenterologist',
        description: 'Specialists in digestive system disorders',
        icon: 'Gastroenterologist.svg'
      }
    ];
    
    res.json({
      status: 'success',
      data: specialities
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get doctors by speciality
// @route   GET /api/specialities/:speciality/doctors
// @access  Public
router.get('/:speciality/doctors', async (req, res) => {
  try {
    const { speciality } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Validate speciality
    const validSpecialities = [
      'General physician',
      'Gynecologist',
      'Dermatologist',
      'Pediatricians',
      'Neurologist',
      'Gastroenterologist'
    ];
    
    if (!validSpecialities.includes(speciality)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid speciality'
      });
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    const doctors = await Doctor.find({
      speciality,
      isActive: true
    })
      .sort({ rating: -1, name: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Doctor.countDocuments({
      speciality,
      isActive: true
    });
    
    res.json({
      status: 'success',
      data: {
        speciality,
        doctors,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get speciality statistics
// @route   GET /api/specialities/:speciality/stats
// @access  Public
router.get('/:speciality/stats', async (req, res) => {
  try {
    const { speciality } = req.params;
    
    // Validate speciality
    const validSpecialities = [
      'General physician',
      'Gynecologist',
      'Dermatologist',
      'Pediatricians',
      'Neurologist',
      'Gastroenterologist'
    ];
    
    if (!validSpecialities.includes(speciality)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid speciality'
      });
    }
    
    const stats = await Doctor.aggregate([
      {
        $match: {
          speciality,
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          totalDoctors: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          avgFees: { $avg: '$fees' },
          minFees: { $min: '$fees' },
          maxFees: { $max: '$fees' }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalDoctors: 0,
      avgRating: 0,
      avgFees: 0,
      minFees: 0,
      maxFees: 0
    };
    
    res.json({
      status: 'success',
      data: {
        speciality,
        ...result
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
