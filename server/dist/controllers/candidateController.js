"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyInterviews = exports.getCandidateById = exports.getCandidates = exports.createCandidate = void 0;
const Candidate_1 = require("../models/Candidate");
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
        const { Interview } = await Promise.resolve().then(() => __importStar(require('../models/Interview')));
        const interviews = await Interview.find({ candidateId })
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
