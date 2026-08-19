import mongoose from 'mongoose';

const attendanceMarkSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['attend', 'bunk'],
      required: true
    },
    markedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const lectureSessionSchema = new mongoose.Schema(
  {
    subjectName: {
      type: String,
      required: true,
      trim: true
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    lectureDate: {
      type: Date,
      required: true,
      index: true
    },
    startTime: {
      type: String,
      required: true,
      trim: true
    },
    room: {
      type: String,
      required: true,
      trim: true
    },
    minimumRequired: {
      type: Number,
      min: 1,
      max: 100,
      default: 75
    },
    marks: [attendanceMarkSchema]
  },
  { timestamps: true }
);

lectureSessionSchema.index({ teacher: 1, subjectName: 1, lectureDate: 1, startTime: 1 }, { unique: true });

export default mongoose.model('LectureSession', lectureSessionSchema);
