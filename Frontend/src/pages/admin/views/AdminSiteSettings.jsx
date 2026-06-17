import { useState, useEffect } from 'react';
import { useCMS } from '../../../context/CMSContext';
import { useToast } from '../../../context/ToastContext';
import { getImageUrl } from '../../../services/api';
import { FaUpload } from 'react-icons/fa';

export const AdminSiteSettings = () => {
  const { cmsData, updateCMSData, loading } = useCMS();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    storeName: '',
    logo: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    aboutUs: '',
    footerDescription: '',
    supermarketTimings: '',
    foodCornerTimings: '',
    socials: {
      facebook: '',
      instagram: '',
      whatsapp: '',
      tiktok: '',
      youtube: ''
    }
  });

  useEffect(() => {
    let isMounted = true;
    const initForm = async () => {
      await Promise.resolve();
      if (isMounted && cmsData) {
        setFormData({
          storeName: cmsData.storeName || '',
          logo: cmsData.logo || '',
          contactEmail: cmsData.contactEmail || '',
          contactPhone: cmsData.contactPhone || '',
          address: cmsData.address || '',
          aboutUs: cmsData.aboutUs || '',
          footerDescription: cmsData.footerDescription || '',
          supermarketTimings: cmsData.supermarketTimings || '',
          foodCornerTimings: cmsData.foodCornerTimings || '',
          socials: {
            facebook: cmsData.socials?.facebook || '',
            instagram: cmsData.socials?.instagram || '',
            whatsapp: cmsData.socials?.whatsapp || '',
            tiktok: cmsData.socials?.tiktok || '',
            youtube: cmsData.socials?.youtube || ''
          }
        });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateCMSData(formData);
      addToast('Branding settings updated successfully!', 'success');
    } catch (err) {
      console.error('Failed to update settings', err);
      addToast('Failed to update settings', 'error');
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
          Contact Details
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
            <div>
              <h3>Contact Details</h3>
              <div className="admin-form-group row-split">
                <div>
                  <label>Contact Email</label>
                  <input 
                    type="email" 
                    name="contactEmail" 
                    value={formData.contactEmail} 
                    onChange={handleChange} 
                    placeholder="info@winswereldwinkel.nl" 
                    required 
                  />
                </div>
                <div>
                  <label>Contact Phone</label>
                  <input 
                    type="tel" 
                    name="contactPhone" 
                    value={formData.contactPhone} 
                    onChange={handleChange} 
                    placeholder="+31 6 12345678" 
                    required 
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div>
              <h3>About Us Details</h3>
              <div className="admin-form-group">
                <label>About Us Description (Public Homepage & Page)</label>
                <textarea 
                  name="aboutUs" 
                  value={formData.aboutUs} 
                  onChange={handleChange} 
                  rows="6" 
                  placeholder="Enter About Us paragraph..." 
                  required 
                />
              </div>
            </div>
          )}

          {activeTab === 'footer' && (
            <div>
              <h3>Footer Details</h3>
              <div className="admin-form-group">
                <label>Footer Paragraph Description</label>
                <textarea 
                  name="footerDescription" 
                  value={formData.footerDescription} 
                  onChange={handleChange} 
                  rows="4" 
                  placeholder="Short summary displayed in page footer..." 
                  required 
                />
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
                    placeholder="https://wa.me/..." 
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
                  setFormData({
                    storeName: cmsData.storeName || '',
                    logo: cmsData.logo || '',
                    contactEmail: cmsData.contactEmail || '',
                    contactPhone: cmsData.contactPhone || '',
                    address: cmsData.address || '',
                    aboutUs: cmsData.aboutUs || '',
                    footerDescription: cmsData.footerDescription || '',
                    supermarketTimings: cmsData.supermarketTimings || '',
                    foodCornerTimings: cmsData.foodCornerTimings || '',
                    socials: {
                      facebook: cmsData.socials?.facebook || '',
                      instagram: cmsData.socials?.instagram || '',
                      whatsapp: cmsData.socials?.whatsapp || '',
                      tiktok: cmsData.socials?.tiktok || '',
                      youtube: cmsData.socials?.youtube || ''
                    }
                  });
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
