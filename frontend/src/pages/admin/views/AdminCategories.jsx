import { useState, useEffect, useCallback, useMemo } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTags, FaSearch } from 'react-icons/fa';
import categoryService from '../../../services/categoryService';
import { getImageUrl } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { formatCategoryName } from '../../../utils/formatCategoryName';
import { invalidateDashboardStats } from '../../../utils/dashboardStatsRefresh';
import useAdminSearch from '../../../hooks/useAdminSearch';
import { filterByAdminSearch, statusSearchLabel, ADMIN_NO_MATCH_MESSAGE } from '../../../utils/adminSearch';
import AdminValidatedField from '../../../components/admin/AdminValidatedField';
import AdminFieldLabel from '../../../components/admin/AdminFieldLabel';
import {
  ADMIN_TEXT_LIMITS,
  CATEGORY_IMAGE_ACCEPT,
  validateCategoryName,
  validateCategoryImage,
  validateCategoryImageFile,
} from '../../../utils/adminTextValidation';

export const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const { searchInput, searchQuery, onSearchChange, hasActiveSearch } = useAdminSearch();

  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    image: '',
    status: 'active',
  });
  const [fieldErrors, setFieldErrors] = useState({ name: '', image: '' });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoryService.getCategories({ admin: true });
      setCategories(Array.isArray(data) ? data : []);
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

  const resetFieldErrors = () => setFieldErrors({ name: '', image: '' });

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      image: '',
      status: 'active',
    });
    resetFieldErrors();
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      image: category.image || '',
      status: category.status || 'active',
    });
    resetFieldErrors();
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'image') {
      setFieldErrors((prev) => ({ ...prev, image: '' }));
    }
  };

  const handleValidatedChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleValidatedBlur = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'name') {
      setFieldErrors((prev) => ({ ...prev, name: validateCategoryName(value) }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const { valid, error } = validateCategoryImageFile(file);
    if (!valid) {
      setFieldErrors((prev) => ({ ...prev, image: error }));
      e.target.value = '';
      return;
    }

    setFieldErrors((prev) => ({ ...prev, image: '' }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const errors = {
      name: validateCategoryName(formData.name),
      image: validateCategoryImage(formData.image, {
        isEdit: Boolean(editingCategory),
        existingImage: editingCategory?.image,
      }),
    };
    setFieldErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deleting this category will affect products. Continue?')) return;
    try {
      await categoryService.deleteCategory(id);
      addToast('Category deleted successfully', 'success');
      invalidateDashboardStats();
      fetchCategories();
    } catch (err) {
      console.error('Failed to delete category', err);
      addToast('Failed to delete category', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, formData);
        addToast('Category updated successfully', 'success');
      } else {
        await categoryService.createCategory(formData);
        addToast('New category created successfully', 'success');
      }
      invalidateDashboardStats();
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error('Failed to save category', err);
      addToast(err.response?.data?.message || 'Failed to save category', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = useMemo(() => {
    const sorted = [...categories].sort((a, b) => {
      const aTime = Date.parse(a.createdAt) || 0;
      const bTime = Date.parse(b.createdAt) || 0;
      if (bTime !== aTime) return bTime - aTime;
      return String(b.id || b._id || '').localeCompare(String(a.id || a._id || ''));
    });
    return filterByAdminSearch(sorted, searchQuery, (cat) => [
      cat.name,
      cat.id,
      statusSearchLabel(cat.status),
    ]);
  }, [categories, searchQuery]);

  const { min: nameMin, max: nameMax } = ADMIN_TEXT_LIMITS.categoryName;

  return (
    <div>
      <div className="view-header">
        <div className="view-title-wrap">
          <h2>Product Categories</h2>
          <p>Organize supermarket products for the Products page. Food Corner meals use separate menu sections.</p>
        </div>
        <button className="action-btn-primary" onClick={openAddModal}>
          <FaPlus /> Add Category
        </button>
      </div>

      <div className="table-controls">
        <div className="search-box-admin">
          <FaSearch className="search-icon-admin" />
          <input
            type="text"
            placeholder="Search by name, ID, or status..."
            value={searchInput}
            onChange={onSearchChange}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', animation: 'pulse 1.5s infinite ease-in-out' }}>
          <div style={{ height: '30px', width: '200px', background: '#cbd5e1', marginBottom: '20px' }}></div>
          <div style={{ height: '150px', background: '#cbd5e1' }}></div>
        </div>
      ) : filteredCategories.length > 0 ? (
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
              {filteredCategories.map((cat) => (
                <tr key={cat.id}>
                  <td data-label="Image">
                    <img 
                      src={getImageUrl(cat.image)} 
                      alt={cat.name} 
                      className="table-image-preview" 
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'; }}
                    />
                  </td>
                  <td data-label="Category ID" style={{ fontWeight: 500, color: '#64748b' }}>{cat.id}</td>
                  <td data-label="Category Name" style={{ fontWeight: 600 }}>{formatCategoryName(cat.name)}</td>
                  <td data-label="Status">
                    <span className={`status-badge-admin ${cat.status}`}>
                      {cat.status}
                    </span>
                  </td>
                  <td data-label="Actions">
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
          <h3>{hasActiveSearch ? ADMIN_NO_MATCH_MESSAGE : 'No categories found!'}</h3>
          <p>
            {hasActiveSearch
              ? 'Try a different search term.'
              : 'Click "Add Category" above to create one.'}
          </p>
        </div>
      )}

      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container">
            <div className="modal-header">
              <h3>{editingCategory ? 'Edit Category' : 'Create Category'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <AdminValidatedField
                  label="Category Name"
                  name="name"
                  value={formData.name}
                  onChange={handleValidatedChange}
                  onBlur={handleValidatedBlur}
                  error={fieldErrors.name}
                  maxLength={nameMax}
                  minLength={nameMin}
                  required
                  placeholder="e.g. Vegetables"
                />

                <div className="admin-form-group row-split">
                  <div>
                    <AdminFieldLabel htmlFor="category-image-url" required>
                      Category Image URL
                    </AdminFieldLabel>
                    <input
                      type="text"
                      id="category-image-url"
                      name="image"
                      value={formData.image}
                      onChange={handleChange}
                      placeholder="https://..."
                      className={fieldErrors.image ? 'admin-input-invalid' : ''}
                      aria-invalid={fieldErrors.image ? 'true' : undefined}
                    />
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="cat-file" required>
                      Or Upload Image File
                    </AdminFieldLabel>
                    <div className={`image-upload-zone${fieldErrors.image ? ' admin-input-invalid' : ''}`} style={{ padding: '8px' }}>
                      <input 
                        type="file" 
                        accept={CATEGORY_IMAGE_ACCEPT}
                        id="cat-file" 
                        onChange={handleImageUpload} 
                        style={{ display: 'none' }} 
                      />
                      <label htmlFor="cat-file" style={{ cursor: 'pointer', margin: 0 }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-sidebar-active)' }}>
                          Browse JPG, JPEG, PNG, WEBP (max 2 MB)
                        </p>
                      </label>
                    </div>
                  </div>
                </div>
                {fieldErrors.image ? (
                  <div className="admin-field-meta">
                    <p className="admin-field-error" role="alert">{fieldErrors.image}</p>
                  </div>
                ) : null}

                {formData.image && (
                  <div className="upload-preview-container">
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Preview:</p>
                    <img 
                      src={getImageUrl(formData.image)} 
                      alt="Category Preview" 
                      className="upload-preview-img"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'; }}
                    />
                  </div>
                )}

                <div className="admin-form-group" style={{ marginTop: '16px' }}>
                  <AdminFieldLabel htmlFor="category-status">Status</AdminFieldLabel>
                  <select id="category-status" name="status" value={formData.status} onChange={handleChange}>
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
