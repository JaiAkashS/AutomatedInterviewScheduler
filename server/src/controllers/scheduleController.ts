import { Request, Response, NextFunction } from 'express';
import { Interview } from '../models/Interview';
import { User } from '../models/User';
import { ICandidate } from '../models/Candidate';
import { SchedulingService } from '../services/scheduling/SchedulingService';
import { InterviewStateMachine } from '../services/stateMachine';
import { GoogleCalendarService } from '../integrations/googleCalendar';

export const getInterviewByToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;

    const interview = await Interview.findOne({ schedulingToken: token })
      .populate('candidateId')
      .populate('recruiterId', 'name email timezone')
      .populate('interviewerIds', 'name email timezone');

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Invalid or expired scheduling link.' });
    }

    if (new Date() > new Date(interview.tokenExpiresAt)) {
      if (interview.status === 'SCHEDULING' || interview.status === 'RESCHEDULE_REQUESTED') {
        interview.status = 'EXPIRED';
        await interview.save();
      }
      return res.status(410).json({ success: false, message: 'This interview scheduling link has expired.', interview });
    }

    return res.status(200).json({
      success: true,
      interview,
    });
  } catch (error) {
    next(error);
  }
};

export const getSlotsByToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const requestedTz = (req.query.timezone as string) || 'Asia/Kolkata';

    const interview = await Interview.findOne({ schedulingToken: token });

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Invalid scheduling link.' });
    }

    if (new Date() > new Date(interview.tokenExpiresAt)) {
      return res.status(410).json({ success: false, message: 'This scheduling link has expired.' });
    }

    const slots = await SchedulingService.generateAvailableSlots({
      interview,
      candidateTimezone: requestedTz,
      slotIntervalMinutes: 30,
    });

    return res.status(200).json({
      success: true,
      timezone: requestedTz,
      duration: interview.duration,
      slots,
    });
  } catch (error) {
    next(error);
  }
};

