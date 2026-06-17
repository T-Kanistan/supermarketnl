import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaBullhorn } from 'react-icons/fa';
import cmsService from '../../../services/cmsService';
import { useToast } from '../../../context/ToastContext';

export const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAnn, setEditingAnn] = useState(null);

  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    offerPercentage: 0,
    startDate: '',
    endDate: '',
    status: 'active',
  });

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const data = await cmsService.getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error('Failed to load announcements', err);
      addToast('Failed to load announcements', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    let isMounted = true;
    const initAnnouncements = async () => {
      await Promise.resolve();
      if (isMounted) {
        fetchAnnouncements();
      }
    };
    initAnnouncements();
    return () => { isMounted = false; };
  }, [fetchAnnouncements]);

  const openAddModal = () => {
    setEditingAnn(null);
    setFormData({
      title: '',
      description: '',
      image: '',
      offerPercentage: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (a) => {
    setEditingAnn(a);
    setFormData({
      title: a.title || '',
      description: a.description || '',
      image: a.image || '',
      offerPercentage: a.offerPercentage || 0,
      startDate: a.startDate || '',
      endDate: a.endDate || '',
      status: a.status || 'active',
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
    if (!window.confirm('Delete this announcement / campaign?')) return;
    try {
      await cmsService.deleteAnnouncement(id);
      addToast('Announcement deleted successfully', 'success');
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to delete announcement', err);
      addToast('Failed to delete announcement', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      addToast('Title and Description are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingAnn) {
        await cmsService.updateAnnouncement(editingAnn.id, formData);
        addToast('Announcement updated successfully', 'success');
      } else {
        await cmsService.createAnnouncement(formData);
        addToast('New announcement created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to save announcement', err);
      addToast('Failed to save announcement', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

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

      {loading ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', animation: 'pulse 1.5s infinite ease-in-out' }}>
          <div style={{ height: '30px', width: '200px', background: '#cbd5e1', marginBottom: '20px' }}></div>
          <div style={{ height: '150px', background: '#cbd5e1' }}></div>
        </div>
      ) : announcements.length > 0 ? (
        <div className="table-responsive-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Description</th>
                <th>Offer %</th>
                <th>Campaign Dates</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.image ? (
                      <img 
                        src={a.image} 
                        alt={a.title} 
                        className="table-image-preview" 
                        style={{ width: '80px', height: '45px' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>No image</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>{a.title}</td>
                  <td style={{ color: 'var(--admin-text-sub)' }}>{a.description}</td>
                  <td style={{ fontWeight: 600, color: 'var(--red-discount)' }}>{a.offerPercentage > 0 ? `${a.offerPercentage}% OFF` : 'N/A'}</td>
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>Start: {a.startDate || 'N/A'}</div>
                    <div style={{ fontSize: '0.8rem' }}>End: {a.endDate || 'N/A'}</div>
                  </td>
                  <td>
                    <span className={`status-badge-admin ${a.status}`}>
                      {a.status}
                    </span>
                  </td>
                  <td>
                    <div className="cell-actions">
                      <button className="btn-action-cell edit" onClick={() => openEditModal(a)} title="Edit Announcement">
                        <FaEdit />
                      </button>
                      <button className="btn-action-cell delete" onClick={() => handleDelete(a.id)} title="Delete Announcement">
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
          <FaBullhorn className="admin-empty-icon" />
          <h3>No announcements found!</h3>
          <p>Click "Add Announcement" above to publish seasonal campaigns.</p>
        </div>
      )}

      {/* Add / Edit Announcement Modal */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>{editingAnn ? 'Edit Announcement' : 'Publish Announcement'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
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
                    placeholder="e.g. WEEKLY DEALS" 
                    required 
                  />
                </div>

                <div className="admin-form-group">
                  <label>Description Content</label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    rows="3"
                    placeholder="Describe the promotion..." 
                    required 
                  />
                </div>

                <div className="admin-form-group row-split">
                  <div>
                    <label>Discount Percentage (%)</label>
                    <input 
                      type="number" 
                      name="offerPercentage" 
                      value={formData.offerPercentage} 
                      onChange={handleChange} 
                      placeholder="e.g. 30" 
                    />
                  </div>
                  <div>
                    <label>Status</label>
                    <select name="status" value={formData.status} onChange={handleChange}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
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
                    />
                  </div>
                  <div>
                    <label>End Date</label>
                    <input 
                      type="date" 
                      name="endDate" 
                      value={formData.endDate} 
                      onChange={handleChange} 
                    />
                  </div>
                </div>

                <div className="admin-form-group row-split">
                  <div>
                    <label>Campaign Banner Image URL</label>
                    <input 
                      type="text" 
                      name="image" 
                      value={formData.image} 
                      onChange={handleChange} 
                      placeholder="https://..." 
                    />
                  </div>
                  <div>
                    <label>Or Upload Campaign Image</label>
                    <div className="image-upload-zone" style={{ padding: '8px' }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        id="ann-file" 
                        onChange={handleImageUpload} 
                        style={{ display: 'none' }} 
                      />
                      <label htmlFor="ann-file" style={{ cursor: 'pointer', margin: 0 }}>
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
                      alt="Campaign Preview" 
                      className="upload-preview-img"
                      style={{ height: '70px', width: '120px' }}
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'; }}
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="action-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncements;
