export const defaultHomeAbout = {
  summary:
    'Since opening in July 2022, Wins Wereld Winkel has been serving the customers with quality groceries, fresh produce, and delicious homemade takeaway food. We offer a wide range of Asian, African, Arabic, and international products, ensuring our customers find everything they need under one roof.',
  bulletPoints: [
    'Fresh fruits, vegetables, and quality meat',
    'International groceries from around the world',
    'Freshly prepared homemade takeaway meals',
    'Affordable prices and excellent customer service',
  ],
  image:
    'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=1200',
  buttonText: 'Learn More',
};

export const mergeHomeAbout = (aboutSection = {}, summary = '') => ({
  summary: summary || defaultHomeAbout.summary,
  bulletPoints:
    aboutSection.bulletPoints?.length > 0
      ? aboutSection.bulletPoints
      : defaultHomeAbout.bulletPoints,
  image: aboutSection.image || defaultHomeAbout.image,
  buttonText: aboutSection.buttonText || defaultHomeAbout.buttonText,
});
