import express from 'express';
import { body } from 'express-validator';
import Review from '../models/Review.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// @desc    Create a review for a doctor
// @route   POST /api/reviews
// @access  Private (Patients only)
router.post('/', protect, authorize('patient'), [
  body('doctorId').isMongoId().withMessage('Valid doctor ID is required'),
  body('appointmentId').isMongoId().withMessage('Valid appointment ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').isLength({ min: 10, max: 1000 }).withMessage('Review must be between 10 and 1000 characters'),
  body('isAnonymous').optional().isBoolean().withMessage('isAnonymous must be a boolean')
], async (req, res) => {
  try {
    const { doctorId, appointmentId, rating, review, isAnonymous = false } = req.body;

    // Check if appointment exists and belongs to the patient
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    if (appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to review this appointment'
      });
    }

    // Check if appointment is completed (has prescription)
    if (appointment.status !== 'completed' || !appointment.prescription) {
      return res.status(400).json({
        status: 'error',
        message: 'Can only review completed appointments with prescriptions'
      });
    }

    // Check if review already exists for this appointment
    const existingReview = await Review.findOne({ appointment: appointmentId });
    if (existingReview) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already reviewed this appointment'
      });
    }

    // Create the review
    const newReview = await Review.create({
      patient: req.user._id,
      doctor: doctorId,
      appointment: appointmentId,
      rating,
      review,
      isAnonymous
    });

    // Update doctor's rating and total reviews
    const doctor = await Doctor.findById(doctorId);
    if (doctor) {
      const allReviews = await Review.find({ doctor: doctorId });
      const totalRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
      const averageRating = totalRating / allReviews.length;
      
      doctor.rating = Math.round(averageRating * 10) / 10; // Round to 1 decimal place
      doctor.totalReviews = allReviews.length;
      await doctor.save();
    }

    // Populate the review with patient and doctor info
    const populatedReview = await Review.findById(newReview._id)
      .populate('patient', 'name')
      .populate('doctor', 'name speciality');

    res.status(201).json({
      status: 'success',
      data: populatedReview,
      message: 'Review submitted successfully'
    });
  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get reviews for a specific doctor
// @route   GET /api/reviews/doctor/:doctorId
// @access  Public
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    console.log('Reviews route hit: GET /doctor/:doctorId');
    console.log('Params:', req.params);
    console.log('Query:', req.query);
    
    // Validate doctorId
    if (!req.params.doctorId || req.params.doctorId === 'undefined' || req.params.doctorId === 'null') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid doctor ID'
      });
    }
    
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    console.log('Searching for reviews with doctor ID:', req.params.doctorId);
    const reviews = await Review.find({ doctor: req.params.doctorId })
      .populate('patient', 'name')
      .populate('doctor', 'name speciality')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log('Found reviews:', reviews.length);
    const total = await Review.countDocuments({ doctor: req.params.doctorId });
    console.log('Total reviews count:', total);

    res.json({
      status: 'success',
      data: reviews,
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

// @desc    Get reviews by a specific patient
// @route   GET /api/reviews/patient
// @access  Private (Patients only)
router.get('/patient', protect, authorize('patient'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ patient: req.user._id })
      .populate('doctor', 'name speciality image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ patient: req.user._id });

    res.json({
      status: 'success',
      data: reviews,
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

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private (Review owner only)
router.put('/:id', protect, [
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().isLength({ min: 10, max: 1000 }).withMessage('Review must be between 10 and 1000 characters'),
  body('isAnonymous').optional().isBoolean().withMessage('isAnonymous must be a boolean')
], async (req, res) => {
  try {
    const { rating, review, isAnonymous } = req.body;
    const reviewDoc = await Review.findById(req.params.id);

    if (!reviewDoc) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }

    // Check if user owns this review
    if (reviewDoc.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this review'
      });
    }

    // Update review
    if (rating !== undefined) reviewDoc.rating = rating;
    if (review !== undefined) reviewDoc.review = review;
    if (isAnonymous !== undefined) reviewDoc.isAnonymous = isAnonymous;

    await reviewDoc.save();

    // Update doctor's rating
    const doctor = await Doctor.findById(reviewDoc.doctor);
    if (doctor) {
      const allReviews = await Review.find({ doctor: reviewDoc.doctor });
      const totalRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
      const averageRating = totalRating / allReviews.length;
      
      doctor.rating = Math.round(averageRating * 10) / 10;
      doctor.totalReviews = allReviews.length;
      await doctor.save();
    }

    const updatedReview = await Review.findById(reviewDoc._id)
      .populate('patient', 'name')
      .populate('doctor', 'name speciality');

    res.json({
      status: 'success',
      data: updatedReview,
      message: 'Review updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private (Review owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }

    // Check if user owns this review
    if (review.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this review'
      });
    }

    await Review.findByIdAndDelete(req.params.id);

    // Update doctor's rating
    const doctor = await Doctor.findById(review.doctor);
    if (doctor) {
      const allReviews = await Review.find({ doctor: review.doctor });
      if (allReviews.length > 0) {
        const totalRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
        const averageRating = totalRating / allReviews.length;
        doctor.rating = Math.round(averageRating * 10) / 10;
        doctor.totalReviews = allReviews.length;
      } else {
        doctor.rating = 0;
        doctor.totalReviews = 0;
      }
      await doctor.save();
    }

    res.json({
      status: 'success',
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export default router;
