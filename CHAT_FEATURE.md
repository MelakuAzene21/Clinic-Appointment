# Real-Time Chat Feature

## Overview
The Prescripto application now includes a real-time chat system that allows doctors and patients to communicate directly through the platform. This feature is built using Socket.IO for real-time messaging and includes notifications for new messages.

## Features

### 🔐 **Access Control**
- Only **doctors** and **patients** can access the chat feature
- Patients can only chat with doctors they have booked appointments with
- Doctors can only chat with their patients
- Admins cannot access the chat feature

### 💬 **Real-Time Messaging**
- Instant message delivery using Socket.IO
- Message history persistence in MongoDB
- Read/unread message tracking
- Typing indicators (ready for implementation)

### 🔔 **Notifications**
- Real-time notifications for new messages
- Unread message count badges
- Toast notifications when not in the chat interface
- Connection status indicators

### 📱 **User Interface**
- Clean, modern chat interface
- Conversation list with unread counts
- Message timestamps and date separators
- Responsive design for mobile and desktop

## Technical Implementation

### Backend
- **Socket.IO Server**: Handles real-time connections and message routing
- **Chat Model**: MongoDB schema for storing messages and chat metadata
- **Authentication**: JWT-based authentication for Socket.IO connections
- **API Routes**: RESTful endpoints for chat management

### Frontend
- **ChatContext**: React Context for managing Socket.IO state and chat data
- **Chat Component**: Main chat interface with conversation list and message area
- **ChatNotification**: Navbar component showing unread message count
- **Integration**: Seamless integration with existing appointment system

## How It Works

### 1. **Chat Creation**
- When a patient books an appointment, a chat is automatically created
- The chat links the patient, doctor, and appointment together
- Both users can access the chat through their respective dashboards

### 2. **Real-Time Communication**
- Users connect to Socket.IO server with JWT authentication
- Messages are sent and received in real-time
- Messages are stored in MongoDB for persistence
- Unread counts are updated automatically

### 3. **Access Control**
- Patients can only see chats for their appointments
- Doctors can only see chats with their patients
- All chat access is validated on both frontend and backend

## Usage

### For Patients
1. Book an appointment with a doctor
2. Navigate to "My Appointments" and click "Chat" button
3. Or go to "Messages" in the navigation menu
4. Start chatting with your doctor about your health concerns

### For Doctors
1. View your appointments in the doctor dashboard
2. Click "Messages" in the navigation menu
3. See all patient conversations
4. Respond to patient messages in real-time

## Security Features
- JWT authentication for all Socket.IO connections
- Role-based access control
- Message validation and sanitization
- Secure WebSocket connections

## Future Enhancements
- File/image sharing
- Voice messages
- Video calling integration
- Message encryption
- Chat search functionality
- Message reactions and emojis

## Installation & Setup

### Backend Dependencies
```bash
npm install socket.io
```

### Frontend Dependencies
```bash
npm install socket.io-client
```

### Environment Variables
Make sure your backend has the following environment variables:
- `JWT_SECRET`: For token verification
- `FRONTEND_URL`: For CORS configuration (optional)

## Testing the Feature

1. **Start the backend server**:
   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend**:
   ```bash
   npm run dev
   ```

3. **Test with different users**:
   - Login as a patient and book an appointment
   - Login as the corresponding doctor
   - Both users should see the chat option
   - Send messages and verify real-time delivery

## Troubleshooting

### Common Issues
1. **Socket connection fails**: Check if backend is running and CORS is configured
2. **Messages not sending**: Verify JWT token is valid
3. **Chat not appearing**: Ensure appointment exists and user has proper role
4. **Notifications not working**: Check browser permissions for notifications

### Debug Mode
Enable debug logging by checking browser console and backend logs for Socket.IO events.
