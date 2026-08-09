"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleCalendarService = void 0;
const googleapis_1 = require("googleapis");
const config_1 = require("../../config");
class GoogleCalendarService {
    static getOAuth2Client() {
        return new googleapis_1.google.auth.OAuth2(config_1.config.googleClientId, config_1.config.googleClientSecret, config_1.config.googleRedirectUri);
    }
    static isConfigured() {
        return (config_1.config.googleClientId !== 'mock_google_client_id' &&
            Boolean(config_1.config.googleClientId) &&
            Boolean(config_1.config.googleClientSecret));
    }
    static getAuthUrl(state) {
        if (!this.isConfigured()) {
            return `${config_1.config.serverUrl}/api/google/callback?code=mock_oauth_code_demo&state=${state || ''}`;
        }
        const oauth2Client = this.getOAuth2Client();
        return oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: [
                'https://www.googleapis.com/auth/calendar.events',
                'https://www.googleapis.com/auth/calendar.readonly',
                'https://www.googleapis.com/auth/userinfo.email',
            ],
            state,
        });
    }
    static async getTokensFromCode(code) {
        if (!this.isConfigured() || code.startsWith('mock_')) {
            return {
                accessToken: `mock_access_token_${Date.now()}`,
                refreshToken: `mock_refresh_token_${Date.now()}`,
                tokenExpiry: Date.now() + 3600 * 1000,
            };
        }
        const oauth2Client = this.getOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);
        return {
            accessToken: tokens.access_token || undefined,
            refreshToken: tokens.refresh_token || undefined,
            tokenExpiry: tokens.expiry_date || undefined,
        };
    }
    static async getFreeBusy(accessToken, refreshToken, calendarId = 'primary', timeMin, timeMax) {
        if (!this.isConfigured() || accessToken.startsWith('mock_')) {
            // Return simulated busy slots for mock mode (e.g., 1 hour busy at 10:00 AM local time tomorrow)
            const mockBusy = [];
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(10, 0, 0, 0);
            const tomorrowEnd = new Date(tomorrow);
            tomorrowEnd.setHours(11, 0, 0, 0);
            mockBusy.push({ start: tomorrow, end: tomorrowEnd });
            return mockBusy;
        }
        const oauth2Client = this.getOAuth2Client();
        oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
        });
        const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                items: [{ id: calendarId }],
            },
        });
        const busySlots = response.data.calendars?.[calendarId]?.busy || [];
        return busySlots.map((slot) => ({
            start: new Date(slot.start || timeMin),
            end: new Date(slot.end || timeMax),
        }));
    }
    static async createEvent(accessToken, refreshToken, eventDetails) {
        if (!this.isConfigured() || accessToken.startsWith('mock_')) {
            const mockEventId = `mock_event_${Math.random().toString(36).substring(2, 9)}`;
            const mockMeetLink = `https://meet.google.com/mock-int-${Math.random().toString(36).substring(2, 7)}`;
            return { eventId: mockEventId, meetingLink: mockMeetLink };
        }
        const oauth2Client = this.getOAuth2Client();
        oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
        });
        const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
        const response = await calendar.events.insert({
            calendarId: 'primary',
            conferenceDataVersion: 1,
            sendUpdates: 'all',
            requestBody: {
                summary: eventDetails.title,
                description: eventDetails.description,
                location: eventDetails.location || 'Google Meet',
                start: {
                    dateTime: eventDetails.startTime.toISOString(),
                    timeZone: eventDetails.timezone,
                },
                end: {
                    dateTime: eventDetails.endTime.toISOString(),
                    timeZone: eventDetails.timezone,
                },
                attendees: eventDetails.attendees.map((email) => ({ email })),
                conferenceData: {
                    createRequest: {
                        requestId: `req-${Date.now()}`,
                        conferenceSolutionKey: { type: 'hangoutsMeet' },
                    },
                },
            },
        });
        const eventId = response.data.id || `evt-${Date.now()}`;
        const meetingLink = response.data.hangoutLink ||
            response.data.conferenceData?.entryPoints?.[0]?.uri ||
            `https://meet.google.com/meet-${eventId}`;
        return { eventId, meetingLink };
    }
    static async updateEvent(accessToken, refreshToken, eventId, eventDetails) {
        if (!this.isConfigured() || accessToken.startsWith('mock_')) {
            const mockMeetLink = `https://meet.google.com/mock-int-rescheduled`;
            return { eventId, meetingLink: mockMeetLink };
        }
        const oauth2Client = this.getOAuth2Client();
        oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
        });
        const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
        const response = await calendar.events.update({
            calendarId: 'primary',
            eventId,
            sendUpdates: 'all',
            requestBody: {
                summary: eventDetails.title,
                description: eventDetails.description,
                location: eventDetails.location || 'Google Meet',
                start: {
                    dateTime: eventDetails.startTime.toISOString(),
                    timeZone: eventDetails.timezone,
                },
                end: {
                    dateTime: eventDetails.endTime.toISOString(),
                    timeZone: eventDetails.timezone,
                },
                attendees: eventDetails.attendees.map((email) => ({ email })),
            },
        });
        const meetingLink = response.data.hangoutLink ||
            `https://meet.google.com/meet-${eventId}`;
        return { eventId, meetingLink };
    }
    static async deleteEvent(accessToken, refreshToken, eventId) {
        if (!this.isConfigured() || accessToken.startsWith('mock_')) {
            return true;
        }
        try {
            const oauth2Client = this.getOAuth2Client();
            oauth2Client.setCredentials({
                access_token: accessToken,
                refresh_token: refreshToken,
            });
            const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
            await calendar.events.delete({
                calendarId: 'primary',
                eventId,
                sendUpdates: 'all',
            });
            return true;
        }
        catch (error) {
            console.error('Failed to delete Google Calendar event:', error);
            return false;
        }
    }
}
exports.GoogleCalendarService = GoogleCalendarService;
