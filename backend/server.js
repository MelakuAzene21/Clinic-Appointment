import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

// Import routes
import authRoutes from './routes/auth.js';
import doctorRoutes from './routes/doctors.js';
import appointmentRoutes from './routes/appointments.js';
import userRoutes from './routes/users.js';
import specialityRoutes from './routes/specialities.js';
import chatRoutes from './routes/chat.js';
import reviewRoutes from './routes/reviews.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';

// Import models
import Chat from './models/Chat.js';
import User from './models/User.js';
import Doctor from './models/Doctor.js';

// Load environment variables
dotenv.config({ path: './config.env' });

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'Prescripto Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/specialities', specialityRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);

// Middleware to authenticate socket connections using JWT
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user data from database (similar to auth middleware)
    let user = await User.findById(decoded.id).select('-password');
    
    if (user) {
      socket.user = user;
      socket.user.role = user.role;
    } else {
      // If not found in User, try Doctor collection
      const doctor = await Doctor.findById(decoded.id);
      if (doctor) {
        socket.user = doctor;
        socket.user.role = 'doctor';
      } else {
        return next(new Error('Authentication error: User not found'));
      }
    }

    if (!socket.user.isActive) {
      return next(new Error('Authentication error: User account is deactivated'));
    }

    console.log('Socket authentication - User data:', {
      id: socket.user._id,
      name: socket.user.name,
      role: socket.user.role
    });
    
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    return next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.name} (${socket.user.role}) - ID: ${socket.user._id}`);

  // Join a chat room
  socket.on('join_chat', async (chatId) => {
    try {
      // Verify user has access to this chat before joining
      const chat = await Chat.findById(chatId);
      if (!chat) {
        console.log(`Chat ${chatId} not found`);
        return;
      }

      const isDoctor = socket.user.role === 'doctor';
      const isPatient = socket.user.role === 'patient';
      const chatDoctorId = chat.doctor.toString();
      const chatPatientId = chat.patient.toString();
      const userSocketId = socket.user._id.toString();
      
      const hasAccess = (isDoctor && chatDoctorId === userSocketId) || (isPatient && chatPatientId === userSocketId);
      
      console.log(`Join chat authorization check for ${socket.user.name}:`, {
        chatId,
        userRole: socket.user.role,
        userSocketId,
        chatDoctorId,
        chatPatientId,
        hasAccess
      });

      if (hasAccess) {
        socket.join(chatId);
        console.log(`${socket.user.name} joined chat ${chatId}`);
      } else {
        console.log(`${socket.user.name} denied access to chat ${chatId}`);
      }
    } catch (error) {
      console.error('Error in join_chat:', error);
    }
  });

  // Leave a chat room
  socket.on('leave_chat', (chatId) => {
    socket.leave(chatId);
    console.log(`${socket.user.name} left chat ${chatId}`);
  });

  // Handle sending a message
  socket.on('send_message', async ({ chatId, content }) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        return socket.emit('error', { message: 'Chat not found' });
      }

      // Verify user is part of the chat
      const isDoctor = socket.user.role === 'doctor';
      const isPatient = socket.user.role === 'patient';
      
      // Convert ObjectIds to strings for comparison
      const chatDoctorId = chat.doctor.toString();
      const chatPatientId = chat.patient.toString();
      const userSocketId = socket.user._id.toString();
      
      console.log('Chat authorization check:', {
        userRole: socket.user.role,
        userSocketId,
        chatDoctorId,
        chatPatientId,
        isDoctor,
        isPatient,
        isAuthorized: (isDoctor && chatDoctorId === userSocketId) || (isPatient && chatPatientId === userSocketId)
      });
      
      if (!( (isDoctor && chatDoctorId === userSocketId) || (isPatient && chatPatientId === userSocketId) )) {
        return socket.emit('error', { message: 'Not authorized for this chat' });
      }

      // Create message
      const senderModel = isDoctor ? 'Doctor' : 'User';
      const message = {
        sender: socket.user._id,
        senderModel,
        content: content.trim(),
        timestamp: new Date(),
        isRead: false // Initially unread for the recipient
      };

      // Save to DB
      chat.messages.push(message);
      chat.lastMessage = new Date();
      await chat.save();

      // Populate sender for the new message (to include name in emission)
      const populatedChat = await Chat.findById(chatId)
        .populate('messages.sender', 'name')
        .select('messages'); // Only need messages
      const newMessage = populatedChat.messages[populatedChat.messages.length - 1];

      // Broadcast to the chat room (both patient and doctor)
      io.to(chatId).emit('new_message', {
        chatId,
        message: newMessage,
        senderName: socket.user.name
      });

      // Send notification to the recipient (if not in the current chat, but client handles visibility)
      const recipientId = isDoctor ? chat.patient.toString() : chat.doctor.toString();
      // You can emit 'message_notification' to specific user if you track online users, but for now, rely on room emission
      io.to(chatId).emit('message_notification', {
        chatId,
        senderName: socket.user.name,
        content: message.content,
        unreadCount: chat.messages.filter(msg => !msg.isRead && msg.sender.toString() !== recipientId).length // Simplified; adjust as needed
      });

      console.log(`Message sent in chat ${chatId} by ${socket.user.name}`);
    } catch (err) {
      console.error('Error sending message:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Optional: Handle typing (if you add client-side emission for typing)
  socket.on('typing', ({ chatId, isTyping }) => {
    socket.to(chatId).emit('user_typing', {
      chatId,
      userName: socket.user.name,
      isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.name}`);
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Socket.IO server is ready`);
  });
};

startServer();

export default app;
