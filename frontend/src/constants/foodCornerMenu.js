/** Default Food Corner categories for local/offline fallback seeding */

export const DEFAULT_FOOD_CORNER_CATEGORIES = [
  {
    id: 'main-meals',
    slug: 'main-meals',
    categoryName: 'Main Meals',
    name: 'Main Meals',
    icon: '🍜',
    description: 'Hearty main dishes prepared fresh daily.',
    displayOrder: 1,
    status: true,
  },
  {
    id: 'grilled-specials',
    slug: 'grilled-specials',
    categoryName: 'Grilled Specials',
    name: 'Grilled Specials',
    icon: '🍗',
    description: 'Smoky grilled favorites from our kitchen.',
    displayOrder: 2,
    status: true,
  },
  {
    id: 'rolls-wraps',
    slug: 'rolls-wraps',
    categoryName: 'Rolls & Wraps',
    name: 'Rolls & Wraps',
    icon: '🌯',
    description: 'Quick bites wrapped and ready to enjoy.',
    displayOrder: 3,
    status: true,
  },
  {
    id: 'snacks',
    slug: 'snacks',
    categoryName: 'Snacks',
    name: 'Snacks',
    icon: '🥟',
    description: 'Light snacks for any time of day.',
    displayOrder: 4,
    status: true,
  },
  {
    id: 'drinks',
    slug: 'drinks',
    categoryName: 'Drinks',
    name: 'Drinks',
    icon: '🥤',
    description: 'Refreshing beverages and hot drinks.',
    displayOrder: 5,
    status: true,
  },
];

const CATEGORY_IMAGES = {
  'main-meals':
    'https://images.unsplash.com/photo-1603133872875-204f41126181?auto=format&fit=crop&q=80&w=600',
  'grilled-specials':
    'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=600',
  'rolls-wraps':
    'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&q=80&w=600',
  snacks:
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=600',
  drinks:
    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=600',
};

const DEFAULT_DESCRIPTIONS = {
  'Fried Rice': 'Fragrant rice tossed with vegetables and spices.',
  'Kottu Roti': 'Shredded roti stir-fried with vegetables and curry.',
  Noodles: 'Savory noodles prepared fresh to order.',
  'Veg Noodles': 'Vegetable noodles with mild spices.',
  Biryani: 'Aromatic rice dish with rich spices.',
  'Chicken Biryani': 'Classic biryani with tender chicken.',
  'Chicken Dum Biryani': 'Slow-cooked dum-style chicken biryani.',
  'Tandoori Chicken Leg': 'Marinated and grilled tandoori chicken leg.',
  'Chicken Tikka': 'Smoky grilled chicken tikka pieces.',
  'Chicken Double Egg Roll': 'Chicken roll with double egg filling.',
  'Sri Lankan Rolls': 'Crispy Sri Lankan-style rolls.',
  Samosa: 'Crispy pastry filled with spiced filling.',
  'Masala Chai': 'Warm spiced tea brewed fresh.',
  Cola: 'Chilled cola drink.',
  'Water Bottle': 'Refreshing bottled water.',
};

const MENU_BY_CATEGORY = {
  'main-meals': [
    'Fried Rice',
    'Kottu Roti',
    'Noodles',
    'Veg Noodles',
    'Biryani',
    'Chicken Biryani',
    'Chicken Dum Biryani',
  ],
  'grilled-specials': ['Tandoori Chicken Leg', 'Chicken Tikka'],
  'rolls-wraps': ['Chicken Double Egg Roll', 'Sri Lankan Rolls'],
  snacks: ['Samosa'],
  drinks: ['Masala Chai', 'Cola', 'Water Bottle'],
};

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const defaultPriceFor = (categorySlug, name) => {
  if (categorySlug === 'drinks') {
    if (name === 'Water Bottle') return 1.49;
    if (name === 'Cola') return 2.49;
    return 2.99;
  }
  if (categorySlug === 'snacks') return 2.99;
  if (categorySlug === 'rolls-wraps') return 6.99;
  if (categorySlug === 'grilled-specials') return 9.99;
  if (name.includes('Biryani')) return 11.99;
  return 8.99;
};

const defaultDisplayTime = (categorySlug) =>
  categorySlug === 'drinks' ? 'All Day' : '11:00 AM - 10:00 PM';

export const buildDefaultFoodCornerProducts = () => {
  const items = [];

  Object.entries(MENU_BY_CATEGORY).forEach(([categoryId, names]) => {
    names.forEach((name, index) => {
      items.push({
        id: `fc-${slugify(name)}`,
        name,
        description: DEFAULT_DESCRIPTIONS[name] || `Fresh ${name} from our Food Corner.`,
        categoryId,
        type: 'food',
        price: defaultPriceFor(categoryId, name),
        image: CATEGORY_IMAGES[categoryId],
        stock: 50,
        status: 'active',
        isFeatured: categoryId === 'main-meals' && index === 0,
        rating: 4.7,
        reviews: 0,
        badge: '',
        displayTime: defaultDisplayTime(categoryId),
      });
    });
  });

  return items;
};

export default DEFAULT_FOOD_CORNER_CATEGORIES;
