import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { Feedback } from '../models/Feedback';
import { Interview } from '../models/Interview';
import { InterviewStateMachine } from '../services/stateMachine';

export const submitFeedback = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      interviewId,
      overallRecommendation,
      ratings,
      strengths,
      redFlags,
      notes,
      markAsCompleted,
    } = req.body;

    if (!interviewId) {
      return res.status(400).json({ success: false, message: 'interviewId is required.' });
    }

    if (!overallRecommendation) {
      return res.status(400).json({ success: false, message: 'overallRecommendation is required.' });
    }

    if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Evaluation notes are required.' });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated.' });
    }

    // Clean arrays
    const sanitizedStrengths = Array.isArray(strengths)
      ? strengths.map((s: string) => s.trim()).filter((s: string) => s.length > 0)
      : [];

    const sanitizedRedFlags = Array.isArray(redFlags)
      ? redFlags.map((rf: string) => rf.trim()).filter((rf: string) => rf.length > 0)
      : [];

    const sanitizedRatings = Array.isArray(ratings)
      ? ratings.map((r: any) => ({
          category: String(r.category || '').trim(),
          score: Math.min(5, Math.max(1, Number(r.score) || 3)),
          comment: r.comment ? String(r.comment).trim() : undefined,
        }))
      : [];

    // Upsert feedback
    const feedback = await Feedback.findOneAndUpdate(
      { interviewId, interviewerId: userId },
      {
        interviewId,
        interviewerId: userId,
        candidateId: interview.candidateId,
        overallRecommendation,
        ratings: sanitizedRatings,
        strengths: sanitizedStrengths,
        redFlags: sanitizedRedFlags,
        notes: notes.trim(),
        submittedAt: new Date(),
      },
      { upsert: true, new: true, runValidators: true }
    ).populate('interviewerId', 'name email role');

    // Optionally mark interview as COMPLETED if currently SCHEDULED
    let updatedInterviewStatus = interview.status;
    if (markAsCompleted && interview.status === 'SCHEDULED') {
      if (InterviewStateMachine.canTransition(interview.status, 'COMPLETED')) {
        interview.status = 'COMPLETED';
        await interview.save();
        updatedInterviewStatus = 'COMPLETED';
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully.',
      feedback,
      interviewStatus: updatedInterviewStatus,
    });
  } catch (error) {
    next(error);
  }
};

export const getFeedbackForInterview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { interviewId } = req.params;

    const feedbacks = await Feedback.find({ interviewId })
      .populate('interviewerId', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      feedbacks,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyFeedbackForInterview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { interviewId } = req.params;
    const userId = req.user?.id;

    const feedback = await Feedback.findOne({ interviewId, interviewerId: userId })
      .populate('interviewerId', 'name email role');

    return res.status(200).json({
      success: true,
      feedback: feedback || null,
    });
  } catch (error) {
    next(error);
  }
};

export const getFeedbackForCandidate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { candidateId } = req.params;

    const feedbacks = await Feedback.find({ candidateId })
      .populate('interviewerId', 'name email role')
      .populate('interviewId', 'title type status duration selectedSlot')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      feedbacks,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFeedback = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found.' });
    }

    // Only creator or ADMIN / RECRUITER can delete
    if (feedback.interviewerId.toString() !== userId && req.user?.role !== 'ADMIN' && req.user?.role !== 'RECRUITER') {
      return res.status(403).json({ success: false, message: 'Forbidden: Cannot delete feedback of another reviewer.' });
    }

    await Feedback.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
