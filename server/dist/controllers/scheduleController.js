"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelByToken = exports.rescheduleByToken = exports.confirmSlotByToken = exports.getSlotsByToken = exports.getInterviewByToken = void 0;
const Interview_1 = require("../models/Interview");
const User_1 = require("../models/User");
const SchedulingService_1 = require("../services/scheduling/SchedulingService");
const stateMachine_1 = require("../services/stateMachine");
const googleCalendar_1 = require("../integrations/googleCalendar");
const getInterviewByToken = async (req, res, next) => {
    try {
        const { token } = req.params;
        const interview = await Interview_1.Interview.findOne({ schedulingToken: token })
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
    }
    catch (error) {
        next(error);
    }
};
exports.getInterviewByToken = getInterviewByToken;
const getSlotsByToken = async (req, res, next) => {
    try {
        const { token } = req.params;
        const requestedTz = req.query.timezone || 'Asia/Kolkata';
        const interview = await Interview_1.Interview.findOne({ schedulingToken: token });
        if (!interview) {
            return res.status(404).json({ success: false, message: 'Invalid scheduling link.' });
        }
        if (new Date() > new Date(interview.tokenExpiresAt)) {
            return res.status(410).json({ success: false, message: 'This scheduling link has expired.' });
        }
        const slots = await SchedulingService_1.SchedulingService.generateAvailableSlots({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getSlotsByToken = getSlotsByToken;
const confirmSlotByToken = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { start, end, timezone } = req.body;
        if (!start || !end) {
            return res.status(400).json({ success: false, message: 'Start and end time are required.' });
        }
        const slotStart = new Date(start);
        const slotEnd = new Date(end);
        const interview = await Interview_1.Interview.findOne({ schedulingToken: token });
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
        const validation = await SchedulingService_1.SchedulingService.validateSelectedSlot(interview, slotStart, slotEnd);
        if (!validation.valid) {
            return res.status(409).json({
                success: false,
                message: validation.reason || 'This time slot is no longer available. Please select another time.',
            });
        }
        stateMachine_1.InterviewStateMachine.validateTransition(interview.status, 'SCHEDULED');
        // Load full details for calendar creation
        const populated = await Interview_1.Interview.findById(interview._id)
            .populate('candidateId')
            .populate('recruiterId', 'name email googleCalendar')
            .populate('interviewerIds', 'name email googleCalendar');
        if (!populated) {
            return res.status(404).json({ success: false, message: 'Interview records error.' });
        }
        const candidateObj = populated.candidateId;
        const recruiterObj = populated.recruiterId;
        const interviewerObjs = populated.interviewerIds || [];
        const attendeeEmails = [candidateObj.email, recruiterObj.email];
        interviewerObjs.forEach((intvw) => {
            if (intvw.email && !attendeeEmails.includes(intvw.email)) {
                attendeeEmails.push(intvw.email);
            }
        });
        // Find target user for Google Calendar (recruiter or any connected interviewer)
        let targetUserId = recruiterObj._id.toString();
        let targetTokens = await User_1.User.findById(targetUserId).select('+googleCalendar.accessToken +googleCalendar.refreshToken');
        if (!targetTokens?.googleCalendar?.accessToken) {
            for (const intvw of interviewerObjs) {
                const intvwUser = await User_1.User.findById(intvw._id).select('+googleCalendar.accessToken +googleCalendar.refreshToken');
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
                    const updated = await googleCalendar_1.GoogleCalendarService.updateEvent(targetTokens.googleCalendar.accessToken, targetTokens.googleCalendar.refreshToken || '', eventId, eventDetails, targetUserId);
                    meetingLink = updated.meetingLink;
                    googleCalendarSynced = true;
                    console.log(`[GoogleCalendar] Event successfully updated: ${eventId}`);
                }
                else {
                    const created = await googleCalendar_1.GoogleCalendarService.createEvent(targetTokens.googleCalendar.accessToken, targetTokens.googleCalendar.refreshToken || '', eventDetails, targetUserId);
                    eventId = created.eventId;
                    meetingLink = created.meetingLink;
                    googleCalendarSynced = true;
                    console.log(`[GoogleCalendar] Event successfully created: ${eventId}`);
                }
            }
            catch (gErr) {
                console.error('[GoogleCalendar Error] Failed to create/update event:', gErr?.message || gErr);
            }
        }
        else {
            console.warn(`[GoogleCalendar Notice] Recruiter (${recruiterObj.email}) has not connected Google Calendar in Settings. Event was not sent to Google Calendar.`);
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
            interview: await Interview_1.Interview.findById(interview._id)
                .populate('candidateId')
                .populate('recruiterId', 'name email')
                .populate('interviewerIds', 'name email'),
            meetingLink,
            googleCalendarSynced,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.confirmSlotByToken = confirmSlotByToken;
const rescheduleByToken = async (req, res, next) => {
    try {
        const { token } = req.params;
        const interview = await Interview_1.Interview.findOne({ schedulingToken: token });
        if (!interview) {
            return res.status(404).json({ success: false, message: 'Invalid scheduling link.' });
        }
        stateMachine_1.InterviewStateMachine.validateTransition(interview.status, 'RESCHEDULE_REQUESTED');
        interview.status = 'RESCHEDULE_REQUESTED';
        interview.selectedSlot = undefined;
        await interview.save();
        return res.status(200).json({
            success: true,
            message: 'Reschedule request initialized. Please choose a new available time slot.',
            interview,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.rescheduleByToken = rescheduleByToken;
const cancelByToken = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { reason } = req.body;
        const interview = await Interview_1.Interview.findOne({ schedulingToken: token });
        if (!interview) {
            return res.status(404).json({ success: false, message: 'Invalid scheduling link.' });
        }
        stateMachine_1.InterviewStateMachine.validateTransition(interview.status, 'CANCELLED');
        if (interview.googleEventId && interview.status === 'SCHEDULED') {
            try {
                const recruiter = await User_1.User.findById(interview.recruiterId).select('+googleCalendar.accessToken +googleCalendar.refreshToken');
                if (recruiter?.googleCalendar?.accessToken) {
                    await googleCalendar_1.GoogleCalendarService.deleteEvent(recruiter.googleCalendar.accessToken, recruiter.googleCalendar.refreshToken || '', interview.googleEventId, interview.recruiterId.toString());
                }
            }
            catch (gErr) {
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
    }
    catch (error) {
        next(error);
    }
};
exports.cancelByToken = cancelByToken;
