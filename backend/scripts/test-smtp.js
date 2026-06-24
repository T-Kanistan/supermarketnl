import { logStartupEnvironment } from '../src/config/env.js';
import { verifySmtpConnection } from '../src/services/emailService.js';

logStartupEnvironment();

const result = await verifySmtpConnection();

if (!result.configured) {
  console.error('\n[test-smtp] FAILED — SMTP is not configured.');
  console.error(`[test-smtp] Missing variables: ${(result.missingVars || []).join(', ')}`);
  process.exit(1);
}

if (!result.verified) {
  console.error('\n[test-smtp] FAILED — SMTP is configured but connection verification failed.');
  console.error(`[test-smtp] Error: ${result.error || 'unknown error'}`);
  process.exit(1);
}

console.log('\n[test-smtp] SUCCESS — SMTP is configured and verified.');
process.exit(0);
