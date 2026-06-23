import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaBullhorn, FaEye, FaSearch } from 'react-icons/fa';
import announcementService from '../../../services/announcementService';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { getImageUrl } from '../../../services/api';

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
  { value: 'expired', label: 'Expired' },
];

const emptyForm = () => ({
  title: '',
  description: '',
  bannerImage: '',
  discountPercentage: 0,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
  const [editingAnn, setEditingAnn] = useState(null);
  const [viewingAnn, setViewingAnn] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { addToast } = useToast();
  const { isAdmin } = useAuth();
  const [formData, setFormData] = useState(emptyForm());

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      let result;
      if (searchQuery.trim()) {
        result = await announcementService.searchAnnouncements(searchQuery.trim());
      } else if (statusFilter && statusFilter !== 'all') {
        result = await announcementService.getAnnouncements({ status: statusFilter });
      } else {
        result = await announcementService.getAnnouncements();
      }
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
    setIsModalOpen(true);
  };

  const openEditModal = (announcement) => {
    setEditingAnn(announcement);
    const storedStatus = announcement.status === 'expired' ? 'inactive' : announcement.status;
    setFormData({
      title: announcement.title || '',
      description: announcement.description || '',
      bannerImage: announcement.bannerImage || announcement.image || '',
      discountPercentage: announcement.discountPercentage ?? announcement.offerPercentage ?? 0,
      startDate: announcement.startDate || '',
      endDate: announcement.endDate || '',
      status: storedStatus === 'scheduled' ? 'draft' : storedStatus || 'draft',
    });
    setIsModalOpen(true);
  };

  const openViewModal = (announcement) => {
    setViewingAnn(announcement);
    setIsViewOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast('Banner image must be 5MB or smaller', 'error');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, bannerImage: previewUrl }));
    setIsUploading(true);

    try {
      const imageUrl = await announcementService.uploadBanner(file);
      setFormData((prev) => ({ ...prev, bannerImage: imageUrl }));
      addToast('Banner uploaded successfully', 'success');
    } catch (err) {
      console.error('Banner upload failed', err);
      addToast(err.response?.data?.message || 'Failed to upload banner', 'error');
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
    if (!formData.startDate || !formData.endDate) {
      addToast('Start and end dates are required', 'error');
      return false;
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      addToast('End date must be after start date', 'error');
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
    if (!isAdmin) {
      addToast('Only administrators can delete announcements', 'error');
      return;
    }
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

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAnnouncements();
  };

  const getStatusClass = (announcement) =>
    announcement.effectiveStatus || announcement.status || 'inactive';

  return (
    <div>
      <div className="view-header">
        <div className="view-title-wrap">
          <h2>Store Announcements</h2>
          <p>Create discount campaigns, seasonal promotions, and store announcements appearing on storefront pages.</p>
        </div>
        <button className="action-btn-primary" onClick={openAddModal}>
          <FaPlus /> Add Announcement
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '260px', maxWidth: '420px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or description..."
            style={{ flex: 1 }}
          />
          <button type="submit" className="action-btn-secondary">
            <FaSearch /> Search
          </button>
        </form>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={statusFilter === option.value ? 'action-btn-primary' : 'action-btn-secondary'}
              onClick={() => {
                setStatusFilter(option.value);
                setSearchQuery('');
              }}
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
                <th>Start Date</th>
                <th>End Date</th>
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
                    <td>
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
                    <td style={{ fontWeight: 600 }}>{announcement.title}</td>
                    <td style={{ color: 'var(--admin-text-sub)', maxWidth: '220px' }}>{announcement.description}</td>
                    <td style={{ fontWeight: 600, color: 'var(--red-discount)' }}>
                      {discount > 0 ? `${discount}% OFF` : 'N/A'}
                    </td>
                    <td>
                      <span className={`status-badge-admin ${statusClass}`}>
                        {statusClass}
                      </span>
                    </td>
                    <td>{formatDate(announcement.startDate)}</td>
                    <td>{formatDate(announcement.endDate)}</td>
                    <td>
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
                        {isAdmin && (
                          <button
                            className="btn-action-cell delete"
                            onClick={() => handleDelete(announcement.id)}
                            title="Delete Announcement"
                          >
                            <FaTrash />
                          </button>
                        )}
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
          <h3>No announcements found</h3>
          <p>Click &quot;Add Announcement&quot; above to publish seasonal campaigns.</p>
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
                  <label>Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. SUMMER SALE"
                    minLength={3}
                    maxLength={150}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Description</label>
                  <textarea
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
                    <label>Discount Percentage (%)</label>
                    <input
                      type="number"
                      name="discountPercentage"
                      value={formData.discountPercentage}
                      onChange={handleChange}
                      min={0}
                      max={100}
                      placeholder="e.g. 25"
                    />
                  </div>
                  <div>
                    <label>Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} required>
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="admin-form-group row-split">
                  <div>
                    <label>Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label>End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Banner Image (Optional)</label>
                  <div className="image-upload-zone" style={{ padding: '12px' }}>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      id="ann-file"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="ann-file" style={{ cursor: 'pointer', margin: 0 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-sidebar-active)' }}>
                        {isUploading ? 'Uploading...' : 'Browse Files — jpg, jpeg, png, webp (max 5MB)'}
                      </p>
                    </label>
                  </div>
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
              <p><strong>Campaign:</strong> {formatDate(viewingAnn.startDate)} – {formatDate(viewingAnn.endDate)}</p>
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
