import api from './axios';

export const googleApi = {
  getAuthUrl: async (): Promise<{ success: boolean; url: string }> => {
    const res = await api.get('/google/auth');
    return res.data;
  },
  disconnect: async (): Promise<{ success: boolean; message: string }> => {
    const res = await api.post('/google/disconnect');
    return res.data;
  },
  getStatus: async (): Promise<{ success: boolean; connected: boolean; calendarId: string; configured: boolean }> => {
    const res = await api.get('/google/status');
    return res.data;
  },
};
