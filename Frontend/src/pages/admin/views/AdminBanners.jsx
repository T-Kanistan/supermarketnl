import { useState, useEffect, useCallback } from 'react';
import { FaSave, FaImage } from 'react-icons/fa';
import bannerService from '../../../services/bannerService';
import { getImageUrl } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

const defaultForm = {
  title: 'FRESH',
  highlightText: 'PRODUCTS',
  titleLine2: 'BETTER LIVING',
  subtitle: 'Your one-stop supermarket for quality products and great offers.',
  image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=2000',
  buttonText: 'EXPLORE PRODUCTS',
  buttonLink: '/products',
  buttonText2: 'EXPLORE FOOD CORNER',
  buttonLink2: '/food-corner',
  showOpenTime: true,
  openTimeTitle: 'Open Time',
  supermarketLabel: 'Supermarket',
  supermarketTimings: '8:00 AM - 10:00 PM',
  foodCornerLabel: 'Food Corner',
  foodCornerTimings: '11:00 AM - 11:00 PM',
  status: 'active',
};

export const AdminBanners = () => {
  const [bannerId, setBannerId] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const loadBanner = useCallback(async () => {
    setLoading(true);
    try {
      const banners = await bannerService.getAllBanners();
      const banner = banners.find((b) => b.status === 'active') || banners[0];
      if (banner) {
        setBannerId(banner.id);
        setFormData({
          title: banner.title || defaultForm.title,
          highlightText: banner.highlightText || defaultForm.highlightText,
          titleLine2: banner.titleLine2 || defaultForm.titleLine2,
          subtitle: banner.subtitle || '',
          image: banner.image || defaultForm.image,
          buttonText: banner.buttonText || defaultForm.buttonText,
          buttonLink: banner.buttonLink || defaultForm.buttonLink,
          buttonText2: banner.buttonText2 || defaultForm.buttonText2,
          buttonLink2: banner.buttonLink2 || defaultForm.buttonLink2,
          showOpenTime: banner.showOpenTime !== false,
          openTimeTitle: banner.openTimeTitle || defaultForm.openTimeTitle,
          supermarketLabel: banner.supermarketLabel || defaultForm.supermarketLabel,
          supermarketTimings: banner.supermarketTimings || defaultForm.supermarketTimings,
          foodCornerLabel: banner.foodCornerLabel || defaultForm.foodCornerLabel,
          foodCornerTimings: banner.foodCornerTimings || defaultForm.foodCornerTimings,
          status: banner.status || 'active',
        });
      } else {
        setBannerId(null);
        setFormData(defaultForm);
      }
    } catch (err) {
      console.error('Failed to load home banner', err);
      addToast('Failed to load home banner', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadBanner();
  }, [loadBanner]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (bannerId) {
        await bannerService.updateBanner(bannerId, formData);
        addToast('Home banner updated successfully', 'success');
      } else {
        const created = await bannerService.createBanner(formData);
        setBannerId(created.id);
        addToast('Home banner created successfully', 'success');
      }
      loadBanner();
    } catch (err) {
      console.error('Failed to save home banner', err);
      addToast('Failed to save home banner', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewImage = getImageUrl(formData.image) || defaultForm.image;

  if (loading) {
    return (
      <div style={{ background: 'white', padding: '40px', borderRadius: '16px', animation: 'pulse 1.5s infinite ease-in-out' }}>
        <div style={{ height: '30px', width: '220px', background: '#cbd5e1', marginBottom: '20px' }} />
        <div style={{ height: '280px', background: '#cbd5e1' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="view-header">
        <div className="view-title-wrap">
          <h2>Home Banner</h2>
          <p>Edit the homepage hero banner, buttons, and open time card shown to customers.</p>
        </div>
        <button type="submit" form="home-banner-form" className="action-btn-primary" disabled={isSubmitting}>
          <FaSave /> {isSubmitting ? 'Saving...' : 'Save Banner'}
        </button>
      </div>

      <form id="home-banner-form" onSubmit={handleSubmit} className="dashboard-panel" style={{ padding: '24px' }}>
        <div className="admin-form-grid-2">
          <div>
            <h3 className="admin-section-title">Banner Content</h3>

            <div className="admin-form-group row-split">
              <div>
                <label>Heading Line 1</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required />
              </div>
              <div>
                <label>Heading Line 2 (highlighted)</label>
                <input type="text" name="highlightText" value={formData.highlightText} onChange={handleChange} required />
              </div>
            </div>

            <div className="admin-form-group">
              <label>Heading Line 3</label>
              <input type="text" name="titleLine2" value={formData.titleLine2} onChange={handleChange} />
            </div>

            <div className="admin-form-group">
              <label>Subtitle</label>
              <input type="text" name="subtitle" value={formData.subtitle} onChange={handleChange} required />
            </div>

            <div className="admin-form-group row-split">
              <div>
                <label>Primary Button Label</label>
                <input type="text" name="buttonText" value={formData.buttonText} onChange={handleChange} required />
              </div>
              <div>
                <label>Primary Button Link</label>
                <input type="text" name="buttonLink" value={formData.buttonLink} onChange={handleChange} required />
              </div>
            </div>

            <div className="admin-form-group row-split">
              <div>
                <label>Secondary Button Label</label>
                <input type="text" name="buttonText2" value={formData.buttonText2} onChange={handleChange} required />
              </div>
              <div>
                <label>Secondary Button Link</label>
                <input type="text" name="buttonLink2" value={formData.buttonLink2} onChange={handleChange} required />
              </div>
            </div>

            <div className="admin-form-group row-split">
              <div>
                <label>Background Image URL</label>
                <input type="text" name="image" value={formData.image} onChange={handleChange} required />
              </div>
              <div>
                <label>Upload Image</label>
                <div className="image-upload-zone" style={{ padding: '8px' }}>
                  <input type="file" accept="image/*" id="home-banner-file" onChange={handleImageUpload} style={{ display: 'none' }} />
                  <label htmlFor="home-banner-file" style={{ cursor: 'pointer', margin: 0 }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-sidebar-active)' }}>
                      <FaImage style={{ marginRight: '6px' }} />
                      Browse Files
                    </p>
                  </label>
                </div>
              </div>
            </div>

            <div className="admin-form-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <h3 className="admin-section-title" style={{ marginTop: '24px' }}>Open Time Card</h3>

            <div className="admin-form-group">
              <label className="admin-checkbox-label">
                <input type="checkbox" name="showOpenTime" checked={formData.showOpenTime} onChange={handleChange} />
                Show open time card on homepage banner
              </label>
            </div>

            <div className="admin-form-group">
              <label>Card Title</label>
              <input type="text" name="openTimeTitle" value={formData.openTimeTitle} onChange={handleChange} />
            </div>

            <div className="admin-form-group row-split">
              <div>
                <label>Supermarket Label</label>
                <input type="text" name="supermarketLabel" value={formData.supermarketLabel} onChange={handleChange} />
              </div>
              <div>
                <label>Supermarket Hours</label>
                <input type="text" name="supermarketTimings" value={formData.supermarketTimings} onChange={handleChange} />
              </div>
            </div>

            <div className="admin-form-group row-split">
              <div>
                <label>Food Corner Label</label>
                <input type="text" name="foodCornerLabel" value={formData.foodCornerLabel} onChange={handleChange} />
              </div>
              <div>
                <label>Food Corner Hours</label>
                <input type="text" name="foodCornerTimings" value={formData.foodCornerTimings} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="admin-section-title">Live Preview</h3>
            <div className="banner-preview-box">
              <div
                className="banner-render-mock home-banner-preview"
                style={{ backgroundImage: `url('${previewImage}')` }}
              >
                <div className="banner-mock-layout">
                  <div className="banner-mock-content">
                    <h4 className="banner-mock-title">
                      {formData.title || 'FRESH'}
                      <br />
                      <span className="preview-highlight">{formData.highlightText || 'PRODUCTS'}</span>
                      <br />
                      <span>{formData.titleLine2 || 'BETTER LIVING'}</span>
                    </h4>
                    <p className="banner-mock-sub">{formData.subtitle || 'Subtitle goes here.'}</p>
                    <div className="banner-mock-buttons">
                      <span className="banner-mock-btn">{formData.buttonText}</span>
                      <span className="banner-mock-btn secondary">{formData.buttonText2}</span>
                    </div>
                  </div>

                  {formData.showOpenTime ? (
                    <div className="banner-mock-timings">
                      <div className="banner-mock-timings-title">{formData.openTimeTitle}</div>
                      <div className="banner-mock-timing-row">
                        <strong>{formData.supermarketLabel}</strong>
                        <span>{formData.supermarketTimings}</span>
                      </div>
                      <div className="banner-mock-timing-row">
                        <strong>{formData.foodCornerLabel}</strong>
                        <span>{formData.foodCornerTimings}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminBanners;
