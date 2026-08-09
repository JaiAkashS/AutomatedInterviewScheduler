import mongoose, { Schema, Document } from 'mongoose';
import { InterviewStatus } from '../types';

export interface ISelectedSlot {
  start: Date;
  end: Date;
  timezone: string;
}

export interface IInterview extends Document {
  candidateId: mongoose.Types.ObjectId;
  recruiterId: mongoose.Types.ObjectId;
  interviewerIds: mongoose.Types.ObjectId[];
  title: string;
  type: string;
  duration: number; // in minutes (e.g. 60)
  status: InterviewStatus;
  schedulingToken: string;
  tokenExpiresAt: Date;
  timezone: string;
  schedulingWindow: {
    startDate: Date;
    endDate: Date;
  };
  workingHours: {
    start: string; // e.g. "09:00"
    end: string;   // e.g. "17:00"
  };
  minimumNotice: number; // hours
  selectedSlot?: ISelectedSlot;
  googleEventId?: string;
  meetingLink?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSchema: Schema = new Schema(
  {
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    recruiterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    interviewerIds: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    title: { type: String, required: true, trim: true },
    type: { type: String, default: 'Technical Interview' },
    duration: { type: Number, required: true, default: 60 },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'SCHEDULING',
        'SCHEDULED',
        'RESCHEDULE_REQUESTED',
        'CANCELLED',
        'COMPLETED',
        'EXPIRED',
      ],
      default: 'SCHEDULING',
    },
    schedulingToken: { type: String, required: true, unique: true, index: true },
    tokenExpiresAt: { type: Date, required: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    schedulingWindow: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
    },
    minimumNotice: { type: Number, default: 12 }, // hours
    selectedSlot: {
      start: { type: Date },
      end: { type: Date },
      timezone: { type: String },
    },
    googleEventId: { type: String },
    meetingLink: { type: String },
    cancellationReason: { type: String },
  },
  { timestamps: true }
);

export const Interview = mongoose.model<IInterview>('Interview', InterviewSchema);
