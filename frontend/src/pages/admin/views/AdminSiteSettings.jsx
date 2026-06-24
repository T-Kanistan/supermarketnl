import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCMS } from '../../../context/CMSContext';
import { useToast } from '../../../context/ToastContext';
import { getImageUrl } from '../../../services/api';
import { emptyAboutPageForm, emptyAboutSectionForm } from '../../../constants/aboutPageDefaults';
import { emptyContactPageForm, mergeContactPage } from '../../../constants/contactPageDefaults';
import { emptyFooterPageForm, mergeFooterPage } from '../../../constants/footerPageDefaults';
import contactSettingsService from '../../../services/contactSettingsService';
import siteSettingsService from '../../../services/siteSettingsService';
import aboutUsService from '../../../services/aboutUsService';
import { FaUpload, FaPlus, FaTrash, FaFacebook, FaInstagram, FaWhatsapp, FaTiktok, FaYoutube } from 'react-icons/fa';
import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';

const buildFormState = (cmsData) => ({
  storeName: cmsData?.storeName || '',
  logo: cmsData?.logo || '',
  contactEmail: cmsData?.contactEmail || '',
  contactPhone: cmsData?.contactPhone || '',
  address: cmsData?.address || '',
  aboutUs: cmsData?.aboutUs || '',
  footerDescription: cmsData?.footerDescription || '',
  supermarketTimings: cmsData?.supermarketTimings || '',
  foodCornerTimings: cmsData?.foodCornerTimings || '',
  featuresSection: cmsData?.featuresSection || { items: [] },
  aboutSection: cmsData?.aboutSection || emptyAboutSectionForm(),
  foodCornerPromo: cmsData?.foodCornerPromo || {},
  aboutPage: cmsData?.aboutPage || emptyAboutPageForm(),
  contactPage: mergeContactPage(cmsData?.contactPage),
  footerPage: mergeFooterPage(cmsData?.footerPage),
  socials: {
    facebook: cmsData?.socials?.facebook || '',
    instagram: cmsData?.socials?.instagram || '',
    whatsapp: cmsData?.socials?.whatsapp || '',
    tiktok: cmsData?.socials?.tiktok || '',
    youtube: cmsData?.socials?.youtube || '',
  },
});

const AboutImageUpload = ({ label, value, inputId, onUpload }) => (
  <div className="admin-form-group">
    <label>{label}</label>
    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
      {value && (
        <img
          src={getImageUrl(value)}
          alt={label}
          style={{ height: '100px', width: '140px', objectFit: 'cover', border: '1px solid #cbd5e1', borderRadius: '8px' }}
        />
      )}
      <div className="image-upload-zone" style={{ flex: 1, minWidth: '200px', padding: '16px' }}>
        <input type="file" accept="image/*" id={inputId} onChange={onUpload} style={{ display: 'none' }} />
        <label htmlFor={inputId} style={{ cursor: 'pointer', margin: 0 }}>
          <FaUpload className="upload-icon" style={{ fontSize: '1.5rem', marginBottom: '4px' }} />
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Upload image (Max 3MB)</p>
        </label>
      </div>
    </div>
  </div>
);

const FooterLinkRow = ({ link, onChange, onRemove, showEnabled = true }) => (
  <div className="footer-link-row">
    <div className="admin-form-group" style={{ marginBottom: 0 }}>
      <label>Label</label>
      <input
        type="text"
        value={link.label}
        onChange={(e) => onChange('label', e.target.value)}
        placeholder="Link text"
      />
    </div>
    <div className="admin-form-group" style={{ marginBottom: 0 }}>
      <label>Path / URL</label>
      <input
        type="text"
        value={link.path}
        onChange={(e) => onChange('path', e.target.value)}
        placeholder="/products or https://..."
      />
    </div>
    {showEnabled && (
      <label className="footer-link-toggle">
        <input
          type="checkbox"
          checked={link.enabled !== false}
          onChange={(e) => onChange('enabled', e.target.checked)}
        />
        Show
      </label>
    )}
    <button type="button" className="footer-link-remove" onClick={onRemove} aria-label="Remove link">
      <FaTrash />
    </button>
  </div>
);

