/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import cmsService, { mapHomeResponse } from '../services/cmsService';
import footerService, { mapFooterApiToFrontend } from '../services/footerService';
import siteSettingsService from '../services/siteSettingsService';

const CMSContext = createContext(null);

export const CMSProvider = ({ children }) => {
  const [cmsData, setCmsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCMSData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Each request degrades independently so a single failure never blanks the
    // shared layout (Navbar/Footer). Defaults come from the service mappers.
    const [home, footer, siteSettings] = await Promise.all([
      cmsService.getHomeSettings().catch((err) => {
        console.error('Failed to load home CMS settings:', err);
        return null;
      }),
      footerService.getFooterSettings().catch((err) => {
        console.error('Failed to load footer CMS settings:', err);
        return null;
      }),
      siteSettingsService.getSiteSettings().catch(() => null),
    ]);

    const safeHome = home || mapHomeResponse({});
    const safeFooter = footer || mapFooterApiToFrontend({});

    setCmsData({
      ...safeHome,
      ...safeFooter,
      storeName: siteSettings?.storeName || safeHome.storeName || 'Wins Wereld Winkel',
      logo: siteSettings?.storeLogo || safeHome.logo || safeFooter.logo || '/logo.png',
      address: siteSettings?.physicalAddress || safeFooter.address,
      supermarketTimings:
        siteSettings?.supermarketOpeningHours ?? safeHome.supermarketTimings,
      foodCornerTimings:
        siteSettings?.foodCornerOpeningHours ?? safeHome.foodCornerTimings,
    });

    if (!home && !footer) {
      setError('Some site content could not be loaded. Showing default content.');
    }

    setLoading(false);
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
