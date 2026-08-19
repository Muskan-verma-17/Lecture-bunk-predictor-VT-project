import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    subjectName: {
      type: String,
      required: true,
      trim: true
    },
    totalClasses: {
      type: Number,
      required: true,
      min: 0
    },
    attendedClasses: {
      type: Number,
      required: true,
      min: 0
    },
    requiredPercentage: {
      type: Number,
      min: 1,
      max: 100,
      default: 75
    },
    upcomingLecture: {
      type: String,
      trim: true,
      default: 'Today'
    }
  },
  { timestamps: true }
);

attendanceSchema.index({ user: 1, subjectName: 1 }, { unique: true });

attendanceSchema.virtual('attendancePercentage').get(function attendancePercentage() {
  if (!this.totalClasses) {
    return 0;
  }

  return Math.round((this.attendedClasses / this.totalClasses) * 100);
});

attendanceSchema.set('toJSON', { virtuals: true });
attendanceSchema.set('toObject', { virtuals: true });

export default mongoose.model('Attendance', attendanceSchema);
