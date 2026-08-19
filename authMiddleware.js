import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (request, response, next) => {
  try {
    const authHeader = request.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return response.status(401).json({ message: 'Authentication token is required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development-secret');
    const user = await User.findById(decoded.userId).select('-passwordHash');

    if (!user) {
      return response.status(401).json({ message: 'User account no longer exists' });
    }

    request.user = user;
    next();
  } catch (error) {
    response.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const allowRoles = (...roles) => {
  return (request, response, next) => {
    if (!roles.includes(request.user.role)) {
      return response.status(403).json({ message: 'You do not have permission to access this panel' });
    }

    next();
  };
};
