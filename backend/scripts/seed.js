import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import { generateToken } from '../utils/generateToken.js';

// Load environment variables
dotenv.config({ path: './config.env' });

// Sample doctors data
const doctorsData = [
  {
    name: 'Dr. Richard James',
    email: 'richard.james@prescripto.com',
    phone: '1234567890',
    speciality: 'General physician',
    degree: 'MBBS',
    experience: '4 Years',
    about: 'Dr. James has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
    fees: 50,
    image: '/src/assets/doc1.png',
    address: {
      line1: '17th Cross, Richmond',
      line2: 'Circle, Ring Road, London',
      city: 'London',
      state: 'England',
      zipCode: 'SW1A 1AA'
    },
    rating: 4.5,
    totalReviews: 120,
    isVerified: true
  },
  {
    name: 'Dr. Emily Larson',
    email: 'emily.larson@prescripto.com',
    phone: '1234567891',
    speciality: 'Gynecologist',
    degree: 'MBBS',
    experience: '3 Years',
    about: 'Dr. Larson specializes in women\'s reproductive health with extensive experience in gynecological procedures and patient care.',
    fees: 60,
    image: '/src/assets/doc2.png',
    address: {
      line1: '27th Cross, Richmond',
      line2: 'Circle, Ring Road, London',
      city: 'London',
      state: 'England',
      zipCode: 'SW1A 1AB'
    },
    rating: 4.8,
    totalReviews: 95,
    isVerified: true
  },
  {
    name: 'Dr. Sarah Patel',
    email: 'sarah.patel@prescripto.com',
    phone: '1234567892',
    speciality: 'Gastroenterologist',
    degree: 'MBBS',
    experience: '1 Year',
    about: 'Dr. Patel is a dedicated gastroenterologist with expertise in digestive system disorders and endoscopic procedures.',
    fees: 30,
    image: '/src/assets/doc3.png',
    address: {
      line1: '37th Cross, Richmond',
      line2: 'Circle, Ring Road, London',
      city: 'London',
      state: 'England',
      zipCode: 'SW1A 1AC'
    },
    rating: 4.2,
    totalReviews: 45,
    isVerified: true
  },
  {
    name: 'Dr. Christopher Lee',
    email: 'christopher.lee@prescripto.com',
    phone: '1234567893',
    speciality: 'Pediatricians',
    degree: 'MBBS',
    experience: '2 Years',
    about: 'Dr. Lee specializes in pediatric care with a gentle approach to treating children and providing family-centered care.',
    fees: 40,
    image: '/src/assets/doc4.png',
    address: {
      line1: '47th Cross, Richmond',
      line2: 'Circle, Ring Road, London',
      city: 'London',
      state: 'England',
      zipCode: 'SW1A 1AD'
    },
    rating: 4.7,
    totalReviews: 78,
    isVerified: true
  },
  {
    name: 'Dr. Jennifer Garcia',
    email: 'jennifer.garcia@prescripto.com',
    phone: '1234567894',
    speciality: 'Neurologist',
    degree: 'MBBS',
    experience: '4 Years',
    about: 'Dr. Garcia is a skilled neurologist with expertise in treating complex neurological disorders and conditions.',
    fees: 50,
    image: '/src/assets/doc5.png',
    address: {
      line1: '57th Cross, Richmond',
      line2: 'Circle, Ring Road, London',
      city: 'London',
      state: 'England',
      zipCode: 'SW1A 1AE'
    },
    rating: 4.6,
    totalReviews: 110,
    isVerified: true
  },
  {
    name: 'Dr. Andrew Williams',
    email: 'andrew.williams@prescripto.com',
    phone: '1234567895',
    speciality: 'Neurologist',
    degree: 'MBBS',
    experience: '4 Years',
    about: 'Dr. Williams has extensive experience in neurological disorders and provides comprehensive care for patients.',
    fees: 50,
    image: '/src/assets/doc6.png',
    address: {
      line1: '57th Cross, Richmond',
      line2: 'Circle, Ring Road, London',
      city: 'London',
      state: 'England',
      zipCode: 'SW1A 1AF'
    },
    rating: 4.4,
    totalReviews: 85,
    isVerified: true
  },
  {
    name: 'Dr. Christopher Davis',
    email: 'christopher.davis@prescripto.com',
    phone: '1234567896',
    speciality: 'General physician',
    degree: 'MBBS',
    experience: '4 Years',
    about: 'Dr. Davis provides comprehensive primary care services with a focus on preventive medicine and patient education.',
    fees: 50,
    image: '/src/assets/doc7.png',
    address: {
      line1: '17th Cross, Richmond',
      line2: 'Circle, Ring Road, London',
      city: 'London',
      state: 'England',
      zipCode: 'SW1A 1AG'
    },
    rating: 4.3,
    totalReviews: 92,
    isVerified: true
  },
  {
    name: 'Dr. Timothy White',
    email: 'timothy.white@prescripto.com',
    phone: '1234567897',
    speciality: 'Gynecologist',
    degree: 'MBBS',
    experience: '3 Years',
    about: 'Dr. White specializes in women\'s health with a compassionate approach to gynecological care.',
    fees: 60,
    image: '/src/assets/doc8.png',
    address: {
      line1: '27th Cross, Richmond',
      line2: 'Circle, Ring Road, London',
      city: 'London',
      state: 'England',
      zipCode: 'SW1A 1AH'
    },
    rating: 4.5,
    totalReviews: 67,
    isVerified: true
  },
  {
    name: 'Dr. Ava Mitchell',
    email: 'ava.mitchell@prescripto.com',
    phone: '1234567898',
    speciality: 'Dermatologist',
    degree: 'MBBS',
    experience: '1 Year',
    about: 'Dr. Mitchell specializes in dermatological conditions and provides comprehensive skin care treatments.',
    fees: 30,
    image: '/src/assets/doc9.png',
    address: {
      line1: '37th Cross, Richmond',
      line2: 'Circle, Ring Road, London',
      city: 'London',
      state: 'England',
      zipCode: 'SW1A 1AI'
    },
    rating: 4.1,
    totalReviews: 34,
    isVerified: true
  },
  {
    name: 'Dr. Jeffrey King',
    email: 'jeffrey.king@prescripto.com',
    phone: '1234567899',
    speciality: 'Pediatricians',
    degree: 'MBBS',
    experience: '2 Years',
    about: 'Dr. King provides excellent pediatric care with a focus on child development and family health.',
    fees: 40,
    image: '/src/assets/doc10.png',
    address: {
      line1: '47th Cross, Richmond',
      line2: 'Circle, Ring Road, London',
      city: 'London',
      state: 'England',
      zipCode: 'SW1A 1AJ'
    },
    rating: 4.6,
    totalReviews: 56,
    isVerified: true
  }
];

