import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Candidate } from '../models/Candidate';
import { Interview } from '../models/Interview';
import { config } from '../config';
import { AuthRequest } from '../types';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role, timezone } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role || 'RECRUITER',
      timezone: timezone || 'Asia/Kolkata',
    });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        googleCalendarConnected: user.googleCalendar.connected,
        timezone: user.timezone,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        googleCalendarConnected: user.googleCalendar.connected,
        timezone: user.timezone,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('token');
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

export const candidateLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, token: schedulingToken, password } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Candidate email is required.' });
    }



    const candidate = await Candidate.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'No candidate profile found with this email.' });
    }

    // 1. If scheduling token provided, verify interview exists for candidate
    if (schedulingToken) {
      const interview = await Interview.findOne({
        candidateId: candidate._id,
        schedulingToken,
      });

      if (!interview) {
        return res.status(401).json({ success: false, message: 'Invalid scheduling code for this email.' });
      }
    } 
    // 2. Or if password provided, verify password
    else if (password && candidate.passwordHash) {
      const isMatch = await bcrypt.compare(password, candidate.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid password.' });
      }
    } 
    // 3. Passwordless email access if candidate has active interviews
    else {
      const activeInterviews = await Interview.countDocuments({ candidateId: candidate._id });
      if (activeInterviews === 0) {
        return res.status(401).json({ success: false, message: 'No active interviews found for this candidate email.' });
      }
    }

    const token = jwt.sign(
      { id: candidate._id, email: candidate.email, role: 'CANDIDATE', name: candidate.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: 'Candidate login successful',
      token,
      user: {
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        role: 'CANDIDATE',
        timezone: candidate.timezone,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    if (req.user.role === 'CANDIDATE') {
      const candidate = await Candidate.findById(req.user.id);
      if (!candidate) {
        return res.status(404).json({ success: false, message: 'Candidate profile not found.' });
      }
      return res.status(200).json({
        success: true,
        user: {
          id: candidate._id,
          name: candidate.name,
          email: candidate.email,
          role: 'CANDIDATE',
          timezone: candidate.timezone,
        },
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        googleCalendarConnected: user.googleCalendar.connected,
        timezone: user.timezone,
      },
    });
  } catch (error) {
    next(error);
  }
};
