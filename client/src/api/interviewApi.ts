import api from './axios';
import { Interview } from '../types';

export const interviewApi = {
  createInterview: async (data: any): Promise<{ success: boolean; interview: Interview; schedulingUrl: string }> => {
    const res = await api.post('/interviews', data);
    return res.data;
  },
  getInterviews: async (status?: string): Promise<{ success: boolean; interviews: Interview[] }> => {
    const res = await api.get('/interviews', { params: { status } });
    return res.data;
  },
  getInterviewById: async (id: string): Promise<{ success: boolean; interview: Interview }> => {
    const res = await api.get(`/interviews/${id}`);
    return res.data;
  },
  cancelInterview: async (id: string, reason?: string): Promise<{ success: boolean; interview: Interview }> => {
    const res = await api.post(`/interviews/${id}/cancel`, { reason });
    return res.data;
  },
  rescheduleInterview: async (id: string): Promise<{ success: boolean; schedulingUrl: string; interview: Interview }> => {
    const res = await api.post(`/interviews/${id}/reschedule`);
    return res.data;
  },
  deleteInterview: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/interviews/${id}`);
    return res.data;
  },
};
