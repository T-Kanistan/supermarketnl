import Offer from '../models/Offer.js';
import OfferCategory from '../models/OfferCategory.js';

const CATEGORY_NAME = 'Buy 1 Get 1 Deals';
const CATEGORY_SLUG = 'buy-1-get-1-deals';
const LEGACY_NAMES = ['Buy 1 Get 1'];

let migrationRan = false;

export const seedBuy1Get1DealsCategory = async () => {
  if (migrationRan) return;

  try {
    const existing = await OfferCategory.findOne({
      name: new RegExp(`^${CATEGORY_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    });

    if (!existing) {
      for (const legacyName of LEGACY_NAMES) {
        const legacy = await OfferCategory.findOne({ name: legacyName });
        if (!legacy) continue;

        legacy.name = CATEGORY_NAME;
        legacy.slug = CATEGORY_SLUG;
        await legacy.save();
        console.log(`[migration] Offer category renamed: "${legacyName}" -> "${CATEGORY_NAME}"`);
        migrationRan = true;
        break;
      }
    }

    const category = await OfferCategory.findOne({
      name: new RegExp(`^${CATEGORY_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    });

    if (!category) {
      await OfferCategory.create({
        name: CATEGORY_NAME,
        slug: CATEGORY_SLUG,
        status: 'active',
        sortOrder: 1,
      });
      console.log(`[migration] Seeded offer category "${CATEGORY_NAME}"`);
    }

    const offerResult = await Offer.updateMany(
      { category: { $in: LEGACY_NAMES } },
      { $set: { category: CATEGORY_NAME } }
    );

    if (offerResult.modifiedCount > 0) {
      console.log(
        `[migration] Updated ${offerResult.modifiedCount} offer(s) to category "${CATEGORY_NAME}"`
      );
    }

    migrationRan = true;
  } catch (error) {
    console.error(`[migration] Buy 1 Get 1 Deals category seed failed: ${error.message}`);
    throw error;
  }
};

export default seedBuy1Get1DealsCategory;
