import { expireAnnouncements } from '../services/announcementService.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export const startAnnouncementExpiryJob = () => {
  const runExpiryCheck = async () => {
    try {
      const count = await expireAnnouncements();
      if (count > 0) {
        console.log(`[announcement-expiry] Marked ${count} announcement(s) as expired`);
      }
    } catch (error) {
      console.error('[announcement-expiry] Failed:', error.message);
    }
  };

  runExpiryCheck();
  setInterval(runExpiryCheck, DAY_MS);
};
