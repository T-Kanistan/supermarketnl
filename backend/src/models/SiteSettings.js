import mongoose from 'mongoose';

const siteSettingsSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      trim: true,
      default: 'Wins Wereld Winkel',
    },
    storeLogo: {
      type: String,
      default: '/logo.png',
    },
    physicalAddress: {
      type: String,
      default: '',
      trim: true,
    },
    supermarketOpeningHours: {
      type: String,
      default: '8:00 AM - 10:00 PM',
      trim: true,
    },
    foodCornerOpeningHours: {
      type: String,
      default: '11:00 AM - 11:00 PM',
      trim: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true, collection: 'sitesettings' }
);

export const getDefaultSiteSettings = () => ({
  storeName: 'Wins Wereld Winkel',
  storeLogo: '/logo.png',
  physicalAddress: '',
  supermarketOpeningHours: '8:00 AM - 10:00 PM',
  foodCornerOpeningHours: '11:00 AM - 11:00 PM',
});

const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);

export default SiteSettings;
