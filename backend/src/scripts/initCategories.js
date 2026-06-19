import dotenv from 'dotenv';
import connectMongo from '../config/mongo.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { catalogCategories } from '../constants/catalogCategories.js';

dotenv.config();

const legacySlugMap = {
  grocery: 'vegetables-fruits',
  masala: 'spices-masalas',
  vegetables: 'vegetables-fruits',
  sweets: 'beverages-tea',
  frozen: 'frozen-ready-to-eat',
};

const run = async () => {
  await connectMongo();

  for (const item of catalogCategories) {
    await Category.findOneAndUpdate(
      { slug: item.slug },
      {
        slug: item.slug,
        name: item.name,
        image: item.image,
        status: 'active',
      },
      { upsert: true, new: true }
    );
    console.log(`  ✓ ${item.name}`);
  }

  const allowedSlugs = new Set(catalogCategories.map((c) => c.slug));
  const stale = await Category.find({ slug: { $nin: [...allowedSlugs] } });
  if (stale.length) {
    console.log(`\nDeactivating ${stale.length} old category(ies)...`);
    for (const cat of stale) {
      cat.status = 'inactive';
      await cat.save();
      console.log(`  − ${cat.name} (${cat.slug})`);
    }
  }

  console.log('\nUpdating product category references...');
  for (const [oldSlug, newSlug] of Object.entries(legacySlugMap)) {
    const result = await Product.updateMany({ categoryId: oldSlug }, { $set: { categoryId: newSlug } });
    if (result.modifiedCount) {
      console.log(`  ${oldSlug} → ${newSlug}: ${result.modifiedCount} product(s)`);
    }
  }

  console.log('\nCatalog categories ready.');
  console.log('Legacy slug map for products:', legacySlugMap);
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed to initialize categories:', err.message);
  process.exit(1);
});
