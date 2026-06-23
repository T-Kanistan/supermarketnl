import { useState, useEffect, useCallback, useRef } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCommentDots, FaStar, FaUpload, FaSearch } from 'react-icons/fa';
import testimonialService, { DEFAULT_AVATAR } from '../../../services/testimonialService';
import { getImageUrl } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

const emptyForm = {
  customerName: '',
  rating: 5,
  review: '',
  avatarImage: '',
  status: 'active',
};

const validateForm = (formData) => {
  const errors = [];
  const name = (formData.customerName || '').trim();
  const review = (formData.review || '').trim();
  const rating = Number(formData.rating);

  if (!name || name.length < 2) errors.push('Customer name must be at least 2 characters');
  if (name.length > 100) errors.push('Customer name must not exceed 100 characters');
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.push('Rating must be an integer between 1 and 5');
  }
  if (!review || review.length < 20) errors.push('Review must be at least 20 characters');
  if (review.length > 1000) errors.push('Review must not exceed 1000 characters');
  if (!formData.status) errors.push('Status is required');

  return errors;
};

const resolveAvatarSrc = (path) => {
  if (!path) return DEFAULT_AVATAR;
  return getImageUrl(path);
};

export const AdminTestimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const fileInputRef = useRef(null);

  const { addToast } = useToast();
  const { isAdmin } = useAuth();

  const fetchTestimonials = useCallback(async (query = '') => {
    setLoading(true);
    try {
      const data = query.trim()
        ? await testimonialService.searchTestimonials(query.trim())
        : await testimonialService.getAllTestimonials();
      setTestimonials(data);
    } catch (err) {
      console.error('Failed to load testimonials', err);
      addToast(err.response?.data?.message || 'Failed to load testimonials', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTestimonials(searchQuery);
  };

  const openAddModal = () => {
    setEditingTestimonial(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (t) => {
    setEditingTestimonial(t);
    setFormData({
      customerName: t.customerName || '',
      rating: t.rating || 5,
      review: t.review || '',
      avatarImage: t.avatarImage && t.avatarImage !== DEFAULT_AVATAR ? t.avatarImage : '',
      status: t.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? Number(value) : value,
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      addToast('Avatar image must be 3MB or smaller', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await testimonialService.uploadAvatar(file);
      setFormData((prev) => ({ ...prev, avatarImage: imageUrl }));
      addToast('Avatar uploaded successfully', 'success');
    } catch (err) {
      console.error('Failed to upload avatar', err);
      addToast(err.response?.data?.message || 'Failed to upload avatar', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      addToast('Only administrators can delete testimonials', 'error');
      return;
    }
    if (!window.confirm('Delete this testimonial?')) return;
    try {
      await testimonialService.deleteTestimonial(id);
      addToast('Testimonial deleted successfully', 'success');
      fetchTestimonials(searchQuery);
    } catch (err) {
      console.error('Failed to delete testimonial', err);
      addToast(err.response?.data?.message || 'Failed to delete testimonial', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm(formData);
    if (errors.length) {
      addToast(errors[0], 'error');
      return;
    }

    const payload = {
      customerName: formData.customerName.trim(),
      rating: Number(formData.rating),
      review: formData.review.trim(),
      status: formData.status,
      avatarImage: formData.avatarImage || '',
    };

    setIsSubmitting(true);
    try {
      if (editingTestimonial) {
        await testimonialService.updateTestimonial(editingTestimonial.id, payload);
        addToast('Testimonial updated successfully', 'success');
      } else {
        await testimonialService.createTestimonial(payload);
        addToast('New testimonial added successfully', 'success');
      }
      setIsModalOpen(false);
      fetchTestimonials(searchQuery);
    } catch (err) {
      console.error('Failed to save testimonial', err);
      addToast(err.response?.data?.message || 'Failed to save testimonial', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewAvatar = formData.avatarImage || DEFAULT_AVATAR;

  return (
    <div>
      <div className="view-header">
        <div className="view-title-wrap">
          <h2>Testimonials board</h2>
          <p>Update customer reviews, feedback cards, and star ratings displayed on the public site.</p>
        </div>
        <button className="action-btn-primary" onClick={openAddModal}>
          <FaPlus /> Add Testimonial
        </button>
      </div>

      <form onSubmit={handleSearch} style={{ marginBottom: '20px', display: 'flex', gap: '12px', maxWidth: '420px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by customer name or review..."
          style={{ flex: 1 }}
        />
        <button type="submit" className="action-btn-secondary">
          <FaSearch /> Search
        </button>
        {searchQuery && (
          <button
            type="button"
            className="action-btn-secondary"
            onClick={() => {
              setSearchQuery('');
              fetchTestimonials('');
            }}
          >
            Clear
          </button>
        )}
      </form>

      {loading ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', animation: 'pulse 1.5s infinite ease-in-out' }}>
          <div style={{ height: '30px', width: '200px', background: '#cbd5e1', marginBottom: '20px' }}></div>
          <div style={{ height: '150px', background: '#cbd5e1' }}></div>
        </div>
      ) : testimonials.length > 0 ? (
        <div className="table-responsive-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer Image</th>
                <th>Customer Name</th>
                <th>Rating</th>
                <th>Feedback Review</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {testimonials.map((t) => (
                <tr key={t.id}>
                  <td>
                    <img
                      src={resolveAvatarSrc(t.avatarImage || t.image)}
                      alt={t.customerName}
                      className="table-image-preview"
                      style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                    />
                  </td>
                  <td style={{ fontWeight: 600 }}>{t.customerName}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '2px', color: '#eab308' }}>
                      {[...Array(t.rating || 0)].map((_, i) => (
                        <FaStar key={i} />
                      ))}
                    </div>
                  </td>
                  <td style={{ color: 'var(--admin-text-sub)' }}>&ldquo;{t.review}&rdquo;</td>
                  <td>
                    <span className={`status-badge-admin ${t.status}`}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    <div className="cell-actions">
                      <button className="btn-action-cell edit" onClick={() => openEditModal(t)} title="Edit Testimonial">
                        <FaEdit />
                      </button>
                      {isAdmin && (
                        <button className="btn-action-cell delete" onClick={() => handleDelete(t.id)} title="Delete Testimonial">
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="dashboard-panel admin-empty-state">
          <FaCommentDots className="admin-empty-icon" />
          <h3>No testimonials found!</h3>
          <p>Click &ldquo;Add Testimonial&rdquo; above to add new customer feedback.</p>
        </div>
      )}

      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="admin-form-group">
                  <label>Customer Name</label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="e.g. Sarah"
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Rating Score (Stars)</label>
                  <select name="rating" value={formData.rating} onChange={handleChange}>
                    <option value={5}>5 Stars</option>
                    <option value={4}>4 Stars</option>
                    <option value={3}>3 Stars</option>
                    <option value={2}>2 Stars</option>
                    <option value={1}>1 Star</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Customer Review</label>
                  <textarea
                    name="review"
                    value={formData.review}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Write feedback paragraph (min 20 characters)..."
                    required
                    minLength={20}
                    maxLength={1000}
                  />
                  <p className="admin-field-hint">{formData.review.length}/1000 characters</p>
                </div>

                <div className="admin-form-group">
                  <label>Avatar Image (Optional)</label>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <img
                      src={resolveAvatarSrc(previewAvatar)}
                      alt="Avatar preview"
                      style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                    />
                    <div
                      className="image-upload-zone"
                      style={{ flex: 1, minWidth: '200px', padding: '16px', cursor: 'pointer' }}
                      onClick={() => !isUploading && fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                      <FaUpload style={{ marginBottom: '6px' }} />
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                        {isUploading ? 'Uploading...' : 'Click to upload — jpg, jpeg, png, webp (max 3MB)'}
                      </p>
                    </div>
                  </div>
                  <p className="admin-field-hint">Leave empty to use the default avatar on the storefront.</p>
                </div>

                <div className="admin-form-group" style={{ marginTop: '16px' }}>
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="action-btn-primary" disabled={isSubmitting || isUploading}>
                  {isSubmitting ? 'Saving...' : 'Save Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTestimonials;
