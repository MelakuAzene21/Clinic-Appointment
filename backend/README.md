# Prescripto Backend API

A comprehensive healthcare appointment booking system backend built with Node.js, Express, and MongoDB.

## 🚀 Features

- **User Authentication & Authorization** - JWT-based authentication with role-based access control
- **Doctor Management** - CRUD operations for doctors with speciality filtering
- **Appointment Booking** - Complete appointment lifecycle management
- **User Profile Management** - Profile updates and password management
- **Speciality Management** - Doctor speciality categorization and filtering
- **Prescription Management** - Digital prescription system for doctors
- **Payment Integration Ready** - Stripe and Razorpay integration support
- **Email Notifications** - Automated email notifications for appointments
- **File Upload Support** - Profile and document upload capabilities

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **File Upload**: Multer
- **Email**: Nodemailer
- **Payments**: Stripe & Razorpay
- **CORS**: Cross-origin resource sharing enabled

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn package manager

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy the environment file
   cp config.env.example config.env
   
   # Edit the environment variables
   nano config.env
   ```

4. **Configure Environment Variables**
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/prescripto
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=30d
   
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890"
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

### Doctor Endpoints

#### Get All Doctors
```http
GET /doctors?speciality=General physician&page=1&limit=10
```

#### Get Doctor by ID
```http
GET /doctors/:id
```

#### Create Doctor (Admin Only)
```http
POST /doctors
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Dr. Sarah Johnson",
  "email": "sarah@example.com",
  "phone": "1234567890",
  "speciality": "General physician",
  "degree": "MBBS",
  "experience": "5 Years",
  "about": "Experienced general physician...",
  "fees": 50,
  "image": "doctor-image-url"
}
```

#### Get Available Time Slots
```http
GET /doctors/:id/slots?date=2024-01-15
```

### Appointment Endpoints

#### Get User Appointments
```http
GET /appointments?status=pending&page=1&limit=10
Authorization: Bearer <token>
```

#### Create Appointment
```http
POST /appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "doctorId": "doctor-id",
  "appointmentDate": "2024-01-15",
  "appointmentTime": "14:30",
  "symptoms": "Fever and headache",
  "notes": "Additional notes"
}
```

#### Update Appointment Status
```http
PUT /appointments/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed"
}
```

#### Add Prescription (Admin Only)
```http
PUT /appointments/:id/prescription
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "diagnosis": "Common cold",
  "medicines": [
    {
      "name": "Paracetamol",
      "dosage": "500mg",
      "duration": "3 days",
      "instructions": "Take 3 times daily"
    }
  ],
  "recommendations": "Rest well and stay hydrated"
}
```

### User Endpoints

#### Get User Profile
```http
GET /users/profile
Authorization: Bearer <token>
```

#### Update User Profile
```http
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "1234567890",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

#### Change Password
```http
PUT /users/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### Speciality Endpoints

#### Get All Specialities
```http
GET /specialities
```

#### Get Doctors by Speciality
```http
GET /specialities/General physician/doctors?page=1&limit=10
```

#### Get Speciality Statistics
```http
GET /specialities/General physician/stats
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📊 Database Schema

### User Model
- Basic info (name, email, password)
- Profile details (phone, date of birth, gender, address)
- Role-based access (patient, admin)
- Account status and verification

### Doctor Model
- Professional info (name, email, phone, speciality)
- Medical credentials (degree, experience, about)
- Practice details (fees, address, rating)
- Availability and verification status

### Appointment Model
- Patient and doctor references
- Appointment details (date, time, status)
- Medical information (symptoms, notes, prescription)
- Payment and cancellation tracking

## 🚀 Deployment

### Production Setup

1. **Environment Variables**
   ```env
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/prescripto
   JWT_SECRET=your-production-secret-key
   ```

2. **Build and Start**
   ```bash
   npm start
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔧 Development

### Running Tests
```bash
npm test
```

### Code Linting
```bash
npm run lint
```

### Database Seeding
```bash
npm run seed
```

## 📝 Error Handling

The API returns consistent error responses:

```json
{
  "status": "error",
  "message": "Error description"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added prescription management
- **v1.2.0** - Enhanced appointment scheduling
- **v1.3.0** - Payment integration support
