// import express from 'express';
// import { body } from 'express-validator';
// import Appointment from '../models/Appointment.js';
// import Doctor from '../models/Doctor.js';
// import { protect } from '../middleware/auth.js';
// import { authorize } from '../middleware/authorize.js';

// const router = express.Router();

// // @desc    Get all appointments for a user
// // @route   GET /api/appointments
// // @access  Private
// router.get('/', protect, async (req, res) => {
//   try {
//     const { status, page = 1, limit = 10 } = req.query;
    
//     // Build query
//     const query = { patient: req.user._id };
    
//     if (status) {
//       query.status = status;
//     }
    
//     // Pagination
//     const skip = (page - 1) * limit;
    
//     const appointments = await Appointment.find(query)
//       .populate('doctor', 'name speciality image fees')
//       .sort({ appointmentDate: -1, appointmentTime: -1 })
//       .skip(skip)
//       .limit(parseInt(limit));
    
//     const total = await Appointment.countDocuments(query);
    
//     res.json({
//       status: 'success',
//       data: appointments,
//       pagination: {
//         current: parseInt(page),
//         total: Math.ceil(total / limit),
//         hasNext: page * limit < total,
//         hasPrev: page > 1
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: 'error',
//       message: error.message
//     });
//   }
// });

// // @desc    Get single appointment
// // @route   GET /api/appointments/:id
// // @access  Private
// router.get('/:id', protect, async (req, res) => {
//   try {
//     const appointment = await Appointment.findById(req.params.id)
//       .populate('doctor', 'name speciality image fees about address')
//       .populate('patient', 'name email phone');
    
//     if (!appointment) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'Appointment not found'
//       });
//     }
    
//     // Check if user is authorized to view this appointment
//     if (appointment.patient._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
//       return res.status(403).json({
//         status: 'error',
//         message: 'Not authorized to view this appointment'
//       });
//     }
    
//     res.json({
//       status: 'success',
//       data: appointment
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: 'error',
//       message: error.message
//     });
//   }
// });

// // @desc    Create appointment
// // @route   POST /api/appointments
// // @access  Private
// router.post('/', protect, [
//   body('doctorId').isMongoId().withMessage('Valid doctor ID is required'),
//   body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
//   body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid appointment time is required'),
//   body('symptoms').optional().isLength({ max: 500 }).withMessage('Symptoms cannot exceed 500 characters'),
//   body('notes').optional().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
// ], async (req, res) => {
//   try {
//     const { doctorId, appointmentDate, appointmentTime, symptoms, notes } = req.body;
    
//     // Check if doctor exists
//     const doctor = await Doctor.findById(doctorId);
//     if (!doctor || !doctor.isActive) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'Doctor not found or inactive'
//       });
//     }
    
//     // Check if appointment date is in the future
//     const appointmentDateTime = new Date(appointmentDate);
//     appointmentDateTime.setHours(parseInt(appointmentTime.split(':')[0]));
//     appointmentDateTime.setMinutes(parseInt(appointmentTime.split(':')[1]));
    
//     if (appointmentDateTime <= new Date()) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Appointment date and time must be in the future'
//       });
//     }
    
//     // Check if slot is available
//     const existingAppointment = await Appointment.findOne({
//       doctor: doctorId,
//       appointmentDate: appointmentDate,
//       appointmentTime: appointmentTime,
//       status: { $in: ['pending', 'confirmed'] }
//     });
    
//     if (existingAppointment) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'This time slot is already booked'
//       });
//     }
    
//     // Create appointment
//     const appointment = await Appointment.create({
//       patient: req.user._id,
//       doctor: doctorId,
//       appointmentDate,
//       appointmentTime,
//       amount: doctor.fees,
//       symptoms,
//       notes
//     });
    
//     const populatedAppointment = await Appointment.findById(appointment._id)
//       .populate('doctor', 'name speciality image fees')
//       .populate('patient', 'name email phone');
    
