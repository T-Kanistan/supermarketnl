import { expirePastOffers } from '../services/offerService.js';

const HOUR_MS = 60 * 60 * 1000;

export const startOfferExpiryJob = () => {
  const runExpiryCheck = async () => {
    try {
      const count = await expirePastOffers();
      if (count > 0) {
        console.log(`[offer-expiry] Marked ${count} offer(s) as inactive`);
      }
    } catch (error) {
      console.error('[offer-expiry] Failed:', error.message);
    }
  };

  runExpiryCheck();
  setInterval(runExpiryCheck, HOUR_MS);
};
