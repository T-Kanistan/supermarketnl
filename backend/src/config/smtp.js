import './loadEnv.js';

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

  return {
    message: `SMTP is not configured. Set ${missing.join(', ')} in backend/.env and restart the server.`,
    missingVars: missing,
  };
};

export const logSmtpEnvironment = () => {
  logSmtpRuntimeDiagnostics('startup');
};

/** Safe runtime SMTP diagnostics — never logs passwords. */
export const logSmtpRuntimeDiagnostics = (context = 'runtime') => {
  const config = getSmtpConfig();
  const missing = getMissingSmtpVars();
  const userPresent = Boolean(trim(process.env.SMTP_USER));
  const passPresent = Boolean(trim(process.env.SMTP_PASS));

  console.log(`[smtp] Diagnostics (${context}):`);
  console.log(`[smtp]   SMTP_HOST=${config.host || 'MISSING'}`);
  console.log(`[smtp]   SMTP_PORT=${config.port}`);
  console.log(`[smtp]   SMTP_SECURE=${config.secure}`);
  console.log(`[smtp]   SMTP_USER=${userPresent ? 'set' : 'MISSING'}${userPresent ? ` (${config.user})` : ''}`);
  console.log(`[smtp]   SMTP_PASS=${passPresent ? 'set' : 'MISSING'}`);
  console.log(`[smtp]   SMTP_FROM=${config.from || '(defaults to SMTP_USER)'}`);
  console.log(`[smtp]   configured=${isSmtpConfigured()}`);

  if (missing.length) {
    console.warn(`[smtp]   missing variables: ${missing.join(', ')}`);
  }
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
