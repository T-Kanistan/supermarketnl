import { expirePastOffers, expireOffersHeroBanners } from '../services/offerService.js';

const HOUR_MS = 60 * 60 * 1000;

export const startOfferExpiryJob = () => {
  const runExpiryCheck = async () => {
    try {
      const offerCount = await expirePastOffers();
      const heroCount = await expireOffersHeroBanners();
      if (offerCount > 0) {
        console.log(`[offer-expiry] Marked ${offerCount} offer(s) as inactive`);
      }
      if (heroCount > 0) {
        console.log(`[offer-expiry] Marked ${heroCount} hero banner(s) as expired`);
      }
    } catch (error) {
      console.error('[offer-expiry] Failed:', error.message);
    }
  };

  runExpiryCheck();
  setInterval(runExpiryCheck, HOUR_MS);
};
