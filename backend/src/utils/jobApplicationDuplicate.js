import JobApplication from '../models/JobApplication.js';

export const DUPLICATE_APPLICATION_CODE = 'DUPLICATE_APPLICATION';

export const DUPLICATE_APPLICATION_TITLE = "You've Already Applied";

export const DUPLICATE_APPLICATION_MESSAGE =
  "Our records show that you've already submitted an application for this vacancy. Each applicant can apply only once for the same job.";

export class DuplicateJobApplicationError extends Error {
  constructor() {
    super(DUPLICATE_APPLICATION_MESSAGE);
    this.name = 'DuplicateJobApplicationError';
    this.statusCode = 409;
    this.code = DUPLICATE_APPLICATION_CODE;
    this.title = DUPLICATE_APPLICATION_TITLE;
  }
}

export const normalizeApplicantEmail = (email) =>
  String(email || '')
    .trim()
    .toLowerCase();

export const normalizeApplicantPhone = (phone) =>
  String(phone || '').replace(/\D/g, '');

export const findDuplicateApplication = async ({ jobId, email, phoneNumber }) => {
  const vacancyId = String(jobId || '').trim();
  if (!vacancyId) return null;

  const normalizedEmail = normalizeApplicantEmail(email);
  const normalizedPhone = normalizeApplicantPhone(phoneNumber);

  if (normalizedEmail) {
    const byEmail = await JobApplication.findOne({
      jobId: vacancyId,
      email: normalizedEmail,
    }).lean();
    if (byEmail) return byEmail;
  }

  if (!normalizedPhone) return null;

  const byNormalizedPhone = await JobApplication.findOne({
    jobId: vacancyId,
    normalizedPhone,
  }).lean();
  if (byNormalizedPhone) return byNormalizedPhone;

  const sameJobApplications = await JobApplication.find({ jobId: vacancyId })
    .select('phoneNumber email normalizedPhone')
    .lean();

  return (
    sameJobApplications.find(
      (application) => normalizeApplicantPhone(application.phoneNumber) === normalizedPhone
    ) || null
  );
};

export const sendDuplicateApplicationResponse = (res) =>
  res.status(409).json({
    success: false,
    code: DUPLICATE_APPLICATION_CODE,
    title: DUPLICATE_APPLICATION_TITLE,
    message: DUPLICATE_APPLICATION_MESSAGE,
  });
