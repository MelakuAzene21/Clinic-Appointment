import express from 'express';
import { body } from 'express-validator';
import Chat from '../models/Chat.js';
import Appointment from '../models/Appointment.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// @desc    Get all chats for a user (patient or doctor)
// @route   GET /api/chat
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    console.log('Fetching chats for user:', req.user.name, 'role:', req.user.role, 'id:', req.user._id);
    let chats;
    
    if (req.user.role === 'doctor') {
      // Get chats where the logged-in user is the doctor
      chats = await Chat.find({ 
        doctor: req.user._id,
        isActive: true 
      })
      .populate('patient', 'name email')
      .populate('appointment', 'appointmentDate appointmentTime status')
      .populate('messages.sender', 'name')
      .sort({ lastMessage: -1 });
    } else if (req.user.role === 'patient') {
      // Get chats where the logged-in user is the patient
      chats = await Chat.find({ 
        patient: req.user._id,
        isActive: true 
      })
      .populate('doctor', 'name speciality')
      .populate('appointment', 'appointmentDate appointmentTime status')
      .populate('messages.sender', 'name')
      .sort({ lastMessage: -1 });
    } else {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Only doctors and patients can access chats.'
      });
    }

    console.log('Found chats:', chats.length);
    res.json({
      status: 'success',
      data: chats
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get a specific chat by ID
// @route   GET /api/chat/:chatId
// @access  Private
router.get('/:chatId', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate('patient', 'name email')
      .populate('doctor', 'name speciality')
      .populate('appointment', 'appointmentDate appointmentTime status')
      .populate('messages.sender', 'name');

    if (!chat) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat not found'
      });
    }

    // Check if user has access to this chat
    if (req.user.role === 'doctor' && chat.doctor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    if (req.user.role === 'patient' && chat.patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    res.json({
      status: 'success',
      data: chat
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Create a new chat (when appointment is booked)
// @route   POST /api/chat/appointment
// @access  Private
router.post('/appointment', protect, [
  body('appointmentId').isMongoId().withMessage('Valid appointment ID is required')
], async (req, res) => {
  try {
    const { appointmentId } = req.body;

    // Check if appointment exists and user has access
    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'name email')
      .populate('doctor', 'name speciality');

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    // Check if user has permission to create chat for this appointment
    if (req.user.role === 'patient' && appointment.patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    if (req.user.role === 'doctor' && appointment.doctor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    // Check if chat already exists
    const existingChat = await Chat.findOne({ appointment: appointmentId });
    if (existingChat) {
      return res.json({
        status: 'success',
        data: existingChat,
        message: 'Chat already exists'
      });
    }

    // Create new chat
    const chat = new Chat({
      patient: appointment.patient._id,
      doctor: appointment.doctor._id,
      appointment: appointmentId,
      messages: []
    });

    await chat.save();

    // Populate the chat with user details
    await chat.populate('patient', 'name email');
    await chat.populate('doctor', 'name speciality');
    await chat.populate('appointment', 'appointmentDate appointmentTime status');

    res.status(201).json({
      status: 'success',
      data: chat
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Create a direct chat between doctor and patient
// @route   POST /api/chat
// @access  Private
router.post('/', protect, [
  body('patientId').isMongoId().withMessage('Valid patient ID is required')
], async (req, res) => {
  try {
    const { patientId } = req.body;

    // Only doctors can create direct chats
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        status: 'error',
        message: 'Only doctors can create direct chats'
      });
    }

    // Check if chat already exists between this doctor and patient
    const existingChat = await Chat.findOne({ 
      doctor: req.user._id,
      patient: patientId,
      appointment: { $exists: false } // No appointment-based chat
    });

    if (existingChat) {
      return res.json({
        status: 'success',
        data: existingChat,
        message: 'Chat already exists'
      });
    }

    // Create new direct chat
    const chat = new Chat({
      patient: patientId,
      doctor: req.user._id,
      messages: []
    });

    await chat.save();

    // Populate the chat with user details
    await chat.populate('patient', 'name email');
    await chat.populate('doctor', 'name speciality');

    res.status(201).json({
      status: 'success',
      data: chat
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// ... (existing imports)

// @desc    Mark messages as read
// @route   PUT /api/chat/:chatId/read
// @access  Private
router.put('/:chatId/read', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat not found'
      });
    }

    // Check access
    if (req.user.role === 'doctor' && chat.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'error', message: 'Access denied' });
    }
    if (req.user.role === 'patient' && chat.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'error', message: 'Access denied' });
    }

    // Determine other sender model
    const otherSenderModel = req.user.role === 'doctor' ? 'User' : 'Doctor';

    // Update all matching messages using arrayFilters
    await Chat.updateOne(
      { _id: chat._id },
      { $set: { 'messages.$[elem].isRead': true } },
      { 
        arrayFilters: [{ 'elem.senderModel': otherSenderModel, 'elem.isRead': false }],
        multi: true
      }
    );

    res.json({
      status: 'success',
      message: 'Messages marked as read'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});  

// Test endpoint to check chat creation
router.get('/test/check-chats', protect, async (req, res) => {
  try {
    console.log('Test endpoint - User:', req.user.name, 'Role:', req.user.role, 'ID:', req.user._id);
    
    const allChats = await Chat.find({})
      .populate('patient', 'name email')
      .populate('doctor', 'name email')
      .populate('appointment', 'appointmentDate appointmentTime status');
    
    console.log('All chats in system:', allChats.length);
    allChats.forEach(chat => {
      console.log(`Chat ${chat._id}: Patient ${chat.patient?.name} (${chat.patient?._id}) - Doctor ${chat.doctor?.name} (${chat.doctor?._id})`);
    });
    
    res.json({
      status: 'success',
      message: 'Check console for chat details',
      totalChats: allChats.length,
      userInfo: {
        name: req.user.name,
        role: req.user.role,
        id: req.user._id
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export default router;
