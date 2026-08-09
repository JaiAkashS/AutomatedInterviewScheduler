"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTemplate = exports.getTemplateById = exports.getTemplates = exports.createTemplate = void 0;
const Template_1 = require("../models/Template");
const createTemplate = async (req, res, next) => {
    try {
        const { title, type, duration, workingHours, minimumNotice, description } = req.body;
        const template = await Template_1.Template.create({
            title,
            type: type || 'Technical Interview',
            duration: duration || 60,
            workingHours: workingHours || { start: '09:00', end: '17:00' },
            minimumNotice: minimumNotice || 12,
            description,
            createdBy: req.user?.id,
        });
        return res.status(201).json({ success: true, template });
    }
    catch (error) {
        next(error);
    }
};
exports.createTemplate = createTemplate;
const getTemplates = async (req, res, next) => {
    try {
        const templates = await Template_1.Template.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, templates });
    }
    catch (error) {
        next(error);
    }
};
exports.getTemplates = getTemplates;
const getTemplateById = async (req, res, next) => {
    try {
        const template = await Template_1.Template.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found.' });
        }
        return res.status(200).json({ success: true, template });
    }
    catch (error) {
        next(error);
    }
};
exports.getTemplateById = getTemplateById;
const deleteTemplate = async (req, res, next) => {
    try {
        const template = await Template_1.Template.findByIdAndDelete(req.params.id);
        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found.' });
        }
        return res.status(200).json({ success: true, message: 'Template deleted.' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteTemplate = deleteTemplate;
