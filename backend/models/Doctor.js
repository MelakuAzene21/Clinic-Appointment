import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide doctor name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide doctor email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Please provide doctor phone number'],
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
  },
  speciality: {
    type: String,
    required: [true, 'Please provide doctor speciality'],
    enum: [
      'General physician',
      'Gynecologist', 
      'Dermatologist',
      'Pediatricians',
      'Neurologist',
      'Gastroenterologist'
    ]
  },
  degree: {
    type: String,
    required: [true, 'Please provide doctor degree']
  },
  experience: {
    type: String,
    required: [true, 'Please provide doctor experience']
  },
  about: {
    type: String,
    required: [true, 'Please provide doctor description'],
    maxlength: [1000, 'About cannot be more than 1000 characters']
  },
  fees: {
    type: Number,
    required: [true, 'Please provide consultation fees'],
    min: [0, 'Fees cannot be negative']
  },
  image: {
    type: String,
  },
  address: {
    line1: {
      type: String,
    },
    line2: String,
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    zipCode: {
      type: String,
    }
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  availability: {
    slotDurationMinutes: {
      type: Number,
      default: 30,
      min: [5, 'Slot duration must be at least 5 minutes'],
      max: [240, 'Slot duration cannot exceed 240 minutes']
    },
    workingHours: {
      mon: {
        isWorking: { type: Boolean, default: true },
        start: { type: String, default: '10:00' },
        end: { type: String, default: '21:00' }
      },
      tue: {
        isWorking: { type: Boolean, default: true },
        start: { type: String, default: '10:00' },
        end: { type: String, default: '21:00' }
      },
      wed: {
        isWorking: { type: Boolean, default: true },
        start: { type: String, default: '10:00' },
        end: { type: String, default: '21:00' }
      },
      thu: {
        isWorking: { type: Boolean, default: true },
        start: { type: String, default: '10:00' },
        end: { type: String, default: '21:00' }
      },
      fri: {
        isWorking: { type: Boolean, default: true },
        start: { type: String, default: '10:00' },
        end: { type: String, default: '21:00' }
      },
      sat: {
        isWorking: { type: Boolean, default: true },
        start: { type: String, default: '10:00' },
        end: { type: String, default: '21:00' }
      },
      sun: {
        isWorking: { type: Boolean, default: true },
        start: { type: String, default: '10:00' },
        end: { type: String, default: '21:00' }
      }
    },
    daysOff: [{ type: Date }]
  }
}, {
  timestamps: true
});

doctorSchema.index({ speciality: 1 });
doctorSchema.index({ name: 1 });
doctorSchema.index({ email: 1 });

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor;
