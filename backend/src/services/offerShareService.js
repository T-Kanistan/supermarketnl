import mongoose from 'mongoose';
import * as offerService from './offerService.js';
import { getActiveBannerByPage } from './pageBannerService.js';
import { buildOfferShareMeta } from '../utils/offerShareMeta.js';

const getSiteUrl = () =>
  (process.env.SITE_URL || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

const getSiteName = () =>
  process.env.SITE_OG_NAME || process.env.STORE_NAME || 'Wins Wereld Winkel';

const resolveOffersFallbackImage = async () => {
  try {
    const banner = await getActiveBannerByPage('offers');
    return banner?.backgroundImage || banner?.image || '';
  } catch {
    return '';
  }
};

export const getOfferShareMeta = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Offer not found');
    error.statusCode = 404;
    throw error;
  }

  const offer = await offerService.getOfferById(id, { publicOnly: true });
  const fallbackImageUrl = await resolveOffersFallbackImage();

  return buildOfferShareMeta({
    offer,
    siteUrl: getSiteUrl(),
    siteName: getSiteName(),
    fallbackImageUrl,
  });
};
