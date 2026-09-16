import { addMinutes, isAfter, isBefore, parseISO, format as formatDateFns } from 'date-fns';
import { toZonedTime, format as formatZonedTime } from 'date-fns-tz';
import { GoogleCalendarService } from '../../integrations/googleCalendar';
import { IInterview, Interview } from '../../models/Interview';
import { User, IUser } from '../../models/User';
import { Availability } from '../../models/Availability';
import { ITimeInterval, ITimeSlot } from '../../types';

export interface GenerateSlotsOptions {
  interview: IInterview;
  candidateTimezone?: string;
  slotIntervalMinutes?: number; // default 30
}

export class SchedulingService {
  /**
   * Sorts and merges overlapping or adjacent time intervals.
   */
  public static mergeBusyIntervals(intervals: ITimeInterval[]): ITimeInterval[] {
    if (intervals.length === 0) return [];

    // Sort by start time
    const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime());
    const merged: ITimeInterval[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const lastMerged = merged[merged.length - 1];

      // If current interval starts before or at the end of last merged interval
      if (current.start.getTime() <= lastMerged.end.getTime()) {
        if (current.end.getTime() > lastMerged.end.getTime()) {
          lastMerged.end = current.end;
        }
      } else {
        merged.push(current);
      }
    }

    return merged;
  }

  /**
   * Fetches busy intervals from Google Calendar and existing MongoDB scheduled interviews for all interviewers.
   */
  public static async getInterviewerBusySlots(
    interviewers: IUser[],
    timeMin: Date,
    timeMax: Date
  ): Promise<ITimeInterval[]> {
    const allBusy: ITimeInterval[] = [];

    for (const interviewer of interviewers) {
      // 1. Google Calendar busy slots if connected
      if (interviewer.googleCalendar?.connected) {
        try {
          const userWithTokens = await User.findById(interviewer._id).select('+googleCalendar.accessToken +googleCalendar.refreshToken');
          const accessToken = userWithTokens?.googleCalendar?.accessToken || 'mock_token';
          const refreshToken = userWithTokens?.googleCalendar?.refreshToken || 'mock_token';

          const googleBusy = await GoogleCalendarService.getFreeBusy(
            accessToken,
            refreshToken,
            interviewer.googleCalendar.calendarId || 'primary',
            timeMin,
            timeMax
          );
          allBusy.push(...googleBusy);
        } catch (err) {
          console.error(`Error fetching Google Calendar FreeBusy for ${interviewer.email}:`, err);
        }
      }

      // 2. Existing scheduled interviews in Mongo for this interviewer
      const existingInterviews = await Interview.find({
        interviewerIds: interviewer._id,
        status: 'SCHEDULED',
        'selectedSlot.start': { $lt: timeMax },
        'selectedSlot.end': { $gt: timeMin },
      });

      for (const existing of existingInterviews) {
        if (existing.selectedSlot?.start && existing.selectedSlot?.end) {
          allBusy.push({
            start: new Date(existing.selectedSlot.start),
            end: new Date(existing.selectedSlot.end),
          });
        }
      }
    }

    return this.mergeBusyIntervals(allBusy);
  }

  /**
   * Generates mutually available time slots for a given interview.
   */
  public static async generateAvailableSlots(options: GenerateSlotsOptions): Promise<ITimeSlot[]> {
    const { interview, slotIntervalMinutes = 30 } = options;
    const targetTimezone = options.candidateTimezone || interview.timezone || 'UTC';

    const now = new Date();
    // Minimum notice threshold
    const minNoticeHours = interview.minimumNotice || 12;
    const minNoticeDate = new Date(now.getTime() + minNoticeHours * 3600 * 1000);

    const windowStart = new Date(interview.schedulingWindow.startDate);
    const windowEnd = new Date(interview.schedulingWindow.endDate);

    // Effective start search date must satisfy minNotice
    const searchStart = isAfter(minNoticeDate, windowStart) ? minNoticeDate : windowStart;
    const searchEnd = windowEnd;

    if (isAfter(searchStart, searchEnd)) {
      return [];
    }

    // Load interviewers
    const interviewers = await User.find({ _id: { $in: interview.interviewerIds } });
    const mergedBusy = await this.getInterviewerBusySlots(interviewers, searchStart, searchEnd);

    // Fetch candidate-submitted custom availability if present
    const candidateCustomAvail = await Availability.find({ interviewId: interview._id });

    // Working hours (e.g. "09:00" to "17:00") in recruiter/interview working hours timezone
    const [workStartHour, workStartMin] = (interview.workingHours?.start || '09:00').split(':').map(Number);
    const [workEndHour, workEndMin] = (interview.workingHours?.end || '17:00').split(':').map(Number);

    const durationMs = interview.duration * 60 * 1000;
    const slotStepMs = slotIntervalMinutes * 60 * 1000;

    const availableSlots: ITimeSlot[] = [];

    // Iterate through days within the scheduling window
    let currentCursor = new Date(searchStart.getTime());
    // Align cursor to next 30-min boundary
    const mins = currentCursor.getMinutes();
    const remainder = mins % slotIntervalMinutes;
    if (remainder !== 0) {
      currentCursor = addMinutes(currentCursor, slotIntervalMinutes - remainder);
    }
    currentCursor.setSeconds(0, 0);

    while (currentCursor.getTime() + durationMs <= searchEnd.getTime()) {
      const slotStart = new Date(currentCursor);
      const slotEnd = new Date(slotStart.getTime() + durationMs);

      // Check working hours constraint in working hours timezone (interview.timezone)
      const slotStartInInterviewTz = toZonedTime(slotStart, interview.timezone);
      const slotEndInInterviewTz = toZonedTime(slotEnd, interview.timezone);

      const startHour = slotStartInInterviewTz.getHours();
      const startMin = slotStartInInterviewTz.getMinutes();
      const endHour = slotEndInInterviewTz.getHours();
      const endMin = slotEndInInterviewTz.getMinutes();

      const startMinutesOfDay = startHour * 60 + startMin;
      const endMinutesOfDay = endHour * 60 + endMin;

      const workStartMinutes = workStartHour * 60 + workStartMin;
      const workEndMinutes = workEndHour * 60 + workEndMin;

      // Check if slot falls strictly within working hours on the same day
      const isWithinWorkingHours =
        slotStartInInterviewTz.getDate() === slotEndInInterviewTz.getDate() &&
        startMinutesOfDay >= workStartMinutes &&
        endMinutesOfDay <= workEndMinutes;

      if (isWithinWorkingHours) {
        // Check collision against merged busy intervals
        const overlapsWithBusy = mergedBusy.some((busy) => {
          return slotStart.getTime() < busy.end.getTime() && slotEnd.getTime() > busy.start.getTime();
        });

        if (!overlapsWithBusy) {
          // If candidate custom availability submitted, verify slot falls within custom intervals
          let passesCandidateCustom = true;
          if (candidateCustomAvail.length > 0) {
            passesCandidateCustom = candidateCustomAvail.some((candAvail) => {
              const [candSH, candSM] = candAvail.startTime.split(':').map(Number);
              const [candEH, candEM] = candAvail.endTime.split(':').map(Number);

              const slotStartInCandTz = toZonedTime(slotStart, candAvail.timezone);
              const slotEndInCandTz = toZonedTime(slotEnd, candAvail.timezone);
              const dateStr = formatZonedTime(slotStartInCandTz, 'yyyy-MM-dd', { timeZone: candAvail.timezone });

              if (dateStr !== candAvail.date) return false;

              const candStartMins = slotStartInCandTz.getHours() * 60 + slotStartInCandTz.getMinutes();
              const candEndMins = slotEndInCandTz.getHours() * 60 + slotEndInCandTz.getMinutes();

              const cStartMins = candSH * 60 + candSM;
              const cEndMins = candEH * 60 + candEM;
              return candStartMins >= cStartMins && candEndMins <= cEndMins;
            });
          }

          if (passesCandidateCustom) {
            const formattedStart = formatZonedTime(slotStart, 'yyyy-MM-dd HH:mm (z)', { timeZone: targetTimezone });
            const formattedEnd = formatZonedTime(slotEnd, 'HH:mm (z)', { timeZone: targetTimezone });

            availableSlots.push({
              start: slotStart.toISOString(),
              end: slotEnd.toISOString(),
              formattedStart,
              formattedEnd,
              timezone: targetTimezone,
              available: true,
            });
          }
        }
      }

      currentCursor = new Date(currentCursor.getTime() + slotStepMs);
    }

    return availableSlots;
  }

  /**
   * Revalidates a slot right before confirmation to prevent race conditions & double-booking.
   */
  public static async validateSelectedSlot(
    interview: IInterview,
    slotStart: Date,
    slotEnd: Date
  ): Promise<{ valid: boolean; reason?: string }> {
    // 1. Check window & min notice
    const now = new Date();
    const minNoticeDate = new Date(now.getTime() + (interview.minimumNotice || 12) * 3600 * 1000);

    if (isBefore(slotStart, minNoticeDate)) {
      return { valid: false, reason: 'Selected slot violates minimum notice requirement.' };
    }

    if (isBefore(slotStart, interview.schedulingWindow.startDate) || isAfter(slotEnd, interview.schedulingWindow.endDate)) {
      return { valid: false, reason: 'Selected slot is outside the allowed scheduling window.' };
    }

    // 2. Re-check interviewer busy state
    const interviewers = await User.find({ _id: { $in: interview.interviewerIds } });
    const busySlots = await this.getInterviewerBusySlots(interviewers, slotStart, slotEnd);

    const isBlocked = busySlots.some(
      (busy) => slotStart.getTime() < busy.end.getTime() && slotEnd.getTime() > busy.start.getTime()
    );

    if (isBlocked) {
      return { valid: false, reason: 'Selected time slot was just booked by another participant.' };
    }

    return { valid: true };
  }
}
