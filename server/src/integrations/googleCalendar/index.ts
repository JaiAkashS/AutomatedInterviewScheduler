import { google } from 'googleapis';
import { config } from '../../config';
import { ITimeInterval } from '../../types';

export interface CalendarEventDetails {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  attendees: string[]; // Emails
  location?: string;
}

export class GoogleCalendarService {
  private static getOAuth2Client() {
    return new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      config.googleRedirectUri
    );
  }

  public static isConfigured(): boolean {
    return (
      config.googleClientId !== 'mock_google_client_id' &&
      Boolean(config.googleClientId) &&
      Boolean(config.googleClientSecret)
    );
  }

  public static getAuthUrl(state?: string): string {
    if (!this.isConfigured()) {
      return `${config.serverUrl}/api/google/callback?code=mock_oauth_code_demo&state=${state || ''}`;
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

  public static async getAuthenticatedClientForUser(userId: string) {
    const { User } = require('../../models/User');
    const user = await User.findById(userId).select(
      '+googleCalendar.accessToken +googleCalendar.refreshToken +googleCalendar.tokenExpiry'
    );

    if (!user || !user.googleCalendar?.accessToken) {
      return null;
    }

    const accessToken = user.googleCalendar.accessToken;
    const refreshToken = user.googleCalendar.refreshToken;

    if (!this.isConfigured() || accessToken.startsWith('mock_')) {
      return { isMock: true, accessToken, refreshToken, userId, oauth2Client: null };
    }

    const oauth2Client = this.getOAuth2Client();
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const tokenExpiry = user.googleCalendar.tokenExpiry || 0;
    const isExpired = Date.now() >= tokenExpiry - 300000;

    if ((isExpired || !accessToken) && refreshToken) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        if (credentials.access_token) {
          user.googleCalendar.accessToken = credentials.access_token;
          if (credentials.expiry_date) {
            user.googleCalendar.tokenExpiry = credentials.expiry_date;
          }
          if (credentials.refresh_token) {
            user.googleCalendar.refreshToken = credentials.refresh_token;
          }
          await user.save();
          oauth2Client.setCredentials(credentials);
        }
      } catch (refreshErr) {
        console.error(`Failed to refresh Google OAuth token for user ${userId}:`, refreshErr);
      }
    }

    return { isMock: false, oauth2Client, userId, accessToken, refreshToken };
  }

  public static async getTokensFromCode(code: string) {
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

  public static async getFreeBusy(
    accessToken: string,
    refreshToken: string,
    calendarId: string = 'primary',
    timeMin: Date,
    timeMax: Date,
    userId?: string
  ): Promise<ITimeInterval[]> {
    if (userId) {
      const authResult = await this.getAuthenticatedClientForUser(userId);
      if (authResult?.isMock || !authResult) {
        return this.getMockFreeBusy();
      }
      if (authResult.oauth2Client) {
        return this.executeFreeBusyQuery(authResult.oauth2Client, calendarId, timeMin, timeMax);
      }
    }

    if (!this.isConfigured() || accessToken.startsWith('mock_')) {
      return this.getMockFreeBusy();
    }

    const oauth2Client = this.getOAuth2Client();
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    return this.executeFreeBusyQuery(oauth2Client, calendarId, timeMin, timeMax);
  }

  private static getMockFreeBusy(): ITimeInterval[] {
    const mockBusy: ITimeInterval[] = [];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(11, 0, 0, 0);

    mockBusy.push({ start: tomorrow, end: tomorrowEnd });
    return mockBusy;
  }

  private static async executeFreeBusyQuery(
    oauth2Client: any,
    calendarId: string,
    timeMin: Date,
    timeMax: Date
  ): Promise<ITimeInterval[]> {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
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

  public static async createEvent(
    accessToken: string,
    refreshToken: string,
    eventDetails: CalendarEventDetails,
    userId?: string
  ): Promise<{ eventId: string; meetingLink: string }> {
    if (userId) {
      const authResult = await this.getAuthenticatedClientForUser(userId);
      if (authResult?.isMock) {
        return this.getMockEventResult();
      }
      if (authResult?.oauth2Client) {
        return this.executeCreateEvent(authResult.oauth2Client, eventDetails);
      }
    }

    if (!this.isConfigured() || accessToken.startsWith('mock_')) {
      return this.getMockEventResult();
    }

    const oauth2Client = this.getOAuth2Client();
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (refreshToken) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        if (credentials.access_token) {
          oauth2Client.setCredentials(credentials);
        }
      } catch (err) {
        console.warn('OAuth refresh token attempt warning:', err);
      }
    }

    return this.executeCreateEvent(oauth2Client, eventDetails);
  }

  private static getMockEventResult() {
    const mockEventId = `mock_event_${Math.random().toString(36).substring(2, 9)}`;
    const mockMeetLink = `https://meet.google.com/mock-int-${Math.random().toString(36).substring(2, 7)}`;
    return { eventId: mockEventId, meetingLink: mockMeetLink };
  }

  private static async executeCreateEvent(
    oauth2Client: any,
    eventDetails: CalendarEventDetails
  ): Promise<{ eventId: string; meetingLink: string }> {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
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
            requestId: `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      },
    });

    const eventId = response.data.id || `evt-${Date.now()}`;
    const meetingLink =
      response.data.hangoutLink ||
      response.data.conferenceData?.entryPoints?.[0]?.uri ||
      `https://meet.google.com/meet-${eventId}`;

    return { eventId, meetingLink };
  }

  public static async updateEvent(
    accessToken: string,
    refreshToken: string,
    eventId: string,
    eventDetails: CalendarEventDetails,
    userId?: string
  ): Promise<{ eventId: string; meetingLink: string }> {
    if (userId) {
      const authResult = await this.getAuthenticatedClientForUser(userId);
      if (authResult?.isMock) {
        return { eventId, meetingLink: `https://meet.google.com/mock-int-rescheduled` };
      }
      if (authResult?.oauth2Client) {
        return this.executeUpdateEvent(authResult.oauth2Client, eventId, eventDetails);
      }
    }

    if (!this.isConfigured() || accessToken.startsWith('mock_')) {
      return { eventId, meetingLink: `https://meet.google.com/mock-int-rescheduled` };
    }

    const oauth2Client = this.getOAuth2Client();
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    return this.executeUpdateEvent(oauth2Client, eventId, eventDetails);
  }

  private static async executeUpdateEvent(
    oauth2Client: any,
    eventId: string,
    eventDetails: CalendarEventDetails
  ): Promise<{ eventId: string; meetingLink: string }> {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
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

    const meetingLink =
      response.data.hangoutLink ||
      `https://meet.google.com/meet-${eventId}`;

    return { eventId, meetingLink };
  }

  public static async deleteEvent(
    accessToken: string,
    refreshToken: string,
    eventId: string,
    userId?: string
  ): Promise<boolean> {
    try {
      if (userId) {
        const authResult = await this.getAuthenticatedClientForUser(userId);
        if (authResult?.isMock) return true;
        if (authResult?.oauth2Client) {
          const calendar = google.calendar({ version: 'v3', auth: authResult.oauth2Client });
          await calendar.events.delete({
            calendarId: 'primary',
            eventId,
            sendUpdates: 'all',
          });
          return true;
        }
      }

      if (!this.isConfigured() || accessToken.startsWith('mock_')) {
        return true;
      }

      const oauth2Client = this.getOAuth2Client();
      oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      await calendar.events.delete({
        calendarId: 'primary',
        eventId,
        sendUpdates: 'all',
      });
      return true;
    } catch (error) {
      console.error('Failed to delete Google Calendar event:', error);
      return false;
    }
  }
}
