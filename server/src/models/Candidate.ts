import mongoose, { Schema, Document } from 'mongoose';

export interface ICandidate extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  timezone: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },
    timezone: { type: String, default: 'America/New_York' },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Candidate = mongoose.model<ICandidate>('Candidate', CandidateSchema);
