import { useEffect, useMemo, useState } from 'react';
import bannerService from '../services/bannerService';
import { mergePageBanner, normalizePageType } from '../constants/pageBannerDefaults';

const usePageBanner = (pageName) => {
  const [apiBanner, setApiBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchBanner = async () => {
      setLoading(true);
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

  return {
    banner,
    loading,
    error,
    fromApi: Boolean(apiBanner),
  };
};

export default usePageBanner;
