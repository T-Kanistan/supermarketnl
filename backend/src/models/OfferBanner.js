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
      default: 'Exclusive Offers & Deals',
      maxlength: 150,
    },
    heroSubtitle: {
      type: String,
      trim: true,
      default: 'Save big every day',
      maxlength: 200,
    },
    heroDescription: {
      type: String,
      trim: true,
      default: 'Discover handpicked discounts across the supermarket and food corner.',
      maxlength: 600,
    },
    heroButtonText: {
      type: String,
      trim: true,
      default: 'Shop Offers',
      maxlength: 50,
    },
    heroButtonLink: {
      type: String,
      trim: true,
      default: '#offers',
    },

    // Promotion banner (mid/bottom of the offers page)
    promoImage: {
      type: String,
      trim: true,
      default: '',
    },
    promoTitle: {
      type: String,
      trim: true,
      default: 'Weekend Specials',
      maxlength: 150,
    },
    promoSubtitle: {
      type: String,
      trim: true,
      default: 'Limited time only',
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
      default: 'Explore Now',
      maxlength: 50,
    },
    promoButtonLink: {
      type: String,
      trim: true,
      default: '#offers',
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
