import { normalizePageType } from '../constants/pageBannerDefaults';

const pageBannerCache = new Map();

export const getCachedPageBanner = (pageName) => {
  const key = normalizePageType(pageName);
  return pageBannerCache.has(key) ? pageBannerCache.get(key) : undefined;
};

export const setCachedPageBanner = (pageName, data) => {
  pageBannerCache.set(normalizePageType(pageName), data ?? null);
};

export const invalidatePageBannerCache = (pageNameOrType) => {
  pageBannerCache.delete(normalizePageType(pageNameOrType));
};

export const invalidateAllPageBannerCaches = () => {
  pageBannerCache.clear();
};
