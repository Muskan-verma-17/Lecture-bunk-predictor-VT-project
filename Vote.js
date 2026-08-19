import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema(
  {
    lecture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lecture',
      required: true
    },
    choice: {
      type: String,
      enum: ['attend', 'bunk'],
      required: true
    },
    anonymousKey: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

voteSchema.index({ lecture: 1, anonymousKey: 1 }, { unique: true });

export default mongoose.model('Vote', voteSchema);
