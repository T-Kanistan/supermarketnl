import dotenv from 'dotenv';
import connectMongo from '../config/mongo.js';
import FoodCornerCategory from '../models/FoodCornerCategory.js';
import Product from '../models/Product.js';

dotenv.config();

const DEFAULT_CATEGORIES = [
  {
    slug: 'main-meals',
    categoryName: 'Main Meals',
    icon: '🍜',
    description: 'Hearty main dishes prepared fresh daily.',
    displayOrder: 1,
    status: true,
  },
  {
    slug: 'grilled-specials',
    categoryName: 'Grilled Specials',
    icon: '🍗',
    description: 'Smoky grilled favorites from our kitchen.',
    displayOrder: 2,
    status: true,
  },
  {
    slug: 'rolls-wraps',
    categoryName: 'Rolls & Wraps',
    icon: '🌯',
    description: 'Quick bites wrapped and ready to enjoy.',
    displayOrder: 3,
    status: true,
  },
  {
    slug: 'snacks',
    categoryName: 'Snacks',
    icon: '🥟',
    description: 'Light snacks for any time of day.',
    displayOrder: 4,
    status: true,
  },
  {
    slug: 'drinks',
    categoryName: 'Drinks',
    icon: '🥤',
    description: 'Refreshing beverages and hot drinks.',
    displayOrder: 5,
    status: true,
  },
];

const LEGACY_NAME_TO_SLUG = {
  'Main Meals': 'main-meals',
  'Grilled Specials': 'grilled-specials',
  'Rolls & Wraps': 'rolls-wraps',
  Snacks: 'snacks',
  Drinks: 'drinks',
};

const migrateLegacyCategoryDocuments = async () => {
  const legacyDocs = await FoodCornerCategory.find({});

  for (const doc of legacyDocs) {
    const updates = {};

    if (!doc.categoryName && doc.name) {
      updates.categoryName = doc.name;
    }

    if (typeof doc.status === 'string') {
      updates.status = doc.status === 'active';
    }

    if (Object.keys(updates).length > 0) {
      await FoodCornerCategory.updateOne({ _id: doc._id }, { $set: updates, $unset: { name: 1, image: 1 } });
    }
  }
};

const run = async () => {
  await connectMongo();

  await migrateLegacyCategoryDocuments();

  const categoryBySlug = new Map();

  for (const category of DEFAULT_CATEGORIES) {
    const saved = await FoodCornerCategory.findOneAndUpdate(
      { slug: category.slug },
      { $set: category, $unset: { name: 1, image: 1 } },
      { upsert: true, new: true, runValidators: true }
    );
    categoryBySlug.set(category.slug, saved);
    console.log(`  ✓ ${category.categoryName}`);
  }

  for (const [legacyName, slug] of Object.entries(LEGACY_NAME_TO_SLUG)) {
    const category = categoryBySlug.get(slug);
    if (!category) continue;

    const result = await Product.updateMany(
      {
        type: 'food',
        $or: [{ categoryId: legacyName }, { categoryId: slug }],
      },
      {
        $set: {
          categoryId: category._id,
          categoryName: category.categoryName,
        },
      }
    );

    if (result.modifiedCount) {
      console.log(
        `  ↳ linked ${result.modifiedCount} item(s) to "${category.categoryName}" (${category._id})`
      );
    }
  }

  console.log(`\nFood Corner categories ready (${DEFAULT_CATEGORIES.length} categories).`);
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed to initialize Food Corner categories:', err.message);
  process.exit(1);
});
