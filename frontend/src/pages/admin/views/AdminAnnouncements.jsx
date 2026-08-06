import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaBullhorn, FaEye, FaSearch } from 'react-icons/fa';
import announcementService from '../../../services/announcementService';
import { useToast } from '../../../context/ToastContext';
import { getImageUrl } from '../../../services/api';
import { CMS_IMAGE_ACCEPT, rejectInvalidCmsImageFile } from '../../../utils/imageUploadValidation';
import useAdminSearch from '../../../hooks/useAdminSearch';
import { ADMIN_NO_MATCH_MESSAGE } from '../../../utils/adminSearch';
import AdminFieldLabel from '../../../components/admin/AdminFieldLabel';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'draft', label: 'Draft' },
];

const emptyForm = () => ({
  title: '',
  subtitle: '',
  description: '',
  badgeText: '',
  buttonText: 'Shop Offers',
  buttonLink: '/offers',
  overlayColor: '#0f172a',
  overlayOpacity: 0.35,
  bannerImage: '',
  discountPercentage: 0,
  status: 'draft',
});

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

export const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [editingAnn, setEditingAnn] = useState(null);
  const [viewingAnn, setViewingAnn] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const { searchInput, searchQuery, onSearchChange, applySearchNow, hasActiveSearch } = useAdminSearch();

  const { addToast } = useToast();
  const [formData, setFormData] = useState(emptyForm());

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery) params.q = searchQuery;
      const result = await announcementService.getAnnouncements(params);
      setAnnouncements(result.data);
    } catch (err) {
      console.error('Failed to load announcements', err);
      addToast(err.response?.data?.message || 'Failed to load announcements', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, searchQuery, statusFilter]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const openAddModal = () => {
    setEditingAnn(null);
    setFormData(emptyForm());
    setImageError('');
    setIsModalOpen(true);
  };

  const openEditModal = (announcement) => {
    setEditingAnn(announcement);
    const storedStatus = announcement.status === 'expired' ? 'inactive' : announcement.status;
    setFormData({
      title: announcement.title || '',
      subtitle: announcement.subtitle || '',
      description: announcement.description || '',
      badgeText: announcement.badgeText || '',
      buttonText: announcement.buttonText || 'Shop Offers',
      buttonLink: announcement.buttonLink || '/offers',
      overlayColor: announcement.overlayColor || '#0f172a',
      overlayOpacity: announcement.overlayOpacity ?? 0.35,
      bannerImage: announcement.bannerImage || announcement.image || '',
      discountPercentage: announcement.discountPercentage ?? announcement.offerPercentage ?? 0,
      status: storedStatus || 'draft',
    });
    setImageError('');
    setIsModalOpen(true);
  };

  const openViewModal = (announcement) => {
    setViewingAnn(announcement);
    setIsViewOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'range' && name === 'overlayOpacity' ? Number(value) : value,
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      rejectInvalidCmsImageFile(
        file,
        (msg) => {
          setImageError(msg);
          addToast(msg, 'error');
        },
        e.target
      )
    ) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, bannerImage: previewUrl }));
    setImageError('');
    setIsUploading(true);

    try {
      const imageUrl = await announcementService.uploadBanner(file);
      setFormData((prev) => ({ ...prev, bannerImage: imageUrl }));
      addToast('Banner uploaded successfully', 'success');
    } catch (err) {
      console.error('Banner upload failed', err);
      const message = err.response?.data?.message || 'Failed to upload banner';
      setImageError(message);
      addToast(message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = () => {
    const title = formData.title?.trim() || '';
    const description = formData.description?.trim() || '';

    if (title.length < 3 || title.length > 150) {
      addToast('Title must be between 3 and 150 characters', 'error');
      return false;
    }
    if (description.length < 10) {
      addToast('Description must be at least 10 characters', 'error');
      return false;
    }
    if (description.length > 2000) {
      addToast('Description must not exceed 2000 characters', 'error');
      return false;
    }
    const discount = Number(formData.discountPercentage);
    if (discount < 0 || discount > 100) {
      addToast('Discount must be between 0 and 100', 'error');
      return false;
    }
    if (!formData.status) {
      addToast('Status is required', 'error');
      return false;
    }
    if (formData.bannerImage?.startsWith('blob:')) {
      addToast('Please wait for banner upload to finish', 'error');
      return false;
    }
    return true;
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement / campaign?')) return;
    try {
      await announcementService.deleteAnnouncement(id);
      addToast('Announcement deleted successfully', 'success');
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to delete announcement', err);
      addToast(err.response?.data?.message || 'Failed to delete announcement', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingAnn) {
        await announcementService.updateAnnouncement(editingAnn.id, formData);
        addToast('Announcement updated successfully', 'success');
      } else {
        await announcementService.createAnnouncement(formData);
        addToast('Announcement created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to save announcement', err);
      addToast(err.response?.data?.message || 'Failed to save announcement', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusClass = (announcement) =>
    announcement.effectiveStatus || announcement.status || 'inactive';

  return (
    <div>
      <div className="view-header">
        <div className="view-title-wrap">
          <h2>Store Announcements</h2>
          <p>Homepage promotional banners only. These do not appear on the Offers page.</p>
        </div>
        <button
          className="action-btn-primary"
          onClick={openAddModal}
          disabled={announcements.length >= 2}
          title={announcements.length >= 2 ? "Maximum of 2 banners allowed" : ""}
        >
          <FaPlus /> Add Announcement
        </button>
      </div>

      <div className="view-toolbar">
        <form onSubmit={applySearchNow} className="view-toolbar-search">
          <input
            type="text"
            value={searchInput}
            onChange={onSearchChange}
            placeholder="Search by title or description..."
          />
          <button type="submit" className="action-btn-secondary">
            <FaSearch /> Search
          </button>
        </form>
        <div className="view-toolbar-filters">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={statusFilter === option.value ? 'action-btn-primary' : 'action-btn-secondary'}
              onClick={() => setStatusFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', animation: 'pulse 1.5s infinite ease-in-out' }}>
          <div style={{ height: '30px', width: '200px', background: '#cbd5e1', marginBottom: '20px' }} />
          <div style={{ height: '150px', background: '#cbd5e1' }} />
        </div>
      ) : announcements.length > 0 ? (
        <div className="table-responsive-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Banner</th>
                <th>Title</th>
                <th>Description</th>
                <th>Discount %</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((announcement) => {
                const banner = announcement.bannerImage || announcement.image;
                const discount = announcement.discountPercentage ?? announcement.offerPercentage ?? 0;
                const statusClass = getStatusClass(announcement);

                return (
                  <tr key={announcement.id}>
                    <td data-label="Banner">
                      {banner ? (
                        <img
                          src={getImageUrl(banner)}
                          alt={announcement.title}
                          className="table-image-preview"
                          style={{ width: '80px', height: '45px', objectFit: 'cover' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>No banner</span>
                      )}
                    </td>
                    <td data-label="Title" style={{ fontWeight: 600 }}>{announcement.title}</td>
                    <td data-label="Description" style={{ color: 'var(--admin-text-sub)', maxWidth: '220px' }}>{announcement.description}</td>
                    <td data-label="Discount %" style={{ fontWeight: 600, color: 'var(--red-discount)' }}>
                      {discount > 0 ? `${discount}% OFF` : 'N/A'}
                    </td>
                    <td data-label="Status">
                      <span className={`status-badge-admin ${statusClass}`}>
                        {statusClass}
                      </span>
                    </td>
                    <td data-label="Actions">
                      <div className="cell-actions">
                        <button
                          className="btn-action-cell view"
                          onClick={() => openViewModal(announcement)}
                          title="View Announcement"
                        >
                          <FaEye />
                        </button>
                        <button
                          className="btn-action-cell edit"
                          onClick={() => openEditModal(announcement)}
                          title="Edit Announcement"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn-action-cell delete"
                          onClick={() => handleDelete(announcement.id)}
                          title="Delete Announcement"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="dashboard-panel admin-empty-state">
          <FaBullhorn className="admin-empty-icon" />
          <h3>{hasActiveSearch ? ADMIN_NO_MATCH_MESSAGE : 'No announcements found'}</h3>
          {!hasActiveSearch ? (
            <p>Click &quot;Add Announcement&quot; above to publish seasonal campaigns.</p>
          ) : null}
        </div>
      )}

      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>{editingAnn ? 'Edit Announcement' : 'Add Announcement'}</h3>
              <button className="modal-close-btn" type="button" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="ann-title" required>Title</AdminFieldLabel>
                  <input
                    id="ann-title"
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. SUMMER SALE"
                    minLength={3}
                    maxLength={150}
                    required
                  />
                  <div className="admin-field-meta">
                    <span />
                    <span className="admin-char-counter">{formData.title.length}/150</span>
                  </div>
                </div>

                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="ann-subtitle" optional>Highlighted Title</AdminFieldLabel>
                  <input
                    id="ann-subtitle"
                    type="text"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleChange}
                    placeholder="e.g. MADE FRESH (shown in accent color)"
                    maxLength={200}
                  />
                </div>

                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="ann-description" required>Description</AdminFieldLabel>
                  <textarea
                    id="ann-description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Describe the promotion (min 10 characters)..."
                    required
                    minLength={10}
                    maxLength={2000}
                  />
                  <p className="admin-field-hint">{formData.description.length}/2000 characters</p>
                </div>

                <div className="admin-form-group row-split">
                  <div>
                    <AdminFieldLabel htmlFor="ann-badge" optional>Badge Text</AdminFieldLabel>
                    <input
                      id="ann-badge"
                      type="text"
                      name="badgeText"
                      value={formData.badgeText}
                      onChange={handleChange}
                      placeholder="e.g. WEEKLY DEALS"
                      maxLength={60}
                    />
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="ann-discount" optional>Discount Percentage (%)</AdminFieldLabel>
                    <input
                      id="ann-discount"
                      type="number"
                      name="discountPercentage"
                      value={formData.discountPercentage}
                      onChange={handleChange}
                      min={0}
                      max={100}
                      placeholder="e.g. 25"
                    />
                  </div>
                </div>

                <div className="admin-form-group row-split">
                  <div>
                    <AdminFieldLabel htmlFor="ann-button-text" optional>Button Text</AdminFieldLabel>
                    <input
                      id="ann-button-text"
                      type="text"
                      name="buttonText"
                      value={formData.buttonText}
                      onChange={handleChange}
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="ann-button-link" optional>Button URL</AdminFieldLabel>
                    <input
                      id="ann-button-link"
                      type="text"
                      name="buttonLink"
                      value={formData.buttonLink}
                      onChange={handleChange}
                      placeholder="/offers"
                    />
                  </div>
                </div>

                <div className="admin-form-group row-split">
                  <div>
                    <AdminFieldLabel htmlFor="ann-overlay-color" optional>Overlay Color</AdminFieldLabel>
                    <input
                      id="ann-overlay-color"
                      type="color"
                      name="overlayColor"
                      value={formData.overlayColor}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="ann-overlay-opacity" optional>
                      Overlay Opacity ({Math.round((formData.overlayOpacity ?? 0.35) * 100)}%)
                    </AdminFieldLabel>
                    <input
                      id="ann-overlay-opacity"
                      type="range"
                      name="overlayOpacity"
                      min="0"
                      max="1"
                      step="0.05"
                      value={formData.overlayOpacity ?? 0.35}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="admin-form-group row-split">
                  <div>
                    <AdminFieldLabel htmlFor="ann-status" required>Status</AdminFieldLabel>
                    <select id="ann-status" name="status" value={formData.status} onChange={handleChange} required>
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div />
                </div>

                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="ann-file" optional>Banner Image</AdminFieldLabel>
                  <div className={`image-upload-zone${imageError ? ' admin-input-invalid' : ''}`} style={{ padding: '12px' }}>
                    <input
                      type="file"
                      accept={CMS_IMAGE_ACCEPT}
                      id="ann-file"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="ann-file" style={{ cursor: 'pointer', margin: 0 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-sidebar-active)' }}>
                        {isUploading ? 'Uploading...' : 'Browse JPG, JPEG, PNG, WEBP (max 5 MB)'}
                      </p>
                    </label>
                  </div>
                  {imageError ? <p className="admin-field-error" role="alert">{imageError}</p> : null}
                  {formData.bannerImage && (
                    <div className="upload-preview-container" style={{ marginTop: '12px' }}>
                      <img
                        src={getImageUrl(formData.bannerImage)}
                        alt="Campaign Preview"
                        className="upload-preview-img"
                        style={{ height: '70px', width: '120px', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="action-btn-primary" disabled={isSubmitting || isUploading}>
                  {isSubmitting ? 'Saving...' : 'Save Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewOpen && viewingAnn && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3>{viewingAnn.title}</h3>
              <button className="modal-close-btn" type="button" onClick={() => setIsViewOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {(viewingAnn.bannerImage || viewingAnn.image) && (
                <img
                  src={getImageUrl(viewingAnn.bannerImage || viewingAnn.image)}
                  alt={viewingAnn.title}
                  style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px' }}
                />
              )}
              <p style={{ marginBottom: '12px' }}>{viewingAnn.description}</p>
              <p><strong>Discount:</strong> {viewingAnn.discountPercentage ?? viewingAnn.offerPercentage ?? 0}%</p>
              <p><strong>Status:</strong> {getStatusClass(viewingAnn)}</p>
              <p><strong>Created:</strong> {formatDate(viewingAnn.createdAt)}</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="action-btn-secondary" onClick={() => setIsViewOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncements;
