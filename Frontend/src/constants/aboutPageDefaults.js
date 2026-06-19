export const defaultAboutStats = [
  { value: 15, suffix: 'K+', label: 'Happy Customers' },
  { value: 500, suffix: '+', label: 'Products' },
  { value: 50, suffix: '+', label: 'Categories' },
  { value: 99, suffix: '%', label: 'Customer Satisfaction' },
];

export const defaultAboutPage = {
  heroEyebrow: 'ABOUT WINS WERELD WINKEL',
  heroHeading: 'Your Trusted International Supermarket & Food Corner in',
  heroHighlight: 'Hilversum',
  heroBadge: 'Serving Hilversum since 2022',
  heroDescription:
    'Founded in July 2022, Wins Wereld Winkel has become a trusted destination for quality groceries, fresh produce, and delicious takeaway food in Hilversum.',
  heroImage:
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=1400',
  storyTitle: 'Our Story',
  storyDescription: '',
  storyImage:
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
  missionTitle: 'Our Mission',
  missionDescription: '',
  visionTitle: 'Our Vision',
  visionDescription: '',
  promiseTitle: 'Our Promise',
  promiseDescription: '',
  stats: defaultAboutStats,
  offerings: [],
  owner: {
    name: '',
    designation: '',
    quote: '',
    badge: '',
    phone: '',
    location: '',
    photo: '',
  },
};

export const mergeAboutPage = (data) => ({
  heroEyebrow: data?.heroEyebrow || defaultAboutPage.heroEyebrow,
  heroHeading: data?.heroHeading || defaultAboutPage.heroHeading,
  heroHighlight: data?.heroHighlight || defaultAboutPage.heroHighlight,
  heroBadge: data?.heroBadge || defaultAboutPage.heroBadge,
  heroDescription: data?.heroDescription || defaultAboutPage.heroDescription,
  heroImage: data?.heroImage || defaultAboutPage.heroImage,
  storyTitle: data?.storyTitle || defaultAboutPage.storyTitle,
  storyDescription: data?.storyDescription || defaultAboutPage.storyDescription,
  storyImage: data?.storyImage || defaultAboutPage.storyImage,
  missionTitle: data?.missionTitle || defaultAboutPage.missionTitle,
  missionDescription: data?.missionDescription || defaultAboutPage.missionDescription,
  visionTitle: data?.visionTitle || defaultAboutPage.visionTitle,
  visionDescription: data?.visionDescription || defaultAboutPage.visionDescription,
  promiseTitle: data?.promiseTitle || defaultAboutPage.promiseTitle,
  promiseDescription: data?.promiseDescription || defaultAboutPage.promiseDescription,
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
