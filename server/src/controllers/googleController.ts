import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { GoogleCalendarService } from '../integrations/googleCalendar';
import { User } from '../models/User';
import { config } from '../config';

export const getAuthUrl = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const authUrl = GoogleCalendarService.getAuthUrl(userId);
    return res.status(200).json({ success: true, url: authUrl });
  } catch (error) {
    next(error);
  }
};

export const handleCallback = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const code = req.query.code as string;
    const userId = req.query.state as string || req.user?.id;

    if (!code) {
      return res.redirect(`${config.clientUrl}/settings?error=no_code_provided`);
    }

    const tokens = await GoogleCalendarService.getTokensFromCode(code);

    if (userId) {
      await User.findByIdAndUpdate(userId, {
        googleCalendar: {
          connected: true,
          calendarId: 'primary',
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiry: tokens.tokenExpiry,
        },
      });
    }

    return res.redirect(`${config.clientUrl}/settings?google=connected`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return res.redirect(`${config.clientUrl}/settings?error=oauth_failed`);
  }
};

export const disconnectCalendar = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    await User.findByIdAndUpdate(userId, {
      googleCalendar: {
        connected: false,
        calendarId: 'primary',
        accessToken: undefined,
        refreshToken: undefined,
        tokenExpiry: undefined,
      },
    });

    return res.status(200).json({ success: true, message: 'Google Calendar disconnected successfully.' });
  } catch (error) {
    next(error);
  }
};

export const getCalendarStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);

    return res.status(200).json({
      success: true,
      connected: user?.googleCalendar?.connected || false,
      calendarId: user?.googleCalendar?.calendarId || 'primary',
      configured: GoogleCalendarService.isConfigured(),
    });
  } catch (error) {
    next(error);
  }
};
