import { ITimeInterval } from '../../types';
export interface CalendarEventDetails {
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    timezone: string;
    attendees: string[];
    location?: string;
}
export declare class GoogleCalendarService {
    private static getOAuth2Client;
    static isConfigured(): boolean;
    static getAuthUrl(state?: string): string;
    static getTokensFromCode(code: string): Promise<{
        accessToken: string | undefined;
        refreshToken: string | undefined;
        tokenExpiry: number | undefined;
    }>;
    static getFreeBusy(accessToken: string, refreshToken: string, calendarId: string | undefined, timeMin: Date, timeMax: Date): Promise<ITimeInterval[]>;
    static createEvent(accessToken: string, refreshToken: string, eventDetails: CalendarEventDetails): Promise<{
        eventId: string;
        meetingLink: string;
    }>;
    static updateEvent(accessToken: string, refreshToken: string, eventId: string, eventDetails: CalendarEventDetails): Promise<{
        eventId: string;
        meetingLink: string;
    }>;
    static deleteEvent(accessToken: string, refreshToken: string, eventId: string): Promise<boolean>;
}
