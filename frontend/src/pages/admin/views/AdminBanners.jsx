import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaImage } from 'react-icons/fa';
import bannerService from '../../../services/bannerService';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { getImageUrl } from '../../../services/api';
import { BANNER_PAGE_OPTIONS, getPageBannerLabel } from '../../../constants/pageBannerDefaults';
import { getBannerOverlayStyle } from '../../../utils/bannerOverlay';
import { invalidateDashboardStats } from '../../../utils/dashboardStatsRefresh';
import { invalidatePageBannerCache } from '../../../utils/pageBannerCache';
import { CMS_IMAGE_ACCEPT, rejectInvalidCmsImageFile } from '../../../utils/imageUploadValidation';
import useAdminSearch from '../../../hooks/useAdminSearch';
import { ADMIN_NO_MATCH_MESSAGE } from '../../../utils/adminSearch';
import AdminValidatedField from '../../../components/admin/AdminValidatedField';
import AdminFieldLabel from '../../../components/admin/AdminFieldLabel';
import { ADMIN_TEXT_LIMITS, validateAdminText } from '../../../utils/adminTextValidation';
import './AdminBanners.css';

const PAGE_FILTER_OPTIONS = [{ value: 'all', label: 'All Pages' }, ...BANNER_PAGE_OPTIONS];

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const EMPTY_BANNER_SUMMARY = { total: 0, active: 0, inactive: 0 };

const BANNER_TEXT_FIELDS = ['badgeText', 'title', 'highlightedTitle', 'description'];

const emptyFieldErrors = () =>
  Object.fromEntries(BANNER_TEXT_FIELDS.map((field) => [field, '']));

const validateBannerField = (name, value) => {
  const { bannerBadge, bannerTitle, bannerHighlightedTitle, bannerDescription } = ADMIN_TEXT_LIMITS;

  switch (name) {
    case 'badgeText':
      return validateAdminText(value, {
        max: bannerBadge.max,
        maxMessage: `Badge text cannot exceed ${bannerBadge.max} characters.`,
      });
    case 'title':
      return validateAdminText(value, {
        required: true,
        max: bannerTitle.max,
        requiredMessage: 'Title is required',
        maxMessage: `Title cannot exceed ${bannerTitle.max} characters.`,
      });
    case 'highlightedTitle':
      return validateAdminText(value, {
        max: bannerHighlightedTitle.max,
        maxMessage: `Highlighted title cannot exceed ${bannerHighlightedTitle.max} characters.`,
      });
    case 'description':
      return validateAdminText(value, {
        max: bannerDescription.max,
        maxMessage: `Description cannot exceed ${bannerDescription.max} characters.`,
      });
    default:
      return '';
  }
};

const emptyForm = () => ({
  pageType: 'home',
  badgeText: '',
  title: '',
  highlightedTitle: '',
  description: '',
  backgroundImage: '',
  sideCardTitle: '',
  sideCardDescription: '',
  sideCardIcon: '',
  overlayColor: '#0f172a',
  overlayOpacity: 0.55,
  displayOrder: 0,
  isActive: true,
});

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const getBannerId = (banner) => banner?.id || banner?._id;

