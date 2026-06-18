import mongoose from 'mongoose';

const cmsSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
      default: 'Wins Wereld Winkel',
    },
    logo: {
      type: String,
      default: '/logo.png',
    },
    contactEmail: {
      type: String,
      trim: true,
      default: 'info@winswereldwinkel.nl',
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '+31659046526',
    },
    address: {
      type: String,
      trim: true,
      default: 'Amsterdam, Netherlands',
    },
    aboutUs: {
      type: String,
      default: 'Your premium destination for high-quality groceries and fresh daily produce.',
    },
    footerDescription: {
      type: String,
      default: 'Your premium destination for high-quality groceries and fresh daily produce.',
    },
    // Social Links
    facebook: {
      type: String,
      default: '#',
    },
    instagram: {
      type: String,
      default: '#',
    },
    whatsapp: {
      type: String,
      default: 'https://wa.me/31659046526',
    },
    youtube: {
      type: String,
      default: '#',
    },
    tiktok: {
      type: String,
      default: '#',
    },
    supermarketTimings: {
      type: String,
      default: '8:00 AM - 10:00 PM',
    },
    foodCornerTimings: {
      type: String,
      default: '11:00 AM - 11:00 PM',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const CMS = mongoose.model('CMS', cmsSchema);

export default CMS;
