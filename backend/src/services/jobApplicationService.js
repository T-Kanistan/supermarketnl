import fs from 'fs';
import JobApplication, { APPLICATION_STATUS_LABELS } from '../models/JobApplication.js';
import Vacancy from '../models/Vacancy.js';
import mongoose from 'mongoose';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { resolveJobApplicationCvPath } from '../middlewares/jobApplicationUploadMiddleware.js';

const getStatusLabel = (status) => APPLICATION_STATUS_LABELS[status] || status;

const formatApplication = (doc, options = {}) => {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : doc;
  const id = plain._id?.toString();
  return {
    id,
    vacancyId: plain.jobId,
    jobId: plain.jobId,
    vacancyTitle: plain.jobTitle,
    jobTitle: plain.jobTitle,
    department: plain.department || '',
    employmentType: plain.employmentType || '',
    location: plain.location || '',
    firstName: plain.firstName,
    lastName: plain.lastName,
    applicantName: `${plain.firstName} ${plain.lastName}`.trim(),
    email: plain.email,
    phone: plain.phoneNumber,
    phoneNumber: plain.phoneNumber,
    address: plain.address,
    cvFile: plain.resumeUrl || plain.cvFile || '',
    resumeUrl: plain.resumeUrl || plain.cvFile || '',
    cvDownloadLink: (plain.resumeUrl || plain.cvFile) && id
      ? `/api/admin/applications/${id}/download-cv`
      : null,
    applicationDate: plain.appliedDate || plain.createdAt,
    appliedDate: plain.appliedDate || plain.createdAt,
    status: plain.status,
    applicationStatus: plain.applicationStatus || getStatusLabel(plain.status),
    statusLabel: getStatusLabel(plain.status),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    ...(options.includeCvPath ? { cvAbsolutePath: plain.cvFile } : {}),
  };
};

const resolveVacancySnapshot = async (vacancyId) => {
  if (!vacancyId) return null;
  const lookup = [{ legacyId: vacancyId }];
  if (mongoose.Types.ObjectId.isValid(vacancyId)) lookup.unshift({ _id: vacancyId });
  return Vacancy.findOne({ $or: lookup }).lean();
};

export const createJobApplication = async (payload) => {
  const vacancy = await resolveVacancySnapshot(payload.jobId);
  const resumeUrl = payload.resumeUrl || payload.cvFile || '';

  const application = await JobApplication.create({
    jobId: payload.jobId,
    jobTitle: payload.jobTitle || vacancy?.title || 'Vacancy',
    department: payload.department || vacancy?.department || '',
    employmentType: payload.employmentType || vacancy?.employmentType || '',
    location: payload.location || vacancy?.location || '',
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    phoneNumber: payload.phoneNumber,
    address: payload.address,
    cvFile: resumeUrl,
    resumeUrl,
    appliedDate: new Date(),
    status: 'pending',
    applicationStatus: APPLICATION_STATUS_LABELS.pending,
  });
  return formatApplication(application);
};

export const listJobApplications = async (filters = {}) => {
  const filter = {};
  if (filters.status && filters.status !== 'all') {
    filter.status = filters.status;
  }
  if (filters.vacancyId) {
    filter.jobId = filters.vacancyId;
  }
  if (filters.search) {
    const regex = new RegExp(filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { phoneNumber: regex },
      { jobTitle: regex },
      { department: regex },
      { employmentType: regex },
      { location: regex },
      { address: regex },
    ];
  }

  const { page, limit, skip } = parsePagination(filters);

  const [applications, total] = await Promise.all([
    JobApplication.find(filter)
      .sort({ appliedDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    JobApplication.countDocuments(filter),
  ]);

  return {
    data: applications.map((doc) => formatApplication(doc)),
    pagination: buildPaginationMeta({ page, limit, total }),
  };
};

export const getJobApplicationById = async (id) => {
  const application = await JobApplication.findById(id);
  if (!application) {
    const error = new Error('Application not found');
    error.statusCode = 404;
    throw error;
  }
  return formatApplication(application);
};

export const updateJobApplicationStatus = async (id, status) => {
  const application = await JobApplication.findByIdAndUpdate(
    id,
    {
      status,
      applicationStatus: getStatusLabel(status),
    },
    { new: true, runValidators: true }
  );
  if (!application) {
    const error = new Error('Application not found');
    error.statusCode = 404;
    throw error;
  }
  return formatApplication(application);
};

export const deleteJobApplication = async (id) => {
  const application = await JobApplication.findById(id);
  if (!application) {
    const error = new Error('Application not found');
    error.statusCode = 404;
    throw error;
  }

  if (application.cvFile || application.resumeUrl) {
    try {
      const { absolutePath } = resolveJobApplicationCvPath(
        application.resumeUrl || application.cvFile
      );
      fs.unlinkSync(absolutePath);
    } catch {
      // File may already be removed; continue deleting record.
    }
  }

  await application.deleteOne();
  return formatApplication(application);
};

export const getJobApplicationCvDownload = async (id) => {
  const application = await JobApplication.findById(id).lean();
  if (!application) {
    const error = new Error('Application not found');
    error.statusCode = 404;
    throw error;
  }

  const { absolutePath, filename } = resolveJobApplicationCvPath(
    application.resumeUrl || application.cvFile
  );
  return {
    absolutePath,
    filename,
    applicantName: `${application.firstName} ${application.lastName}`.trim(),
  };
};

export const getRecentJobApplications = async (limit = 10) => {
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const applications = await JobApplication.find()
    .sort({ appliedDate: -1, createdAt: -1 })
    .limit(safeLimit)
    .lean();

  return applications.map((app) => {
    const id = app._id?.toString();
    return {
      id,
      applicantName: `${app.firstName} ${app.lastName}`.trim(),
      jobTitle: app.jobTitle,
      appliedDate: app.appliedDate || app.createdAt,
      status: getStatusLabel(app.status),
      applicationStatus: app.applicationStatus || getStatusLabel(app.status),
      cvDownloadLink: app.resumeUrl || app.cvFile
        ? `/api/admin/applications/${id}/download-cv`
        : null,
    };
  });
};
