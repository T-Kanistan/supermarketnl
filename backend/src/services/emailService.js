import nodemailer from 'nodemailer';
import {
  buildNodemailerTransportOptions,
  getMissingSmtpVars,
  getSmtpConfig,
  getSmtpConfigurationError,
  isSmtpConfigured,
  logSmtpEnvironment,
  logSmtpRuntimeDiagnostics,
} from '../config/smtp.js';
import { buildWhatsAppLink } from '../utils/whatsapp.js';

const truncate = (text, max = 120) => {
  if (!text) return '';
  return text.length <= max ? text : `${text.slice(0, max)}...`;
};

let cachedTransporter = null;
let cachedConfigKey = '';

const getConfigCacheKey = (config) =>
  `${config.host}|${config.port}|${config.user}|${config.secure}|${config.pass}`;

const createTransporter = async () => {
  const configError = getSmtpConfigurationError();
  if (configError) {
    return null;
  }

  const config = getSmtpConfig();
  const configKey = getConfigCacheKey(config);

  if (cachedTransporter && cachedConfigKey === configKey) {
    return cachedTransporter;
  }

  const transportOptions = buildNodemailerTransportOptions(config);
  console.log(
    `[email-service] Creating SMTP transporter → ${config.host}:${config.port} (secure=${config.secure}, user=${config.user})`
  );

  cachedTransporter = nodemailer.createTransport(transportOptions);
  cachedConfigKey = configKey;
  return cachedTransporter;
};

export { isSmtpConfigured, getMissingSmtpVars, getSmtpConfigurationError, logSmtpEnvironment, logSmtpRuntimeDiagnostics };

export const verifySmtpConnection = async () => {
  logSmtpEnvironment();

  const configError = getSmtpConfigurationError();
  if (configError) {
    console.warn('[email-service] SMTP verification skipped — configuration incomplete.');
    return { configured: false, verified: false, missingVars: configError.missingVars };
  }

  try {
    const transporter = await createTransporter();
    await transporter.verify();
    console.log('[email-service] SMTP connection verified successfully.');
    return { configured: true, verified: true };
  } catch (error) {
    console.error('[email-service] SMTP verification failed.');
    console.error(`[email-service]   Message: ${error.message}`);
    if (error.code) console.error(`[email-service]   Code: ${error.code}`);
    if (error.response) console.error(`[email-service]   Response: ${error.response}`);
    if (error.responseCode) console.error(`[email-service]   Response code: ${error.responseCode}`);
    if (error.command) console.error(`[email-service]   Command: ${error.command}`);
    if (error.stack) console.error(error.stack);

    const config = getSmtpConfig();
    if (config.isGmail) {
      console.error(
        '[email-service] Gmail tip: enable 2-Step Verification and create an App Password at https://myaccount.google.com/apppasswords'
      );
      console.error('[email-service] Use the 16-character App Password as SMTP_PASS (no spaces).');
    }

    return { configured: true, verified: false, error: error.message };
  }
};

const getMailDefaults = () => {
  const config = getSmtpConfig();
  const fromEmail = config.from || config.user || 'noreply@winswereldwinkel.nl';
  const fromName = process.env.STORE_NAME || 'Wins Wereld Winkel';
  const adminEmail = process.env.ADMIN_EMAIL?.trim() || config.user;
  return { fromEmail, fromName, adminEmail };
};

const logSmtpSendError = (error, mailOptions) => {
  console.error('[email-service] Failed to send email.');
  console.error(`[email-service]   To: ${mailOptions.to}`);
  console.error(`[email-service]   Subject: ${mailOptions.subject}`);
  console.error(`[email-service]   Message: ${error.message}`);
  if (error.code) console.error(`[email-service]   Code: ${error.code}`);
  if (error.response) console.error(`[email-service]   Response: ${error.response}`);
  if (error.responseCode) console.error(`[email-service]   Response code: ${error.responseCode}`);
  if (error.command) console.error(`[email-service]   Command: ${error.command}`);
  if (error.stack) console.error(error.stack);
};

