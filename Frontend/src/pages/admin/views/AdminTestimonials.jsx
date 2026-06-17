import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCommentDots, FaStar } from 'react-icons/fa';
import feedbackService from '../../../services/feedbackService';
import { useToast } from '../../../context/ToastContext';

export const AdminTestimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);

  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    customerName: '',
    rating: 5,
    review: '',
    image: '',
    status: 'active',
  });

  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      const data = await feedbackService.getTestimonials();
      setTestimonials(data);
    } catch (err) {
      console.error('Failed to load testimonials', err);
      addToast('Failed to load testimonials', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    let isMounted = true;
    const initTestimonials = async () => {
      await Promise.resolve();
      if (isMounted) {
        fetchTestimonials();
      }
    };
    initTestimonials();
    return () => { isMounted = false; };
  }, [fetchTestimonials]);

  const openAddModal = () => {
    setEditingTestimonial(null);
    setFormData({
      customerName: '',
      rating: 5,
      review: '',
      image: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70 + 1),
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (t) => {
    setEditingTestimonial(t);
    setFormData({
      customerName: t.customerName || '',
      rating: t.rating || 5,
      review: t.review || '',
      image: t.image || '',
      status: t.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this testimonial feedback?')) return;
    try {
      await feedbackService.deleteTestimonial(id);
      addToast('Testimonial deleted successfully', 'success');
      fetchTestimonials();
    } catch (err) {
      console.error('Failed to delete testimonial', err);
      addToast('Failed to delete testimonial', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.review) {
      addToast('Customer Name and Review are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTestimonial) {
        await feedbackService.updateTestimonial(editingTestimonial.id, formData);
        addToast('Testimonial updated successfully', 'success');
      } else {
        await feedbackService.createTestimonial(formData);
        addToast('New testimonial added successfully', 'success');
      }
      setIsModalOpen(false);
      fetchTestimonials();
    } catch (err) {
      console.error('Failed to save testimonial', err);
      addToast('Failed to save testimonial', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                      src={t.image} 
                      alt={t.customerName} 
                      className="table-image-preview" 
                      style={{ width: '44px', height: '44px', borderRadius: '50%' }}
                      onError={(e) => { e.target.src = 'https://i.pravatar.cc/150?img=9'; }}
                    />
                  </td>
                  <td style={{ fontWeight: 600 }}>{t.customerName}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '2px', color: '#eab308' }}>
                      {[...Array(t.rating)].map((_, i) => (
                        <FaStar key={i} />
                      ))}
                    </div>
                  </td>
                  <td style={{ color: 'var(--admin-text-sub)' }}>"{t.review}"</td>
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
                      <button className="btn-action-cell delete" onClick={() => handleDelete(t.id)} title="Delete Testimonial">
                        <FaTrash />
                      </button>
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
          <p>Click "Add Testimonial" above to add new customer feedback.</p>
        </div>
      )}

      {/* Add / Edit Testimonial Modal */}
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
                    placeholder="e.g. Sarah Johnson" 
                    required 
                  />
                </div>

                <div className="admin-form-group">
                  <label>Rating Score (Stars)</label>
                  <select name="rating" value={formData.rating} onChange={handleChange}>
                    <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                    <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                    <option value="3">⭐⭐⭐ (3 Stars)</option>
                    <option value="2">⭐⭐ (2 Stars)</option>
                    <option value="1">⭐ (1 Star)</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Customer Review</label>
                  <textarea 
                    name="review" 
                    value={formData.review} 
                    onChange={handleChange} 
                    rows="4"
                    placeholder="Write feedback paragraph..." 
                    required 
                  />
                </div>

                <div className="admin-form-group row-split">
                  <div>
                    <label>Avatar URL</label>
                    <input 
                      type="text" 
                      name="image" 
                      value={formData.image} 
                      onChange={handleChange} 
                      placeholder="https://..." 
                      required 
                    />
                  </div>
                  <div>
                    <label>Or Upload Avatar File</label>
                    <div className="image-upload-zone" style={{ padding: '8px' }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        id="test-file" 
                        onChange={handleImageUpload} 
                        style={{ display: 'none' }} 
                      />
                      <label htmlFor="test-file" style={{ cursor: 'pointer', margin: 0 }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-sidebar-active)' }}>
                          Browse Files
                        </p>
                      </label>
                    </div>
                  </div>
                </div>

                {formData.image && (
                  <div className="upload-preview-container">
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Preview:</p>
                    <img 
                      src={formData.image} 
                      alt="Customer Preview" 
                      className="upload-preview-img"
                      style={{ borderRadius: '50%', width: '60px', height: '60px' }}
                      onError={(e) => { e.target.src = 'https://i.pravatar.cc/150?img=9'; }}
                    />
                  </div>
                )}

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
                <button type="submit" className="action-btn-primary" disabled={isSubmitting}>
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
