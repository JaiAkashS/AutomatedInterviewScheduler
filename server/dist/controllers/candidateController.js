"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyInterviews = exports.getCandidateById = exports.getCandidates = exports.createCandidate = void 0;
const Candidate_1 = require("../models/Candidate");
const Interview_1 = require("../models/Interview");
const createCandidate = async (req, res, next) => {
    try {
        const { name, email, timezone, notes } = req.body;
        const candidate = await Candidate_1.Candidate.create({
            name,
            email: email.toLowerCase(),
            timezone: timezone || 'America/New_York',
            notes,
        });
        return res.status(201).json({ success: true, candidate });
    }
    catch (error) {
        next(error);
    }
};
exports.createCandidate = createCandidate;
const getCandidates = async (req, res, next) => {
    try {
        const candidates = await Candidate_1.Candidate.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, candidates });
    }
    catch (error) {
        next(error);
    }
};
exports.getCandidates = getCandidates;
const getCandidateById = async (req, res, next) => {
    try {
        const candidate = await Candidate_1.Candidate.findById(req.params.id);
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found.' });
        }
        return res.status(200).json({ success: true, candidate });
    }
    catch (error) {
        next(error);
    }
};
exports.getCandidateById = getCandidateById;
const getMyInterviews = async (req, res, next) => {
    try {
        const candidateId = req.user?.id;
        if (!candidateId) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }
        const interviews = await Interview_1.Interview.find({ candidateId })
            .populate('candidateId')
            .populate('recruiterId', 'name email timezone')
            .populate('interviewerIds', 'name email timezone')
            .sort({ createdAt: -1 });
        return res.status(200).json({ success: true, interviews });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyInterviews = getMyInterviews;
