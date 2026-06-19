import mongoose from 'mongoose';

const whatWeOfferSchema = new mongoose.Schema(
  {
    categoryName: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    imageUrl: { type: String, default: '' },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const statisticSchema = new mongoose.Schema(
  {
    value: { type: Number, default: 0 },
    suffix: { type: String, default: '', trim: true },
    label: { type: String, default: '', trim: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const homepageAboutSectionSchema = new mongoose.Schema(
  {
    buttonText: { type: String, default: 'Learn More', trim: true },
    features: { type: [String], default: [] },
    image: { type: String, default: '' },
  },
  { _id: false }
);

const heroSectionSchema = new mongoose.Schema(
  {
    eyebrowTag: { type: String, default: '', trim: true },
    pageHeading: { type: String, default: '', trim: true },
    highlightedWord: { type: String, default: '', trim: true },
    description: { type: String, default: '' },
    imageBadgeText: { type: String, default: '', trim: true },
    heroImage: { type: String, default: '' },
  },
  { _id: false }
);

const storySectionSchema = new mongoose.Schema(
  {
    title: { type: String, default: '', trim: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
  },
  { _id: false }
);

const missionVisionPromiseSchema = new mongoose.Schema(
  {
    missionTitle: { type: String, default: '', trim: true },
    missionDescription: { type: String, default: '' },
    visionTitle: { type: String, default: '', trim: true },
    visionDescription: { type: String, default: '' },
    promiseTitle: { type: String, default: '', trim: true },
    promiseDescription: { type: String, default: '' },
  },
  { _id: false }
);

const ownerDetailsSchema = new mongoose.Schema(
  {
    ownerPhoto: { type: String, default: '' },
    ownerName: { type: String, default: '', trim: true },
    designation: { type: String, default: '', trim: true },
    phoneNumber: { type: String, default: '', trim: true },
    location: { type: String, default: '', trim: true },
    badgeText: { type: String, default: '', trim: true },
    ownerQuote: { type: String, default: '' },
  },
  { _id: false }
);

const aboutUsCmsSchema = new mongoose.Schema(
  {
    homepageShortDescription: { type: String, default: '' },
    homepageAboutSection: { type: homepageAboutSectionSchema, default: () => ({}) },
    heroSection: { type: heroSectionSchema, default: () => ({}) },
    storySection: { type: storySectionSchema, default: () => ({}) },
    missionVisionPromise: { type: missionVisionPromiseSchema, default: () => ({}) },
    whatWeOffer: { type: [whatWeOfferSchema], default: [] },
    statistics: { type: [statisticSchema], default: [] },
    ownerDetails: { type: ownerDetailsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const getDefaultAboutCMS = () => ({
  homepageShortDescription:
    'Since opening in July 2022, Wins Wereld Winkel has been serving the customers with quality groceries, fresh produce, and delicious homemade takeaway food. We offer a wide range of Asian, African, Arabic, and international products, ensuring our customers find everything they need under one roof.',
  homepageAboutSection: {
    buttonText: 'Learn More',
    features: [
      'Fresh fruits, vegetables, and quality meat',
      'International groceries from around the world',
      'Freshly prepared homemade takeaway meals',
      'Affordable prices and excellent customer service',
    ],
    image:
      'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=1200',
  },
  heroSection: {
    eyebrowTag: 'ABOUT WINS WERELD WINKEL',
    pageHeading: 'Your Trusted International Supermarket & Food Corner in',
    highlightedWord: 'Hilversum',
    description:
      'Founded in July 2022, Wins Wereld Winkel has become a trusted destination for quality groceries, fresh produce, and delicious takeaway food in Hilversum. We serve our community with international products, affordable prices, and friendly service.',
    imageBadgeText: 'Serving Hilversum since 2022',
    heroImage:
      'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=1400',
  },
  storySection: {
    title: 'Our Story',
    description:
      'Established on 01 July 2022 with a vision of creating a supermarket where customers find everything under one roof.',
    image:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
  },
  missionVisionPromise: {
    missionTitle: 'Our Mission',
    missionDescription:
      'High-quality products at affordable prices, exceptional service, and a welcoming environment for everyone.',
    visionTitle: 'Our Vision',
    visionDescription:
      'To become the most trusted multicultural supermarket in the Netherlands through freshness, variety, and value.',
    promiseTitle: 'Our Promise',
    promiseDescription:
      'Fresh quality, fair prices, and friendly service on every visit.',
  },
  whatWeOffer: [
    {
      categoryName: 'Fresh Vegetables & Fruits',
      description: 'Daily fresh produce for every meal.',
      imageUrl:
        'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?auto=format&fit=crop&q=80&w=600',
      displayOrder: 1,
      isActive: true,
    },
    {
      categoryName: 'International Groceries',
      description: 'Products from cultures worldwide.',
      imageUrl:
        'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=600',
      displayOrder: 2,
      isActive: true,
    },
    {
      categoryName: 'Fresh Meat & Frozen Foods',
      description: 'Quality cuts and frozen essentials.',
      imageUrl:
        'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&q=80&w=600',
      displayOrder: 3,
      isActive: true,
    },
    {
      categoryName: 'Homemade Takeaway Food',
      description: 'Fresh meals from our Food Corner.',
      imageUrl:
        'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600',
      displayOrder: 4,
      isActive: true,
    },
  ],
  statistics: [
    { value: 15, suffix: 'K+', label: 'Happy Customers', displayOrder: 1 },
    { value: 500, suffix: '+', label: 'Products', displayOrder: 2 },
    { value: 50, suffix: '+', label: 'Categories', displayOrder: 3 },
    { value: 99, suffix: '%', label: 'Customer Satisfaction', displayOrder: 4 },
  ],
  ownerDetails: {
    ownerPhoto: '/images/owner-raguparan.png',
    ownerName: 'Raguparan Murugamoorthy',
    designation: 'Founder & Owner',
    phoneNumber: '+31659046526',
    location: 'Leeuwenstraat 36, 1211ev, Hilversum',
    badgeText: 'Since 2022',
    ownerQuote:
      'Our goal is to provide quality products, fresh groceries, and excellent customer service to every customer.',
  },
});

/** Migrate legacy flat documents to nested AboutUsCMS shape. */
export const migrateLegacyAboutDoc = (raw) => {
  if (!raw) return null;

  const legacyOffers = (raw.whatWeOffer || []).map((offer, index) => ({
    categoryName: offer.categoryName || '',
    description: offer.description || '',
    imageUrl: offer.imageUrl || offer.image || '',
    displayOrder: offer.displayOrder ?? offer.order ?? index + 1,
    isActive:
      offer.isActive !== undefined
        ? offer.isActive
        : offer.status !== 'inactive',
    ...(offer._id ? { _id: offer._id } : {}),
  }));

  const sourceStats = raw.statistics?.length ? raw.statistics : raw.stats || [];
  const legacyStats = sourceStats.map((stat, index) => ({
    value: stat.value ?? 0,
    suffix: stat.suffix || '',
    label: stat.label || '',
    displayOrder: stat.displayOrder ?? index + 1,
    ...(stat._id ? { _id: stat._id } : {}),
  }));

  return {
    homepageShortDescription:
      raw.homepageShortDescription?.trim() ||
      raw.homepageDescription ||
      '',
    homepageAboutSection: {
      buttonText: raw.homepageAboutSection?.buttonText || 'Learn More',
      features:
        raw.homepageAboutSection?.features?.length
          ? raw.homepageAboutSection.features
          : [],
      image: raw.homepageAboutSection?.image || raw.aboutImage || '',
    },
    heroSection: {
      eyebrowTag: raw.heroSection?.eyebrowTag || raw.heroEyebrow || '',
      pageHeading: raw.heroSection?.pageHeading || raw.pageHeading || '',
      highlightedWord: raw.heroSection?.highlightedWord || raw.heroHighlight || '',
      description: raw.heroSection?.description || raw.aboutDescription || '',
      imageBadgeText: raw.heroSection?.imageBadgeText || raw.heroBadge || '',
      heroImage: raw.heroSection?.heroImage || raw.aboutImage || '',
    },
    storySection: {
      title: raw.storySection?.title || raw.storyTitle || '',
      description: raw.storySection?.description || raw.storyDescription || '',
      image: raw.storySection?.image || raw.storyImage || '',
    },
    missionVisionPromise: {
      missionTitle: raw.missionVisionPromise?.missionTitle || raw.missionTitle || '',
      missionDescription:
        raw.missionVisionPromise?.missionDescription || raw.missionDescription || '',
      visionTitle: raw.missionVisionPromise?.visionTitle || raw.visionTitle || '',
      visionDescription:
        raw.missionVisionPromise?.visionDescription || raw.visionDescription || '',
      promiseTitle: raw.missionVisionPromise?.promiseTitle || raw.promiseTitle || '',
      promiseDescription:
        raw.missionVisionPromise?.promiseDescription || raw.promiseDescription || '',
    },
    whatWeOffer: legacyOffers,
    statistics: legacyStats,
    ownerDetails: {
      ownerPhoto:
        raw.ownerDetails?.ownerPhoto || raw.ownerDetails?.ownerImage || '',
      ownerName: raw.ownerDetails?.ownerName || '',
      designation: raw.ownerDetails?.designation || '',
      phoneNumber: raw.ownerDetails?.phoneNumber || '',
      location: raw.ownerDetails?.location || '',
      badgeText: raw.ownerDetails?.badgeText || '',
      ownerQuote: raw.ownerDetails?.ownerQuote || raw.ownerDetails?.quote || '',
    },
  };
};

const LEGACY_FIELDS = [
  'homepageDescription',
  'pageHeading',
  'heroEyebrow',
  'heroHighlight',
  'heroBadge',
  'aboutDescription',
  'aboutImage',
  'storyTitle',
  'storyDescription',
  'storyImage',
  'missionTitle',
  'missionDescription',
  'visionTitle',
  'visionDescription',
  'promiseTitle',
  'promiseDescription',
  'stats',
];

const AboutUsCMS = mongoose.model('AboutUsCMS', aboutUsCmsSchema, 'aboutus');

export { LEGACY_FIELDS };
export default AboutUsCMS;
