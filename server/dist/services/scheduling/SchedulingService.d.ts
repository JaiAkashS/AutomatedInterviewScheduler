import { IInterview } from '../../models/Interview';
import { IUser } from '../../models/User';
import { ITimeInterval, ITimeSlot } from '../../types';
export interface GenerateSlotsOptions {
    interview: IInterview;
    candidateTimezone?: string;
    slotIntervalMinutes?: number;
}
export declare class SchedulingService {
    /**
     * Sorts and merges overlapping or adjacent time intervals.
     */
    static mergeBusyIntervals(intervals: ITimeInterval[]): ITimeInterval[];
    /**
     * Fetches busy intervals from Google Calendar and existing MongoDB scheduled interviews for all interviewers.
     */
    static getInterviewerBusySlots(interviewers: IUser[], timeMin: Date, timeMax: Date): Promise<ITimeInterval[]>;
    /**
     * Generates mutually available time slots for a given interview.
     */
    static generateAvailableSlots(options: GenerateSlotsOptions): Promise<ITimeSlot[]>;
    /**
     * Revalidates a slot right before confirmation to prevent race conditions & double-booking.
     */
    static validateSelectedSlot(interview: IInterview, slotStart: Date, slotEnd: Date): Promise<{
        valid: boolean;
        reason?: string;
    }>;
}
