import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // First try to find in User collection
      let user = await User.findById(decoded.id).select('-password');
      
      if (user) {
        req.user = user;
        req.user.role = user.role; // Ensure role is set
      } else {
        // If not found in User, try Doctor collection
        const doctor = await Doctor.findById(decoded.id);
        if (doctor) {
          req.user = doctor;
          req.user.role = 'doctor'; // Set role for doctor
        } else {
          return res.status(401).json({
            status: 'error',
            message: 'User not found'
          });
        }
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          status: 'error',
          message: 'User account is deactivated'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to access this route'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized to access this route'
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};
