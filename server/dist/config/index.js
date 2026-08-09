"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
exports.config = {
    port: process.env.PORT || 5000,
    mongoUri: process.env.NODE_ENV === 'production'
        ? process.env.PROD_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/interview_scheduler'
        : process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/interview_scheduler',
    jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key_interview_scheduler_2026_dev',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    googleClientId: process.env.GOOGLE_CLIENT_ID || 'mock_google_client_id',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_google_client_secret',
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google/callback',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    serverUrl: process.env.SERVER_URL || 'http://localhost:5000',
    nodeEnv: process.env.NODE_ENV || 'development',
};