//     res.status(201).json({
//       status: 'success',
//       data: populatedAppointment
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: 'error',
//       message: error.message
//     });
//   }
// });

// // @desc    Update appointment status
// // @route   PUT /api/appointments/:id/status
// // @access  Private
// router.put('/:id/status', protect, [
//   body('status').isIn(['pending', 'confirmed', 'completed', 'cancelled']).withMessage('Invalid status'),
//   body('cancellationReason').optional().isLength({ max: 500 }).withMessage('Cancellation reason cannot exceed 500 characters')
// ], async (req, res) => {
//   try {
//     const { status, cancellationReason } = req.body;
    
//     const appointment = await Appointment.findById(req.params.id);
    
//     if (!appointment) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'Appointment not found'
//       });
//     }
    
//     // Check authorization
//     if (appointment.patient.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
//       return res.status(403).json({
//         status: 'error',
//         message: 'Not authorized to update this appointment'
//       });
//     }
    
//     // Update appointment
//     appointment.status = status;
//     if (status === 'cancelled') {
//       appointment.cancellationReason = cancellationReason;
//       appointment.cancelledBy = req.user.role === 'admin' ? 'admin' : 'patient';
//     }
    
//     await appointment.save();
    
//     const updatedAppointment = await Appointment.findById(appointment._id)
//       .populate('doctor', 'name speciality image fees')
//       .populate('patient', 'name email phone');
    
//     res.json({
//       status: 'success',
//       data: updatedAppointment
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: 'error',
//       message: error.message
//     });
//   }
// });

// // @desc    Add prescription to appointment
// // @route   PUT /api/appointments/:id/prescription
// // @access  Private/Admin
// router.put('/:id/prescription', protect, authorize('admin'), [
//   body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
//   body('medicines').isArray().withMessage('Medicines must be an array'),
//   body('recommendations').optional().isLength({ max: 1000 }).withMessage('Recommendations cannot exceed 1000 characters'),
//   body('nextVisit').optional().isISO8601().withMessage('Valid next visit date is required')
// ], async (req, res) => {
//   try {
//     const { diagnosis, medicines, recommendations, nextVisit } = req.body;
    
//     const appointment = await Appointment.findById(req.params.id);
    
//     if (!appointment) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'Appointment not found'
//       });
//     }
    
//     // Update prescription
//     appointment.prescription = {
//       diagnosis,
//       medicines,
//       recommendations,
//       nextVisit: nextVisit ? new Date(nextVisit) : null
//     };
    
//     await appointment.save();
    
//     const updatedAppointment = await Appointment.findById(appointment._id)
//       .populate('doctor', 'name speciality image fees')
//       .populate('patient', 'name email phone');
    
//     res.json({
//       status: 'success',
//       data: updatedAppointment
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: 'error',
//       message: error.message
//     });
//   }
// });

// // Get appointments for doctor
// router.get('/doctor', protect, authorize('doctor'), async (req, res) => {
//   try {
//     // Find appointments by doctor's email since we need to match with Doctor model
//     const appointments = await Appointment.find({})
//       .populate('patient', 'name email phone')
//       .populate('doctor', 'name speciality')
//       .sort({ appointmentDate: 1 });

//     // Filter appointments for the logged-in doctor by email
//     const doctorAppointments = appointments.filter(appointment =>
//       appointment.doctor && appointment.doctor.email === req.user.email
//     );

//     res.json({
//       status: 'success',
//       data: doctorAppointments
//     });
//   } catch (error) {
//     console.error('Error fetching doctor appointments:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Server error'
//     });
//   }
// });

// // Get doctor's patients
// router.get('/doctor/patients', protect, authorize('doctor'), async (req, res) => {
//   try {
//     const appointments = await Appointment.find({})
//       .populate('patient', 'name email phone')
//       .populate('doctor', 'email')
//       .sort({ appointmentDate: -1 });

