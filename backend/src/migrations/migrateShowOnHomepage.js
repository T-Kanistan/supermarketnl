import Product from '../models/Product.js';

export const migrateShowOnHomepage = async () => {
  const products = await Product.find({
    $or: [{ featuredProduct: true }, { isFeatured: true }],
    showOnHomepage: { $ne: true },
  });

  if (!products.length) {
    console.log('[migrateShowOnHomepage] No products need migration.');
    return { updated: 0 };
  }

  let updated = 0;
  for (const product of products) {
    const featured = Boolean(product.featuredProduct ?? product.isFeatured);
    product.showOnHomepage = featured;
    product.featuredProduct = featured;
    product.isFeatured = featured;
    await product.save();
    updated += 1;
  }

  console.log(`[migrateShowOnHomepage] Synced showOnHomepage for ${updated} product(s).`);
  return { updated };
};

export default migrateShowOnHomepage;