// Sample admin user
const adminUser = {
  name: 'Admin User',
  email: 'admin@prescripto.com',
  password: 'admin123',
  phone: '9876543210',
  role: 'admin',
  isEmailVerified: true
};

// Sample regular user
const regularUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  password: 'password123',
  phone: '1234567890',
  role: 'patient',
  isEmailVerified: true
};

// Sample doctor user
const doctorUser = {
  name: 'Dr. Sarah Patel',
  email: 'doctor@prescripto.com',
  password: 'doctor123',
  phone: '1234567890',
  role: 'doctor',
  isEmailVerified: true
};

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Doctor.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const admin = await User.create(adminUser);
    console.log('Created admin user:', admin.email);

    // Create regular user
    const user = await User.create(regularUser);
    console.log('Created regular user:', user.email);

    // Create doctor user
    const doctor = await User.create(doctorUser);
    console.log('Created doctor user:', doctor.email);

    // Create doctors
    const doctors = await Doctor.insertMany(doctorsData);
    console.log(`Created ${doctors.length} doctors`);

    // Ensure there is a Doctor profile for the seeded doctorUser email so the doctor can receive appointments
    const existingDoctorProfile = await Doctor.findOne({ email: doctorUser.email });
    if (!existingDoctorProfile) {
      await Doctor.create({
        name: doctorUser.name,
        email: doctorUser.email,
        phone: doctorUser.phone,
        speciality: 'General physician',
        degree: 'MBBS',
        experience: '3 Years',
        about: 'Seeded doctor account for testing. This profile links to the doctor user so appointments can be assigned.',
        fees: 45,
        image: '/src/assets/doc1.png',
        address: {
          line1: 'Seed Street',
          line2: 'Suite 100',
          city: 'Testville',
          state: 'TS',
          zipCode: '00000'
        },
        rating: 4.0,
        totalReviews: 0,
        isVerified: true,
        isActive: true
      });
      console.log('Created matching Doctor profile for seeded doctor user');
    }

    // Create User accounts for each doctor in doctorsData so they can log in
    const createdDoctorUsers = [];
    for (const doc of doctorsData) {
      const existing = await User.findOne({ email: doc.email });
      if (!existing) {
        const created = await User.create({
          name: doc.name,
          email: doc.email,
          password: 'doctor123',
          phone: doc.phone,
          role: 'doctor',
          isEmailVerified: true
        });
        createdDoctorUsers.push(created.email);
      }
    }
    if (createdDoctorUsers.length > 0) {
      console.log(`Created ${createdDoctorUsers.length} doctor user accounts (default password: doctor123)`);
      createdDoctorUsers.forEach(e => console.log(`Doctor - Email: ${e}, Password: doctor123`));
    } else {
      console.log('All seeded doctors already have user accounts.');
    }

    console.log('Database seeded successfully!');
    console.log('\nSample credentials:');
    console.log('Admin - Email: admin@prescripto.com, Password: admin123');
    console.log('User - Email: john.doe@example.com, Password: password123');
    console.log('Doctor - Email: doctor@prescripto.com, Password: doctor123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedDatabase();
