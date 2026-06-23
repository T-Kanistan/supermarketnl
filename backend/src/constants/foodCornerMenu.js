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

const CATEGORY_SLUG_META = {
  'main-meals': {
    label: 'Main Meals',
    image:
      'https://images.unsplash.com/photo-1603133872875-204f41126181?auto=format&fit=crop&q=80&w=600',
  },
  'grilled-specials': {
    label: 'Grilled Specials',
    image:
      'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=600',
  },
  'rolls-wraps': {
    label: 'Rolls & Wraps',
    image:
      'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&q=80&w=600',
  },
  snacks: {
    label: 'Snacks',
    image:
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=600',
  },
  drinks: {
    label: 'Drinks',
    image:
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=600',
  },
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

export const buildFoodCornerMenuItems = () => {
  const items = [];

  Object.entries(MENU_BY_CATEGORY).forEach(([categoryId, names]) => {
    const meta = CATEGORY_SLUG_META[categoryId];
    names.forEach((name, index) => {
      items.push({
        name,
        description: DEFAULT_DESCRIPTIONS[name] || `Fresh ${name} from our Food Corner.`,
        categoryId,
        type: 'food',
        productType: 'food-corner',
        price: defaultPriceFor(categoryId, name),
        image: meta?.image || '',
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
