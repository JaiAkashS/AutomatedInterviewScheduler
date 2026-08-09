"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.candidateLogin = exports.logout = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const config_1 = require("../config");
const register = async (req, res, next) => {
    try {
        const { name, email, password, role, timezone } = req.body;
        const existingUser = await User_1.User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User with this email already exists.' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const user = await User_1.User.create({
            name,
            email: email.toLowerCase(),
            passwordHash,
            role: role || 'RECRUITER',
            timezone: timezone || 'Asia/Kolkata',
        });
        const token = jsonwebtoken_1.default.sign({ id: user._id, email: user.email, role: user.role, name: user.name }, config_1.config.jwtSecret, { expiresIn: config_1.config.jwtExpiresIn });
        res.cookie('token', token, {
            httpOnly: true,
            secure: config_1.config.nodeEnv === 'production',
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
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, email: user.email, role: user.role, name: user.name }, config_1.config.jwtSecret, { expiresIn: config_1.config.jwtExpiresIn });
        res.cookie('token', token, {
            httpOnly: true,
            secure: config_1.config.nodeEnv === 'production',
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
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const logout = async (req, res) => {
    res.clearCookie('token');
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
};
exports.logout = logout;
const candidateLogin = async (req, res, next) => {
    try {
        const { email, token: schedulingToken, password } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Candidate email is required.' });
        }
        const { Candidate } = await Promise.resolve().then(() => __importStar(require('../models/Candidate')));
        const { Interview } = await Promise.resolve().then(() => __importStar(require('../models/Interview')));
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
            const isMatch = await bcryptjs_1.default.compare(password, candidate.passwordHash);
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
        const token = jsonwebtoken_1.default.sign({ id: candidate._id, email: candidate.email, role: 'CANDIDATE', name: candidate.name }, config_1.config.jwtSecret, { expiresIn: config_1.config.jwtExpiresIn });
        res.cookie('token', token, {
            httpOnly: true,
            secure: config_1.config.nodeEnv === 'production',
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
    }
    catch (error) {
        next(error);
    }
};
exports.candidateLogin = candidateLogin;
const getMe = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authenticated.' });
        }
        if (req.user.role === 'CANDIDATE') {
            const { Candidate } = await Promise.resolve().then(() => __importStar(require('../models/Candidate')));
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
        const user = await User_1.User.findById(req.user.id);
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
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
