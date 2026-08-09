import api from './axios';
import { Template } from '../types';

export const templateApi = {
  createTemplate: async (data: any): Promise<{ success: boolean; template: Template }> => {
    const res = await api.post('/templates', data);
    return res.data;
  },
  getTemplates: async (): Promise<{ success: boolean; templates: Template[] }> => {
    const res = await api.get('/templates');
    return res.data;
  },
  getTemplateById: async (id: string): Promise<{ success: boolean; template: Template }> => {
    const res = await api.get(`/templates/${id}`);
    return res.data;
  },
  deleteTemplate: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/templates/${id}`);
    return res.data;
  },
};