//     // Filter appointments for the logged-in doctor
//     const doctorAppointments = appointments.filter(appointment =>
//       appointment.doctor && appointment.doctor.email === req.user.email
//     );

//     // Get unique patients
//     const patients = [];
//     const patientIds = new Set();
    
//     doctorAppointments.forEach(appointment => {
//       if (appointment.patient && !patientIds.has(appointment.patient._id.toString())) {
//         patientIds.add(appointment.patient._id.toString());
//         patients.push({
//           _id: appointment.patient._id,
//           name: appointment.patient.name,
//           email: appointment.patient.email,
//           phone: appointment.patient.phone,
//           totalAppointments: doctorAppointments.filter(apt =>
//             apt.patient._id.toString() === appointment.patient._id.toString()
//           ).length,
//           lastVisit: appointment.appointmentDate
//         });
//       }
//     });

//     res.json({
//       status: 'success',
//       data: patients
//     });
//   } catch (error) {
//     console.error('Error fetching doctor patients:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Server error'
//     });
//   }
// });

// // Get doctor's earnings
// router.get('/doctor/earnings', protect, authorize('doctor'), async (req, res) => {
//   try {
//     const { period = 'month' } = req.query;
//     const appointments = await Appointment.find({})
//       .populate('doctor', 'email')
//       .sort({ appointmentDate: -1 });

//     // Filter appointments for the logged-in doctor
//     const doctorAppointments = appointments.filter(appointment =>
//       appointment.doctor && appointment.doctor.email === req.user.email
//     );

//     // Calculate earnings based on period
//     const now = new Date();
//     let startDate;
    
//     switch (period) {
//       case 'week':
//         startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
//         break;
//       case 'month':
//         startDate = new Date(now.getFullYear(), now.getMonth(), 1);
//         break;
//       case 'year':
//         startDate = new Date(now.getFullYear(), 0, 1);
//         break;
//       default:
//         startDate = new Date(now.getFullYear(), now.getMonth(), 1);
//     }

//     const filteredAppointments = doctorAppointments.filter(appointment =>
//       appointment.status === 'completed' &&
//       new Date(appointment.appointmentDate) >= startDate
//     );

//     const totalEarnings = filteredAppointments.reduce((sum, appointment) => sum + appointment.amount, 0);
//     const totalAppointments = filteredAppointments.length;

//     // Monthly earnings for the last 6 months
//     const monthlyEarnings = [];
//     for (let i = 5; i >= 0; i--) {
//       const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
//       const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
//       const monthAppointments = doctorAppointments.filter(appointment =>
//         appointment.status === 'completed' &&
//         new Date(appointment.appointmentDate) >= monthStart &&
//         new Date(appointment.appointmentDate) <= monthEnd
//       );
      
//       const monthEarnings = monthAppointments.reduce((sum, appointment) => sum + appointment.amount, 0);
      
//       monthlyEarnings.push({
//         month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
//         earnings: monthEarnings,
//         appointments: monthAppointments.length
//       });
//     }

//     res.json({
//       status: 'success',
//       data: {
//         totalEarnings,
//         totalAppointments,
//         period,
//         monthlyEarnings
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching doctor earnings:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Server error'
//     });
//   }
// });

// // Update appointment status (doctor only)
// router.put('/:id/status', protect, authorize('doctor'), async (req, res) => {
//   try {
//     const { status } = req.body;
//     const appointment = await Appointment.findById(req.params.id)
//       .populate('doctor', 'email');

//     if (!appointment) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'Appointment not found'
//       });
//     }

//     // Check if the appointment belongs to the logged-in doctor
//     if (appointment.doctor.email !== req.user.email) {
//       return res.status(403).json({
//         status: 'error',
//         message: 'Not authorized to update this appointment'
//       });
//     }

//     appointment.status = status;
//     await appointment.save();

