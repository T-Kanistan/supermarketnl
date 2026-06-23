import mongoose from 'mongoose';

const STATUS_TYPES = ['active', 'inactive', 'draft', 'deleted'];

const homepageAboutSectionSchema = new mongoose.Schema(
  {
    useAboutUsPageContent: {
      type: Boolean,
      default: false,
    },
    sectionHeading: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    buttonText: {
      type: String,
      trim: true,
      maxlength: 50,
      default: 'Learn More',
    },
    buttonLink: {
      type: String,
      trim: true,
      default: '/about',
    },
    aboutImage: {
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
    // Legacy field kept for backward compatibility
    useAboutUsContent: { type: Boolean, default: false },
    features: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  {
    timestamps: true,
    collection: 'homepage_about_sections',
  }
);

homepageAboutSectionSchema.index({ status: 1, updatedAt: -1 });

homepageAboutSectionSchema.pre('save', function preSave(next) {
  if (this.useAboutUsPageContent === undefined && this.useAboutUsContent !== undefined) {
    this.useAboutUsPageContent = this.useAboutUsContent;
  }
  this.useAboutUsContent = this.useAboutUsPageContent;

  if (this.status === 'Active') this.status = 'active';
  if (this.status === 'Inactive') this.status = 'inactive';

  next();
});

export const getDefaultHomepageAbout = () => ({
  useAboutUsPageContent: false,
  sectionHeading: 'About Ins Wereld Winkel',
  shortDescription:
    'Founded in July 2022, Wins Wereld Winkel Supermarket has become a trusted destination for quality groceries, fresh produce, international products, and delicious takeaway food.',
  buttonText: 'Learn More',
  buttonLink: '/about',
  aboutImage: '',
  status: 'active',
});

const HomepageAboutSection = mongoose.model('HomepageAboutSection', homepageAboutSectionSchema);

export { STATUS_TYPES };
export default HomepageAboutSection;
