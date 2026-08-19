import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (email) => email.endsWith('@ssipmt.com'),
        message: 'Only @ssipmt.com email addresses are allowed'
      }
    },
    rollNo: {
      type: String,
      trim: true,
      uppercase: true,
      required() {
        return this.role === 'student';
      }
    },
    role: {
      type: String,
      enum: ['student', 'teacher'],
      default: 'student',
      required: true
    },
    department: {
      type: String,
      trim: true,
      default: 'Computer Science'
    },
    passwordHash: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

userSchema.index({ rollNo: 1 }, { unique: true, sparse: true });

export default mongoose.model('User', userSchema);
