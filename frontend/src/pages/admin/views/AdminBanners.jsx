import { useState, useEffect, useCallback } from 'react';
import { FaSave, FaImage } from 'react-icons/fa';
import bannerService from '../../../services/bannerService';
import { getImageUrl } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

const defaultForm = {
  headingLine1: 'FRESH',
  headingLine2: 'PRODUCTS',
  headingLine3: 'BETTER LIVING',
  subtitle: 'Your one-stop supermarket for quality products and great offers.',
  backgroundImage: '',
  primaryButtonLabel: 'EXPLORE PRODUCTS',
  primaryButtonLink: '/products',
  secondaryButtonLabel: 'EXPLORE FOOD CORNER',
  secondaryButtonLink: '/food-corner',
  showOpenTimeCard: true,
  cardTitle: 'Open Time',
  supermarketLabel: 'Supermarket',
  supermarketHours: '8:00 AM - 10:00 PM',
  foodCornerLabel: 'Food Corner',
  foodCornerHours: '6:00 PM - 10:00 PM (Weekend)',
  status: 'active',
};

const mapBannerToForm = (banner) => ({
  headingLine1: banner.headingLine1 || banner.title || defaultForm.headingLine1,
  headingLine2: banner.headingLine2 || banner.highlightText || defaultForm.headingLine2,
  headingLine3: banner.headingLine3 || banner.titleLine2 || defaultForm.headingLine3,
  subtitle: banner.subtitle || defaultForm.subtitle,
  backgroundImage: banner.backgroundImage || banner.image || '',
  primaryButtonLabel: banner.primaryButtonLabel || banner.buttonText || defaultForm.primaryButtonLabel,
  primaryButtonLink: banner.primaryButtonLink || banner.buttonLink || defaultForm.primaryButtonLink,
  secondaryButtonLabel: banner.secondaryButtonLabel || banner.buttonText2 || defaultForm.secondaryButtonLabel,
  secondaryButtonLink: banner.secondaryButtonLink || banner.buttonLink2 || defaultForm.secondaryButtonLink,
  showOpenTimeCard: banner.showOpenTimeCard ?? banner.showOpenTime ?? true,
  cardTitle: banner.cardTitle || banner.openTimeTitle || defaultForm.cardTitle,
  supermarketLabel: banner.supermarketLabel || defaultForm.supermarketLabel,
  supermarketHours: banner.supermarketHours || banner.supermarketTimings || defaultForm.supermarketHours,
  foodCornerLabel: banner.foodCornerLabel || defaultForm.foodCornerLabel,
  foodCornerHours: banner.foodCornerHours || banner.foodCornerTimings || defaultForm.foodCornerHours,
  status: banner.status || 'active',
});

