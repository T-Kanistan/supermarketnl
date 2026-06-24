import Banner, { BANNER_PAGE_TYPES, normalizePageType } from '../models/Banner.js';

const defaults = [
  {
    pageType: 'home',
    badgeText: 'BETTER LIVING',
    title: 'Fresh Products',
    highlightedTitle: 'Better Living',
    description: 'Your one-stop supermarket for quality products and great offers.',
    buttonText: 'EXPLORE PRODUCTS',
    buttonUrl: '/products',
    backgroundImage: '/images/home-banner-produce.jpg',
    sideCardTitle: 'Open Time',
    sideCardDescription: '',
    sideCardIcon: 'clock',
    overlayColor: '#0f172a',
    overlayOpacity: 0.35,
    displayOrder: 0,
    isActive: true,
  },
  {
    pageType: 'products',
    badgeText: 'OUR STORE',
    title: 'Our',
    highlightedTitle: 'Products',
    description: 'Browse fresh groceries, beverages, spices, frozen foods and daily essentials.',
    backgroundImage: '/images/products-hero-banner.png',
    overlayColor: '#000000',
    overlayOpacity: 0.5,
    displayOrder: 0,
    isActive: true,
  },
  {
    pageType: 'foodcorner',
    badgeText: 'FOOD CORNER',
    title: 'Enjoy Delicious',
    highlightedTitle: 'Food Corner',
    description: 'Freshly prepared meals, snacks and beverages made daily.',
    backgroundImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=2000',
    overlayColor: '#0f172a',
    overlayOpacity: 0.45,
    displayOrder: 0,
    isActive: true,
  },
  {
    pageType: 'vacancies',
    badgeText: 'JOIN OUR TEAM',
    title: 'Join Our Team',
    highlightedTitle: '',
    description: 'Build your career with Ins Wereld Winkel.',
    backgroundImage: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=2000',
    overlayColor: '#0f172a',
    overlayOpacity: 0.55,
    displayOrder: 0,
    isActive: true,
  },
  {
    pageType: 'faq',
    badgeText: 'HELP CENTER',
    title: 'Frequently Asked Questions',
    highlightedTitle: '',
    description: 'Find answers about our products, services and store policies.',
    backgroundImage: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=2000',
    overlayColor: '#0f172a',
    overlayOpacity: 0.85,
    displayOrder: 0,
    isActive: true,
  },
  {
    pageType: 'contact',
    badgeText: 'GET IN TOUCH',
    title: 'Contact Us',
    highlightedTitle: '',
    description: 'We are here to help. Reach out anytime.',
    backgroundImage: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=2000',
    overlayColor: '#0f2d52',
    overlayOpacity: 0.9,
    displayOrder: 0,
    isActive: true,
  },
];

const migrateLegacyFields = async () => {
  const docs = await Banner.collection.find({ deletedAt: null }).toArray();
  let migrated = 0;

  for (const doc of docs) {
    const updates = {};

    if (!doc.pageType) {
      updates.pageType = normalizePageType(doc.pageName || doc.pageType);
    }
    if (!doc.title) {
      updates.title = doc.mainHeading || doc.title || '';
    }
    if (!doc.highlightedTitle && doc.highlightText) {
      updates.highlightedTitle = doc.highlightText;
    }
    if (!doc.backgroundImage) {
      updates.backgroundImage = doc.image || doc.backgroundImage || '';
    }
    if (!doc.buttonText && doc.button1Text) {
      updates.buttonText = doc.button1Text;
    }
    if (!doc.buttonUrl && doc.button1Url) {
      updates.buttonUrl = doc.button1Url;
    }
    if (doc.sideCardTitle === undefined) {
      updates.sideCardTitle = doc.sideCardTitle || '';
    }
    if (doc.sideCardDescription === undefined) {
      updates.sideCardDescription = doc.sideCardDescription || '';
    }
    if (doc.sideCardIcon === undefined) {
      updates.sideCardIcon = doc.sideCardIcon || '';
    }

    if (Object.keys(updates).length) {
      await Banner.collection.updateOne({ _id: doc._id }, { $set: updates });
      migrated += 1;
    }
  }

  if (migrated) {
    console.log(`[Banners] Migrated ${migrated} legacy banner record(s).`);
  }
};

export const seedPageBanners = async () => {
  await migrateLegacyFields();

  for (const banner of defaults) {
    const existing = await Banner.findOne({
      pageType: banner.pageType,
      deletedAt: null,
    });
    if (existing) continue;

    const legacyPageName = banner.pageType === 'foodcorner' ? 'food-corner' : banner.pageType;
    const legacyExisting = await Banner.findOne({
      pageName: legacyPageName,
      deletedAt: null,
    });
    if (legacyExisting) continue;

    await Banner.create(banner);
    console.log(`[Banners] Seeded default banner for: ${banner.pageType}`);
  }
};

export default seedPageBanners;
