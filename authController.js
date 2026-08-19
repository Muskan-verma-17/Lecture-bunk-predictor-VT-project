import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const createToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'development-secret', {
    expiresIn: '7d'
  });
};

const toUserResponse = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  rollNo: user.rollNo,
  role: user.role,
  department: user.department
});

const resolveRole = ({ role, teacherInviteCode }) => {
  if (role !== 'teacher') {
    return 'student';
  }

  if (!process.env.TEACHER_INVITE_CODE || teacherInviteCode !== process.env.TEACHER_INVITE_CODE) {
    const error = new Error('Valid teacher invite code is required for teacher registration');
    error.statusCode = 403;
    throw error;
  }

  return 'teacher';
};

export const register = async (request, response, next) => {
  try {
    const { firstName, lastName, email, password, role, department, teacherInviteCode, rollNo } = request.body;

    if (!firstName || !lastName || !email || !password) {
      return response.status(400).json({ message: 'All fields are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail.endsWith('@ssipmt.com')) {
      return response.status(400).json({ message: 'Only @ssipmt.com email addresses can register' });
    }

    const resolvedRole = resolveRole({ role, teacherInviteCode });
    if (resolvedRole === 'student' && !rollNo) {
      return response.status(400).json({ message: 'Roll No is required for student registration' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return response.status(409).json({ message: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      rollNo: resolvedRole === 'student' ? rollNo : undefined,
      role: resolvedRole,
      department,
      passwordHash
    });

    response.status(201).json({ token: createToken(user._id), user: toUserResponse(user) });
  } catch (error) {
    next(error);
  }
};

export const login = async (request, response, next) => {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return response.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;

    if (!user || !passwordMatches) {
      return response.status(401).json({ message: 'Invalid email or password' });
    }

    response.json({ token: createToken(user._id), user: toUserResponse(user) });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (request, response) => {
  response.json({ user: toUserResponse(request.user) });
};


