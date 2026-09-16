"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCalendarStatus = exports.disconnectCalendar = exports.handleCallback = exports.getAuthUrl = void 0;
const googleCalendar_1 = require("../integrations/googleCalendar");
const User_1 = require("../models/User");
const config_1 = require("../config");
const getAuthUrl = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const authUrl = googleCalendar_1.GoogleCalendarService.getAuthUrl(userId);
        return res.status(200).json({ success: true, url: authUrl });
    }
    catch (error) {
        next(error);
    }
};
exports.getAuthUrl = getAuthUrl;
const handleCallback = async (req, res, next) => {
    try {
        const code = req.query.code;
        const userId = req.query.state || req.user?.id;
        if (!code) {
            return res.redirect(`${config_1.config.clientUrl}/settings?error=no_code_provided`);
        }
        const tokens = await googleCalendar_1.GoogleCalendarService.getTokensFromCode(code);
        if (userId) {
            const existingUser = await User_1.User.findById(userId).select('+googleCalendar.refreshToken');
            const refreshToken = tokens.refreshToken || existingUser?.googleCalendar?.refreshToken;
            await User_1.User.findByIdAndUpdate(userId, {
                googleCalendar: {
                    connected: true,
                    calendarId: 'primary',
                    accessToken: tokens.accessToken,
                    refreshToken: refreshToken,
                    tokenExpiry: tokens.tokenExpiry,
                },
            });
        }
        return res.redirect(`${config_1.config.clientUrl}/settings?google=connected`);
    }
    catch (error) {
        console.error('Google OAuth callback error:', error);
        return res.redirect(`${config_1.config.clientUrl}/settings?error=oauth_failed`);
    }
};
exports.handleCallback = handleCallback;
const disconnectCalendar = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }
        await User_1.User.findByIdAndUpdate(userId, {
            googleCalendar: {
                connected: false,
                calendarId: 'primary',
                accessToken: undefined,
                refreshToken: undefined,
                tokenExpiry: undefined,
            },
        });
        return res.status(200).json({ success: true, message: 'Google Calendar disconnected successfully.' });
    }
    catch (error) {
        next(error);
    }
};
exports.disconnectCalendar = disconnectCalendar;
const getCalendarStatus = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const user = await User_1.User.findById(userId);
        return res.status(200).json({
            success: true,
            connected: user?.googleCalendar?.connected || false,
            calendarId: user?.googleCalendar?.calendarId || 'primary',
            configured: googleCalendar_1.GoogleCalendarService.isConfigured(),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCalendarStatus = getCalendarStatus;
