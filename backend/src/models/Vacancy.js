import mongoose from 'mongoose';

export const VACANCY_STATUSES = ['Active', 'Inactive', 'Closed', 'Extended', 'Hired'];
export const VACANCY_DEPARTMENTS = ['Supermarket', 'Food Corner'];

const vacancySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: VACANCY_DEPARTMENTS,
      index: true,
    },
    employmentType: {
      type: String,
      required: [true, 'Employment type is required'],
      trim: true,
      maxlength: 50,
    },
    status: {
      type: String,
      enum: VACANCY_STATUSES,
      default: 'Active',
      index: true,
    },
    location: {
      type: String,
      trim: true,
      default: 'Hilversum, Netherlands',
    },
    workingDays: {
      type: String,
      trim: true,
      default: '',
    },
    workingHours: {
      type: String,
      trim: true,
      default: '',
    },
    cvRequired: {
      type: Boolean,
      default: true,
    },
    closingDate: {
      type: Date,
      default: null,
    },
    openDate: {
      type: Date,
      default: null,
    },
    summary: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    icon: {
      type: String,
      trim: true,
      default: 'cashier',
    },
    legacyId: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
    collection: 'vacancies',
  }
);

vacancySchema.index({ status: 1, department: 1, createdAt: -1 });
vacancySchema.index({ createdAt: -1 });

const Vacancy = mongoose.model('Vacancy', vacancySchema);

export default Vacancy;
