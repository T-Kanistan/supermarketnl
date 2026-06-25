import '../src/config/loadEnv.js';
import { logSmtpRuntimeDiagnostics } from '../src/config/smtp.js';
import { BACKEND_ENV_PATH } from '../src/config/loadEnv.js';

console.log('[smtp-check] Verifying environment loading...\n');
console.log(`[smtp-check] .env path: ${BACKEND_ENV_PATH}`);
logSmtpRuntimeDiagnostics('smtp-check');

const missing = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'].filter(
  (key) => !String(process.env[key] || '').trim()
);

if (missing.length) {
  console.error(`\n[smtp-check] FAILED — missing at runtime: ${missing.join(', ')}`);
  console.error('[smtp-check] Add these to backend/.env and restart the server.');
  process.exit(1);
}

console.log('\n[smtp-check] SUCCESS — SMTP_USER and SMTP_PASS are available at runtime.');
process.exit(0);
