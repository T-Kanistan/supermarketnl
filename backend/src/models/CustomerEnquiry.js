import mongoose from 'mongoose';
import { ENQUIRY_STATUS_TYPES } from '../constants/enquiryStatuses.js';

const ENQUIRY_TYPES = ['contact-us', 'product-enquiry', 'food-corner-enquiry'];
const SOURCE_TYPES = ['website', 'whatsapp'];

const replyLogSchema = new mongoose.Schema(
  {
    replyMessage: { type: String, required: true, trim: true },
    repliedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    repliedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const customerEnquirySchema = new mongoose.Schema(
  {
    enquiryType: {
      type: String,
      enum: ENQUIRY_TYPES,
      required: true,
      index: true,
    },
    senderName: {
      type: String,
      trim: true,
      default: 'Guest Customer',
      maxlength: 150,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    subject: {
      type: String,
      trim: true,
      default: '',
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    productName: {
      type: String,
      trim: true,
      default: '',
    },
    quantityRequired: {
      type: String,
      trim: true,
      default: '',
    },
    attachment: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ENQUIRY_STATUS_TYPES,
      default: 'New',
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
      default: '',
    },
    repliedAt: {
      type: Date,
      default: null,
    },
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    replyLogs: {
      type: [replyLogSchema],
      default: [],
    },
    source: {
      type: String,
      enum: SOURCE_TYPES,
      default: 'website',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'customer_enquiries',
  }
);

customerEnquirySchema.index({ createdAt: -1 });
customerEnquirySchema.index({ status: 1, enquiryType: 1, createdAt: -1 });
customerEnquirySchema.index({
  senderName: 'text',
  email: 'text',
  subject: 'text',
  message: 'text',
  productName: 'text',
});

const CustomerEnquiry = mongoose.model('CustomerEnquiry', customerEnquirySchema);

export { ENQUIRY_TYPES, SOURCE_TYPES };
export default CustomerEnquiry;
