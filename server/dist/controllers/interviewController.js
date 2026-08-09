"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteInterview = exports.rescheduleInterviewRequest = exports.cancelInterview = exports.getInterviewById = exports.getInterviews = exports.createInterview = void 0;
const crypto_1 = __importDefault(require("crypto"));
const Interview_1 = require("../models/Interview");
const Candidate_1 = require("../models/Candidate");
const User_1 = require("../models/User");
const stateMachine_1 = require("../services/stateMachine");
const googleCalendar_1 = require("../integrations/googleCalendar");
const config_1 = require("../config");
const createInterview = async (req, res, next) => {
    try {
        const { candidateId, candidateName, candidateEmail, candidateTimezone, title, type, duration, interviewerIds, schedulingWindowDays, startDate, endDate, workingHours, minimumNotice, timezone, expirationDays, } = req.body;
        let targetCandidateId = candidateId;
        // Create candidate inline if email & name provided instead of existing candidateId
        if (!targetCandidateId && candidateEmail && candidateName) {
            let candidate = await Candidate_1.Candidate.findOne({ email: candidateEmail.toLowerCase() });
            if (!candidate) {
                candidate = await Candidate_1.Candidate.create({
                    name: candidateName,
                    email: candidateEmail.toLowerCase(),
                    timezone: candidateTimezone || 'America/New_York',
                });
            }
            targetCandidateId = candidate._id;
        }
        if (!targetCandidateId) {
            return res.status(400).json({ success: false, message: 'Candidate information is required.' });
        }
        const recruiterId = req.user?.id;
        let finalInterviewers = interviewerIds && Array.isArray(interviewerIds) && interviewerIds.length > 0
            ? interviewerIds
            : [recruiterId];
        // Cryptographically secure token
        const schedulingToken = crypto_1.default.randomBytes(24).toString('hex');
        const tokenExpDays = expirationDays || 7;
        const tokenExpiresAt = new Date(Date.now() + tokenExpDays * 24 * 3600 * 1000);
        const now = new Date();
        const windowStart = startDate ? new Date(startDate) : now;
        const windowDays = schedulingWindowDays || 7;
        const windowEnd = endDate
            ? new Date(endDate)
            : new Date(now.getTime() + windowDays * 24 * 3600 * 1000);
        const interview = await Interview_1.Interview.create({
            candidateId: targetCandidateId,
            recruiterId,
            interviewerIds: finalInterviewers,
            title,
            type: type || 'Technical Interview',
            duration: duration || 60,
            status: 'SCHEDULING',
            schedulingToken,
            tokenExpiresAt,
            timezone: timezone || 'Asia/Kolkata',
            schedulingWindow: {
                startDate: windowStart,
                endDate: windowEnd,
            },
            workingHours: workingHours || { start: '09:00', end: '17:00' },
            minimumNotice: minimumNotice || 12,
        });
        const populated = await Interview_1.Interview.findById(interview._id)
            .populate('candidateId')
            .populate('recruiterId', 'name email role timezone')
            .populate('interviewerIds', 'name email role timezone googleCalendar.connected');
        const schedulingUrl = `${config_1.config.clientUrl}/schedule/${schedulingToken}`;
        return res.status(201).json({
            success: true,
            interview: populated,
            schedulingUrl,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createInterview = createInterview;
const getInterviews = async (req, res, next) => {
    try {
        const { status } = req.query;
        const query = {};
        if (status) {
            query.status = status;
        }
        const interviews = await Interview_1.Interview.find(query)
            .populate('candidateId')
            .populate('recruiterId', 'name email role timezone')
            .populate('interviewerIds', 'name email role timezone googleCalendar.connected')
            .sort({ createdAt: -1 });
        return res.status(200).json({ success: true, interviews });
    }
    catch (error) {
        next(error);
    }
};
exports.getInterviews = getInterviews;
const getInterviewById = async (req, res, next) => {
    try {
        const interview = await Interview_1.Interview.findById(req.params.id)
            .populate('candidateId')
            .populate('recruiterId', 'name email role timezone')
            .populate('interviewerIds', 'name email role timezone googleCalendar.connected');
        if (!interview) {
            return res.status(404).json({ success: false, message: 'Interview not found.' });
        }
        return res.status(200).json({ success: true, interview });
    }
    catch (error) {
        next(error);
    }
};
exports.getInterviewById = getInterviewById;
const cancelInterview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const interview = await Interview_1.Interview.findById(id);
        if (!interview) {
            return res.status(404).json({ success: false, message: 'Interview not found.' });
        }
        stateMachine_1.InterviewStateMachine.validateTransition(interview.status, 'CANCELLED');
        // Delete Google Calendar event if present
        if (interview.googleEventId && interview.status === 'SCHEDULED') {
            try {
                const recruiter = await User_1.User.findById(interview.recruiterId).select('+googleCalendar.accessToken +googleCalendar.refreshToken');
                if (recruiter?.googleCalendar?.accessToken) {
                    await googleCalendar_1.GoogleCalendarService.deleteEvent(recruiter.googleCalendar.accessToken, recruiter.googleCalendar.refreshToken || '', interview.googleEventId);
                }
            }
            catch (gErr) {
                console.error('Error deleting Google Calendar event on cancel:', gErr);
            }
        }
        interview.status = 'CANCELLED';
        interview.cancellationReason = reason || 'Cancelled by recruiter.';
        await interview.save();
        return res.status(200).json({
            success: true,
            message: 'Interview cancelled successfully.',
            interview,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.cancelInterview = cancelInterview;
const rescheduleInterviewRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const interview = await Interview_1.Interview.findById(id);
        if (!interview) {
            return res.status(404).json({ success: false, message: 'Interview not found.' });
        }
        stateMachine_1.InterviewStateMachine.validateTransition(interview.status, 'RESCHEDULE_REQUESTED');
        interview.status = 'RESCHEDULE_REQUESTED';
        interview.selectedSlot = undefined;
        await interview.save();
        const schedulingUrl = `${config_1.config.clientUrl}/schedule/${interview.schedulingToken}`;
        return res.status(200).json({
            success: true,
            message: 'Interview status set to RESCHEDULE_REQUESTED.',
            schedulingUrl,
            interview,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.rescheduleInterviewRequest = rescheduleInterviewRequest;
const deleteInterview = async (req, res, next) => {
    try {
        const interview = await Interview_1.Interview.findByIdAndDelete(req.params.id);
        if (!interview) {
            return res.status(404).json({ success: false, message: 'Interview not found.' });
        }
        return res.status(200).json({ success: true, message: 'Interview deleted.' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteInterview = deleteInterview;
