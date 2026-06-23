import mongoose from 'mongoose';

export const APPLICATION_STATUSES = [
  'pending',
  'reviewed',
  'shortlisted',
  'rejected',
  'hired',
];

export const APPLICATION_STATUS_LABELS = {
  pending: 'New Application',
  reviewed: 'Reviewed',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
  hired: 'Hired',
};

const jobApplicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: [true, 'Job ID is required'],
      trim: true,
      index: true,
    },
    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    employmentType: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: 100,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      maxlength: 30,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: 500,
    },
    cvFile: {
      type: String,
      trim: true,
      default: '',
    },
    appliedDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: 'pending',
      index: true,
    },
    applicationStatus: {
      type: String,
      trim: true,
      default: 'New Application',
    },
  },
  {
    timestamps: true,
    collection: 'job_applications',
  }
);

jobApplicationSchema.index({ createdAt: -1 });
jobApplicationSchema.index({ status: 1, appliedDate: -1 });

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

export default JobApplication;