//     const updatedAppointment = await Appointment.findById(appointment._id)
//       .populate('patient', 'name email phone')
//       .populate('doctor', 'name speciality');

//     res.json({
//       status: 'success',
//       data: updatedAppointment
//     });
//   } catch (error) {
//     console.error('Error updating appointment status:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Server error'
//     });
//   }
// });

// // Add prescription to appointment (doctor only)
// router.put('/:id/prescription', protect, authorize('doctor'), async (req, res) => {
//   try {
//     const { diagnosis, medicines, recommendations, nextVisit } = req.body;
//     const appointment = await Appointment.findById(req.params.id)
//       .populate('doctor', 'email');

//     if (!appointment) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'Appointment not found'
//       });
//     }

//     // Check if the appointment belongs to the logged-in doctor
//     if (appointment.doctor.email !== req.user.email) {
//       return res.status(403).json({
//         status: 'error',
//         message: 'Not authorized to update this appointment'
//       });
//     }

//     appointment.prescription = {
//       diagnosis,
//       medicines,
//       recommendations,
//       nextVisit: nextVisit ? new Date(nextVisit) : null
//     };
//     appointment.status = 'completed';
//     await appointment.save();

//     const updatedAppointment = await Appointment.findById(appointment._id)
//       .populate('patient', 'name email phone')
//       .populate('doctor', 'name speciality');

//     res.json({
//       status: 'success',
//       data: updatedAppointment
//     });
//   } catch (error) {
//     console.error('Error adding prescription:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Server error'
//     });
//   }
// });

// // @desc    Get appointments for a doctor (admin only)
// // @route   GET /api/appointments/doctor/:doctorId
// // @access  Private/Admin
// router.get('/doctor/:doctorId', protect, authorize('admin'), async (req, res) => {
//   try {
//     const { status, date, page = 1, limit = 10 } = req.query;
    
//     // Build query
//     const query = { doctor: req.params.doctorId };
    
//     if (status) {
//       query.status = status;
//     }
    
//     if (date) {
//       query.appointmentDate = new Date(date);
//     }
    
//     // Pagination
//     const skip = (page - 1) * limit;
    
//     const appointments = await Appointment.find(query)
//       .populate('patient', 'name email phone')
//       .sort({ appointmentDate: 1, appointmentTime: 1 })
//       .skip(skip)
//       .limit(parseInt(limit));
    
//     const total = await Appointment.countDocuments(query);
    
//     res.json({
//       status: 'success',
//       data: appointments,
//       pagination: {
//         current: parseInt(page),
//         total: Math.ceil(total / limit),
//         hasNext: page * limit < total,
//         hasPrev: page > 1
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: 'error',
//       message: error.message
//     });
//   }
// });

// export default router;







