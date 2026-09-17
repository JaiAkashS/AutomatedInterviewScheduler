import api from './axios';
import { Feedback, FeedbackInput } from '../types';

export const feedbackApi = {
  submitFeedback: async (
    data: FeedbackInput
  ): Promise<{ success: boolean; message: string; feedback: Feedback; interviewStatus: string }> => {
    const res = await api.post('/feedback', data);
    return res.data;
  },

  getInterviewFeedback: async (interviewId: string): Promise<{ success: boolean; feedbacks: Feedback[] }> => {
    const res = await api.get(`/feedback/interview/${interviewId}`);
    return res.data;
  },

  getMyFeedback: async (interviewId: string): Promise<{ success: boolean; feedback: Feedback | null }> => {
    const res = await api.get(`/feedback/interview/${interviewId}/mine`);
    return res.data;
  },

  getCandidateFeedback: async (candidateId: string): Promise<{ success: boolean; feedbacks: Feedback[] }> => {
    const res = await api.get(`/feedback/candidate/${candidateId}`);
    return res.data;
  },

  deleteFeedback: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/feedback/${id}`);
    return res.data;
  },
};
