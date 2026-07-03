import { useEffect, useMemo, useState } from 'react';
import bannerService from '../services/bannerService';
import { mergePageBanner, normalizePageType } from '../constants/pageBannerDefaults';
import { getImageUrl } from '../services/api';

// Append a version query param so browsers never serve a stale cached banner
// after the admin uploads a new image (the updatedAt timestamp changes on save).
const withCacheBust = (url, version) => {
  if (!url || url.startsWith('data:')) return url;
  if (!version) return url;
  const stamp = new Date(version).getTime();
  if (!Number.isFinite(stamp)) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${stamp}`;
};

const usePageBanner = (pageName) => {
  const [apiBanner, setApiBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageReady, setImageReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchBanner = async () => {
      setLoading(true);
      setImageReady(false);
      setError(null);
      try {
        const data = await bannerService.getBannerByPage(normalizePageType(pageName));
        if (!cancelled) {
          setApiBanner(data || null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(`Failed to fetch banner for ${pageName}`, err);
          setError(err);
          setApiBanner(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchBanner();
    return () => {
      cancelled = true;
    };
  }, [pageName]);

  const banner = useMemo(
    () => mergePageBanner(pageName, apiBanner),
    [pageName, apiBanner]
  );

  const version = apiBanner?.updatedAt || apiBanner?.updated_at || null;

  const heroImageUrl = useMemo(
    () => withCacheBust(getImageUrl(banner.backgroundImage || banner.image), version),
    [banner.backgroundImage, banner.image, version]
  );

  // Preload the resolved image after the banner data resolves. Only signal
  // readiness once the final image is fully downloaded, so the hero never
  // flashes the previous/default image while the real one is still loading.
  useEffect(() => {
    if (loading) return undefined;

    if (!heroImageUrl) {
      setImageReady(true);
      return undefined;
    }

    let cancelled = false;
    setImageReady(false);

    const img = new Image();
    const markReady = () => {
      if (!cancelled) setImageReady(true);
    };
    img.onload = markReady;
    img.onerror = markReady;
    img.src = heroImageUrl;
    if (img.complete) markReady();

    return () => {
      cancelled = true;
    };
  }, [loading, heroImageUrl]);

  return {
    banner,
    heroImageUrl,
    loading,
    imageReady,
    ready: !loading && imageReady,
    error,
    fromApi: Boolean(apiBanner),
  };
};

export default usePageBanner;
