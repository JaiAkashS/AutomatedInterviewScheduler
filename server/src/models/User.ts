import mongoose, { Schema, Document } from 'mongoose';
import { UserRole, IGoogleCalendarToken } from '../types';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  googleCalendar: IGoogleCalendarToken;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['RECRUITER', 'INTERVIEWER', 'ADMIN'],
      default: 'RECRUITER',
    },
    googleCalendar: {
      connected: { type: Boolean, default: false },
      calendarId: { type: String, default: 'primary' },
      accessToken: { type: String, select: false },
      refreshToken: { type: String, select: false },
      tokenExpiry: { type: Number, select: false },
    },
    timezone: { type: String, default: 'Asia/Kolkata' },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
