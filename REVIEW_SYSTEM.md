# Review and Rating System

## Overview
The Prescripto application now includes a comprehensive review and rating system that allows patients to provide feedback for doctors after receiving prescriptions.

## Features

### For Patients
- **Submit Reviews**: After completing an appointment and receiving a prescription, patients can submit reviews
- **Rating System**: 5-star rating system (1-5 stars)
- **Review Text**: Detailed feedback with minimum 10 characters and maximum 1000 characters
- **Anonymous Option**: Option to submit reviews anonymously
- **One Review Per Appointment**: Patients can only review each appointment once

### For Doctors
- **Rating Display**: Overall rating and total review count displayed on profile
- **Review Visibility**: All reviews are visible on the doctor's profile page
- **Automatic Updates**: Doctor ratings automatically update when new reviews are submitted

### For All Users
- **Public Reviews**: Anyone can view doctor reviews and ratings
- **Review History**: Patients can see their own review history
- **Pagination**: Reviews are paginated for better performance

## Technical Implementation

### Backend
- **Review Model**: MongoDB schema for storing reviews
- **API Endpoints**: RESTful API for CRUD operations on reviews
- **Validation**: Input validation for ratings and review text
- **Authorization**: Role-based access control (patients can only review their own appointments)

### Frontend
- **ReviewForm Component**: Modal form for submitting reviews
- **ReviewsDisplay Component**: Component for displaying reviews
- **Integration**: Seamlessly integrated into existing appointment and doctor profile pages

## API Endpoints

### POST /api/reviews
- **Purpose**: Submit a new review
- **Access**: Patients only
- **Body**: 
  - `doctorId`: Doctor's ID
  - `appointmentId`: Appointment ID
  - `rating`: Rating (1-5)
  - `review`: Review text (10-1000 characters)
  - `isAnonymous`: Boolean for anonymous submission

### GET /api/reviews/doctor/:doctorId
- **Purpose**: Get reviews for a specific doctor
- **Access**: Public
- **Query Parameters**: `page`, `limit`

### GET /api/reviews/patient
- **Purpose**: Get reviews submitted by the current patient
- **Access**: Patients only
- **Query Parameters**: `page`, `limit`

### PUT /api/reviews/:id
- **Purpose**: Update an existing review
- **Access**: Review owner only

### DELETE /api/reviews/:id
- **Purpose**: Delete a review
- **Access**: Review owner only

## Database Schema

### Review Collection
```javascript
{
  patient: ObjectId,      // Reference to User
  doctor: ObjectId,       // Reference to Doctor
  appointment: ObjectId,   // Reference to Appointment
  rating: Number,         // 1-5 rating
  review: String,         // Review text
  isAnonymous: Boolean,   // Anonymous flag
  createdAt: Date,        // Timestamp
  updatedAt: Date         // Timestamp
}
```

### Doctor Collection Updates
- `rating`: Average rating (automatically calculated)
- `totalReviews`: Total number of reviews (automatically updated)

## User Experience Flow

1. **Patient completes appointment** and receives prescription
2. **Review button appears** in MyAppointments page for completed appointments
3. **Patient clicks review button** to open review form
4. **Patient submits review** with rating and text
5. **Review is saved** and doctor's rating is updated
6. **Reviews are displayed** on doctor's profile page for other patients to see

## Security Features

- **Authentication Required**: All review operations require valid JWT token
- **Authorization**: Patients can only review their own appointments
- **Input Validation**: Rating and review text are validated
- **One Review Per Appointment**: Prevents duplicate reviews
- **Completed Appointments Only**: Reviews only allowed for appointments with prescriptions

## Future Enhancements

- **Review Moderation**: Admin approval system for reviews
- **Review Responses**: Doctors can respond to reviews
- **Review Analytics**: Detailed analytics for doctors
- **Review Notifications**: Email notifications for new reviews
- **Review Categories**: Categorized feedback (bedside manner, expertise, etc.)

## Testing

To test the review system:

1. **Create an appointment** as a patient
2. **Complete the appointment** by adding a prescription as a doctor
3. **Submit a review** as the patient
4. **Verify the review** appears on the doctor's profile
5. **Check rating updates** on the doctor's profile

## Troubleshooting

### Common Issues
- **Review button not showing**: Ensure appointment is completed with prescription
- **Cannot submit review**: Check if review already exists for the appointment
- **Rating not updating**: Verify the review was saved successfully
- **Permission denied**: Ensure user is authenticated and has patient role

### Debug Information
- Check browser console for API errors
- Verify JWT token is valid
- Check appointment status and prescription existence
- Verify user role and permissions
