import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendEnvPath = path.resolve(__dirname, '../../.env');

dotenv.config({ path: backendEnvPath });
dotenv.config();

export const REQUIRED_SMTP_VARS = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];

export const OPTIONAL_SMTP_VARS = ['SMTP_PORT', 'SMTP_SECURE', 'SMTP_FROM'];

const trim = (value) => (value == null ? '' : String(value).trim());

export const getMissingSmtpVars = () =>
  REQUIRED_SMTP_VARS.filter((key) => !trim(process.env[key]));

export const isSmtpConfigured = () => getMissingSmtpVars().length === 0;

export const getSmtpConfig = () => {
  const host = trim(process.env.SMTP_HOST);
  const user = trim(process.env.SMTP_USER);
  const pass = trim(process.env.SMTP_PASS);
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = trim(process.env.SMTP_SECURE).toLowerCase() === 'true' || port === 465;
  const from = trim(process.env.SMTP_FROM) || user;
  const isGmail = host.includes('gmail.com');

  return {
    host,
    user,
    pass,
    port,
    secure,
    from,
    isGmail,
    configured: Boolean(host && user && pass),
  };
};

export const getSmtpConfigurationError = () => {
  const missing = getMissingSmtpVars();
  if (!missing.length) {
    return null;
  }

  console.error('[smtp] Missing required environment variables:');
  missing.forEach((key) => {
    console.error(`[smtp]   - ${key} is not set in backend/.env`);
  });
  OPTIONAL_SMTP_VARS.forEach((key) => {
    const value = trim(process.env[key]);
    console.error(`[smtp]   - ${key}=${value || '(not set, using default if applicable)'}`);
  });

  return {
    message: `Email service is not configured. Missing environment variables: ${missing.join(', ')}`,
    missingVars: missing,
  };
};

export const logSmtpEnvironment = () => {
  const config = getSmtpConfig();
  const missing = getMissingSmtpVars();

  console.log('[smtp] Configuration status:');
  console.log(`[smtp]   SMTP_HOST=${config.host || 'MISSING'}`);
  console.log(`[smtp]   SMTP_PORT=${config.port}`);
  console.log(`[smtp]   SMTP_SECURE=${config.secure}`);
  console.log(`[smtp]   SMTP_USER=${config.user || 'MISSING'}`);
  console.log(`[smtp]   SMTP_PASS=${config.pass ? 'set' : 'MISSING'}`);
  console.log(`[smtp]   SMTP_FROM=${config.from || 'MISSING'}`);

  if (missing.length) {
    console.warn(`[smtp] Not ready — missing: ${missing.join(', ')}`);
    return;
  }

  if (config.isGmail) {
    console.log('[smtp] Gmail detected — use an App Password (not your regular Gmail password).');
    console.log('[smtp] Recommended: SMTP_HOST=smtp.gmail.com SMTP_PORT=587 SMTP_SECURE=false');
  }

  console.log('[smtp] Required variables are present.');
};

export const buildNodemailerTransportOptions = (config = getSmtpConfig()) => ({
  host: config.host,
  port: config.port,
  secure: config.secure,
  auth: {
    user: config.user,
    pass: config.pass,
  },
  ...(config.isGmail && config.port === 587
    ? { requireTLS: true, tls: { minVersion: 'TLSv1.2' } }
    : {}),
});
