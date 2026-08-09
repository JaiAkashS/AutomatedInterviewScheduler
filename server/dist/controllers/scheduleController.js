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
        const recruiterTokens = await User_1.User.findById(recruiterObj._id).select('+googleCalendar.accessToken +googleCalendar.refreshToken');
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
        if (recruiterTokens?.googleCalendar?.accessToken) {
            try {
                if (eventId && interview.status === 'RESCHEDULE_REQUESTED') {
                    const updated = await googleCalendar_1.GoogleCalendarService.updateEvent(recruiterTokens.googleCalendar.accessToken, recruiterTokens.googleCalendar.refreshToken || '', eventId, eventDetails);
                    meetingLink = updated.meetingLink;
                }
                else {
                    const created = await googleCalendar_1.GoogleCalendarService.createEvent(recruiterTokens.googleCalendar.accessToken, recruiterTokens.googleCalendar.refreshToken || '', eventDetails);
                    eventId = created.eventId;
                    meetingLink = created.meetingLink;
                }
            }
            catch (gErr) {
                console.error('Failed to create/update Google Calendar event:', gErr);
            }
        }
        else {
            // Mock event creation if no OAuth token present
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
            message: 'Interview successfully scheduled!',
            interview: await Interview_1.Interview.findById(interview._id)
                .populate('candidateId')
                .populate('recruiterId', 'name email')
                .populate('interviewerIds', 'name email'),
            meetingLink,
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
                    await googleCalendar_1.GoogleCalendarService.deleteEvent(recruiter.googleCalendar.accessToken, recruiter.googleCalendar.refreshToken || '', interview.googleEventId);
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
