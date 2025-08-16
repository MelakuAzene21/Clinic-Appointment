import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient is required']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Doctor is required']
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'Appointment is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  review: {
    type: String,
    required: [true, 'Review text is required'],
    maxlength: [1000, 'Review cannot exceed 1000 characters']
  },
  isAnonymous: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Ensure one review per appointment
reviewSchema.index({ appointment: 1 }, { unique: true });

// Index for better query performance
reviewSchema.index({ doctor: 1, createdAt: -1 });
reviewSchema.index({ patient: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