import express from 'express';
import { body } from 'express-validator';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// @desc    Get appointments for doctor
// @route   GET /api/appointments/doctor
// @access  Private/Doctor
router.get('/doctor', protect, authorize('doctor'), async (req, res) => {
  try {
    const appointments = await Appointment.find({})
      .populate('patient', 'name email phone')
      .populate('doctor', 'name speciality email')
      .sort({ appointmentDate: 1 });

    // Filter appointments for the logged-in doctor by email
    const doctorAppointments = appointments.filter(appointment =>
      appointment.doctor && appointment.doctor.email === req.user.email
    );

    res.json({
      status: 'success',
      data: doctorAppointments
    });
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @desc    Get doctor's patients
// @route   GET /api/appointments/doctor/patients
// @access  Private/Doctor
router.get('/doctor/patients', protect, authorize('doctor'), async (req, res) => {
  try {
    const appointments = await Appointment.find({})
      .populate('patient', 'name email phone')
      .populate('doctor', 'email')
      .sort({ appointmentDate: -1 });

    // Filter appointments for the logged-in doctor
    const doctorAppointments = appointments.filter(appointment =>
      appointment.doctor && appointment.doctor.email === req.user.email
    );

    // Get unique patients
    const patients = [];
    const patientIds = new Set();

    doctorAppointments.forEach(appointment => {
      if (appointment.patient && !patientIds.has(appointment.patient._id.toString())) {
        patientIds.add(appointment.patient._id.toString());
        patients.push({
          _id: appointment.patient._id,
          name: appointment.patient.name,
          email: appointment.patient.email,
          phone: appointment.patient.phone,
          totalAppointments: doctorAppointments.filter(apt =>
            apt.patient._id.toString() === appointment.patient._id.toString()
          ).length,
          lastVisit: appointment.appointmentDate
        });
      }
    });

    res.json({
      status: 'success',
      data: patients
    });
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @desc    Get doctor's earnings
// @route   GET /api/appointments/doctor/earnings
// @access  Private/Doctor
router.get('/doctor/earnings', protect, authorize('doctor'), async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const appointments = await Appointment.find({})
      .populate('doctor', 'email')
      .sort({ appointmentDate: -1 });

    // Filter appointments for the logged-in doctor
    const doctorAppointments = appointments.filter(appointment =>
      appointment.doctor && appointment.doctor.email === req.user.email
    );

    // Calculate earnings based on period
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const filteredAppointments = doctorAppointments.filter(appointment =>
      appointment.status === 'completed' &&
      new Date(appointment.appointmentDate) >= startDate
    );

    const totalEarnings = filteredAppointments.reduce((sum, appointment) => sum + appointment.amount, 0);
    const totalAppointments = filteredAppointments.length;

    // Monthly earnings for the last 6 months
    const monthlyEarnings = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthAppointments = doctorAppointments.filter(appointment =>
        appointment.status === 'completed' &&
        new Date(appointment.appointmentDate) >= monthStart &&
        new Date(appointment.appointmentDate) <= monthEnd
      );

      const monthEarnings = monthAppointments.reduce((sum, appointment) => sum + appointment.amount, 0);

      monthlyEarnings.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        earnings: monthEarnings,
        appointments: monthAppointments.length
      });
    }

    res.json({
      status: 'success',
      data: {
        totalEarnings,
        totalAppointments,
        period,
        monthlyEarnings
      }
    });
  } catch (error) {
    console.error('Error fetching doctor earnings:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @desc    Get appointments for a doctor (admin only)
// @route   GET /api/appointments/doctor/:doctorId
// @access  Private/Admin
router.get('/doctor/:doctorId', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, date, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { doctor: req.params.doctorId };

    if (status) {
      query.status = status;
    }

    if (date) {
      query.appointmentDate = new Date(date);
    }

    // Pagination
    const skip = (page - 1) * limit;

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.json({
      status: 'success',
      data: appointments,
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

// @desc    Get all appointments for a user
// @route   GET /api/appointments
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { patient: req.user._id };

    if (status) {
      query.status = status;
    }

    // Pagination
    const skip = (page - 1) * limit;

    const appointments = await Appointment.find(query)
      .populate('doctor', 'name speciality image fees')
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.json({
      status: 'success',
      data: appointments,
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

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctor', 'name speciality image fees about address')
      .populate('patient', 'name email phone');

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    // Check if user is authorized to view this appointment
    if (appointment.patient._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this appointment'
      });
    }

    res.json({
      status: 'success',
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Create appointment
// @route   POST /api/appointments
// @access  Private
router.post('/', protect, [
  body('doctorId').isMongoId().withMessage('Valid doctor ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid appointment time is required'),
  body('symptoms').optional().isLength({ max: 500 }).withMessage('Symptoms cannot exceed 500 characters'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
], async (req, res) => {
  try {
    const { doctorId, appointmentDate, appointmentTime, symptoms, notes } = req.body;

    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found or inactive'
      });
    }

    // Check if appointment date is in the future
    const appointmentDateTime = new Date(appointmentDate);
    appointmentDateTime.setHours(parseInt(appointmentTime.split(':')[0]));
    appointmentDateTime.setMinutes(parseInt(appointmentTime.split(':')[1]));

    if (appointmentDateTime <= new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'Appointment date and time must be in the future'
      });
    }

    // Check if slot is available
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: appointmentDate,
      appointmentTime: appointmentTime,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({
        status: 'error',
        message: 'This time slot is already booked'
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      appointmentDate,
      appointmentTime,
      amount: doctor.fees,
      symptoms,
      notes
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'name speciality image fees')
      .populate('patient', 'name email phone');

    res.status(201).json({
      status: 'success',
      data: populatedAppointment
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Update appointment status (patient/admin/doctor)
// @route   PUT /api/appointments/:id/status
// @access  Private
router.put('/:id/status', protect, [
  body('status').isIn(['pending', 'confirmed', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('cancellationReason').optional().isLength({ max: 500 }).withMessage('Cancellation reason cannot exceed 500 characters')
], async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;

    // Load appointment with doctor to allow doctor-ownership check
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctor', 'email');

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    // Authorization:
    // - Patient who booked it
    // - Admin
    // - Doctor assigned to the appointment
    const isPatient = appointment.patient.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isDoctorOwner = req.user.role === 'doctor' && appointment.doctor && appointment.doctor.email === req.user.email;

    if (!isPatient && !isAdmin && !isDoctorOwner) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this appointment'
      });
    }

    // Update appointment
    appointment.status = status;
    if (status === 'cancelled') {
      appointment.cancellationReason = cancellationReason;
      appointment.cancelledBy = isAdmin ? 'admin' : (req.user.role === 'doctor' ? 'doctor' : 'patient');
    }

    await appointment.save();

    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'name speciality image fees email')
      .populate('patient', 'name email phone');

    res.json({
      status: 'success',
      data: updatedAppointment
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Add prescription to appointment (admin/doctor)
// @route   PUT /api/appointments/:id/prescription
// @access  Private/Admin|Doctor
router.put('/:id/prescription', protect, authorize('admin', 'doctor'), [
  body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
  body('medicines').isArray().withMessage('Medicines must be an array'),
  body('recommendations').optional().isLength({ max: 1000 }).withMessage('Recommendations cannot exceed 1000 characters'),
  body('nextVisit').optional().isISO8601().withMessage('Valid next visit date is required')
], async (req, res) => {
  try {
    const { diagnosis, medicines, recommendations, nextVisit } = req.body;

    const appointment = await Appointment.findById(req.params.id)
      .populate('doctor', 'email');

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    // If doctor, ensure this appointment belongs to them
    if (req.user.role === 'doctor') {
      if (!appointment.doctor || appointment.doctor.email !== req.user.email) {
        return res.status(403).json({
          status: 'error',
          message: 'Not authorized to update this appointment'
        });
      }
    }

    // Update prescription
    appointment.prescription = {
      diagnosis,
      medicines,
      recommendations,
      nextVisit: nextVisit ? new Date(nextVisit) : null
    };
    // Mark as completed when prescription is added
    appointment.status = 'completed';

    await appointment.save();

    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'name speciality image fees')
      .populate('patient', 'name email phone');

    res.json({
      status: 'success',
      data: updatedAppointment
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Removed duplicate doctor-only routes by unifying logic above

// @desc    Get all appointments for admin
// @route   GET /api/appointments/admin/all
// @access  Private/Admin
router.get('/admin/all', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, doctorId, patientId, date, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (doctorId) {
      query.doctor = doctorId;
    }
    
    if (patientId) {
      query.patient = patientId;
    }
    
    if (date) {
      query.appointmentDate = new Date(date);
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name speciality email')
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Appointment.countDocuments(query);
    
    res.json({
      status: 'success',
      data: appointments,
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

export default router;