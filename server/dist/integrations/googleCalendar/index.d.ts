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
    static getAuthenticatedClientForUser(userId: string): Promise<{
        isMock: boolean;
        accessToken: any;
        refreshToken: any;
        userId: string;
        oauth2Client: null;
    } | {
        isMock: boolean;
        oauth2Client: import("google-auth-library").OAuth2Client;
        userId: string;
        accessToken: any;
        refreshToken: any;
    } | null>;
    static getTokensFromCode(code: string): Promise<{
        accessToken: string | undefined;
        refreshToken: string | undefined;
        tokenExpiry: number | undefined;
    }>;
    static getFreeBusy(accessToken: string, refreshToken: string, calendarId: string | undefined, timeMin: Date, timeMax: Date, userId?: string): Promise<ITimeInterval[]>;
    private static getMockFreeBusy;
    private static executeFreeBusyQuery;
    static createEvent(accessToken: string, refreshToken: string, eventDetails: CalendarEventDetails, userId?: string): Promise<{
        eventId: string;
        meetingLink: string;
    }>;
    private static getMockEventResult;
    private static executeCreateEvent;
    static updateEvent(accessToken: string, refreshToken: string, eventId: string, eventDetails: CalendarEventDetails, userId?: string): Promise<{
        eventId: string;
        meetingLink: string;
    }>;
    private static executeUpdateEvent;
    static deleteEvent(accessToken: string, refreshToken: string, eventId: string, userId?: string): Promise<boolean>;
}