const FooterPreview = ({ formData }) => {
  const footer = formData.footerPage;
  const quickLinks = footer.quickLinks.filter((l) => l.enabled && l.label);
  const categoryLinks = footer.categoryLinks.filter((l) => l.enabled && l.label);
  const legalLinks = footer.legalLinks.filter((l) => l.enabled && l.label);

  return (
    <div className="footer-admin-preview">
      <p className="footer-admin-preview-label">Live Preview</p>
      <div className="footer-admin-preview-inner">
        <div className="footer-admin-preview-grid">
          <div className="footer-admin-preview-col brand">
            <img src={getImageUrl(formData.logo) || '/logo.png'} alt="Logo" className="footer-admin-preview-logo" />
            <p>{formData.footerDescription || 'Footer description...'}</p>
            <div className="footer-admin-preview-socials">
              {formData.socials.facebook && <span className="fb"><FaFacebook /></span>}
              {formData.socials.instagram && <span className="ig"><FaInstagram /></span>}
              {formData.socials.whatsapp && <span className="wa"><FaWhatsapp /></span>}
              {formData.socials.tiktok && <span className="tt"><FaTiktok /></span>}
              {formData.socials.youtube && <span className="yt"><FaYoutube /></span>}
            </div>
          </div>
          <div className="footer-admin-preview-col">
            <h5>{footer.quickLinksTitle}</h5>
            <ul>{quickLinks.map((l) => <li key={l.id}>{l.label}</li>)}</ul>
          </div>
          <div className="footer-admin-preview-col">
            <h5>{footer.categoriesTitle}</h5>
            <ul>{categoryLinks.map((l) => <li key={l.id}>{l.label}</li>)}</ul>
          </div>
          <div className="footer-admin-preview-col">
            <h5>{footer.businessHoursTitle}</h5>
            <p><FiClock /> {footer.supermarketLabel}</p>
            <small>{formData.supermarketTimings}</small>
            <p><FiClock /> {footer.foodCornerLabel}</p>
            <small>{formData.foodCornerTimings}</small>
            {footer.sundayHours && <small>{footer.sundayHours}</small>}
          </div>
          <div className="footer-admin-preview-col">
            <h5>{footer.contactTitle}</h5>
            <p><FiMapPin /> {formData.address}</p>
            <p><FiPhone /> {formData.contactPhone}</p>
            <p><FiMail /> {formData.contactEmail}</p>
          </div>
        </div>
        <div className="footer-admin-preview-bottom">
          <div>{legalLinks.map((l) => <span key={l.id}>{l.label}</span>)}</div>
          <p>&copy; {new Date().getFullYear()} {footer.copyrightText || formData.storeName}. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
};

export const AdminSiteSettings = () => {
  const { cmsData, updateHomeData, updateFooterData, refreshCMS, loading } = useCMS();
  const { addToast } = useToast();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    ...buildFormState(null),
    aboutPage: emptyAboutPageForm(),
    contactPage: emptyContactPageForm(),
    footerPage: emptyFooterPageForm(),
  });

  useEffect(() => {
    const tab = location.state?.settingsTab;
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.state?.settingsTab]);

  useEffect(() => {
    let isMounted = true;
    const initForm = async () => {
      await Promise.resolve();
      if (!isMounted) return;

      const base = buildFormState(cmsData);
      let next = { ...base };

      try {
        const aboutData = await aboutUsService.getAboutUs();
        if (aboutData && isMounted) {
          next = {
            ...next,
            aboutUs: aboutData.aboutUs || '',
            aboutSection: aboutData.aboutSection || emptyAboutSectionForm(),
            aboutPage: aboutData.aboutPage || emptyAboutPageForm(),
          };
        }
      } catch (err) {
        console.warn('About Us API unavailable, using CMS fallback.', err);
      }

      try {
        const siteSettings = await siteSettingsService.getSiteSettings();
        if (siteSettings && isMounted) {
          next = {
            ...next,
            storeName: siteSettings.storeName || next.storeName,
            logo: siteSettings.storeLogo || next.logo,
            address: siteSettings.physicalAddress || next.address,
            supermarketTimings: siteSettings.supermarketOpeningHours || next.supermarketTimings,
            foodCornerTimings: siteSettings.foodCornerOpeningHours || next.foodCornerTimings,
          };
        }
      } catch (err) {
        console.warn('Site settings API unavailable, using CMS fallback.', err);
      }

      try {
        const contactSettings = await contactSettingsService.getContactSettings();
        if (contactSettings && isMounted) {
          next = {
            ...next,
            contactPhone: contactSettings.contactPhone || next.contactPhone,
            contactEmail: contactSettings.contactEmail || next.contactEmail,
            contactPage: mergeContactPage({
              ...next.contactPage,
              ...contactSettings.contactPage,
            }),
          };
        }
      } catch (err) {
        console.warn('Contact settings API unavailable, using CMS fallback.', err);
      }

      if (isMounted) {
        setFormData(next);
      }
    };
    initForm();
    return () => { isMounted = false; };
  }, [cmsData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      socials: {
        ...prev.socials,
        [name]: value
      }
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        addToast('File too large. Max size is 2MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, logo: reader.result }));
        addToast('Logo loaded. Save settings to apply.', 'info');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAboutImageUpload = (field) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      addToast('File too large. Max size is 3MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (field === 'owner.photo') {
        setFormData((prev) => ({
          ...prev,
          aboutPage: {
            ...prev.aboutPage,
            owner: { ...prev.aboutPage.owner, photo: reader.result },
          },
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          aboutPage: { ...prev.aboutPage, [field]: reader.result },
        }));
      }
      addToast('Image loaded. Save settings to apply.', 'info');
    };
    reader.readAsDataURL(file);
  };

  const updateAboutPage = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      aboutPage: { ...prev.aboutPage, [field]: value },
    }));
  };

  const updateOwner = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      aboutPage: {
        ...prev.aboutPage,
        owner: { ...prev.aboutPage.owner, [field]: value },
      },
    }));
  };

  const updateOffering = (index, field, value) => {
    setFormData((prev) => {
      const offerings = [...prev.aboutPage.offerings];
      offerings[index] = { ...offerings[index], [field]: value };
      return { ...prev, aboutPage: { ...prev.aboutPage, offerings } };
    });
  };

  const updateAboutStat = (index, field, value) => {
    setFormData((prev) => {
      const stats = [...(prev.aboutPage.stats || [])];
      stats[index] = { ...stats[index], [field]: field === 'value' ? Number(value) || 0 : value };
      return { ...prev, aboutPage: { ...prev.aboutPage, stats } };
    });
  };

  const addOffering = () => {
    setFormData((prev) => ({
      ...prev,
      aboutPage: {
        ...prev.aboutPage,
        offerings: [
          ...prev.aboutPage.offerings,
          { id: `${Date.now()}`, title: '', description: '', image: '' },
        ],
      },
    }));
  };

  const removeOffering = (index) => {
    setFormData((prev) => ({
      ...prev,
      aboutPage: {
        ...prev.aboutPage,
        offerings: prev.aboutPage.offerings.filter((_, i) => i !== index),
      },
    }));
  };

  const updateAboutSection = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      aboutSection: { ...prev.aboutSection, [field]: value },
    }));
  };

  const updateAboutBullet = (index, value) => {
    setFormData((prev) => {
      const bulletPoints = [...(prev.aboutSection?.bulletPoints || [])];
      bulletPoints[index] = value;
      return { ...prev, aboutSection: { ...prev.aboutSection, bulletPoints } };
    });
  };

  const addAboutBullet = () => {
    setFormData((prev) => ({
      ...prev,
      aboutSection: {
        ...prev.aboutSection,
        bulletPoints: [...(prev.aboutSection?.bulletPoints || []), ''],
      },
    }));
  };

  const removeAboutBullet = (index) => {
    setFormData((prev) => ({
      ...prev,
      aboutSection: {
        ...prev.aboutSection,
        bulletPoints: (prev.aboutSection?.bulletPoints || []).filter((_, i) => i !== index),
      },
    }));
  };

  const handleAboutSectionImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      addToast('File too large. Max size is 3MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      updateAboutSection('image', reader.result);
      addToast('Image loaded. Save settings to apply.', 'info');
    };
    reader.readAsDataURL(file);
  };

  const updateContactPage = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      contactPage: { ...prev.contactPage, [field]: value },
    }));
  };

  const updateFooterPage = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      footerPage: { ...prev.footerPage, [field]: value },
    }));
  };

  const updateFooterLinks = (listKey, index, field, value) => {
    setFormData((prev) => {
      const links = [...prev.footerPage[listKey]];
      links[index] = { ...links[index], [field]: value };
      return { ...prev, footerPage: { ...prev.footerPage, [listKey]: links } };
    });
  };

  const addFooterLink = (listKey) => {
    setFormData((prev) => ({
      ...prev,
      footerPage: {
        ...prev.footerPage,
        [listKey]: [
          ...prev.footerPage[listKey],
          { id: `${listKey}-${Date.now()}`, label: '', path: '/', enabled: true },
        ],
      },
    }));
  };

  const removeFooterLink = (listKey, index) => {
    setFormData((prev) => ({
      ...prev,
      footerPage: {
        ...prev.footerPage,
        [listKey]: prev.footerPage[listKey].filter((_, i) => i !== index),
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (activeTab === 'contact') {
        const updated = await contactSettingsService.updateContactSettings(formData);
        await refreshCMS();
        setFormData((prev) => ({
          ...prev,
          contactPhone: updated.contactPhone,
          contactEmail: updated.contactEmail,
          storeName: updated.storeName,
          address: updated.address,
          supermarketTimings: updated.supermarketTimings,
          foodCornerTimings: updated.foodCornerTimings,
          contactPage: mergeContactPage(updated.contactPage),
        }));
        addToast('Contact settings updated successfully!', 'success');
      } else if (activeTab === 'about') {
        const synced = await aboutUsService.updateAboutUs(formData);
        setFormData((prev) => ({
          ...prev,
          aboutUs: synced?.aboutUs || prev.aboutUs,
          aboutSection: synced?.aboutSection || prev.aboutSection,
          aboutPage: synced?.aboutPage || prev.aboutPage,
        }));
        addToast('About Us settings updated successfully!', 'success');
      } else if (activeTab === 'footer') {
        await updateFooterData(formData);
        addToast('Footer settings updated successfully!', 'success');
      } else {
        const updated = await siteSettingsService.updateSiteSettings(formData);
        await refreshCMS();
        setFormData((prev) => ({
          ...prev,
          storeName: updated.storeName || prev.storeName,
          logo: updated.storeLogo || prev.logo,
          address: updated.physicalAddress || prev.address,
          supermarketTimings: updated.supermarketOpeningHours || prev.supermarketTimings,
          foodCornerTimings: updated.foodCornerOpeningHours || prev.foodCornerTimings,
        }));
        addToast('Settings updated successfully', 'success');
      }
    } catch (err) {
      console.error('Failed to update settings', err);
      addToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-loading-skeleton" style={{ background: 'white', padding: '40px', borderRadius: '16px', animation: 'pulse 1.5s infinite ease-in-out' }}>
        <div style={{ height: '30px', width: '200px', background: '#cbd5e1', marginBottom: '20px' }}></div>
        <div style={{ height: '200px', background: '#cbd5e1' }}></div>
      </div>
    );
  }

  return (
    <div className="settings-tabs-container">
      {/* Sidebar Tabs list */}
      <div className="settings-tabs-list">
        <button 
          className={`settings-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General Settings
        </button>
        <button 
          className={`settings-tab-btn ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          Contact Us Setting
        </button>
        <button 
          className={`settings-tab-btn ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          About Us Section
        </button>
        <button 
          className={`settings-tab-btn ${activeTab === 'footer' ? 'active' : ''}`}
          onClick={() => setActiveTab('footer')}
        >
          Footer Details
        </button>
        <button 
          className={`settings-tab-btn ${activeTab === 'socials' ? 'active' : ''}`}
          onClick={() => setActiveTab('socials')}
        >
          Social Media Links
        </button>
      </div>

      {/* Forms content side */}
      <div className="settings-form-content">
        <form onSubmit={handleSubmit}>
          {activeTab === 'general' && (
            <div>
              <h3>General Settings</h3>
              <div className="admin-form-group">
                <label>Store Name</label>
                <input 
                  type="text" 
                  name="storeName" 
                  value={formData.storeName} 
                  onChange={handleChange} 
                  placeholder="e.g. Ins Wereld Winkel" 
                  required 
                />
              </div>
              <div className="admin-form-group">
                <label>Store Logo</label>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  {formData.logo && (
                    <img 
                      src={getImageUrl(formData.logo)} 
                      alt="Logo preview" 
                      style={{ height: '80px', width: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px', background: 'white' }} 
                    />
                  )}
                  <div className="image-upload-zone" style={{ flex: 1, padding: '16px' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      id="logo-file" 
                      onChange={handleLogoUpload} 
                      style={{ display: 'none' }} 
                    />
                    <label htmlFor="logo-file" style={{ cursor: 'pointer', margin: 0 }}>
                      <FaUpload className="upload-icon" style={{ fontSize: '1.5rem', marginBottom: '4px' }} />
                      <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Select store logo image (Max 2MB)</p>
                    </label>
                  </div>
                </div>
              </div>
              <div className="admin-form-group">
                <label>Physical Address</label>
                <textarea 
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange} 
                  rows="3" 
                  placeholder="Amsterdam, Netherlands"
                  required
                />
              </div>
              <div className="admin-form-group row-split">
                <div>
                  <label>Supermarket Opening Hours</label>
                  <input 
                    type="text" 
                    name="supermarketTimings" 
                    value={formData.supermarketTimings} 
                    onChange={handleChange} 
                    placeholder="e.g. 8:00 AM - 10:00 PM" 
                    required 
                  />
                </div>
                <div>
                  <label>Food Corner Opening Hours</label>
                  <input 
                    type="text" 
                    name="foodCornerTimings" 
                    value={formData.foodCornerTimings} 
                    onChange={handleChange} 
                    placeholder="e.g. 11:00 AM - 11:00 PM" 
                    required 
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="about-settings-sections">
              <h3>Contact Us Page Settings</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>
                Manage contact information and the message form shown on the Contact page.
              </p>

              <div className="settings-subsection">
                <h4>1. Contact Information</h4>
                <div className="admin-form-group row-split">
                  <div>
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      placeholder="+31659046526"
                      required
                    />
                  </div>
                  <div>
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      placeholder="info@winswereldwinkel.nl"
                      required
                    />
                  </div>
                </div>
                <div className="admin-form-group row-split">
                  <div>
                    <label>Phone Subtext</label>
                    <input
                      type="text"
                      value={formData.contactPage.phoneSubtext}
                      onChange={(e) => updateContactPage('phoneSubtext', e.target.value)}
                      placeholder="Leave empty to use: Supermarket: [opening hours]"
                    />
                    <p className="admin-field-hint">Shown under phone on contact page. Empty = auto supermarket hours.</p>
                  </div>
                  <div>
                    <label>Email Subtext</label>
                    <input
                      type="text"
                      value={formData.contactPage.emailNote}
                      onChange={(e) => updateContactPage('emailNote', e.target.value)}
                      placeholder="We reply within 24 hours"
                    />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>Store Name (Location Line 1)</label>
                  <input
                    type="text"
                    name="storeName"
                    value={formData.storeName}
                    onChange={handleChange}
                    placeholder="Ins Wereld Winkel"
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label>Store Address (Location Line 2)</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Amsterdam, Netherlands"
                    required
                  />
                </div>
                <div className="admin-form-group row-split">
                  <div>
                    <label>Supermarket Opening Hours</label>
                    <input
                      type="text"
                      name="supermarketTimings"
                      value={formData.supermarketTimings}
                      onChange={handleChange}
                      placeholder="8:00 AM - 10:00 PM"
                      required
                    />
                  </div>
                  <div>
                    <label>Food Corner Opening Hours</label>
                    <input
                      type="text"
                      name="foodCornerTimings"
                      value={formData.foodCornerTimings}
                      onChange={handleChange}
                      placeholder="11:00 AM - 11:00 PM"
                      required
                    />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>Holiday Hours Note</label>
                  <input
                    type="text"
                    value={formData.contactPage.holidayHours}
                    onChange={(e) => updateContactPage('holidayHours', e.target.value)}
                    placeholder="Opens as Announced"
                  />
                </div>
              </div>

              <div className="settings-subsection">
                <h4>2. Page Hero</h4>
                <div className="admin-form-group row-split">
                  <div>
                    <label>Hero Badge</label>
                    <input
                      type="text"
                      value={formData.contactPage.heroBadge}
                      onChange={(e) => updateContactPage('heroBadge', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Hero Title</label>
                    <input
                      type="text"
                      value={formData.contactPage.heroTitle}
                      onChange={(e) => updateContactPage('heroTitle', e.target.value)}
                    />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>Hero Subtitle</label>
                  <input
                    type="text"
                    value={formData.contactPage.heroSubtitle}
                    onChange={(e) => updateContactPage('heroSubtitle', e.target.value)}
                  />
                </div>
                <div className="admin-form-group row-split">
                  <div>
                    <label>Hero Feature 1</label>
                    <input type="text" value={formData.contactPage.heroFeature1} onChange={(e) => updateContactPage('heroFeature1', e.target.value)} />
                  </div>
                  <div>
                    <label>Hero Feature 2</label>
                    <input type="text" value={formData.contactPage.heroFeature2} onChange={(e) => updateContactPage('heroFeature2', e.target.value)} />
                  </div>
                  <div>
                    <label>Hero Feature 3</label>
                    <input type="text" value={formData.contactPage.heroFeature3} onChange={(e) => updateContactPage('heroFeature3', e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="settings-subsection">
                <h4>3. Contact Information Card</h4>
                <div className="admin-form-group row-split">
                  <div>
                    <label>Info Card Title</label>
                    <input
                      type="text"
                      value={formData.contactPage.infoCardTitle}
                      onChange={(e) => updateContactPage('infoCardTitle', e.target.value)}
                      placeholder="Contact Information"
                    />
                  </div>
                  <div>
                    <label>Info Card Subtitle</label>
                    <input
                      type="text"
                      value={formData.contactPage.infoCardSubtitle}
                      onChange={(e) => updateContactPage('infoCardSubtitle', e.target.value)}
                      placeholder="Find our phone, email, location..."
                    />
                  </div>
                </div>
              </div>

              <div className="settings-subsection">
                <h4>4. Send Us a Message Form</h4>
                <div className="admin-form-group row-split">
                  <div>
                    <label>Form Title</label>
                    <input type="text" value={formData.contactPage.formTitle} onChange={(e) => updateContactPage('formTitle', e.target.value)} />
                  </div>
                  <div>
                    <label>Submit Button Text</label>
                    <input type="text" value={formData.contactPage.submitButtonText} onChange={(e) => updateContactPage('submitButtonText', e.target.value)} />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>Form Subtitle</label>
                  <input type="text" value={formData.contactPage.formSubtitle} onChange={(e) => updateContactPage('formSubtitle', e.target.value)} />
                </div>
                <div className="admin-form-group row-split">
                  <div>
                    <label>Full Name Label</label>
                    <input type="text" value={formData.contactPage.nameLabel} onChange={(e) => updateContactPage('nameLabel', e.target.value)} />
                  </div>
                  <div>
                    <label>Full Name Placeholder</label>
                    <input type="text" value={formData.contactPage.namePlaceholder} onChange={(e) => updateContactPage('namePlaceholder', e.target.value)} />
                  </div>
                </div>
                <div className="admin-form-group row-split">
                  <div>
                    <label>Email Label</label>
                    <input type="text" value={formData.contactPage.emailLabel} onChange={(e) => updateContactPage('emailLabel', e.target.value)} />
                  </div>
                  <div>
                    <label>Email Placeholder</label>
                    <input type="text" value={formData.contactPage.emailPlaceholder} onChange={(e) => updateContactPage('emailPlaceholder', e.target.value)} />
                  </div>
                </div>
                <div className="admin-form-group row-split">
                  <div>
                    <label>Phone Label</label>
                    <input type="text" value={formData.contactPage.phoneLabel} onChange={(e) => updateContactPage('phoneLabel', e.target.value)} />
                  </div>
                  <div>
                    <label>Phone Placeholder</label>
                    <input type="text" value={formData.contactPage.phonePlaceholder} onChange={(e) => updateContactPage('phonePlaceholder', e.target.value)} />
                  </div>
                </div>
                <div className="admin-form-group row-split">
                  <div>
                    <label>Subject Label</label>
                    <input type="text" value={formData.contactPage.subjectLabel} onChange={(e) => updateContactPage('subjectLabel', e.target.value)} />
                  </div>
                  <div>
                    <label>Subject Placeholder</label>
                    <input type="text" value={formData.contactPage.subjectPlaceholder} onChange={(e) => updateContactPage('subjectPlaceholder', e.target.value)} />
                  </div>
                </div>
                <div className="admin-form-group row-split">
                  <div>
                    <label>Message Label</label>
                    <input type="text" value={formData.contactPage.messageLabel} onChange={(e) => updateContactPage('messageLabel', e.target.value)} />
                  </div>
                  <div>
                    <label>Message Placeholder</label>
                    <input type="text" value={formData.contactPage.messagePlaceholder} onChange={(e) => updateContactPage('messagePlaceholder', e.target.value)} />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>Privacy Note (below form)</label>
                  <input type="text" value={formData.contactPage.privacyNote} onChange={(e) => updateContactPage('privacyNote', e.target.value)} />
                </div>
              </div>

              <div className="settings-subsection">
                <h4>4. Help Box &amp; Map</h4>
                <div className="admin-form-group row-split">
                  <div>
                    <label>Help Box Title</label>
                    <input type="text" value={formData.contactPage.helpBoxText} onChange={(e) => updateContactPage('helpBoxText', e.target.value)} />
                  </div>
                  <div>
                    <label>Help Box Subtext</label>
                    <input type="text" value={formData.contactPage.helpBoxSubtext} onChange={(e) => updateContactPage('helpBoxSubtext', e.target.value)} />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>Google Maps Embed URL</label>
                  <textarea
                    value={formData.contactPage.mapEmbedUrl}
                    onChange={(e) => updateContactPage('mapEmbedUrl', e.target.value)}
                    rows="3"
                    placeholder="Paste Google Maps embed iframe src URL"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="about-settings-sections">
              <h3>About Us Page Settings</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>
                Manage content shown on the public About Us page.
              </p>

              <div className="settings-subsection" style={{ marginBottom: '24px' }}>
                <h4>Homepage About Section</h4>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '12px' }}>
                  The homepage About block is managed separately to avoid duplicate content.
                </p>
                <a
                  href="/admin/dashboard/homepage-about"
                  className="action-btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                >
                  Manage Homepage About Section →
                </a>
              </div>

              <div className="settings-subsection">
                <h4>1. Hero Section</h4>
                <div className="admin-form-group">
                  <label>Eyebrow Tag</label>
                  <input
                    type="text"
                    value={formData.aboutPage.heroEyebrow || ''}
                    onChange={(e) => updateAboutPage('heroEyebrow', e.target.value)}
                    placeholder="ABOUT WINS WERELD WINKEL"
                  />
                </div>
                <div className="admin-form-group row-split">
                  <div>
                    <label>Page Heading</label>
                    <input
                      type="text"
                      value={formData.aboutPage.heroHeading}
                      onChange={(e) => updateAboutPage('heroHeading', e.target.value)}
                      placeholder="Your Trusted International Supermarket & Food Corner in"
                    />
                  </div>
                  <div>
                    <label>Highlighted Word (green)</label>
                    <input
                      type="text"
                      value={formData.aboutPage.heroHighlight || ''}
                      onChange={(e) => updateAboutPage('heroHighlight', e.target.value)}
                      placeholder="Hilversum"
                    />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>Hero Description</label>
                  <textarea
                    value={formData.aboutPage.heroDescription}
                    onChange={(e) => updateAboutPage('heroDescription', e.target.value)}
                    rows="4"
                    placeholder="Short introduction shown in the hero section..."
                  />
                </div>
                <div className="admin-form-group">
                  <label>Hero Image Badge Text</label>
                  <input
                    type="text"
                    value={formData.aboutPage.heroBadge || ''}
                    onChange={(e) => updateAboutPage('heroBadge', e.target.value)}
                    placeholder="Serving Hilversum since 2022"
                  />
                </div>
                <AboutImageUpload
                  label="Hero Image"
                  value={formData.aboutPage.heroImage}
                  inputId="about-hero-image"
                  onUpload={handleAboutImageUpload('heroImage')}
                />
              </div>

              <div className="settings-subsection">
                <h4>2. Our Story</h4>
                <div className="admin-form-group">
                  <label>Story Title</label>
                  <input
                    type="text"
                    value={formData.aboutPage.storyTitle}
                    onChange={(e) => updateAboutPage('storyTitle', e.target.value)}
                    placeholder="Our Story"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Story Description</label>
                  <textarea
                    value={formData.aboutPage.storyDescription}
                    onChange={(e) => updateAboutPage('storyDescription', e.target.value)}
                    rows="6"
                    placeholder="Tell your company story. Use blank lines between paragraphs."
                  />
                </div>
                <AboutImageUpload
                  label="Story Image"
                  value={formData.aboutPage.storyImage}
                  inputId="about-story-image"
                  onUpload={handleAboutImageUpload('storyImage')}
                />
              </div>

              <div className="settings-subsection">
                <h4>3. Mission, Vision &amp; Promise</h4>
                <div className="admin-form-group row-split">
                  <div>
                    <label>Mission Title</label>
                    <input
                      type="text"
                      value={formData.aboutPage.missionTitle}
                      onChange={(e) => updateAboutPage('missionTitle', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Vision Title</label>
                    <input
                      type="text"
                      value={formData.aboutPage.visionTitle}
                      onChange={(e) => updateAboutPage('visionTitle', e.target.value)}
                    />
                  </div>
                </div>
                <div className="admin-form-group row-split">
                  <div>
                    <label>Mission Description</label>
                    <textarea
                      value={formData.aboutPage.missionDescription}
                      onChange={(e) => updateAboutPage('missionDescription', e.target.value)}
                      rows="4"
                    />
                  </div>
                  <div>
                    <label>Vision Description</label>
                    <textarea
                      value={formData.aboutPage.visionDescription}
                      onChange={(e) => updateAboutPage('visionDescription', e.target.value)}
                      rows="4"
                    />
                  </div>
                </div>
                <div className="admin-form-group row-split">
                  <div>
                    <label>Promise Title</label>
                    <input
                      type="text"
                      value={formData.aboutPage.promiseTitle || ''}
                      onChange={(e) => updateAboutPage('promiseTitle', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Promise Description</label>
                    <textarea
                      value={formData.aboutPage.promiseDescription || ''}
                      onChange={(e) => updateAboutPage('promiseDescription', e.target.value)}
                      rows="4"
                    />
                  </div>
                </div>
              </div>

              <div className="settings-subsection">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0 }}>4. What We Offer</h4>
                  <button type="button" className="action-btn-secondary" onClick={addOffering} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaPlus /> Add Item
                  </button>
                </div>
                {formData.aboutPage.offerings.map((item, index) => (
                  <div key={item.id || index} className="about-offering-row">
                    <div className="admin-form-group row-split">
                      <div>
                        <label>Category Name</label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateOffering(index, 'title', e.target.value)}
                          placeholder="e.g. Fresh Vegetables & Fruits"
                        />
                      </div>
                      <div>
                        <label>Description</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateOffering(index, 'description', e.target.value)}
                          placeholder="Short description"
                        />
                      </div>
                    </div>
                    <div className="admin-form-group">
                      <label>Image URL</label>
                      <input
                        type="text"
                        value={item.image || ''}
                        onChange={(e) => updateOffering(index, 'image', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <button type="button" className="about-offering-remove" onClick={() => removeOffering(index)}>
                      <FaTrash /> Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="settings-subsection">
                <h4>5. Statistics Banner</h4>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
                  Numbers shown on the dark blue stats section.
                </p>
                {(formData.aboutPage.stats || []).map((stat, index) => (
                  <div key={stat.label || index} className="about-offering-row">
                    <div className="admin-form-group row-split">
                      <div>
                        <label>Value</label>
                        <input
                          type="number"
                          value={stat.value}
                          onChange={(e) => updateAboutStat(index, 'value', e.target.value)}
                        />
                      </div>
                      <div>
                        <label>Suffix</label>
                        <input
                          type="text"
                          value={stat.suffix}
                          onChange={(e) => updateAboutStat(index, 'suffix', e.target.value)}
                          placeholder="K+, +, %"
                        />
                      </div>
                      <div>
                        <label>Label</label>
                        <input
                          type="text"
                          value={stat.label}
                          onChange={(e) => updateAboutStat(index, 'label', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="settings-subsection">
                <h4>6. Company Owner Details</h4>
                <AboutImageUpload
                  label="Owner Photo"
                  value={formData.aboutPage.owner.photo}
                  inputId="about-owner-photo"
                  onUpload={handleAboutImageUpload('owner.photo')}
                />
                <div className="admin-form-group row-split">
                  <div>
                    <label>Owner Name</label>
                    <input
                      type="text"
                      value={formData.aboutPage.owner.name}
                      onChange={(e) => updateOwner('name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Designation</label>
                    <input
                      type="text"
                      value={formData.aboutPage.owner.designation}
                      onChange={(e) => updateOwner('designation', e.target.value)}
                      placeholder="Founder & Owner"
                    />
                  </div>
                </div>
                <div className="admin-form-group row-split">
                  <div>
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={formData.aboutPage.owner.phone}
                      onChange={(e) => updateOwner('phone', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Location</label>
                    <input
                      type="text"
                      value={formData.aboutPage.owner.location}
                      onChange={(e) => updateOwner('location', e.target.value)}
                    />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>Badge Text</label>
                  <input
                    type="text"
                    value={formData.aboutPage.owner.badge}
                    onChange={(e) => updateOwner('badge', e.target.value)}
                    placeholder="Since 2022"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Owner Quote</label>
                  <textarea
                    value={formData.aboutPage.owner.quote}
                    onChange={(e) => updateOwner('quote', e.target.value)}
                    rows="3"
                    placeholder="A quote from the owner..."
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'footer' && (
            <div className="footer-settings-sections">
              <h3>Footer Details</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
                Manage every section of the site footer — brand, links, hours, contact, and legal links.
              </p>

              <FooterPreview formData={formData} />

              <div className="settings-subsection">
                <h4>1. Brand &amp; About</h4>
                <div className="admin-form-group">
                  <label>Store Logo</label>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {formData.logo && (
                      <img
                        src={getImageUrl(formData.logo)}
                        alt="Logo preview"
                        style={{ height: '80px', width: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px', background: 'white' }}
                      />
                    )}
                    <div className="image-upload-zone" style={{ flex: 1, minWidth: '200px', padding: '16px' }}>
                      <input type="file" accept="image/*" id="footer-logo-file" onChange={handleLogoUpload} style={{ display: 'none' }} />
                      <label htmlFor="footer-logo-file" style={{ cursor: 'pointer', margin: 0 }}>
                        <FaUpload className="upload-icon" style={{ fontSize: '1.5rem', marginBottom: '4px' }} />
                        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Upload footer logo (Max 2MB)</p>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>Footer Description</label>
                  <textarea
                    name="footerDescription"
                    value={formData.footerDescription}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Your premium destination for high-quality groceries..."
                    required
                  />
                </div>
                <div className="admin-form-group row-split">
                  <div>
                    <label>Facebook URL</label>
                    <input type="text" name="facebook" value={formData.socials.facebook} onChange={handleSocialChange} placeholder="https://facebook.com/..." />
                  </div>
                  <div>
                    <label>Instagram URL</label>
                    <input type="text" name="instagram" value={formData.socials.instagram} onChange={handleSocialChange} placeholder="https://instagram.com/..." />
                  </div>
                </div>
                <div className="admin-form-group row-split">
                  <div>
                    <label>WhatsApp Link</label>
                    <input type="text" name="whatsapp" value={formData.socials.whatsapp} onChange={handleSocialChange} placeholder="https://wa.me/31659046526" />
                  </div>
                  <div>
                    <label>TikTok URL</label>
                    <input type="text" name="tiktok" value={formData.socials.tiktok} onChange={handleSocialChange} placeholder="https://tiktok.com/@..." />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>YouTube Channel URL</label>
                  <input type="text" name="youtube" value={formData.socials.youtube} onChange={handleSocialChange} placeholder="https://youtube.com/c/..." />
                </div>
              </div>

              <div className="settings-subsection">
                <div className="footer-section-header">
                  <h4>2. Quick Links</h4>
                  <button type="button" className="action-btn-secondary" onClick={() => addFooterLink('quickLinks')}>
                    <FaPlus /> Add Link
                  </button>
                </div>
                <div className="admin-form-group">
                  <label>Section Title</label>
                  <input
                    type="text"
                    value={formData.footerPage.quickLinksTitle}
                    onChange={(e) => updateFooterPage('quickLinksTitle', e.target.value)}
                  />
                </div>
                {formData.footerPage.quickLinks.map((link, index) => (
                  <FooterLinkRow
                    key={link.id}
                    link={link}
                    onChange={(field, value) => updateFooterLinks('quickLinks', index, field, value)}
                    onRemove={() => removeFooterLink('quickLinks', index)}
                  />
                ))}
              </div>

              <div className="settings-subsection">
                <div className="footer-section-header">
                  <h4>3. Categories</h4>
                  <button type="button" className="action-btn-secondary" onClick={() => addFooterLink('categoryLinks')}>
                    <FaPlus /> Add Category Link
                  </button>
                </div>
                <div className="admin-form-group">
                  <label>Section Title</label>
                  <input
                    type="text"
                    value={formData.footerPage.categoriesTitle}
                    onChange={(e) => updateFooterPage('categoriesTitle', e.target.value)}
                  />
                </div>
                {formData.footerPage.categoryLinks.map((link, index) => (
                  <FooterLinkRow
                    key={link.id}
                    link={link}
                    onChange={(field, value) => updateFooterLinks('categoryLinks', index, field, value)}
                    onRemove={() => removeFooterLink('categoryLinks', index)}
                  />
                ))}
              </div>

              <div className="settings-subsection">
                <h4>4. Business Hours</h4>
                <div className="admin-form-group">
                  <label>Section Title</label>
                  <input
                    type="text"
                    value={formData.footerPage.businessHoursTitle}
                    onChange={(e) => updateFooterPage('businessHoursTitle', e.target.value)}
                  />
                </div>
                <div className="admin-form-group row-split">
                  <div>
                    <label>Supermarket Label</label>
                    <input
                      type="text"
                      value={formData.footerPage.supermarketLabel}
                      onChange={(e) => updateFooterPage('supermarketLabel', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Supermarket Hours</label>
                    <input
                      type="text"
                      name="supermarketTimings"
                      value={formData.supermarketTimings}
                      onChange={handleChange}
                      placeholder="8:00 AM - 10:00 PM"
                    />
                  </div>
                </div>
                <div className="admin-form-group row-split">
                  <div>
                    <label>Food Corner Label</label>
                    <input
                      type="text"
                      value={formData.footerPage.foodCornerLabel}
                      onChange={(e) => updateFooterPage('foodCornerLabel', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Food Corner Hours</label>
                    <input
                      type="text"
                      name="foodCornerTimings"
                      value={formData.foodCornerTimings}
                      onChange={handleChange}
                      placeholder="11:00 AM - 11:00 PM"
                    />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>Sunday / Special Hours Note</label>
                  <input
                    type="text"
                    value={formData.footerPage.sundayHours}
                    onChange={(e) => updateFooterPage('sundayHours', e.target.value)}
                    placeholder="Sunday: 12:00 PM - 7:00 PM"
                  />
                </div>
              </div>

              <div className="settings-subsection">
                <h4>5. Contact</h4>
                <div className="admin-form-group">
                  <label>Section Title</label>
                  <input
                    type="text"
                    value={formData.footerPage.contactTitle}
                    onChange={(e) => updateFooterPage('contactTitle', e.target.value)}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Amsterdam, Netherlands"
                    required
                  />
                </div>
                <div className="admin-form-group row-split">
                  <div>
                    <label>Phone Number</label>
                    <input type="tel" name="contactPhone" value={formData.contactPhone} onChange={handleChange} placeholder="+31659046526" required />
                  </div>
                  <div>
                    <label>Email Address</label>
                    <input type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange} placeholder="info@winswereldwinkel.nl" required />
                  </div>
                </div>
              </div>

              <div className="settings-subsection">
                <div className="footer-section-header">
                  <h4>6. Bottom Bar &amp; Legal Links</h4>
                  <button type="button" className="action-btn-secondary" onClick={() => addFooterLink('legalLinks')}>
                    <FaPlus /> Add Legal Link
                  </button>
                </div>
                <div className="admin-form-group">
                  <label>Copyright Name (optional)</label>
                  <input
                    type="text"
                    value={formData.footerPage.copyrightText}
                    onChange={(e) => updateFooterPage('copyrightText', e.target.value)}
                    placeholder="Leave empty to use store name"
                  />
                </div>
                {formData.footerPage.legalLinks.map((link, index) => (
                  <FooterLinkRow
                    key={link.id}
                    link={link}
                    onChange={(field, value) => updateFooterLinks('legalLinks', index, field, value)}
                    onRemove={() => removeFooterLink('legalLinks', index)}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'socials' && (
            <div>
              <h3>Social Media Links</h3>
              <div className="admin-form-group row-split">
                <div>
                  <label>Facebook URL</label>
                  <input 
                    type="text" 
                    name="facebook" 
                    value={formData.socials.facebook} 
                    onChange={handleSocialChange} 
                    placeholder="https://facebook.com/..." 
                  />
                </div>
                <div>
                  <label>Instagram URL</label>
                  <input 
                    type="text" 
                    name="instagram" 
                    value={formData.socials.instagram} 
                    onChange={handleSocialChange} 
                    placeholder="https://instagram.com/..." 
                  />
                </div>
              </div>
              <div className="admin-form-group row-split">
                <div>
                  <label>WhatsApp Link</label>
                  <input 
                    type="text" 
                    name="whatsapp" 
                    value={formData.socials.whatsapp} 
                    onChange={handleSocialChange} 
                    placeholder="https://wa.me/31659046526" 
                  />
                </div>
                <div>
                  <label>TikTok URL</label>
                  <input 
                    type="text" 
                    name="tiktok" 
                    value={formData.socials.tiktok} 
                    onChange={handleSocialChange} 
                    placeholder="https://tiktok.com/@..." 
                  />
                </div>
              </div>
              <div className="admin-form-group">
                <label>YouTube Channel URL</label>
                <input 
                  type="text" 
                  name="youtube" 
                  value={formData.socials.youtube} 
                  onChange={handleSocialChange} 
                  placeholder="https://youtube.com/c/..." 
                />
              </div>
            </div>
          )}

          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button 
              type="button" 
              className="action-btn-secondary"
              onClick={() => {
                if (cmsData) {
                  setFormData(buildFormState(cmsData));
                  addToast('Form reset to saved settings', 'info');
                }
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={`action-btn-primary ${isSaving ? 'disabled' : ''}`}
              disabled={isSaving}
            >
              {isSaving ? 'Saving Settings...' : 'Save Site Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSiteSettings;
