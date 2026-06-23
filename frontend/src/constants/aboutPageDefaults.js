export const ABOUT_STORY_IMAGE = '/images/premium_supermarket_hero.png';

export const defaultAboutStats = [
  { value: 15, suffix: 'K+', label: 'Happy Customers' },
  { value: 500, suffix: '+', label: 'Products' },
  { value: 50, suffix: '+', label: 'Categories' },
  { value: 99, suffix: '%', label: 'Customer Satisfaction' },
];

export const defaultAboutOfferings = [
  {
    id: '1',
    title: 'Fresh Vegetables & Fruits',
    description: 'Daily fresh produce for every meal.',
    image: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?auto=format&fit=crop&q=80&w=600',
    isActive: true,
  },
  {
    id: '2',
    title: 'International Groceries',
    description: 'Products from cultures worldwide.',
    image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=600',
    isActive: true,
  },
  {
    id: '3',
    title: 'Fresh Meat & Frozen Foods',
    description: 'Quality cuts and frozen essentials.',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&q=80&w=600',
    isActive: true,
  },
  {
    id: '4',
    title: 'Homemade Takeaway Food',
    description: 'Fresh meals from our Food Corner.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600',
    isActive: true,
  },
];

export const defaultAboutPage = {
  heroEyebrow: 'ABOUT WINS WERELD WINKEL',
  heroHeading: 'Your Trusted International Supermarket & Food Corner in',
  heroHighlight: 'Hilversum',
  heroBadge: 'Serving Hilversum Since 2022',
  heroParagraphs: [
    'Founded in July 2022, Wins Wereld Winkel has become a trusted destination for quality groceries, fresh produce, and delicious takeaway food in Hilversum.',
    'We bring together international products from Asia, Africa, and Arabic countries — giving our community one place to shop for everyday essentials and specialty items.',
    'Our Food Corner serves freshly prepared meals and snacks, while our supermarket shelves stay stocked with affordable, high-quality products.',
    'Every visit is built around friendly service, fair prices, and a welcoming atmosphere for families and neighbours across Hilversum.',
  ],
  heroHighlights: ['quality groceries', 'fresh produce', 'international products', 'Food Corner', 'Hilversum', 'friendly service'],
  heroDescription:
    'Founded in July 2022, Wins Wereld Winkel has become a trusted destination for quality groceries, fresh produce, and delicious takeaway food in Hilversum. We serve our community with international products, affordable prices, and friendly service.',
  heroImage:
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=1400',
  button1Text: 'Explore Products',
  button1Url: '/products',
  button2Text: 'Contact Us',
  button2Url: '/contact',
  heroDisplayOrder: 1,
  heroIsActive: true,
  storyTitle: 'Our Story',
  storyDescription:
    'Established on 01 July 2022 with a vision of creating a supermarket where customers find everything under one roof — from everyday groceries to specialty products from Asia, Africa, and Arabic countries. We continue to grow with our community while staying focused on freshness, variety, and value.',
  storyTimeline: [
    {
      marker: 'July 2022',
      title: 'Store Founded',
      description: 'Wins Wereld Winkel opened in Hilversum with a vision to bring quality groceries and global products under one roof.',
    },
    {
      marker: 'Community Growth',
      title: 'Community Growth',
      description: 'We expanded our international range and built lasting relationships with families across Hilversum.',
    },
    {
      marker: 'Food Corner Launch',
      title: 'Food Corner Launch',
      description: 'Freshly prepared meals and takeaway favourites joined our shelves, making every visit even more convenient.',
    },
    {
      marker: 'Today',
      title: 'Trusted Supermarket in Hilversum',
      description: 'A welcoming one-stop destination for fresh produce, global groceries, and friendly service every day.',
    },
  ],
  storyImage: ABOUT_STORY_IMAGE,
  missionTitle: 'Our Mission',
  missionDescription:
    'High-quality products at affordable prices, exceptional service, and a welcoming environment for everyone.',
  visionTitle: 'Our Vision',
  visionDescription:
    'To become the most trusted multicultural supermarket in the Netherlands through freshness, variety, and value.',
  promiseTitle: 'Our Promise',
  promiseDescription:
    'Fresh quality, fair prices, and friendly service on every visit.',
  mvpCards: [
    { title: 'Our Mission', icon: 'FiTarget', description: 'High-quality products at affordable prices, exceptional service, and a welcoming environment for everyone.', displayOrder: 1, isActive: true },
    { title: 'Our Vision', icon: 'FiEye', description: 'To become the most trusted multicultural supermarket in the Netherlands through freshness, variety, and value.', displayOrder: 2, isActive: true },
    { title: 'Our Promise', icon: 'FiHeart', description: 'Fresh quality, fair prices, and friendly service on every visit.', displayOrder: 3, isActive: true },
  ],
  stats: defaultAboutStats,
  offerings: defaultAboutOfferings,
  owner: {
    name: 'Raguparan Murugamoorthy',
    designation: 'Founder & Owner',
    yearsServing: '5+ Years Serving Community',
    quote:
      'Our goal is to provide quality products, fresh groceries, and excellent customer service to every customer.',
    badge: 'Founder & Owner',
    phone: '+31659046526',
    location: 'Leeuwenstraat 36, 1211 EV, Hilversum',
    photo: '/images/owner-raguparan.png',
    sinceYear: '2022',
    isActive: true,
  },
};

