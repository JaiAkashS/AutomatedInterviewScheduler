import { Request } from 'express';

export type UserRole = 'RECRUITER' | 'INTERVIEWER' | 'ADMIN' | 'CANDIDATE';

export interface IGoogleCalendarToken {
  connected: boolean;
  calendarId?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
  };
}

export type InterviewStatus =
  | 'DRAFT'
  | 'SCHEDULING'
  | 'SCHEDULED'
  | 'RESCHEDULE_REQUESTED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'EXPIRED';

export interface ITimeInterval {
  start: Date;
  end: Date;
}

export interface ITimeSlot {
  start: string; // ISO String
  end: string;   // ISO String
  formattedStart: string;
  formattedEnd: string;
  timezone: string;
  available: boolean;
}

export interface IWorkingHours {
  start: string; // e.g. "09:00"
  end: string;   // e.g. "17:00"
}

export interface ISchedulingWindow {
  startDate: Date;
  endDate: Date;
}
