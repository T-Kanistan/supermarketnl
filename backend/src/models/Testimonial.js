import mongoose from 'mongoose';

const STATUS_TYPES = ['active', 'inactive', 'deleted'];
export const DEFAULT_AVATAR = '/default-avatar.png';

const testimonialSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      required: [true, 'Review text is required'],
      trim: true,
      minlength: 20,
      maxlength: 1000,
    },
    avatarImage: {
      type: String,
      trim: true,
      default: '',
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
    // Legacy alias
    image: { type: String, default: '' },
  },
  {
    timestamps: true,
    collection: 'testimonials',
  }
);

testimonialSchema.index({ createdAt: -1 });
testimonialSchema.index({ customerName: 'text', review: 'text' });

testimonialSchema.pre('save', function preSave(next) {
  if (this.avatarImage) this.image = this.avatarImage;
  else if (this.image) this.avatarImage = this.image;
  next();
});

const Testimonial = mongoose.model('Testimonial', testimonialSchema);

export { STATUS_TYPES };
export default Testimonial;