export const mergeAboutPage = (data) => ({
  heroEyebrow: data?.heroEyebrow || defaultAboutPage.heroEyebrow,
  heroHeading: data?.heroHeading || defaultAboutPage.heroHeading,
  heroHighlight: data?.heroHighlight || defaultAboutPage.heroHighlight,
  heroBadge: data?.heroBadge || defaultAboutPage.heroBadge,
  heroDescription: data?.heroDescription || defaultAboutPage.heroDescription,
  heroParagraphs:
    Array.isArray(data?.heroParagraphs) && data.heroParagraphs.length
      ? data.heroParagraphs
      : defaultAboutPage.heroParagraphs,
  heroHighlights: data?.heroHighlights || defaultAboutPage.heroHighlights,
  heroImage: data?.heroImage || defaultAboutPage.heroImage,
  button1Text: data?.button1Text || defaultAboutPage.button1Text,
  button1Url: data?.button1Url || defaultAboutPage.button1Url,
  button2Text: data?.button2Text || defaultAboutPage.button2Text,
  button2Url: data?.button2Url || defaultAboutPage.button2Url,
  heroDisplayOrder: data?.heroDisplayOrder ?? defaultAboutPage.heroDisplayOrder,
  heroIsActive: data?.heroIsActive !== false,
  storyTitle: data?.storyTitle || defaultAboutPage.storyTitle,
  storyDescription: data?.storyDescription || defaultAboutPage.storyDescription,
  storyTimeline:
    Array.isArray(data?.storyTimeline) && data.storyTimeline.length
      ? data.storyTimeline
      : defaultAboutPage.storyTimeline,
  storyImage: data?.storyImage || defaultAboutPage.storyImage,
  missionTitle: data?.missionTitle || defaultAboutPage.missionTitle,
  missionDescription: data?.missionDescription || defaultAboutPage.missionDescription,
  visionTitle: data?.visionTitle || defaultAboutPage.visionTitle,
  visionDescription: data?.visionDescription || defaultAboutPage.visionDescription,
  promiseTitle: data?.promiseTitle || defaultAboutPage.promiseTitle,
  promiseDescription: data?.promiseDescription || defaultAboutPage.promiseDescription,
  mvpCards:
    Array.isArray(data?.mvpCards) && data.mvpCards.length
      ? data.mvpCards
      : defaultAboutPage.mvpCards,
  stats:
    Array.isArray(data?.stats) && data.stats.length
      ? data.stats
      : defaultAboutPage.stats,
  offerings:
    Array.isArray(data?.offerings) && data.offerings.length
      ? data.offerings
      : defaultAboutPage.offerings,
  owner: { ...defaultAboutPage.owner, ...data?.owner },
});

export const emptyAboutPageForm = () => structuredClone(defaultAboutPage);

export const emptyAboutSectionForm = () => ({
  buttonText: '',
  bulletPoints: [],
  image: '',
});
