import { expirePastOffers, expireOffersHeroBanners } from '../services/offerService.js';

/** Check often enough that day-boundary activation/expiry feels automatic. */
const INTERVAL_MS = 5 * 60 * 1000;

export const startOfferExpiryJob = () => {
  const runExpiryCheck = async () => {
    try {
      const offerCount = await expirePastOffers();
      const heroCount = await expireOffersHeroBanners();
      if (offerCount > 0) {
        console.log(`[offer-expiry] Synced schedule status for ${offerCount} offer(s)`);
      }
      if (heroCount > 0) {
        console.log(`[offer-expiry] Marked ${heroCount} hero banner(s) as expired`);
      }
    } catch (error) {
      console.error('[offer-expiry] Failed:', error.message);
    }
  };

  runExpiryCheck();
  setInterval(runExpiryCheck, INTERVAL_MS);
};
