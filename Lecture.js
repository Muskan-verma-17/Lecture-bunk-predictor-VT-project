import mongoose from 'mongoose';

const lectureSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true
    },
    teacher: {
      type: String,
      required: true,
      trim: true
    },
    startsAt: {
      type: Date,
      required: true
    },
    room: {
      type: String,
      required: true,
      trim: true
    },
    historicalAttendanceRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 55
    },
    moodIndex: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    }
  },
  { timestamps: true }
);

export default mongoose.model('Lecture', lectureSchema);
