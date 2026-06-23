import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['unread', 'read'],
      default: 'unread',
      index: true,
    },
    enquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomerEnquiry',
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'notifications',
  }
);

notificationSchema.index({ module: 1, status: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
