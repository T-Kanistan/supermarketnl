import mongoose from 'mongoose';

export const JOB_ENQUIRY_STATUSES = ['new', 'replied'];

const jobEnquirySchema = new mongoose.Schema(
  {
    vacancyId: {
      type: String,
      required: [true, 'Vacancy ID is required'],
      trim: true,
      index: true,
    },
    vacancyTitle: {
      type: String,
      required: [true, 'Vacancy title is required'],
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: 150,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
      maxlength: 30,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: 2000,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: JOB_ENQUIRY_STATUSES,
      default: 'new',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'job_enquiries',
  }
);

jobEnquirySchema.index({ createdAt: -1 });
jobEnquirySchema.index({ status: 1, submittedAt: -1 });

const JobEnquiry = mongoose.model('JobEnquiry', jobEnquirySchema);

export default JobEnquiry;
