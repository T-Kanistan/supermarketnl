import dotenv from 'dotenv';
import connectMongo from '../config/mongo.js';
import Product from '../models/Product.js';
import FoodCornerCategory from '../models/FoodCornerCategory.js';
import { buildFoodCornerMenuItems } from '../constants/foodCornerMenu.js';

dotenv.config();

const run = async () => {
  await connectMongo();

  const categories = await FoodCornerCategory.find();
  const categoryBySlug = new Map(categories.map((cat) => [cat.slug, cat]));

  const menuItems = buildFoodCornerMenuItems();
  const menuNames = new Set(menuItems.map((item) => item.name));

  const deactivated = await Product.updateMany(
    { type: 'food', name: { $nin: [...menuNames] } },
    { $set: { status: 'inactive' } }
  );

  if (deactivated.modifiedCount) {
    console.log(`Deactivated ${deactivated.modifiedCount} old Food Corner item(s).`);
  }

  for (const item of menuItems) {
    const category = categoryBySlug.get(item.categoryId);
    const payload = {
      ...item,
      categoryId: category?._id || item.categoryId,
      categoryName: category?.categoryName || item.categoryId,
    };

    await Product.findOneAndUpdate(
      { type: 'food', name: item.name },
      { $set: payload },
      { upsert: true, new: true, runValidators: true }
    );
    console.log(`  ✓ ${payload.categoryName} — ${item.name}`);
  }

  console.log(`\nFood Corner menu ready (${menuItems.length} items).`);
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed to initialize Food Corner menu:', err.message);
  process.exit(1);
});
