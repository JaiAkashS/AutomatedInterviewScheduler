import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { Template } from '../models/Template';

export const createTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, type, duration, workingHours, minimumNotice, description } = req.body;

    const template = await Template.create({
      title,
      type: type || 'Technical Interview',
      duration: duration || 60,
      workingHours: workingHours || { start: '09:00', end: '17:00' },
      minimumNotice: minimumNotice || 12,
      description,
      createdBy: req.user?.id,
    });

    return res.status(201).json({ success: true, template });
  } catch (error) {
    next(error);
  }
};

export const getTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const templates = await Template.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, templates });
  } catch (error) {
    next(error);
  }
};

export const getTemplateById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }
    return res.status(200).json({ success: true, template });
  } catch (error) {
    next(error);
  }
};

export const deleteTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const template = await Template.findByIdAndDelete(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }
    return res.status(200).json({ success: true, message: 'Template deleted.' });
  } catch (error) {
    next(error);
  }
};
