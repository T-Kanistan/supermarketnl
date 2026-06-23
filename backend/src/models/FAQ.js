import mongoose from 'mongoose';

const STATUS_TYPES = ['active', 'inactive', 'deleted'];

const faqSchema = new mongoose.Schema(
  {
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
      minlength: 5,
      maxlength: 300,
    },
    answer: {
      type: String,
      required: [true, 'Answer is required'],
      trim: true,
      minlength: 10,
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: STATUS_TYPES,
      default: 'active',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    // Legacy alias kept in sync via pre-save
    order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'faqs',
  }
);

faqSchema.index({ displayOrder: 1, createdAt: 1 });
faqSchema.index({ question: 'text', answer: 'text' });

faqSchema.pre('save', function preSave(next) {
  if (this.displayOrder !== undefined && this.displayOrder !== null) {
    this.order = this.displayOrder;
  } else if (this.order !== undefined && this.order !== null) {
    this.displayOrder = this.order;
  }
  next();
});

const FAQ = mongoose.model('FAQ', faqSchema);

export { STATUS_TYPES };
export default FAQ;
