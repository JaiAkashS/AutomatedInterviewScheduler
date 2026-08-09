import mongoose, { Schema, Document } from 'mongoose';

export interface IAvailability extends Document {
  interviewId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

const AvailabilitySchema: Schema = new Schema(
  {
    interviewId: { type: Schema.Types.ObjectId, ref: 'Interview', required: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    timezone: { type: String, required: true },
  },
  { timestamps: true }
);

export const Availability = mongoose.model<IAvailability>('Availability', AvailabilitySchema);
