/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import cmsService from '../services/cmsService';
import footerService from '../services/footerService';
import siteSettingsService from '../services/siteSettingsService';

const CMSContext = createContext(null);

export const CMSProvider = ({ children }) => {
  const [cmsData, setCmsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCMSData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [home, footer, siteSettings] = await Promise.all([
        cmsService.getHomeSettings(),
        footerService.getFooterSettings(),
        siteSettingsService.getSiteSettings().catch(() => null),
      ]);
      setCmsData({
        ...home,
        ...footer,
        storeName: siteSettings?.storeName || home.storeName,
        logo: siteSettings?.storeLogo || home.logo,
        address: siteSettings?.physicalAddress || footer.address,
        supermarketTimings:
          siteSettings?.supermarketOpeningHours || home.supermarketTimings,
        foodCornerTimings:
          siteSettings?.foodCornerOpeningHours || home.foodCornerTimings,
      });
    } catch (err) {
      console.error('Failed to load CMS data:', err);
      setError(err.message || 'Failed to load site content. Please try again later.');
      setCmsData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCMSData();
  }, [fetchCMSData]);

  const updateHomeData = async (newData) => {
    const updated = await cmsService.updateHomeSettings(newData);
    setCmsData((prev) => ({ ...prev, ...updated }));
    return updated;
  };

  const updateFooterData = async (formData) => {
    const updated = await footerService.saveFooterFromAdmin(formData);
    setCmsData((prev) => ({ ...prev, ...updated }));
    return updated;
  };

  return (
    <CMSContext.Provider
      value={{
        cmsData,
        loading,
        error,
        refreshCMS: fetchCMSData,
        updateHomeData,
        updateFooterData,
      }}
    >
      {children}
    </CMSContext.Provider>
  );
};

export const useCMS = () => {
  const context = useContext(CMSContext);
  if (!context) throw new Error('useCMS must be used within a CMSProvider');
  return context;
};
