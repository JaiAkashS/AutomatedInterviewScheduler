/// <reference types="cookie-parser" />
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
export type InterviewStatus = 'DRAFT' | 'SCHEDULING' | 'SCHEDULED' | 'RESCHEDULE_REQUESTED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED';
export interface ITimeInterval {
    start: Date;
    end: Date;
}
export interface ITimeSlot {
    start: string;
    end: string;
    formattedStart: string;
    formattedEnd: string;
    timezone: string;
    available: boolean;
}
export interface IWorkingHours {
    start: string;
    end: string;
}
export interface ISchedulingWindow {
    startDate: Date;
    endDate: Date;
}