export const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [viewingBanner, setViewingBanner] = useState(null);
  const [pageFilter, setPageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bannerSummary, setBannerSummary] = useState(EMPTY_BANNER_SUMMARY);
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [fieldErrors, setFieldErrors] = useState(emptyFieldErrors);
  const { searchInput, searchQuery, onSearchChange, applySearchNow, hasActiveSearch } = useAdminSearch();

  const { addToast } = useToast();
  const { isAdmin } = useAuth();

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const result = await bannerService.listBanners({
        pageType: pageFilter,
        status: statusFilter,
        q: searchQuery || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      setBanners(result.data);
      setPagination((prev) => ({ ...prev, ...result.pagination }));
      setBannerSummary(result.summary || EMPTY_BANNER_SUMMARY);
    } catch (err) {
      console.error('Failed to load banners', err);
      addToast(err.response?.data?.message || 'Failed to load banners', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, pageFilter, statusFilter, searchQuery, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  useEffect(() => {
    setPagination((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    if (isModalOpen || isViewOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isModalOpen, isViewOpen]);

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingBanner(null);
    setImageFile(null);
  };

  const openAddModal = () => {
    setEditingBanner(null);
    setImageFile(null);
    setFormData(emptyForm());
    setFieldErrors(emptyFieldErrors());
    setIsModalOpen(true);
  };

  const openEditModal = (banner) => {
    setEditingBanner(banner);
    setImageFile(null);
    setFormData({
      pageType: banner.pageType || banner.pageName || 'home',
      badgeText: banner.badgeText || '',
      title: banner.title || banner.mainHeading || '',
      highlightedTitle: banner.highlightedTitle || banner.highlightText || '',
      description: banner.description || '',
      backgroundImage: banner.backgroundImage || banner.image || '',
      sideCardTitle: banner.sideCardTitle || '',
      sideCardDescription: banner.sideCardDescription || '',
      sideCardIcon: banner.sideCardIcon || '',
      overlayColor: banner.overlayColor || '#0f172a',
      overlayOpacity: banner.overlayOpacity ?? 0.55,
      displayOrder: banner.displayOrder ?? 0,
      isActive: banner.isActive !== false,
    });
    setFieldErrors(emptyFieldErrors());
    setIsModalOpen(true);
  };

  const openViewModal = (banner) => {
    setViewingBanner(banner);
    setIsViewOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleValidatedChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleValidatedBlur = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: validateBannerField(name, value) }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (rejectInvalidCmsImageFile(file, (msg) => addToast(msg, 'error'), e.target)) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast('Banner image must be 5MB or smaller', 'error');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImageFile(file);
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
    const errors = Object.fromEntries(
      BANNER_TEXT_FIELDS.map((field) => [field, validateBannerField(field, formData[field])])
    );
    setFieldErrors(errors);

    if (Object.values(errors).some(Boolean)) return false;

    if (!formData.pageType) {
      addToast('Page type is required', 'error');
      return false;
    }
    if (!formData.backgroundImage || formData.backgroundImage.startsWith('blob:')) {
      addToast('Please upload a banner image before saving', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        isActive: formData.isActive !== false,
        overlayOpacity: Number(formData.overlayOpacity),
        displayOrder: Number(formData.displayOrder) || 0,
      };

      if (editingBanner) {
        const bannerId = getBannerId(editingBanner);
        if (!bannerId) {
          addToast('Unable to update banner: missing ID', 'error');
          return;
        }
        await bannerService.updateBanner(bannerId, payload, imageFile);
        addToast('Banner updated successfully', 'success');
      } else {
        await bannerService.createBanner(payload, imageFile);
        addToast('Banner created successfully', 'success');
      }

      invalidateDashboardStats();
      invalidatePageBannerCache(payload.pageType);
      setIsModalOpen(false);
      setImageFile(null);
      fetchBanners();
    } catch (err) {
      console.error('Failed to save banner', err);
      addToast(err.response?.data?.message || 'Failed to save banner', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (banner) => {
    if (!isAdmin) return;
    const bannerId = getBannerId(banner);
    if (!bannerId) {
      addToast('Unable to delete banner: missing ID', 'error');
      return;
    }
    if (!window.confirm(`Delete banner for ${getPageBannerLabel(banner.pageType || banner.pageName)}?`)) return;

    try {
      await bannerService.deleteBanner(bannerId);
      addToast('Banner deleted successfully', 'success');
      invalidateDashboardStats();
      invalidatePageBannerCache(banner.pageType || banner.pageName);
      fetchBanners();
    } catch (err) {
      console.error('Failed to delete banner', err);
      addToast(err.response?.data?.message || 'Failed to delete banner', 'error');
    }
  };

  const handleToggleStatus = async (banner) => {
    const bannerId = getBannerId(banner);
    if (!bannerId) {
      addToast('Unable to update banner: missing ID', 'error');
      return;
    }

    const nextActive = !banner.isActive;
    const previousBanners = banners;
    const previousSummary = bannerSummary;

    setBanners((prev) => {
      const updated = prev.map((item) =>
        getBannerId(item) === bannerId ? { ...item, isActive: nextActive } : item
      );
      if (statusFilter === 'active' && !nextActive) {
        return updated.filter((item) => getBannerId(item) !== bannerId);
      }
      if (statusFilter === 'inactive' && nextActive) {
        return updated.filter((item) => getBannerId(item) !== bannerId);
      }
      return updated;
    });
    setBannerSummary((prev) => ({
      ...prev,
      active: Math.max(0, prev.active + (nextActive ? 1 : -1)),
      inactive: Math.max(0, prev.inactive + (nextActive ? -1 : 1)),
    }));

    try {
      await bannerService.updateBannerStatus(bannerId, nextActive);
      addToast(`Banner ${nextActive ? 'activated' : 'deactivated'} successfully`, 'success');
      invalidateDashboardStats();
      invalidatePageBannerCache(banner.pageType || banner.pageName);
    } catch (err) {
      console.error('Failed to update banner status', err);
      setBanners(previousBanners);
      setBannerSummary(previousSummary);
      addToast(err.response?.data?.message || 'Failed to update banner status', 'error');
    }
  };

  const previewImage =
    getImageUrl(formData.backgroundImage) ||
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=2000';

  return (
    <div>
      <div className="view-header">
        <div className="view-title-wrap">
          <h2>Banner Management</h2>
          <p>Manage hero banners for all storefront pages from one place.</p>
        </div>
        <button type="button" className="action-btn-primary" onClick={openAddModal}>
          <FaPlus /> Add New Banner
        </button>
      </div>

      <div className="admin-banner-summary">
        <div className="admin-banner-summary-card">
          <span className="admin-banner-summary-value">{bannerSummary.total}</span>
          <span className="admin-banner-summary-label">Total Banners</span>
        </div>
        <div className="admin-banner-summary-card active">
          <span className="admin-banner-summary-value">{bannerSummary.active}</span>
          <span className="admin-banner-summary-label">Active</span>
        </div>
        <div className="admin-banner-summary-card inactive">
          <span className="admin-banner-summary-value">{bannerSummary.inactive}</span>
          <span className="admin-banner-summary-label">Inactive</span>
        </div>
      </div>

      <div className="admin-banners-toolbar">
        <form onSubmit={applySearchNow} className="admin-banners-search">
          <input
            type="text"
            value={searchInput}
            onChange={onSearchChange}
            placeholder="Search banners..."
          />
          <button type="submit" className="action-btn-secondary">
            <FaSearch /> Search
          </button>
        </form>

        <div className="admin-banners-filters">
          <span className="admin-banners-filter-label">Page:</span>
          {PAGE_FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={pageFilter === option.value ? 'action-btn-primary' : 'action-btn-secondary'}
              onClick={() => {
                setPageFilter(option.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="admin-banners-filters">
          <span className="admin-banners-filter-label">Status:</span>
          {STATUS_FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={statusFilter === option.value ? 'action-btn-primary' : 'action-btn-secondary'}
              onClick={() => {
                setStatusFilter(option.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', animation: 'pulse 1.5s infinite ease-in-out' }}>
          <div style={{ height: '30px', width: '220px', background: '#cbd5e1', marginBottom: '20px' }} />
          <div style={{ height: '150px', background: '#cbd5e1' }} />
        </div>
      ) : banners.length > 0 ? (
        <div className="table-responsive-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Banner Preview</th>
                <th>Page Name</th>
                <th>Title</th>
                <th>Highlighted</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner) => (
                <tr key={getBannerId(banner) || banner.pageType}>
                  <td data-label="Banner Preview">
                    <img
                      src={getImageUrl(banner.backgroundImage || banner.image)}
                      alt=""
                      className="admin-banner-thumb"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/logo.png';
                      }}
                    />
                  </td>
                  <td data-label="Page Name">
                    <div className="admin-banner-page-label">
                      {getPageBannerLabel(banner.pageType || banner.pageName)}
                    </div>
                  </td>
                  <td data-label="Title">{banner.title || banner.mainHeading || '—'}</td>
                  <td data-label="Highlighted">
                    {banner.highlightedTitle || banner.highlightText || banner.badgeText || '—'}
                  </td>
                  <td data-label="Status">
                    <div className="admin-banner-status-cell">
                      <span className={`admin-banner-status-text ${banner.isActive ? 'active' : 'inactive'}`}>
                        {banner.isActive ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                      <label
                        className="toggle-switch-admin"
                        title={banner.isActive ? 'Click to deactivate' : 'Click to activate'}
                      >
                        <input
                          type="checkbox"
                          checked={banner.isActive !== false}
                          onChange={() => handleToggleStatus(banner)}
                        />
                        <span className="toggle-slider-admin" />
                      </label>
                    </div>
                  </td>
                  <td data-label="Last Updated">{formatDate(banner.updatedAt)}</td>
                  <td data-label="Actions">
                    <div className="cell-actions">
                      <button
                        type="button"
                        className="btn-action-cell view"
                        title="View"
                        onClick={() => openViewModal(banner)}
                      >
                        <FaEye />
                      </button>
                      <button
                        type="button"
                        className="btn-action-cell edit"
                        title="Edit"
                        onClick={() => openEditModal(banner)}
                      >
                        <FaEdit />
                      </button>
                      {isAdmin ? (
                        <button
                          type="button"
                          className="btn-action-cell delete"
                          title="Delete"
                          onClick={() => handleDelete(banner)}
                        >
                          <FaTrash />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="admin-banner-pagination">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} banners)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="action-btn-secondary"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </button>
              <button
                type="button"
                className="action-btn-secondary"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="dashboard-panel" style={{ padding: '32px', textAlign: 'center' }}>
          <p>
            {hasActiveSearch
              ? ADMIN_NO_MATCH_MESSAGE
              : 'No banners found. Create your first banner to get started.'}
          </p>
          {!hasActiveSearch ? (
            <button type="button" className="action-btn-primary" style={{ marginTop: '12px' }} onClick={openAddModal}>
              <FaPlus /> Add New Banner
            </button>
          ) : null}
        </div>
      )}

      {isModalOpen ? (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div
            className="admin-modal-container"
            style={{ maxWidth: '960px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{editingBanner ? 'Edit Banner' : 'Add New Banner'}</h3>
              <button type="button" className="modal-close-btn" onClick={closeModal} disabled={isSubmitting}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body admin-banner-modal-grid">
                <div>
                  <div className="admin-form-group">
                    <AdminFieldLabel htmlFor="banner-page-type" required>Page Type</AdminFieldLabel>
                    <select id="banner-page-type" name="pageType" value={formData.pageType} onChange={handleChange} required>
                      {BANNER_PAGE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <AdminFieldLabel htmlFor="banner-image-file" required>Banner Image Upload</AdminFieldLabel>
                    <div className="image-upload-zone" style={{ padding: '8px' }}>
                      <input
                        type="file"
                        accept={CMS_IMAGE_ACCEPT}
                        id="banner-image-file"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="banner-image-file" style={{ cursor: 'pointer', margin: 0 }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-sidebar-active)' }}>
                          <FaImage style={{ marginRight: '6px' }} />
                          {isUploading ? 'Uploading...' : 'Browse JPG, PNG, WEBP (max 5MB)'}
                        </p>
                      </label>
                    </div>
                  </div>

                  <AdminValidatedField
                    label="Small Badge Text"
                    name="badgeText"
                    optional
                    value={formData.badgeText}
                    onChange={handleValidatedChange}
                    onBlur={handleValidatedBlur}
                    error={fieldErrors.badgeText}
                    maxLength={ADMIN_TEXT_LIMITS.bannerBadge.max}
                    placeholder="e.g. Fresh Daily"
                  />

                  <div className="admin-form-group row-split">
                    <AdminValidatedField
                      label="Title"
                      name="title"
                      value={formData.title}
                      onChange={handleValidatedChange}
                      onBlur={handleValidatedBlur}
                      error={fieldErrors.title}
                      maxLength={ADMIN_TEXT_LIMITS.bannerTitle.max}
                      required
                      placeholder="Main banner title"
                    />
                    <AdminValidatedField
                      label="Highlighted Title"
                      name="highlightedTitle"
                      optional
                      value={formData.highlightedTitle}
                      onChange={handleValidatedChange}
                      onBlur={handleValidatedBlur}
                      error={fieldErrors.highlightedTitle}
                      maxLength={ADMIN_TEXT_LIMITS.bannerHighlightedTitle.max}
                      placeholder="Accent text"
                    />
                  </div>

                  <AdminValidatedField
                    label="Description"
                    name="description"
                    optional
                    value={formData.description}
                    onChange={handleValidatedChange}
                    onBlur={handleValidatedBlur}
                    error={fieldErrors.description}
                    maxLength={ADMIN_TEXT_LIMITS.bannerDescription.max}
                    as="textarea"
                    rows={3}
                    placeholder="Short banner description"
                  />

                  <div className="admin-form-group row-split">
                    <div>
                      <AdminFieldLabel htmlFor="banner-overlay-color" optional>Overlay Color</AdminFieldLabel>
                      <input id="banner-overlay-color" type="color" name="overlayColor" value={formData.overlayColor} onChange={handleChange} />
                    </div>
                    <div>
                      <AdminFieldLabel htmlFor="banner-overlay-opacity" optional>
                        Overlay Opacity ({formData.overlayOpacity})
                      </AdminFieldLabel>
                      <input
                        id="banner-overlay-opacity"
                        type="range"
                        name="overlayOpacity"
                        min="0"
                        max="1"
                        step="0.05"
                        value={formData.overlayOpacity}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <AdminFieldLabel>Status</AdminFieldLabel>
                    <div className="admin-banner-status-field">
                      <label className="toggle-switch-admin" title={formData.isActive !== false ? 'Active' : 'Inactive'}>
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive !== false}
                          onChange={handleChange}
                        />
                        <span className="toggle-slider-admin" />
                      </label>
                      <span className={`admin-banner-status-text ${formData.isActive !== false ? 'active' : 'inactive'}`}>
                        {formData.isActive !== false ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="admin-banner-preview-panel">
                  <h4 className="admin-section-title">Preview</h4>
                  <div
                    className="admin-banner-live-preview"
                    style={{ backgroundImage: `url('${previewImage}')` }}
                  >
                    <div
                      className="admin-banner-live-overlay"
                      style={getBannerOverlayStyle(formData)}
                    />
                    <div className="admin-banner-live-content">
                      {formData.badgeText ? (
                        <span className="admin-banner-live-badge">{formData.badgeText}</span>
                      ) : null}
                      <h4 className="admin-banner-live-title">
                        {formData.title || 'Title'}
                        {formData.highlightedTitle ? (
                          <>
                            <br />
                            <span className="admin-banner-live-highlight">{formData.highlightedTitle}</span>
                          </>
                        ) : null}
                      </h4>
                      {formData.description ? (
                        <p className="admin-banner-live-desc">{formData.description}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" onClick={closeModal} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="action-btn-primary" disabled={isSubmitting || isUploading}>
                  {isSubmitting ? 'Saving...' : editingBanner ? 'Update Banner' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isViewOpen && viewingBanner ? (
        <div className="admin-modal-overlay" onClick={() => setIsViewOpen(false)}>
          <div
            className="admin-modal-container"
            style={{ maxWidth: '560px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{getPageBannerLabel(viewingBanner.pageType || viewingBanner.pageName)} Banner</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsViewOpen(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <img
                src={getImageUrl(viewingBanner.backgroundImage || viewingBanner.image)}
                alt=""
                style={{ width: '100%', borderRadius: '12px', marginBottom: '16px', maxHeight: '220px', objectFit: 'cover' }}
              />
              <p><strong>Title:</strong> {viewingBanner.title || viewingBanner.mainHeading}</p>
              <p><strong>Highlighted Title:</strong> {viewingBanner.highlightedTitle || viewingBanner.highlightText || '—'}</p>
              <p><strong>Badge:</strong> {viewingBanner.badgeText || '—'}</p>
              <p><strong>Description:</strong> {viewingBanner.description || '—'}</p>
              <p><strong>Status:</strong> {viewingBanner.isActive ? '🟢 Active' : '🔴 Inactive'}</p>
              <p><strong>Last Updated:</strong> {formatDate(viewingBanner.updatedAt)}</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="action-btn-secondary" onClick={() => setIsViewOpen(false)}>
                Close
              </button>
              <button
                type="button"
                className="action-btn-primary"
                onClick={() => {
                  setIsViewOpen(false);
                  openEditModal(viewingBanner);
                }}
              >
                <FaEdit /> Edit
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminBanners;
