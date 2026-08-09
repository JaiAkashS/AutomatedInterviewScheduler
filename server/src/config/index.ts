import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/interview_scheduler',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key_interview_scheduler_2026_dev',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  googleClientId: process.env.GOOGLE_CLIENT_ID || 'mock_google_client_id',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_google_client_secret',
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google/callback',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  serverUrl: process.env.SERVER_URL || 'http://localhost:5000',
  nodeEnv: process.env.NODE_ENV || 'development',
};
