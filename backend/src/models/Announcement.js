import mongoose from 'mongoose';

export const ANNOUNCEMENT_STATUSES = ['active', 'inactive', 'draft', 'expired', 'deleted', 'scheduled'];

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      minlength: 3,
      maxlength: 150,
    },
    description: {
      type: String,
      required: [true, 'Announcement description is required'],
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    subtitle: {
      type: String,
      trim: true,
      default: '',
      maxlength: 200,
    },
    badgeText: {
      type: String,
      trim: true,
      default: '',
      maxlength: 60,
    },
    buttonText: {
      type: String,
      trim: true,
      default: 'Shop Offers',
      maxlength: 50,
    },
    buttonLink: {
      type: String,
      trim: true,
      default: '/offers',
    },
    overlayColor: {
      type: String,
      trim: true,
      default: '#0f172a',
    },
    overlayOpacity: {
      type: Number,
      default: 0.35,
      min: 0,
      max: 1,
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    bannerImage: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ANNOUNCEMENT_STATUSES,
      default: 'draft',
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
    // Legacy aliases
    image: { type: String, default: '' },
    offerPercentage: { type: Number, default: 0, min: 0, max: 100 },
  },
  {
    timestamps: true,
    collection: 'announcements',
  }
);

announcementSchema.index({ status: 1 });
announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ title: 'text', description: 'text' });

announcementSchema.pre('save', function preSave(next) {
  if (this.bannerImage) this.image = this.bannerImage;
  else if (this.image) this.bannerImage = this.image;

  if (this.discountPercentage !== undefined) {
    this.offerPercentage = this.discountPercentage;
  } else if (this.offerPercentage !== undefined) {
    this.discountPercentage = this.offerPercentage;
  }
  next();
});

announcementSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update) {
    const getField = (key) => {
      if (update.$set && update.$set[key] !== undefined) return update.$set[key];
      return update[key];
    };

    const setField = (key, val) => {
      if (update.$set) {
        update.$set[key] = val;
      } else {
        update[key] = val;
      }
    };

    const bannerImage = getField('bannerImage');
    const image = getField('image');
    if (bannerImage !== undefined) setField('image', bannerImage);
    else if (image !== undefined) setField('bannerImage', image);

    const discountPercentage = getField('discountPercentage');
    const offerPercentage = getField('offerPercentage');
    if (discountPercentage !== undefined) setField('offerPercentage', discountPercentage);
    else if (offerPercentage !== undefined) setField('discountPercentage', offerPercentage);
  }
  next();
});

const Announcement = mongoose.model('Announcement', announcementSchema);

export default Announcement;
