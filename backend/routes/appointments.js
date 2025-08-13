import express from 'express';
import { body } from 'express-validator';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

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

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private
router.put('/:id/status', protect, [
  body('status').isIn(['pending', 'confirmed', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('cancellationReason').optional().isLength({ max: 500 }).withMessage('Cancellation reason cannot exceed 500 characters')
], async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }
    
    // Check authorization
    if (appointment.patient.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this appointment'
      });
    }
    
    // Update appointment
    appointment.status = status;
    if (status === 'cancelled') {
      appointment.cancellationReason = cancellationReason;
      appointment.cancelledBy = req.user.role === 'admin' ? 'admin' : 'patient';
    }
    
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

// @desc    Add prescription to appointment
// @route   PUT /api/appointments/:id/prescription
// @access  Private/Admin
router.put('/:id/prescription', protect, authorize('admin'), [
  body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
  body('medicines').isArray().withMessage('Medicines must be an array'),
  body('recommendations').optional().isLength({ max: 1000 }).withMessage('Recommendations cannot exceed 1000 characters'),
  body('nextVisit').optional().isISO8601().withMessage('Valid next visit date is required')
], async (req, res) => {
  try {
    const { diagnosis, medicines, recommendations, nextVisit } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }
    
    // Update prescription
    appointment.prescription = {
      diagnosis,
      medicines,
      recommendations,
      nextVisit: nextVisit ? new Date(nextVisit) : null
    };
    
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

export default router;
