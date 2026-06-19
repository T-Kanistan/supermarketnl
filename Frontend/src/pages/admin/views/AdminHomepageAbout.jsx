import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaSave, FaUpload, FaInfoCircle, FaArrowLeft } from 'react-icons/fa';
import { useToast } from '../../../context/ToastContext';
import { getImageUrl } from '../../../services/api';
import homepageAboutService from '../../../services/homepageAboutService';

const defaultForm = {
  useAboutUsContent: true,
  sectionHeading: 'About Ins Wereld Winkel',
  shortDescription: '',
  buttonText: 'Learn More',
  buttonLink: '/about-us',
  aboutImage: '',
  status: 'Active',
  resolvedContent: null,
};

const ImageUploadField = ({ label, value, inputId, onUpload, disabled, hint }) => {
  const fileInputRef = useRef(null);

  const openFilePicker = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="admin-form-group">
      <label>{label}</label>
      {hint ? (
        <p className="admin-field-hint" style={{ marginBottom: '10px' }}>
          {hint}
        </p>
      ) : null}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        {value && (
          <img
            src={getImageUrl(value)}
            alt={label}
            style={{
              height: '120px',
              width: '180px',
              objectFit: 'cover',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
            }}
          />
        )}
        <div
          className={`image-upload-zone ${disabled ? 'image-upload-zone--disabled' : ''}`}
          style={{ flex: 1, minWidth: '200px', padding: '16px' }}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          aria-label={`Upload ${label}`}
          onClick={openFilePicker}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              openFilePicker();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            id={inputId}
            onChange={(e) => {
              onUpload(e);
              e.target.value = '';
            }}
            style={{
              position: 'absolute',
              width: 0,
              height: 0,
              opacity: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
            tabIndex={-1}
            aria-hidden="true"
          />
          <FaUpload className="upload-icon" style={{ fontSize: '1.5rem', marginBottom: '4px' }} />
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
            {disabled ? 'Uncheck About Us sync to upload' : 'Click to upload — jpg, jpeg, png, webp (max 3MB)'}
          </p>
        </div>
      </div>
    </div>
  );
};

const AdminHomepageAbout = () => {
  const [formData, setFormData] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const loadSection = useCallback(async () => {
    setLoading(true);
    try {
      const data = await homepageAboutService.getAdminHomepageAbout();
      setFormData({ ...defaultForm, ...data });
    } catch (err) {
      console.error('Failed to load homepage about section', err);
      addToast('Failed to load homepage about section', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadSection();
  }, [loadSection]);

  const fieldsDisabled = formData.useAboutUsContent;

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      addToast('Image must be 3MB or smaller', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => {
        const next = { ...prev, aboutImage: reader.result };
        if (prev.useAboutUsContent) {
          next.useAboutUsContent = false;
          if (!prev.sectionHeading?.trim() && prev.resolvedContent?.sectionHeading) {
            next.sectionHeading = prev.resolvedContent.sectionHeading;
          }
          if (!prev.shortDescription?.trim() && prev.resolvedContent?.shortDescription) {
            next.shortDescription = prev.resolvedContent.shortDescription;
          }
          if (!prev.buttonText?.trim() && prev.resolvedContent?.buttonText) {
            next.buttonText = prev.resolvedContent.buttonText;
          }
          if (!prev.buttonLink?.trim() && prev.resolvedContent?.buttonLink) {
            next.buttonLink = prev.resolvedContent.buttonLink;
          }
        }
        return next;
      });
      if (formData.useAboutUsContent) {
        addToast('About Us sync turned off so your custom image can be used.', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updated = await homepageAboutService.updateHomepageAbout(formData);
      setFormData({ ...defaultForm, ...updated });
      addToast('Homepage About Section updated successfully', 'success');
    } catch (err) {
      const message =
        err.validationErrors?.join('. ') || err.response?.data?.message || 'Failed to save section';
      addToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const preview = formData.useAboutUsContent ? formData.resolvedContent : formData;

  if (loading) {
    return (
      <div>
        <Link
          to="/admin/dashboard/site-settings"
          state={{ settingsTab: 'about' }}
          className="view-back-link"
        >
          <FaArrowLeft aria-hidden="true" /> Back
        </Link>
        <div className="admin-page-loading">Loading homepage about section...</div>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/admin/dashboard/site-settings"
        state={{ settingsTab: 'about' }}
        className="view-back-link"
      >
        <FaArrowLeft aria-hidden="true" /> Back
      </Link>

      <div className="view-header">
        <div className="view-title-wrap">
          <h2>Homepage About Section</h2>
          <p>Manage the About block shown on the public homepage.</p>
        </div>
        <button
          type="submit"
          form="homepage-about-form"
          className="action-btn-primary"
          disabled={isSubmitting}
        >
          <FaSave /> {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <form id="homepage-about-form" onSubmit={handleSubmit} className="dashboard-panel" style={{ padding: '24px' }}>
        <div className="settings-subsection" style={{ marginBottom: '20px', paddingBottom: '20px' }}>
          <label className="admin-checkbox-label" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', margin: 0 }}>
            <input
              type="checkbox"
              checked={formData.useAboutUsContent}
              onChange={(e) => updateField('useAboutUsContent', e.target.checked)}
            />
            <span>
              <strong>Use About Us Page Content</strong>
              <br />
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                When enabled, content is synced from the About Us CMS. Custom fields below are read-only.
              </span>
            </span>
          </label>
        </div>

        {formData.useAboutUsContent && (
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              padding: '14px 16px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '10px',
              marginBottom: '24px',
              color: '#1e40af',
            }}
          >
            <FaInfoCircle style={{ marginTop: '3px', flexShrink: 0 }} />
            <div>
              <strong>Content is synced from About Us CMS.</strong>
              <p style={{ margin: '6px 0 0', fontSize: '0.9rem' }}>
                Edit hero title, description, and image in{' '}
                <Link to="/admin/dashboard/site-settings" style={{ color: '#1d4ed8', fontWeight: 600 }}>
                  Site Settings → About Us
                </Link>
                .
              </p>
            </div>
          </div>
        )}

        <div className="settings-subsection">
          <h4>Section Content</h4>

          <div className="admin-form-group">
            <label>Section Heading</label>
            <input
              type="text"
              value={formData.sectionHeading}
              onChange={(e) => updateField('sectionHeading', e.target.value)}
              placeholder="About Ins Wereld Winkel"
              disabled={fieldsDisabled}
              required={!fieldsDisabled}
            />
          </div>

          <div className="admin-form-group">
            <label>Short Description</label>
            <textarea
              value={formData.shortDescription}
              onChange={(e) => updateField('shortDescription', e.target.value)}
              rows="5"
              placeholder="Brief introduction shown on the homepage..."
              disabled={fieldsDisabled}
              required={!fieldsDisabled}
            />
          </div>
        </div>

        <div className="settings-subsection">
          <h4>Button &amp; Media</h4>

          <div className="admin-form-group row-split">
            <div>
              <label>Button Text</label>
              <input
                type="text"
                value={formData.buttonText}
                onChange={(e) => updateField('buttonText', e.target.value)}
                placeholder="Learn More"
                disabled={fieldsDisabled}
                required={!fieldsDisabled}
              />
            </div>
            <div>
              <label>Button Link</label>
              <input
                type="text"
                value={formData.buttonLink}
                onChange={(e) => updateField('buttonLink', e.target.value)}
                placeholder="/about-us"
                disabled={fieldsDisabled}
                required={!fieldsDisabled}
              />
            </div>
          </div>

          <ImageUploadField
            label="About Image"
            value={formData.aboutImage}
            inputId="homepage-about-image"
            onUpload={handleImageUpload}
            disabled={false}
          />

          <div className="admin-form-group">
            <label>Status</label>
            <select
              value={formData.status}
              onChange={(e) => updateField('status', e.target.value)}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {preview && (
          <div className="settings-subsection" style={{ marginTop: '8px', marginBottom: 0 }}>
            <h4>Live Preview</h4>
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px' }}>
                {preview.sectionHeading}
              </p>
              <p style={{ color: '#475569', marginBottom: '12px' }}>{preview.shortDescription}</p>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                Button: {preview.buttonText} → {preview.buttonLink}
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default AdminHomepageAbout;
