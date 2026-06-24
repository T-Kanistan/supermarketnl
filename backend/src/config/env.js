import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendEnvPath = path.resolve(__dirname, '../../.env');

dotenv.config({ path: backendEnvPath });
dotenv.config();

import {
  getMissingSmtpVars,
  isSmtpConfigured,
  logSmtpEnvironment,
} from '../config/smtp.js';

const maskValue = (value) => {
  if (!value) return 'MISSING';
  return 'set';
};

export const logStartupEnvironment = () => {
  console.log('[Env] Loading configuration...');
  console.log(`[Env] NODE_ENV=${process.env.NODE_ENV || 'development'}`);
  console.log(`[Env] PORT=${process.env.PORT || '(not set, default 5000)'}`);
  console.log(`[Env] MONGODB_URI=${maskValue(process.env.MONGODB_URI || process.env.MONGO_URI)}`);
  console.log(`[Env] JWT_SECRET=${maskValue(process.env.JWT_SECRET)}`);
  console.log(`[Env] CORS_ORIGINS=${process.env.CORS_ORIGINS ? 'set' : 'using defaults'}`);
  console.log(`[Env] FRONTEND_URL=${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`[Env] SMTP configured=${isSmtpConfigured()}`);
  if (!isSmtpConfigured()) {
    console.log(`[Env] SMTP missing=${getMissingSmtpVars().join(', ')}`);
  }
  logSmtpEnvironment();
  console.log(`[Env] CLOUDINARY=${maskValue(process.env.CLOUDINARY_CLOUD_NAME)}`);
};

export const getRequiredEnv = (key) => {
  const value = process.env[key];
  if (!value || !String(value).trim()) {
    throw new Error(`${key} is not configured`);
  }
  return String(value).trim();
};

export default { logStartupEnvironment, getRequiredEnv };