export const AdminBanners = () => {
  const [bannerId, setBannerId] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { addToast } = useToast();
  const { isAdmin } = useAuth();

  const loadBanner = useCallback(async () => {
    setLoading(true);
    try {
      const banners = await bannerService.getAllBanners();
      const banner = banners.find((b) => b.status === 'active') || banners[0];
      if (banner) {
        setBannerId(banner.id);
        setFormData(mapBannerToForm(banner));
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

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, backgroundImage: previewUrl }));
    setIsUploading(true);

    try {
      const imageUrl = await bannerService.uploadBannerImage(file);
      setFormData((prev) => ({ ...prev, backgroundImage: imageUrl }));
      addToast('Banner image uploaded successfully', 'success');
    } catch (err) {
      console.error('Banner upload failed', err);
      addToast(err.response?.data?.message || 'Failed to upload banner image', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = () => {
    if (!formData.headingLine1?.trim() || !formData.headingLine2?.trim() || !formData.headingLine3?.trim()) {
      addToast('All heading lines are required', 'error');
      return false;
    }
    if (!formData.subtitle?.trim()) {
      addToast('Subtitle is required', 'error');
      return false;
    }
    if (!formData.primaryButtonLabel?.trim() || !formData.primaryButtonLink?.trim()) {
      addToast('Primary button label and link are required', 'error');
      return false;
    }
    if (!formData.backgroundImage || formData.backgroundImage.startsWith('blob:')) {
      addToast('Please upload a background image before saving', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

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
      addToast(err.response?.data?.message || 'Failed to save home banner', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin || !bannerId) return;
    if (!window.confirm('Delete this homepage banner configuration?')) return;
    try {
      await bannerService.deleteBanner(bannerId);
      addToast('Homepage banner deleted', 'success');
      setBannerId(null);
      setFormData(defaultForm);
      loadBanner();
    } catch (err) {
      console.error('Failed to delete banner', err);
      addToast(err.response?.data?.message || 'Failed to delete banner', 'error');
    }
  };

  const previewImage =
    getImageUrl(formData.backgroundImage) ||
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=2000';

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
        <div style={{ display: 'flex', gap: '10px' }}>
          {isAdmin && bannerId ? (
            <button type="button" className="action-btn-secondary" onClick={handleDelete}>
              Delete Banner
            </button>
          ) : null}
          <button
            type="submit"
            form="home-banner-form"
            className="action-btn-primary"
            disabled={isSubmitting || isUploading}
          >
            <FaSave /> {isSubmitting ? 'Saving...' : 'Save Banner'}
          </button>
        </div>
      </div>

      <form id="home-banner-form" onSubmit={handleSubmit} className="dashboard-panel" style={{ padding: '24px' }}>
        <div className="admin-form-grid-2">
          <div>
            <h3 className="admin-section-title">Banner Content</h3>

            <div className="admin-form-group row-split">
              <div>
                <label>Heading Line 1</label>
                <input
                  type="text"
                  name="headingLine1"
                  value={formData.headingLine1}
                  onChange={handleChange}
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <label>Heading Line 2 (highlighted)</label>
                <input
                  type="text"
                  name="headingLine2"
                  value={formData.headingLine2}
                  onChange={handleChange}
                  maxLength={100}
                  required
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label>Heading Line 3</label>
              <input
                type="text"
                name="headingLine3"
                value={formData.headingLine3}
                onChange={handleChange}
                maxLength={100}
                required
              />
            </div>

            <div className="admin-form-group">
              <label>Subtitle</label>
              <input
                type="text"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleChange}
                maxLength={300}
                required
              />
            </div>

            <div className="admin-form-group row-split">
              <div>
                <label>Primary Button Label</label>
                <input
                  type="text"
                  name="primaryButtonLabel"
                  value={formData.primaryButtonLabel}
                  onChange={handleChange}
                  maxLength={50}
                  required
                />
              </div>
              <div>
                <label>Primary Button Link</label>
                <input
                  type="text"
                  name="primaryButtonLink"
                  value={formData.primaryButtonLink}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="admin-form-group row-split">
              <div>
                <label>Secondary Button Label</label>
                <input
                  type="text"
                  name="secondaryButtonLabel"
                  value={formData.secondaryButtonLabel}
                  onChange={handleChange}
                  maxLength={50}
                />
              </div>
              <div>
                <label>Secondary Button Link</label>
                <input
                  type="text"
                  name="secondaryButtonLink"
                  value={formData.secondaryButtonLink}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="admin-form-group row-split">
              <div>
                <label>Background Image URL</label>
                <input
                  type="text"
                  name="backgroundImage"
                  value={formData.backgroundImage}
                  onChange={handleChange}
                  placeholder="/uploads/home-banner/..."
                />
              </div>
              <div>
                <label>Upload Image</label>
                <div className="image-upload-zone" style={{ padding: '8px' }}>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    id="home-banner-file"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="home-banner-file" style={{ cursor: 'pointer', margin: 0 }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-sidebar-active)' }}>
                      <FaImage style={{ marginRight: '6px' }} />
                      {isUploading ? 'Uploading...' : 'Browse Files'}
                    </p>
                  </label>
                </div>
              </div>
            </div>

            <div className="admin-form-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange} required>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <h3 className="admin-section-title" style={{ marginTop: '24px' }}>Open Time Card</h3>

            <div className="admin-form-group">
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  name="showOpenTimeCard"
                  checked={formData.showOpenTimeCard}
                  onChange={handleChange}
                />
                Show open time card on homepage banner
              </label>
            </div>

            <div className="admin-form-group">
              <label>Card Title</label>
              <input type="text" name="cardTitle" value={formData.cardTitle} onChange={handleChange} />
            </div>

            <div className="admin-form-group row-split">
              <div>
                <label>Supermarket Label</label>
                <input type="text" name="supermarketLabel" value={formData.supermarketLabel} onChange={handleChange} />
              </div>
              <div>
                <label>Supermarket Hours</label>
                <input type="text" name="supermarketHours" value={formData.supermarketHours} onChange={handleChange} />
              </div>
            </div>

            <div className="admin-form-group row-split">
              <div>
                <label>Food Corner Label</label>
                <input type="text" name="foodCornerLabel" value={formData.foodCornerLabel} onChange={handleChange} />
              </div>
              <div>
                <label>Food Corner Hours</label>
                <input type="text" name="foodCornerHours" value={formData.foodCornerHours} onChange={handleChange} />
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
                      {formData.headingLine1 || 'FRESH'}
                      <br />
                      <span className="preview-highlight">{formData.headingLine2 || 'PRODUCTS'}</span>
                      <br />
                      <span>{formData.headingLine3 || 'BETTER LIVING'}</span>
                    </h4>
                    <p className="banner-mock-sub">{formData.subtitle || 'Subtitle goes here.'}</p>
                    <div className="banner-mock-buttons">
                      <span className="banner-mock-btn">{formData.primaryButtonLabel}</span>
                      <span className="banner-mock-btn secondary">{formData.secondaryButtonLabel}</span>
                    </div>
                  </div>

                  {formData.showOpenTimeCard ? (
                    <div className="banner-mock-timings">
                      <div className="banner-mock-timings-title">{formData.cardTitle}</div>
                      <div className="banner-mock-timing-row">
                        <strong>{formData.supermarketLabel}</strong>
                        <span>{formData.supermarketHours}</span>
                      </div>
                      <div className="banner-mock-timing-row">
                        <strong>{formData.foodCornerLabel}</strong>
                        <span>{formData.foodCornerHours}</span>
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