const sendMailSafe = async (mailOptions) => {
  const configError = getSmtpConfigurationError();
  if (configError) {
    return {
      sent: false,
      simulated: true,
      missingVars: configError.missingVars,
      error: configError.message,
    };
  }

  const transporter = await createTransporter();
  if (!transporter) {
    const fallbackError = getSmtpConfigurationError();
    return {
      sent: false,
      simulated: true,
      missingVars: fallbackError?.missingVars || [],
      error: fallbackError?.message || 'SMTP transporter could not be created',
    };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[email-service] Email sent successfully to ${mailOptions.to} (messageId=${info.messageId})`);
    return { sent: true, simulated: false, messageId: info.messageId };
  } catch (error) {
    logSmtpSendError(error, mailOptions);
    return {
      sent: false,
      simulated: false,
      error: error.message,
      code: error.code,
    };
  }
};

const logSimulatedEmail = (label, details) => {
  if (process.env.NODE_ENV === 'production') {
    console.warn(`[email-service] ${label} — SMTP unavailable, email not sent.`);
    return;
  }
  console.log(`[email-service] ${label} (simulated — SMTP not configured)`);
  Object.entries(details).forEach(([key, value]) => {
    console.log(`[email-service] ${key}: ${value}`);
  });
};

export const sendEnquiryReplyEmail = async ({ to, customerName, subject, replyMessage }) => {
  const { fromEmail, fromName } = getMailDefaults();
  const mailSubject = subject?.startsWith('Re:') ? subject : `Re: ${subject || 'Your Enquiry'}`;
  const textBody = `Hi ${customerName || 'Customer'},\n\n${replyMessage}\n\n---\n${fromName}`;

  if (!isSmtpConfigured()) {
    logSimulatedEmail('Enquiry reply', { To: to, Subject: mailSubject });
    return { sent: false, simulated: true };
  }

  return sendMailSafe({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: mailSubject,
    text: textBody,
  });
};

export const sendJobApplicationAdminEmail = async (application) => {
  const { fromEmail, fromName, adminEmail } = getMailDefaults();
  const subject = 'New Job Application Received';
  const textBody = [
    'A new job application has been submitted.',
    '',
    `Applicant: ${application.applicantName}`,
    `Email: ${application.email}`,
    `Phone: ${application.phoneNumber}`,
    `Vacancy: ${application.jobTitle}`,
    `Department: ${application.department || 'N/A'}`,
    `Applied: ${new Date(application.appliedDate || Date.now()).toLocaleString()}`,
    '',
    application.cvFile ? 'CV uploaded with application.' : 'No CV uploaded.',
  ].join('\n');

  if (!isSmtpConfigured() || !adminEmail) {
    logSimulatedEmail('Job application admin notification', { To: adminEmail || 'not set', Subject: subject });
    return { sent: false, simulated: true };
  }

  return sendMailSafe({
    from: `"${fromName}" <${fromEmail}>`,
    to: adminEmail,
    subject,
    text: textBody,
  });
};

export const sendJobApplicationApplicantEmail = async (application) => {
  const { fromEmail, fromName } = getMailDefaults();
  const subject = 'Application Received Successfully';
  const textBody = [
    `Dear ${application.firstName} ${application.lastName},`,
    '',
    'Thank you for applying. We have received your job application successfully.',
    '',
    `Position: ${application.jobTitle}`,
    `Submitted: ${new Date(application.appliedDate || Date.now()).toLocaleString()}`,
    '',
    'Our recruitment team will review your application and contact you if you are shortlisted.',
    '',
    fromName,
  ].join('\n');

  if (!isSmtpConfigured() || !application.email) {
    logSimulatedEmail('Applicant confirmation', { To: application.email, Subject: subject });
    return { sent: false, simulated: true };
  }

  return sendMailSafe({
    from: `"${fromName}" <${fromEmail}>`,
    to: application.email,
    subject,
    text: textBody,
  });
};

export const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  const { fromEmail, fromName } = getMailDefaults();
  const subject = 'Password Reset Request';
  const textBody = [
    'Hello,',
    '',
    'We received a request to reset your password for Wins Wereld Winkel.',
    '',
    'Click the link below to reset your password:',
    '',
    resetUrl,
    '',
    'This link expires in 1 hour.',
    '',
    'If you did not request this, please ignore this email.',
    '',
    'Regards,',
    'Wins Wereld Winkel',
  ].join('\n');

  console.log('[email-service] Preparing password reset email...');
  console.log(`[email-service]   Recipient: ${to}`);
  console.log(`[email-service]   Subject: ${subject}`);
  console.log(`[email-service]   Reset URL: ${resetUrl}`);
  logSmtpRuntimeDiagnostics('sendPasswordResetEmail');

  if (!isSmtpConfigured()) {
    const configError = getSmtpConfigurationError();
    logSimulatedEmail('Password reset', { To: to, Subject: subject, 'Reset URL': resetUrl });
    return {
      sent: false,
      simulated: true,
      missingVars: configError?.missingVars || getMissingSmtpVars(),
      error: configError?.message,
    };
  }

  return sendMailSafe({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    text: textBody,
    html: `
      <p>Hello,</p>
      <p>We received a request to reset your password for Wins Wereld Winkel.</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you did not request this, please ignore this email.</p>
      <p>Regards,<br/>Wins Wereld Winkel</p>
    `,
  });
};

export const sendJobEnquiryNotificationEmail = async (enquiry) => {
  const { fromEmail, fromName, adminEmail } = getMailDefaults();

  const subject = 'New Job Enquiry Received';
  const textBody = [
    'A new job enquiry has been submitted.',
    '',
    `Name: ${enquiry.fullName}`,
    `Email: ${enquiry.email}`,
    `Phone: ${enquiry.phone}`,
    `Vacancy: ${enquiry.vacancyTitle}`,
    '',
    'Message:',
    enquiry.message,
    '',
    `Submitted: ${new Date(enquiry.submittedAt || Date.now()).toLocaleString()}`,
  ].join('\n');

  if (!isSmtpConfigured() || !adminEmail) {
    logSimulatedEmail('Job enquiry notification', { To: adminEmail || 'not set', Subject: subject });
    return { sent: false, simulated: true };
  }

  return sendMailSafe({
    from: `"${fromName}" <${fromEmail}>`,
    to: adminEmail,
    subject,
    text: textBody,
  });
};

export { buildWhatsAppLink, truncate };
