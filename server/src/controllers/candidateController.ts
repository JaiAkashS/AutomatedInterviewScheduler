import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { Candidate } from '../models/Candidate';
import { Interview } from '../models/Interview';

export const createCandidate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, email, timezone, notes } = req.body;

    const candidate = await Candidate.create({
      name,
      email: email.toLowerCase(),
      timezone: timezone || 'America/New_York',
      notes,
    });

    return res.status(201).json({ success: true, candidate });
  } catch (error) {
    next(error);
  }
};

export const getCandidates = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const candidates = await Candidate.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, candidates });
  } catch (error) {
    next(error);
  }
};

export const getCandidateById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }
    return res.status(200).json({ success: true, candidate });
  } catch (error) {
    next(error);
  }
};

export const getMyInterviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const candidateId = req.user?.id;
    if (!candidateId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const interviews = await Interview.find({ candidateId })
      .populate('candidateId')
      .populate('recruiterId', 'name email timezone')
      .populate('interviewerIds', 'name email timezone')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, interviews });
  } catch (error) {
    next(error);
  }
};
