import Offer from '../models/Offer.js';
import OfferCategory from '../models/OfferCategory.js';

const OLD_NAME = 'Festival Offers';
const NEW_NAME = 'Seasonal Offers';
const NEW_SLUG = 'seasonal-offers';

let migrationRan = false;

export const migrateFestivalToSeasonalOffers = async () => {
  if (migrationRan) return;

  try {
    const festivalCategory = await OfferCategory.findOne({ name: OLD_NAME });
    const seasonalCategory = await OfferCategory.findOne({ name: NEW_NAME });

    if (festivalCategory && !seasonalCategory) {
      festivalCategory.name = NEW_NAME;
      festivalCategory.slug = NEW_SLUG;
      await festivalCategory.save();
      console.log(`[migration] Offer category renamed: "${OLD_NAME}" -> "${NEW_NAME}"`);
    } else if (festivalCategory && seasonalCategory) {
      await OfferCategory.findByIdAndDelete(festivalCategory._id);
      console.log(
        `[migration] Removed duplicate "${OLD_NAME}" category (already have "${NEW_NAME}")`
      );
    }

    const offerResult = await Offer.updateMany(
      { category: OLD_NAME },
      { $set: { category: NEW_NAME } }
    );

    if (offerResult.modifiedCount > 0) {
      console.log(
        `[migration] Updated ${offerResult.modifiedCount} offer(s) from "${OLD_NAME}" to "${NEW_NAME}"`
      );
    }

    migrationRan = true;
  } catch (error) {
    console.error(`[migration] Festival -> Seasonal offers rename failed: ${error.message}`);
    throw error;
  }
};

export default migrateFestivalToSeasonalOffers;
