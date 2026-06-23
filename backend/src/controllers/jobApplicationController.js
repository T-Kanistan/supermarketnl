import path from 'path';
import {
  createJobApplication,
  listJobApplications,
  getJobApplicationById,
  updateJobApplicationStatus,
  deleteJobApplication,
  getJobApplicationCvDownload,
} from '../services/jobApplicationService.js';
import {
  sendJobApplicationAdminEmail,
  sendJobApplicationApplicantEmail,
} from '../services/emailService.js';
import { getJobApplicationCvPublicPath } from '../middlewares/jobApplicationUploadMiddleware.js';
import { sanitizeJobApplicationInput } from '../utils/sanitize.js';

const handleServiceError = (error, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
};

export const submitJobApplication = async (req, res, next) => {
  try {
    const sanitized = sanitizeJobApplicationInput(req.body);
    const cvFile = req.file ? getJobApplicationCvPublicPath(req.file.filename) : '';

    const application = await createJobApplication({
      jobId: sanitized.jobId,
      jobTitle: sanitized.jobTitle,
      department: sanitized.department,
      employmentType: sanitized.employmentType,
      location: sanitized.location,
      firstName: sanitized.firstName,
      lastName: sanitized.lastName,
      email: sanitized.email,
      phoneNumber: sanitized.phoneNumber,
      address: sanitized.address,
      cvFile,
    });

    try {
      await Promise.all([
        sendJobApplicationAdminEmail(application),
        sendJobApplicationApplicantEmail(application),
      ]);
    } catch (emailError) {
      console.error('[job-application] Email notification failed:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message:
        'Your application has been submitted successfully. Our recruitment team will review your application and contact you if shortlisted.',
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

export const getJobApplications = async (req, res, next) => {
  try {
    const result = await listJobApplications({
      status: req.query.status,
      search: req.query.search,
      vacancyId: req.query.vacancyId,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json({
      success: true,
      count: result.data.length,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getJobApplication = async (req, res, next) => {
  try {
    const application = await getJobApplicationById(req.params.id);
    res.json({ success: true, data: application });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const updateApplicationStatus = async (req, res, next) => {
  try {
    const application = await updateJobApplicationStatus(req.params.id, req.body.status);
    res.json({
      success: true,
      message: 'Application status updated',
      data: application,
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const removeJobApplication = async (req, res, next) => {
  try {
    const application = await deleteJobApplication(req.params.id);
    res.json({ success: true, message: 'Application deleted', data: application });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const downloadApplicationCv = async (req, res, next) => {
  try {
    const { absolutePath, filename } = await getJobApplicationCvDownload(req.params.id);
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.sendFile(absolutePath);
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};