export const confirmSlotByToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const { start, end, timezone } = req.body;

    if (!start || !end) {
      return res.status(400).json({ success: false, message: 'Start and end time are required.' });
    }

    const slotStart = new Date(start);
    const slotEnd = new Date(end);

    const interview = await Interview.findOne({ schedulingToken: token });

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Invalid scheduling link.' });
    }

    if (new Date() > new Date(interview.tokenExpiresAt)) {
      return res.status(410).json({ success: false, message: 'This scheduling link has expired.' });
    }

    if (interview.status === 'CANCELLED' || interview.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: `Cannot schedule an interview with status '${interview.status}'.`,
      });
    }

    // Double-booking and availability revalidation
    const validation = await SchedulingService.validateSelectedSlot(interview, slotStart, slotEnd);
    if (!validation.valid) {
      return res.status(409).json({
        success: false,
        message: validation.reason || 'This time slot is no longer available. Please select another time.',
      });
    }

    InterviewStateMachine.validateTransition(interview.status, 'SCHEDULED');

    // Load full details for calendar creation
    const populated = await Interview.findById(interview._id)
      .populate<{ candidateId: ICandidate }>('candidateId')
      .populate('recruiterId', 'name email googleCalendar')
      .populate('interviewerIds', 'name email googleCalendar');

    if (!populated) {
      return res.status(404).json({ success: false, message: 'Interview records error.' });
    }

    const candidateObj = populated.candidateId;
    const recruiterObj = populated.recruiterId as any;
    const interviewerObjs = (populated.interviewerIds as any[]) || [];

    const attendeeEmails: string[] = [candidateObj.email, recruiterObj.email];
    interviewerObjs.forEach((intvw) => {
      if (intvw.email && !attendeeEmails.includes(intvw.email)) {
        attendeeEmails.push(intvw.email);
      }
    });

    // Find target user for Google Calendar (recruiter or any connected interviewer)
    let targetUserId = recruiterObj._id.toString();
    let targetTokens = await User.findById(targetUserId).select(
      '+googleCalendar.accessToken +googleCalendar.refreshToken'
    );

    if (!targetTokens?.googleCalendar?.accessToken) {
      for (const intvw of interviewerObjs) {
        const intvwUser = await User.findById(intvw._id).select(
          '+googleCalendar.accessToken +googleCalendar.refreshToken'
        );
        if (intvwUser?.googleCalendar?.accessToken) {
          targetUserId = intvw._id.toString();
          targetTokens = intvwUser;
          break;
        }
      }
    }

    let eventId = interview.googleEventId;
    let meetingLink = interview.meetingLink || 'https://meet.google.com/interview';

    const eventDetails = {
      title: `${interview.title} - ${candidateObj.name}`,
      description: `Automated Interview Scheduled via AutoSched.\n\nCandidate: ${candidateObj.name} (${candidateObj.email})\nRecruiter: ${recruiterObj.name} (${recruiterObj.email})\nInterview Type: ${interview.type}\nDuration: ${interview.duration} minutes`,
      startTime: slotStart,
      endTime: slotEnd,
      timezone: timezone || interview.timezone || 'Asia/Kolkata',
      attendees: attendeeEmails,
    };

    let googleCalendarSynced = false;
    if (targetTokens?.googleCalendar?.accessToken) {
      console.log(`[GoogleCalendar] Attempting event creation for user ${targetUserId}...`);
      try {
        if (eventId && interview.status === 'RESCHEDULE_REQUESTED') {
          const updated = await GoogleCalendarService.updateEvent(
            targetTokens.googleCalendar.accessToken,
            targetTokens.googleCalendar.refreshToken || '',
            eventId,
            eventDetails,
            targetUserId
          );
          meetingLink = updated.meetingLink;
          googleCalendarSynced = true;
          console.log(`[GoogleCalendar] Event successfully updated: ${eventId}`);
        } else {
          const created = await GoogleCalendarService.createEvent(
            targetTokens.googleCalendar.accessToken,
            targetTokens.googleCalendar.refreshToken || '',
            eventDetails,
            targetUserId
          );
          eventId = created.eventId;
          meetingLink = created.meetingLink;
          googleCalendarSynced = true;
          console.log(`[GoogleCalendar] Event successfully created: ${eventId}`);
        }
      } catch (gErr: any) {
        console.error('[GoogleCalendar Error] Failed to create/update event:', gErr?.message || gErr);
      }
    } else {
      console.warn(
        `[GoogleCalendar Notice] Recruiter (${recruiterObj.email}) has not connected Google Calendar in Settings. Event was not sent to Google Calendar.`
      );
    }

    if (!googleCalendarSynced && (!eventId || eventId.startsWith('evt_mock_') || eventId.startsWith('mock_'))) {
      eventId = eventId || `evt_mock_${Date.now()}`;
      meetingLink = meetingLink || `https://meet.google.com/mock-interview-${Date.now()}`;
    }

    // Atomic update to database to finalize booking
    interview.status = 'SCHEDULED';
    interview.selectedSlot = {
      start: slotStart,
      end: slotEnd,
      timezone: timezone || interview.timezone,
    };
    interview.googleEventId = eventId;
    interview.meetingLink = meetingLink;
    await interview.save();

    return res.status(200).json({
      success: true,
      message: googleCalendarSynced
        ? 'Interview successfully scheduled and synced to Google Calendar!'
        : 'Interview successfully scheduled! (Connect Google Calendar in Settings to sync with Google Calendar)',
      interview: await Interview.findById(interview._id)
        .populate('candidateId')
        .populate('recruiterId', 'name email')
        .populate('interviewerIds', 'name email'),
      meetingLink,
      googleCalendarSynced,
    });
  } catch (error) {
    next(error);
  }
};

export const rescheduleByToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;

    const interview = await Interview.findOne({ schedulingToken: token });

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Invalid scheduling link.' });
    }

    InterviewStateMachine.validateTransition(interview.status, 'RESCHEDULE_REQUESTED');

    interview.status = 'RESCHEDULE_REQUESTED';
    interview.selectedSlot = undefined;
    await interview.save();

    return res.status(200).json({
      success: true,
      message: 'Reschedule request initialized. Please choose a new available time slot.',
      interview,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelByToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const { reason } = req.body;

    const interview = await Interview.findOne({ schedulingToken: token });

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Invalid scheduling link.' });
    }

    InterviewStateMachine.validateTransition(interview.status, 'CANCELLED');

    if (interview.googleEventId && interview.status === 'SCHEDULED') {
      try {
        const recruiter = await User.findById(interview.recruiterId).select(
          '+googleCalendar.accessToken +googleCalendar.refreshToken'
        );
        if (recruiter?.googleCalendar?.accessToken) {
          await GoogleCalendarService.deleteEvent(
            recruiter.googleCalendar.accessToken,
            recruiter.googleCalendar.refreshToken || '',
            interview.googleEventId,
            interview.recruiterId.toString()
          );
        }
      } catch (gErr) {
        console.error('Error deleting event on candidate cancel:', gErr);
      }
    }

    interview.status = 'CANCELLED';
    interview.cancellationReason = reason || 'Cancelled by candidate.';
    await interview.save();

    return res.status(200).json({
      success: true,
      message: 'Interview successfully cancelled.',
      interview,
    });
  } catch (error) {
    next(error);
  }
};
