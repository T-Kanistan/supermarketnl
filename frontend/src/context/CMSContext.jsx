/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import cmsService, { mapHomeResponse } from '../services/cmsService';
import footerService, { mapFooterApiToFrontend } from '../services/footerService';
import siteSettingsService from '../services/siteSettingsService';
import {
  CMS_SETTINGS_EVENT,
  CMS_SETTINGS_STORAGE_KEY,
  notifyCmsSettingsUpdated,
} from '../utils/cmsRefresh';

const CMSContext = createContext(null);

const mergeOpeningHours = (siteSettings, safeHome) => ({
  supermarketTimings:
    siteSettings != null
      ? siteSettings.supermarketOpeningHours ?? ''
      : safeHome.supermarketTimings ?? '',
  foodCornerTimings:
    siteSettings != null
      ? siteSettings.foodCornerOpeningHours ?? ''
      : safeHome.foodCornerTimings ?? '',
});

export { notifyCmsSettingsUpdated };

export const CMSProvider = ({ children }) => {
  const [cmsData, setCmsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCMSData = useCallback(async ({ bustCache = false, silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);

    const [home, footer, siteSettings] = await Promise.all([
      cmsService.getHomeSettings({ bustCache }).catch((err) => {
        console.error('Failed to load home CMS settings:', err);
        return null;
      }),
      footerService.getFooterSettings({ bustCache }).catch((err) => {
        console.error('Failed to load footer CMS settings:', err);
        return null;
      }),
      siteSettingsService.getSiteSettings({ bustCache }).catch(() => null),
    ]);

    const safeHome = home || mapHomeResponse({});
    const safeFooter = footer || mapFooterApiToFrontend({});
    const openingHours = mergeOpeningHours(siteSettings, safeHome);

    setCmsData({
      ...safeHome,
      ...safeFooter,
      ...openingHours,
      storeName: siteSettings?.storeName || safeHome.storeName || 'Wins Wereld Winkel',
      // Store logo (header/general) and footer logo are independent CMS fields.
      logo: siteSettings?.storeLogo || safeHome.logo || '/logo.png',
      footerLogo: safeFooter.logo || siteSettings?.storeLogo || safeHome.logo || '/logo.png',
      address: siteSettings?.physicalAddress || safeFooter.address,
    });

    if (!home && !footer) {
      setError('Some site content could not be loaded. Showing default content.');
    }

    if (!silent) {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCMSData();
  }, [fetchCMSData]);

  useEffect(() => {
    const refreshFromEvent = () => {
      fetchCMSData({ bustCache: true, silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshFromEvent();
      }
    };

    const handleStorage = (event) => {
      if (event.key === CMS_SETTINGS_STORAGE_KEY) {
        refreshFromEvent();
      }
    };

    window.addEventListener(CMS_SETTINGS_EVENT, refreshFromEvent);
    window.addEventListener('focus', refreshFromEvent);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(CMS_SETTINGS_EVENT, refreshFromEvent);
      window.removeEventListener('focus', refreshFromEvent);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, [fetchCMSData]);

  const patchCmsTimings = useCallback((timings = {}) => {
    setCmsData((prev) => ({
      ...(prev || {}),
      supermarketTimings: timings.supermarketTimings ?? prev?.supermarketTimings ?? '',
      foodCornerTimings: timings.foodCornerTimings ?? prev?.foodCornerTimings ?? '',
    }));
  }, []);

  const updateHomeData = async (newData) => {
    const updated = await cmsService.updateHomeSettings(newData);
    patchCmsTimings({
      supermarketTimings: updated.supermarketTimings,
      foodCornerTimings: updated.foodCornerTimings,
    });
    notifyCmsSettingsUpdated();
    setCmsData((prev) => ({ ...prev, ...updated }));
    return updated;
  };

  const updateFooterData = async (formData) => {
    const updated = await footerService.saveFooterFromAdmin(formData);
    patchCmsTimings({
      supermarketTimings: updated.supermarketTimings,
      foodCornerTimings: updated.foodCornerTimings,
    });
    notifyCmsSettingsUpdated();
    setCmsData((prev) => ({
      ...prev,
      ...updated,
      footerLogo: updated.logo || prev?.footerLogo || '/logo.png',
      // Keep store/header logo unchanged when footer logo is updated.
      logo: prev?.logo || updated.logo || '/logo.png',
    }));
    return updated;
  };

  return (
    <CMSContext.Provider
      value={{
        cmsData,
        loading,
        error,
        refreshCMS: () => fetchCMSData({ bustCache: true, silent: true }),
        patchCmsTimings,
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
