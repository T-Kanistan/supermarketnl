import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import bannerService from '../../../services/bannerService';
import { useToast } from '../../../context/ToastContext';

export const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    highlightText: '',
    subtitle: '',
    image: '',
    buttonText: 'EXPLORE PRODUCTS',
    buttonLink: '/products',
    status: 'active',
  });

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bannerService.getBanners();
      setBanners(data);
    } catch (err) {
      console.error('Failed to load home banners', err);
      addToast('Failed to load home banners', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    let isMounted = true;
    const initBanners = async () => {
      await Promise.resolve();
      if (isMounted) {
        fetchBanners();
      }
    };
    initBanners();
    return () => { isMounted = false; };
  }, [fetchBanners]);

  const openAddModal = () => {
    setEditingBanner(null);
    setFormData({
      title: 'FRESH PRODUCTS',
      highlightText: 'BETTER LIVING',
      subtitle: 'Your one-stop supermarket for quality products and great offers.',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200',
      buttonText: 'EXPLORE PRODUCTS',
      buttonLink: '/products',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      highlightText: banner.highlightText || '',
      subtitle: banner.subtitle || '',
      image: banner.image || '',
      buttonText: banner.buttonText || 'EXPLORE PRODUCTS',
      buttonLink: banner.buttonLink || '/products',
      status: banner.status || 'active',
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
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      await bannerService.deleteBanner(id);
      addToast('Banner deleted successfully', 'success');
      fetchBanners();
    } catch (err) {
      console.error('Failed to delete banner', err);
      addToast('Failed to delete banner', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingBanner) {
        await bannerService.updateBanner(editingBanner.id, formData);
        addToast('Banner updated successfully', 'success');
      } else {
        await bannerService.createBanner(formData);
        addToast('New banner added successfully', 'success');
      }
      setIsModalOpen(false);
      fetchBanners();
    } catch (err) {
      console.error('Failed to save banner', err);
      addToast('Failed to save banner', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="view-header">
        <div className="view-title-wrap">
          <h2>Hero Banners</h2>
          <p>Configure promotion banners on the public homepage header.</p>
        </div>
        <button className="action-btn-primary" onClick={openAddModal}>
          <FaPlus /> Add New Banner
        </button>
      </div>

      {loading ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', animation: 'pulse 1.5s infinite ease-in-out' }}>
          <div style={{ height: '30px', width: '200px', background: '#cbd5e1', marginBottom: '20px' }}></div>
          <div style={{ height: '150px', background: '#cbd5e1' }}></div>
        </div>
      ) : banners.length > 0 ? (
        <div className="table-responsive-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Highlighted</th>
                <th>Button Text</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner) => (
                <tr key={banner.id}>
                  <td>
                    <img 
                      src={banner.image} 
                      alt={banner.title} 
                      className="table-image-preview" 
                      style={{ width: '80px', height: '45px' }}
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'; }}
                    />
                  </td>
                  <td style={{ fontWeight: 600 }}>{banner.title}</td>
                  <td style={{ color: 'var(--primary-green)', fontWeight: 600 }}>{banner.highlightText}</td>
                  <td>{banner.buttonText}</td>
                  <td>
                    <span className={`status-badge-admin ${banner.status}`}>
                      {banner.status}
                    </span>
                  </td>
                  <td>
                    <div className="cell-actions">
                      <button className="btn-action-cell edit" onClick={() => openEditModal(banner)} title="Edit Banner">
                        <FaEdit />
                      </button>
                      <button className="btn-action-cell delete" onClick={() => handleDelete(banner.id)} title="Delete Banner">
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
          <FaEye className="admin-empty-icon" />
          <h3>No banners found!</h3>
          <p>Click "Add New Banner" above to publish one.</p>
        </div>
      )}

      {/* Add / Edit Banner Modal */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>{editingBanner ? 'Edit Banner' : 'Create Hero Banner'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="admin-form-group row-split">
                  <div>
                    <label>Title (Normal Color)</label>
                    <input 
                      type="text" 
                      name="title" 
                      value={formData.title} 
                      onChange={handleChange} 
                      placeholder="e.g. FRESH PRODUCTS" 
                      required 
                    />
                  </div>
                  <div>
                    <label>Highlighted Text (Vibrant Color)</label>
                    <input 
                      type="text" 
                      name="highlightText" 
                      value={formData.highlightText} 
                      onChange={handleChange} 
                      placeholder="e.g. BETTER LIVING" 
                      required 
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Subtitle Paragraph</label>
                  <input 
                    type="text" 
                    name="subtitle" 
                    value={formData.subtitle} 
                    onChange={handleChange} 
                    placeholder="Enter short description..." 
                    required 
                  />
                </div>

                <div className="admin-form-group row-split">
                  <div>
                    <label>Button Label</label>
                    <input 
                      type="text" 
                      name="buttonText" 
                      value={formData.buttonText} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                  <div>
                    <label>Button Router Link</label>
                    <input 
                      type="text" 
                      name="buttonLink" 
                      value={formData.buttonLink} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>

                <div className="admin-form-group row-split">
                  <div>
                    <label>Banner Image URL</label>
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
                    <label>Or Upload Image File</label>
                    <div className="image-upload-zone" style={{ padding: '8px' }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        id="banner-file" 
                        onChange={handleImageUpload} 
                        style={{ display: 'none' }} 
                      />
                      <label htmlFor="banner-file" style={{ cursor: 'pointer', margin: 0 }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-sidebar-active)' }}>
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

                {/* LIVE VISUAL PREVIEW PANEL */}
                <div className="banner-preview-box">
                  <div className="banner-preview-title">Visual Live Preview</div>
                  <div 
                    className="banner-render-mock" 
                    style={{ backgroundImage: `url('${formData.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200'}')` }}
                  >
                    <div className="banner-mock-content">
                      <h4 className="banner-mock-title">
                        {formData.title || 'TITLE TEXT'} <br />
                        <span>{formData.highlightText || 'HIGHLIGHTED TEXT'}</span>
                      </h4>
                      <p className="banner-mock-sub">{formData.subtitle || 'Subtitle description content goes here.'}</p>
                      <span className="banner-mock-btn">{formData.buttonText || 'BUTTON'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="action-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBanners;
