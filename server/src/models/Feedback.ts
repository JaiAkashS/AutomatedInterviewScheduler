import mongoose, { Schema, Document } from 'mongoose';
import { FeedbackRecommendation, IFeedbackRating } from '../types';

export interface IFeedback extends Document {
  interviewId: mongoose.Types.ObjectId;
  interviewerId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  overallRecommendation: FeedbackRecommendation;
  ratings: IFeedbackRating[];
  strengths: string[];
  redFlags: string[];
  notes: string;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackRatingSchema = new Schema(
  {
    category: { type: String, required: true, trim: true },
    score: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
  },
  { _id: false }
);

const FeedbackSchema: Schema = new Schema(
  {
    interviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      index: true,
    },
    interviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
      index: true,
    },
    overallRecommendation: {
      type: String,
      enum: ['STRONG_YES', 'YES', 'NEUTRAL', 'NO', 'STRONG_NO'],
      required: true,
    },
    ratings: [FeedbackRatingSchema],
    strengths: [{ type: String, trim: true }],
    redFlags: [{ type: String, trim: true }],
    notes: { type: String, required: true, trim: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound unique index ensuring 1 feedback submission per interviewer per interview
FeedbackSchema.index({ interviewId: 1, interviewerId: 1 }, { unique: true });

export const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);
