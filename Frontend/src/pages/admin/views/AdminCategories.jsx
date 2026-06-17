import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTags } from 'react-icons/fa';
import categoryService from '../../../services/categoryService';
import { useToast } from '../../../context/ToastContext';

export const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    image: '',
    status: 'active',
  });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories', err);
      addToast('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    let isMounted = true;
    const initCategories = async () => {
      await Promise.resolve();
      if (isMounted) {
        fetchCategories();
      }
    };
    initCategories();
    return () => { isMounted = false; };
  }, [fetchCategories]);

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      image: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      image: category.image || '',
      status: category.status || 'active',
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
    if (!window.confirm('Deleting this category will affect products. Continue?')) return;
    try {
      await categoryService.deleteCategory(id);
      addToast('Category deleted successfully', 'success');
      fetchCategories();
    } catch (err) {
      console.error('Failed to delete category', err);
      addToast('Failed to delete category', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      addToast('Please enter a category name', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, formData);
        addToast('Category updated successfully', 'success');
      } else {
        await categoryService.createCategory(formData);
        addToast('New category created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error('Failed to save category', err);
      addToast('Failed to save category', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="view-header">
        <div className="view-title-wrap">
          <h2>Catalog Categories</h2>
          <p>Organize products and ready-to-eat meals into catalog sections.</p>
        </div>
        <button className="action-btn-primary" onClick={openAddModal}>
          <FaPlus /> Add Category
        </button>
      </div>

      {loading ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', animation: 'pulse 1.5s infinite ease-in-out' }}>
          <div style={{ height: '30px', width: '200px', background: '#cbd5e1', marginBottom: '20px' }}></div>
          <div style={{ height: '150px', background: '#cbd5e1' }}></div>
        </div>
      ) : categories.length > 0 ? (
        <div className="table-responsive-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Category ID</th>
                <th>Category Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    <img 
                      src={cat.image} 
                      alt={cat.name} 
                      className="table-image-preview" 
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'; }}
                    />
                  </td>
                  <td style={{ fontWeight: 500, color: '#64748b' }}>{cat.id}</td>
                  <td style={{ fontWeight: 600 }}>{cat.name}</td>
                  <td>
                    <span className={`status-badge-admin ${cat.status}`}>
                      {cat.status}
                    </span>
                  </td>
                  <td>
                    <div className="cell-actions">
                      <button className="btn-action-cell edit" onClick={() => openEditModal(cat)} title="Edit Category">
                        <FaEdit />
                      </button>
                      <button className="btn-action-cell delete" onClick={() => handleDelete(cat.id)} title="Delete Category">
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
          <FaTags className="admin-empty-icon" />
          <h3>No categories found!</h3>
          <p>Click "Add Category" above to create one.</p>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container">
            <div className="modal-header">
              <h3>{editingCategory ? 'Edit Category' : 'Create Category'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="admin-form-group">
                  <label>Category Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder="e.g. Vegetables" 
                    required 
                  />
                </div>

                <div className="admin-form-group row-split">
                  <div>
                    <label>Category Image URL</label>
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
                        id="cat-file" 
                        onChange={handleImageUpload} 
                        style={{ display: 'none' }} 
                      />
                      <label htmlFor="cat-file" style={{ cursor: 'pointer', margin: 0 }}>
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
                      alt="Category Preview" 
                      className="upload-preview-img"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'; }}
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
                  {isSubmitting ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
