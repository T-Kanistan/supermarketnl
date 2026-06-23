import { buildWhatsAppLink } from '../utils/whatsapp.js';

const truncate = (text, max = 120) => {
  if (!text) return '';
  return text.length <= max ? text : `${text.slice(0, max)}...`;
};

const createTransporter = async () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    return null;
  }

  const nodemailer = await import('nodemailer');
  return nodemailer.default.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

const getMailDefaults = () => {
  const smtpUser = process.env.SMTP_USER;
  const fromEmail = process.env.SMTP_FROM || smtpUser || 'noreply@winswereldwinkel.nl';
  const fromName = process.env.STORE_NAME || 'Wins Wereld Winkel';
  const adminEmail = process.env.ADMIN_EMAIL || smtpUser;
  return { fromEmail, fromName, adminEmail };
};

export const sendEnquiryReplyEmail = async ({ to, customerName, subject, replyMessage }) => {
  const { fromEmail, fromName } = getMailDefaults();
  const mailSubject = subject?.startsWith('Re:') ? subject : `Re: ${subject || 'Your Enquiry'}`;
  const textBody = `Hi ${customerName || 'Customer'},\n\n${replyMessage}\n\n---\n${fromName}`;

  const transporter = await createTransporter();
  if (!transporter) {
    console.log('[email-service] SMTP not configured. Reply logged only.');
    console.log(`[email-service] To: ${to}`);
    console.log(`[email-service] Subject: ${mailSubject}`);
    console.log(`[email-service] Body:\n${textBody}`);
    return { sent: false, simulated: true };
  }

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: mailSubject,
    text: textBody,
  });

  return { sent: true, simulated: false };
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

  const transporter = await createTransporter();
  if (!transporter || !adminEmail) {
    console.log('[email-service] SMTP/admin email not configured. Job application logged only.');
    console.log(`[email-service] To: ${adminEmail || 'not set'}`);
    console.log(`[email-service] Subject: ${subject}`);
    console.log(`[email-service] Body:\n${textBody}`);
    return { sent: false, simulated: true };
  }

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: adminEmail,
    subject,
    text: textBody,
  });

  return { sent: true, simulated: false };
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

  const transporter = await createTransporter();
  if (!transporter || !application.email) {
    console.log('[email-service] SMTP not configured. Applicant confirmation logged only.');
    console.log(`[email-service] To: ${application.email}`);
    console.log(`[email-service] Subject: ${subject}`);
    console.log(`[email-service] Body:\n${textBody}`);
    return { sent: false, simulated: true };
  }

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: application.email,
    subject,
    text: textBody,
  });

  return { sent: true, simulated: false };
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

  const transporter = await createTransporter();
  if (!transporter) {
    console.log('[email-service] SMTP not configured. Password reset logged only.');
    console.log(`[email-service] To: ${to}`);
    console.log(`[email-service] Subject: ${subject}`);
    console.log(`[email-service] Reset URL: ${resetUrl}`);
    return { sent: false, simulated: true };
  }

  await transporter.sendMail({
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

  return { sent: true, simulated: false };
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

  const transporter = await createTransporter();
  if (!transporter || !adminEmail) {
    console.log('[email-service] SMTP/admin email not configured. Job enquiry logged only.');
    console.log(`[email-service] To: ${adminEmail || 'not set'}`);
    console.log(`[email-service] Subject: ${subject}`);
    console.log(`[email-service] Body:\n${textBody}`);
    return { sent: false, simulated: true };
  }

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: adminEmail,
    subject,
    text: textBody,
  });

  return { sent: true, simulated: false };
};

export { buildWhatsAppLink, truncate };
