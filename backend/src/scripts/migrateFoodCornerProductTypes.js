import dotenv from 'dotenv';
import connectMongo from '../config/mongo.js';
import Product from '../models/Product.js';
import FoodCornerCategory from '../models/FoodCornerCategory.js';
import { buildFoodCornerMenuItems } from '../constants/foodCornerMenu.js';

dotenv.config();

const TARGET_NAMES = [
  'Chicken Biryani',
  'Chicken Dum Biryani',
  'Biryani',
  'Veg Noodles',
  'Noodles',
  'Kottu Roti',
  'Fried Rice',
  'Chicken Tikka',
  'Tandoori Chicken Leg',
  'Sri Lankan Rolls',
  'Samosa',
];

const escapeForLog = (v) => String(v ?? '').trim();

const run = async () => {
  await connectMongo();

  const menuItems = buildFoodCornerMenuItems();
  const menuByName = new Map(menuItems.map((item) => [String(item.name).toLowerCase(), item]));

  const categories = await FoodCornerCategory.find().lean();
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  const products = await Product.find({
    $or: [{ productName: { $in: TARGET_NAMES } }, { name: { $in: TARGET_NAMES } }],
  });

  const foundByLower = new Map(
    products.map((p) => [
      String(p.productName || p.name || '').toLowerCase(),
      p,
    ])
  );

  const missing = TARGET_NAMES.filter((n) => !foundByLower.has(n.toLowerCase()));
  if (missing.length) {
    console.warn('Missing products (not found by exact name match):', missing.join(', '));
  }

  let updated = 0;
  for (const rawName of TARGET_NAMES) {
    const key = rawName.toLowerCase();
    const product = foundByLower.get(key);
    if (!product) continue;

    const menuItem = menuByName.get(key);
    if (!menuItem) {
      console.warn(`No menu mapping found for "${rawName}", skipping update.`);
      continue;
    }

    const category = categoryBySlug.get(menuItem.categoryId);
    const categoryId = category?._id ? category._id.toString() : menuItem.categoryId;
    const categoryName = category?.categoryName || menuItem.categoryId;

    const nextName = product.productName || product.name || rawName;
    const nextImage = product.imageUrl || product.image || '';

    const stockStatus = product.stockStatus;
    const nextStock =
      stockStatus === 'in_stock'
        ? Math.max(Number(product.stock) || 1, 1)
        : stockStatus === 'out_of_stock'
          ? 0
          : product.stock ?? 0;

    const update = {
      productType: 'food-corner',
      type: 'food',
      categoryId,
      categoryName,
      // Legacy fields used by Food Corner storefront controller
      name: nextName,
      image: nextImage,
      description: product.description || product.shortDescription || '',
      displayTime: product.displayTime || product.menuDisplayTiming || '',
      stock: nextStock,
    };

    // Use updateOne to avoid running validation hooks unexpectedly.
    await Product.updateOne({ _id: product._id }, { $set: update });
    updated += 1;

    console.log(`✓ ${escapeForLog(rawName)} => Food Corner`);
  }

  console.log(`\nMigration complete. Updated ${updated} product(s).`);
  process.exit(0);
};

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

