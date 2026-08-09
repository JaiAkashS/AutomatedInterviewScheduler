import api from './axios';
import { Candidate } from '../types';

export const candidateApi = {
  createCandidate: async (data: { name: string; email: string; timezone?: string; notes?: string }): Promise<{ success: boolean; candidate: Candidate }> => {
    const res = await api.post('/candidates', data);
    return res.data;
  },
  getCandidates: async (): Promise<{ success: boolean; candidates: Candidate[] }> => {
    const res = await api.get('/candidates');
    return res.data;
  },
  getCandidateById: async (id: string): Promise<{ success: boolean; candidate: Candidate }> => {
    const res = await api.get(`/candidates/${id}`);
    return res.data;
  },
  getMyInterviews: async (): Promise<{ success: boolean; interviews: any[] }> => {
    const res = await api.get('/candidates/my-interviews');
    return res.data;
  },
};
