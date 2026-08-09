import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const getAuthUrl: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const handleCallback: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const disconnectCalendar: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getCalendarStatus: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
