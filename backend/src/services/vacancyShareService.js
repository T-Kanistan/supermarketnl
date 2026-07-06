import * as vacancyService from './vacancyService.js';
import { getActiveBannerByPage } from './pageBannerService.js';
import { buildVacancyShareMeta, resolveVacancyImagePath } from '../utils/vacancyShareMeta.js';

const getSiteUrl = () =>
  (process.env.SITE_URL || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

const getSiteName = () =>
  process.env.SITE_OG_NAME || process.env.STORE_NAME || 'Wins Wereld Winkel Supermarket';

const resolveVacancyHeroImage = async () => {
  try {
    const banner = await getActiveBannerByPage('vacancies');
    return banner?.backgroundImage || banner?.image || '';
  } catch {
    return '';
  }
};

export const getVacancyShareMeta = async (id) => {
  const vacancy = await vacancyService.getVacancyById(id);
  const heroImageUrl = await resolveVacancyHeroImage();
  const vacancyImageUrl = resolveVacancyImagePath(vacancy);

  return buildVacancyShareMeta({
    vacancy,
    siteUrl: getSiteUrl(),
    siteName: getSiteName(),
    vacancyImageUrl,
    heroImageUrl,
  });
};
