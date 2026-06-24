import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaSave, FaUpload, FaInfoCircle, FaArrowLeft } from 'react-icons/fa';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { getImageUrl } from '../../../services/api';
import homepageAboutService from '../../../services/homepageAboutService';

const defaultForm = {
  id: null,
  useAboutUsPageContent: false,
  sectionHeading: 'About Ins Wereld Winkel',
  shortDescription: '',
  buttonText: 'Learn More',
  buttonLink: '/about',
  aboutImage: '',
  status: 'active',
  resolvedContent: null,
};

const ImageUploadField = ({ label, value, inputId, onUpload, disabled, isUploading, hint }) => {
  const fileInputRef = useRef(null);

  const openFilePicker = () => {
    if (!disabled && !isUploading) fileInputRef.current?.click();
  };

  return (
    <div className="admin-form-group">
      <label>{label}</label>
      {hint ? <p className="admin-field-hint" style={{ marginBottom: '10px' }}>{hint}</p> : null}
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
            onChange={onUpload}
            style={{ display: 'none' }}
          />
          <FaUpload className="upload-icon" style={{ fontSize: '1.5rem', marginBottom: '4px' }} />
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
            {disabled
              ? 'Fields are synced from About Us CMS'
              : isUploading
                ? 'Uploading...'
                : 'Click to upload — jpg, jpeg, png, webp (max 3MB)'}
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
  const [isUploading, setIsUploading] = useState(false);
  const { addToast } = useToast();
  const { isAdmin, isManager } = useAuth();

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

  const fieldsDisabled = formData.useAboutUsPageContent;

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (file.size > 3 * 1024 * 1024) {
      addToast('Image must be 3MB or smaller', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await homepageAboutService.uploadImage(file);
      setFormData((prev) => {
        const next = { ...prev, aboutImage: imageUrl, useAboutUsPageContent: false };
        if (prev.useAboutUsPageContent && prev.resolvedContent) {
          if (!prev.sectionHeading?.trim()) next.sectionHeading = prev.resolvedContent.sectionHeading;
          if (!prev.shortDescription?.trim()) next.shortDescription = prev.resolvedContent.shortDescription;
          if (!prev.buttonText?.trim()) next.buttonText = prev.resolvedContent.buttonText;
          if (!prev.buttonLink?.trim()) next.buttonLink = prev.resolvedContent.buttonLink;
        }
        return next;
      });
      addToast('Image uploaded successfully', 'success');
    } catch (err) {
      console.error('Image upload failed', err);
      addToast(err.response?.data?.message || 'Failed to upload image', 'error');
    } finally {
      setIsUploading(false);
    }
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

  const handleDelete = async () => {
    if (!isAdmin || !formData.id) return;
    if (!window.confirm('Delete this homepage about configuration?')) return;
    try {
      await homepageAboutService.deleteSection(formData.id);
      addToast('Homepage about section deleted', 'success');
      loadSection();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete section', 'error');
    }
  };

  const preview = formData.useAboutUsPageContent
    ? formData.resolvedContent || formData
    : formData;

  const backLink = isManager ? '/admin/dashboard' : '/admin/dashboard/site-settings';
  const backLabel = isManager ? 'Back to Dashboard' : 'Back';

  if (loading) {
    return (
      <div>
        <Link to={backLink} className="view-back-link">
          <FaArrowLeft aria-hidden="true" /> {backLabel}
        </Link>
        <div className="admin-page-loading">Loading homepage about section...</div>
      </div>
    );
  }

  return (
    <div>
      <Link to={backLink} className="view-back-link">
        <FaArrowLeft aria-hidden="true" /> {backLabel}
      </Link>

      <div className="view-header">
        <div className="view-title-wrap">
          <h2>Homepage About Section</h2>
          <p>Manage the About block shown on the public homepage.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isAdmin && formData.id ? (
            <button type="button" className="action-btn-secondary" onClick={handleDelete}>
              Delete
            </button>
          ) : null}
          <button
            type="submit"
            form="homepage-about-form"
            className="action-btn-primary"
            disabled={isSubmitting || isUploading}
          >
            <FaSave /> {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <form id="homepage-about-form" onSubmit={handleSubmit} className="dashboard-panel" style={{ padding: '24px' }}>
        {!isManager && (
        <div className="settings-subsection" style={{ marginBottom: '20px', paddingBottom: '20px' }}>
          <label className="admin-checkbox-label" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', margin: 0 }}>
            <input
              type="checkbox"
              checked={formData.useAboutUsPageContent}
              onChange={(e) => updateField('useAboutUsPageContent', e.target.checked)}
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
        )}

        {formData.useAboutUsPageContent && !isManager && (
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
                <Link to="/admin/dashboard/about-us" style={{ color: '#1d4ed8', fontWeight: 600 }}>
                  About Us Management
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
              maxLength={100}
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
              maxLength={1000}
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
                maxLength={50}
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
            disabled={fieldsDisabled}
            isUploading={isUploading}
          />

          <div className="admin-form-group">
            <label>Status</label>
            <select value={formData.status} onChange={(e) => updateField('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {preview && (
          <div className="settings-subsection" style={{ marginTop: '8px', marginBottom: 0 }}>
            <h4>Live Preview</h4>
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
              {preview.aboutImage ? (
                <img
                  src={getImageUrl(preview.aboutImage)}
                  alt={preview.sectionHeading}
                  style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }}
                />
              ) : null}
              <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px' }}>{preview.sectionHeading}</p>
              <p style={{ color: '#475569', marginBottom: '12px' }}>{preview.shortDescription}</p>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                Button: {preview.buttonText} → {preview.buttonLink}
              </p>
              <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                Status: {formData.status}
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default AdminHomepageAbout;
