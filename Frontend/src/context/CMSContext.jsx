/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import cmsService from '../services/cmsService';

const CMSContext = createContext(null);

export const CMSProvider = ({ children }) => {
  const [cmsData, setCmsData] = useState({
    storeName: 'Ins Wereld Winkel',
    logo: '/logo.png',
    contactEmail: 'info@winswereldwinkel.nl',
    contactPhone: '+31659046526',
    address: 'Amsterdam, Netherlands',
    aboutUs: 'Your premium destination for high-quality groceries and fresh daily produce. We bring the world to your shopping cart with hand-picked items from across the globe, ensuring exceptional quality and value in every aisle.',
    footerDescription: 'Your premium destination for high-quality groceries and fresh daily produce. We bring the world to your shopping cart with hand-picked items from across the globe.',
    supermarketTimings: '8:00 AM - 10:00 PM',
    foodCornerTimings: '11:00 AM - 11:00 PM',
    socials: {
      facebook: '#',
      instagram: '#',
      whatsapp: 'https://wa.me/31659046526',
      tiktok: '#',
      youtube: '#',
    }
  });
  const [loading, setLoading] = useState(true);

  const fetchCMSData = async () => {
    setLoading(true);
    try {
      const data = await cmsService.getSiteSettings();
      setCmsData(data);
    } catch (err) {
      console.error('Failed to load CMS settings, using local fallbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (active) {
        fetchCMSData();
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const updateCMSData = async (newData) => {
    const updated = await cmsService.updateSiteSettings(newData);
    setCmsData(updated);
    return updated;
  };

  return (
    <CMSContext.Provider value={{ cmsData, loading, refreshCMS: fetchCMSData, updateCMSData }}>
      {children}
    </CMSContext.Provider>
  );
};

export const useCMS = () => {
  const context = useContext(CMSContext);
  if (!context) throw new Error('useCMS must be used within a CMSProvider');
  return context;
};

