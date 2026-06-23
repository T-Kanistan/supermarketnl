import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Manager',
      default: null,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    userRole: {
      type: String,
      trim: true,
      default: '',
    },
    userName: {
      type: String,
      trim: true,
      default: '',
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
  },
  {
    timestamps: true,
    collection: 'activity_logs',
  }
);

activityLogSchema.index({ managerId: 1, createdAt: -1 });
activityLogSchema.index({ module: 1, action: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
