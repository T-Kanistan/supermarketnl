import { buildWhatsAppLink } from '../utils/whatsapp.js';

const truncate = (text, max = 120) => {
  if (!text) return '';
  return text.length <= max ? text : `${text.slice(0, max)}...`;
};

let cachedTransporter = null;

export const isSmtpConfigured = () =>
  Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim()
  );

const createTransporter = async () => {
  if (!isSmtpConfigured()) {
    return null;
  }

  if (cachedTransporter) {
    return cachedTransporter;
  }

  const nodemailer = await import('nodemailer');
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  cachedTransporter = nodemailer.default.createTransport({
    host: process.env.SMTP_HOST.trim(),
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER.trim(),
      pass: process.env.SMTP_PASS.trim(),
    },
  });

  return cachedTransporter;
};

export const verifySmtpConnection = async () => {
  if (!isSmtpConfigured()) {
    console.warn(
      '[email-service] SMTP not configured. Email features will log only until SMTP_HOST, SMTP_USER, and SMTP_PASS are set.'
    );
    return { configured: false, verified: false };
  }

  try {
    const transporter = await createTransporter();
    await transporter.verify();
    console.log('[email-service] SMTP connection verified successfully.');
    return { configured: true, verified: true };
  } catch (error) {
    console.error(`[email-service] SMTP verification failed: ${error.message}`);
    console.warn('[email-service] Email sending will be attempted but may fail until SMTP is fixed.');
    return { configured: true, verified: false, error: error.message };
  }
};

const getMailDefaults = () => {
  const smtpUser = process.env.SMTP_USER;
  const fromEmail = process.env.SMTP_FROM || smtpUser || 'noreply@winswereldwinkel.nl';
  const fromName = process.env.STORE_NAME || 'Wins Wereld Winkel';
  const adminEmail = process.env.ADMIN_EMAIL || smtpUser;
  return { fromEmail, fromName, adminEmail };
};

const sendMailSafe = async (mailOptions) => {
  const transporter = await createTransporter();
  if (!transporter) {
    return { sent: false, simulated: true };
  }

  try {
    await transporter.sendMail(mailOptions);
    return { sent: true, simulated: false };
  } catch (error) {
    console.error(`[email-service] Failed to send email to ${mailOptions.to}: ${error.message}`);
    return { sent: false, simulated: false, error: error.message };
  }
};

const logSimulatedEmail = (label, details) => {
  if (process.env.NODE_ENV === 'production') {
    console.warn(`[email-service] ${label} — SMTP unavailable, email not sent.`);
    return;
  }
  console.log(`[email-service] ${label} (simulated)`);
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

export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const { fromEmail, fromName } = getMailDefaults();
  const subject = 'Reset Your Password';
  const textBody = [
    `Hi ${name || 'there'},`,
    '',
    'We received a request to reset your password for the Wins Wereld Winkel Admin Portal.',
    '',
    'Click the link below to choose a new password (valid for 1 hour):',
    resetUrl,
    '',
    'If you did not request this, you can safely ignore this email.',
    '',
    fromName,
  ].join('\n');

  if (!isSmtpConfigured()) {
    logSimulatedEmail('Password reset', { To: to, Subject: subject, 'Reset URL': resetUrl });
    return { sent: false, simulated: true };
  }

  return sendMailSafe({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    text: textBody,
    html: `
      <p>Hi ${name || 'there'},</p>
      <p>We received a request to reset your password for the Wins Wereld Winkel Admin Portal.</p>
      <p><a href="${resetUrl}">Reset your password</a> (link valid for 1 hour)</p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <p>${fromName}</p>
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
