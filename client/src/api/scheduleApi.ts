import api from './axios';
import { Interview, TimeSlot } from '../types';

export const scheduleApi = {
  getInterviewByToken: async (token: string): Promise<{ success: boolean; interview: Interview }> => {
    const res = await api.get(`/schedule/${token}`);
    return res.data;
  },
  getSlotsByToken: async (token: string, timezone?: string): Promise<{ success: boolean; timezone: string; duration: number; slots: TimeSlot[] }> => {
    const res = await api.get(`/schedule/${token}/slots`, { params: { timezone } });
    return res.data;
  },
  confirmSlot: async (
    token: string,
    start: string,
    end: string,
    timezone?: string
  ): Promise<{ success: boolean; message: string; interview: Interview; meetingLink?: string }> => {
    const res = await api.post(`/schedule/${token}/confirm`, { start, end, timezone });
    return res.data;
  },
  reschedule: async (token: string): Promise<{ success: boolean; message: string; interview: Interview }> => {
    const res = await api.post(`/schedule/${token}/reschedule`);
    return res.data;
  },
  cancel: async (token: string, reason?: string): Promise<{ success: boolean; message: string; interview: Interview }> => {
    const res = await api.post(`/schedule/${token}/cancel`, { reason });
    return res.data;
  },
};
