import api from './axios';
import { User } from '../types';

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (data: { name: string; email: string; password: string; role?: string; timezone?: string }) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },
  logout: async () => {
    const res = await api.post('/auth/logout');
    return res.data;
  },
  candidateLogin: async (email: string, token?: string, password?: string) => {
    const res = await api.post('/auth/candidate/login', { email, token, password });
    return res.data;
  },
  getMe: async (): Promise<{ success: boolean; user: User }> => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};
