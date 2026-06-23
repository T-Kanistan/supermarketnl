export const FOOD_CORNER_CATEGORY_SLUGS = {
  'main-meals': 'Main Meals',
  'grilled-specials': 'Grilled Specials',
  'rolls-wraps': 'Rolls & Wraps',
  snacks: 'Snacks',
  drinks: 'Drinks',
};

export const FOOD_CORNER_CATEGORIES = [
  { slug: 'main-meals', id: 'Main Meals', name: 'Main Meals' },
  { slug: 'grilled-specials', id: 'Grilled Specials', name: 'Grilled Specials' },
  { slug: 'rolls-wraps', id: 'Rolls & Wraps', name: 'Rolls & Wraps' },
  { slug: 'snacks', id: 'Snacks', name: 'Snacks' },
  { slug: 'drinks', id: 'Drinks', name: 'Drinks' },
];

export const resolveFoodCategorySlug = (slug) => {
  if (!slug) return null;
  return FOOD_CORNER_CATEGORY_SLUGS[String(slug).toLowerCase()] || null;
};
