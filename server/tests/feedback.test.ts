import { Feedback } from '../src/models/Feedback';
import mongoose from 'mongoose';

describe('Feedback Model & Evaluation Constraints', () => {
  it('should validate required fields for feedback submission', () => {
    const feedback = new Feedback({});
    const error = feedback.validateSync();

    expect(error?.errors.interviewId).toBeDefined();
    expect(error?.errors.interviewerId).toBeDefined();
    expect(error?.errors.candidateId).toBeDefined();
    expect(error?.errors.overallRecommendation).toBeDefined();
    expect(error?.errors.notes).toBeDefined();
  });

  it('should accept valid recommendation values', () => {
    const validRecommendations = ['STRONG_YES', 'YES', 'NEUTRAL', 'NO', 'STRONG_NO'];

    validRecommendations.forEach((rec) => {
      const feedback = new Feedback({
        interviewId: new mongoose.Types.ObjectId(),
        interviewerId: new mongoose.Types.ObjectId(),
        candidateId: new mongoose.Types.ObjectId(),
        overallRecommendation: rec,
        notes: 'Thorough evaluation notes.',
        ratings: [
          { category: 'Technical Depth', score: 5 },
          { category: 'Communication', score: 4 },
        ],
        strengths: ['Great coding style'],
        redFlags: [],
      });

      const error = feedback.validateSync();
      expect(error).toBeUndefined();
    });
  });

  it('should reject invalid recommendation values', () => {
    const feedback = new Feedback({
      interviewId: new mongoose.Types.ObjectId(),
      interviewerId: new mongoose.Types.ObjectId(),
      candidateId: new mongoose.Types.ObjectId(),
      overallRecommendation: 'MAYBE', // Invalid enum
      notes: 'Test notes',
    });

    const error = feedback.validateSync();
    expect(error?.errors.overallRecommendation).toBeDefined();
  });

  it('should enforce rating score bounds between 1 and 5', () => {
    const feedback = new Feedback({
      interviewId: new mongoose.Types.ObjectId(),
      interviewerId: new mongoose.Types.ObjectId(),
      candidateId: new mongoose.Types.ObjectId(),
      overallRecommendation: 'YES',
      notes: 'Valid notes',
      ratings: [{ category: 'Algorithms', score: 6 }], // Invalid: > 5
    });

    const error = feedback.validateSync();
    expect(error?.errors['ratings.0.score']).toBeDefined();
  });
});
