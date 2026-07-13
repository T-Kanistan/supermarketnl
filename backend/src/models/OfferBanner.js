import mongoose from 'mongoose';

/**
 * Singleton document holding the Offers page Hero Banner and Promotion Banner.
 * The service layer always reads/writes the single most-recent document.
 */
const offerBannerSchema = new mongoose.Schema(
  {
    // Hero banner (top of the offers page)
    heroImage: {
      type: String,
      trim: true,
      default: '',
    },
    heroTitle: {
      type: String,
      trim: true,
      default: '',
      maxlength: 150,
    },
    heroSubtitle: {
      type: String,
      trim: true,
      default: '',
      maxlength: 200,
    },
    heroDescription: {
      type: String,
      trim: true,
      default: '',
      maxlength: 600,
    },
    heroButtonText: {
      type: String,
      trim: true,
      default: '',
      maxlength: 50,
    },
    heroButtonLink: {
      type: String,
      trim: true,
      default: '',
    },
    heroButton2Text: {
      type: String,
      trim: true,
      default: '',
      maxlength: 50,
    },
    heroButton2Link: {
      type: String,
      trim: true,
      default: '',
    },
    heroOverlayColor: {
      type: String,
      trim: true,
      default: '#0f172a',
    },
    heroOverlayOpacity: {
      type: Number,
      default: 0.55,
      min: 0,
      max: 1,
    },
    heroStatus: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },

    // Promotion banner (mid/bottom of the offers page) — legacy fields retained
    promoImage: {
      type: String,
      trim: true,
      default: '',
    },
    promoTitle: {
      type: String,
      trim: true,
      default: '',
      maxlength: 150,
    },
    promoSubtitle: {
      type: String,
      trim: true,
      default: '',
      maxlength: 200,
    },
    promoDescription: {
      type: String,
      trim: true,
      default: '',
      maxlength: 600,
    },
    promoButtonText: {
      type: String,
      trim: true,
      default: '',
      maxlength: 50,
    },
    promoButtonLink: {
      type: String,
      trim: true,
      default: '',
    },
    promoOverlayColor: {
      type: String,
      trim: true,
      default: '#0f172a',
    },
    promoOverlayOpacity: {
      type: Number,
      default: 0.45,
      min: 0,
      max: 1,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'offer_banners',
  }
);

const OfferBanner = mongoose.model('OfferBanner', offerBannerSchema);

export default OfferBanner;
