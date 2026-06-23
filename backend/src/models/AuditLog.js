import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    accountType: {
      type: String,
      enum: ['admin', 'manager'],
      default: 'manager',
    },
    action: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    module: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    browser: {
      type: String,
      default: '',
    },
    device: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'audit_logs',
  }
);

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, action: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
