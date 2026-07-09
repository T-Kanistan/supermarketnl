import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaUtensils, FaSearch } from 'react-icons/fa';
import foodCornerCategoryService from '../../../services/foodCornerCategoryService';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { formatCategoryName } from '../../../utils/formatCategoryName';
import useAdminSearch from '../../../hooks/useAdminSearch';
import { ADMIN_NO_MATCH_MESSAGE } from '../../../utils/adminSearch';
import FoodCornerCategoryIcon from '../../../components/FoodCornerCategoryIcon';
import AdminFieldLabel from '../../../components/admin/AdminFieldLabel';
import {
  FOOD_CORNER_CATEGORY_ICON_ACCEPT,
  validateFoodCornerCategoryIcon,
  validateFoodCornerCategoryIconFile,
} from '../../../utils/foodCornerCategoryIconValidation';

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const CategoryIconPreview = ({ category }) => (
  <span className="fc-admin-icon-preview" aria-hidden="true">
    <FoodCornerCategoryIcon
      icon={category.icon}
      imgClassName="fc-admin-icon-preview-img"
      fallback="🍽️"
    />
  </span>
);

export const AdminFoodCornerCategories = () => {
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 8, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const { searchInput, searchQuery, onSearchChange, hasActiveSearch } = useAdminSearch();

  const { addToast } = useToast();
  const { isAdmin } = useAuth();

  const [formData, setFormData] = useState({
    categoryName: '',
    slug: '',
    icon: '',
    description: '',
    status: true,
  });
  const [fieldErrors, setFieldErrors] = useState({
    categoryName: '',
    slug: '',
    icon: '',
  });

  const fetchCategories = useCallback(async (pageOverride) => {
    const page = pageOverride ?? currentPage;
    setLoading(true);
    try {
      const result = await foodCornerCategoryService.getCategories({
        search: searchQuery || undefined,
        page,
        limit: itemsPerPage,
      });
      setCategories(Array.isArray(result.data) ? result.data : []);
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (err) {
      console.error('Failed to load Food Corner categories', err);
      addToast('Failed to load Food Corner categories', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, searchQuery, currentPage]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (!isModalOpen) return undefined;

    const scrollY = window.scrollY;
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';

    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [isModalOpen]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFieldErrors({ categoryName: '', slug: '', icon: '' });
  };

  const resetFieldErrors = () => setFieldErrors({ categoryName: '', slug: '', icon: '' });

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({
      categoryName: '',
      slug: '',
      icon: '',
      description: '',
      status: true,
    });
    resetFieldErrors();
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      categoryName: category.categoryName || category.name || '',
      slug: category.slug || category.id || '',
      icon: category.icon || '',
      description: category.description || '',
      status: Boolean(category.status),
    });
    resetFieldErrors();
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'categoryName' && !editingCategory) {
      setFormData((prev) => ({
        ...prev,
        categoryName: value,
        slug: slugify(value),
      }));
      setFieldErrors((prev) => ({ ...prev, categoryName: '', slug: '' }));
      return;
    }

    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'categoryName' || name === 'slug') {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleIconUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { valid, error } = validateFoodCornerCategoryIconFile(file);
    if (!valid) {
      setFieldErrors((prev) => ({ ...prev, icon: error }));
      e.target.value = '';
      return;
    }

    setFieldErrors((prev) => ({ ...prev, icon: '' }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, icon: reader.result || '' }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveIcon = () => {
    setFormData((prev) => ({ ...prev, icon: '' }));
    setFieldErrors((prev) => ({ ...prev, icon: '' }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.categoryName.trim()) {
      errors.categoryName = 'Please enter a category name.';
    }

    if (!formData.slug.trim()) {
      errors.slug = 'Please enter a category slug.';
    }

    const iconError = validateFoodCornerCategoryIcon(formData.icon, {
      isEdit: Boolean(editingCategory),
      existingIcon: editingCategory?.icon || '',
    });
    if (iconError) {
      errors.icon = iconError;
    }

    setFieldErrors({
      categoryName: errors.categoryName || '',
      slug: errors.slug || '',
      icon: errors.icon || '',
    });

    return errors;
  };

  const handleToggleStatus = async (category) => {
    try {
      await foodCornerCategoryService.toggleCategoryStatus(category.id || category.slug);
      addToast('Category status updated', 'success');
      fetchCategories();
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Failed to update status', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      addToast('Only administrators can permanently delete categories', 'error');
      return;
    }
    if (!window.confirm('Delete this Food Corner category?')) return;
    try {
      await foodCornerCategoryService.deleteCategory(id);
      addToast('Food Corner category deleted successfully', 'success');
      fetchCategories();
    } catch (err) {
      console.error('Failed to delete Food Corner category', err);
      addToast(err.message || 'Failed to delete Food Corner category', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    const errorMessages = Object.values(errors).filter(Boolean);
    if (errorMessages.length > 0) {
      addToast(errorMessages[0], 'error');
      return;
    }

    const payload = {
      categoryName: formData.categoryName.trim(),
      slug: slugify(formData.slug || formData.categoryName),
      icon: formData.icon,
      description: formData.description.trim(),
      status: Boolean(formData.status),
    };

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await foodCornerCategoryService.updateCategory(editingCategory.id, payload);
        addToast('Food Corner category updated successfully', 'success');
        closeModal();
        fetchCategories();
      } else {
        await foodCornerCategoryService.createCategory(payload);
        addToast('Food Corner category created successfully', 'success');
        closeModal();
        setCurrentPage(1);
        fetchCategories(1);
      }
    } catch (err) {
      console.error('Failed to save Food Corner category', err);
      addToast(err.response?.data?.message || err.message || 'Failed to save Food Corner category', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = pagination.totalPages || 1;
  const totalEntries = pagination.total || categories.length;

  return (
    <div>
      <div className="view-header">
        <div className="view-title-wrap">
          <h2>Food Corner Categories</h2>
          <p>Manage menu sections for the Food Corner page independently from supermarket catalog categories.</p>
        </div>
        <button type="button" className="action-btn-primary" onClick={openAddModal}>
          <FaPlus /> Add Category
        </button>
      </div>

      <div className="table-controls">
        <div className="search-box-admin">
          <FaSearch className="search-icon-admin" />
          <input
            type="text"
            placeholder="Search Food Corner categories..."
            value={searchInput}
            onChange={onSearchChange}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', animation: 'pulse 1.5s infinite ease-in-out' }}>
          <div style={{ height: '30px', width: '220px', background: '#cbd5e1', marginBottom: '20px' }} />
          <div style={{ height: '150px', background: '#cbd5e1' }} />
        </div>
      ) : categories.length > 0 ? (
        <div className="table-responsive-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image/Icon</th>
                <th>Category ID</th>
                <th>Category Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id || cat.slug}>
                  <td data-label="Image/Icon">
                    <CategoryIconPreview category={cat} />
                  </td>
                  <td data-label="Category ID" style={{ fontWeight: 500, color: '#64748b' }}>{cat.slug || cat.id}</td>
                  <td data-label="Category Name" style={{ fontWeight: 600 }}>{formatCategoryName(cat.categoryName || cat.name)}</td>
                  <td data-label="Status">
                    <button
                      type="button"
                      className={`status-badge-admin ${cat.status ? 'active' : 'inactive'}`}
                      onClick={() => handleToggleStatus(cat)}
                      style={{ border: 'none', cursor: 'pointer' }}
                      title="Toggle status"
                    >
                      {cat.status ? 'active' : 'inactive'}
                    </button>
                  </td>
                  <td data-label="Actions">
                    <div className="cell-actions">
                      <button
                        type="button"
                        className="btn-action-cell edit"
                        onClick={() => openEditModal(cat)}
                        title="Edit Category"
                      >
                        <FaEdit />
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          className="btn-action-cell delete"
                          onClick={() => handleDelete(cat.id || cat.slug)}
                          title="Delete Category"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <span className="pagination-text">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalEntries)} to{' '}
                {Math.min(currentPage * itemsPerPage, totalEntries)} of {totalEntries} entries
              </span>
              <div className="pagination-btns">
                <button
                  type="button"
                  className="pagination-btn-nav"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="pagination-btn-nav"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="dashboard-panel admin-empty-state">
          <FaUtensils className="admin-empty-icon" />
          <h3>{hasActiveSearch ? ADMIN_NO_MATCH_MESSAGE : 'No Food Corner categories found!'}</h3>
          {!hasActiveSearch ? (
            <p>Click &quot;Add Category&quot; above to create your first menu section.</p>
          ) : null}
        </div>
      )}

      {isModalOpen && (
        <div className="admin-modal-overlay" onClick={closeModal} role="presentation">
          <div
            className="admin-modal-container"
            style={{ maxWidth: '650px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{editingCategory ? 'Edit Food Corner Category' : 'Add Food Corner Category'}</h3>
              <button type="button" className="modal-close-btn" onClick={closeModal} aria-label="Close modal">
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="fc-category-name" required>
                    Category Name
                  </AdminFieldLabel>
                  <input
                    id="fc-category-name"
                    type="text"
                    name="categoryName"
                    value={formData.categoryName}
                    onChange={handleChange}
                    placeholder="e.g. Main Meals"
                    className={fieldErrors.categoryName ? 'admin-input-invalid' : ''}
                    aria-invalid={fieldErrors.categoryName ? 'true' : undefined}
                  />
                  {fieldErrors.categoryName ? (
                    <p className="admin-field-error" role="alert">{fieldErrors.categoryName}</p>
                  ) : null}
                </div>

                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="fc-category-slug" required>
                    Category Slug
                  </AdminFieldLabel>
                  <input
                    id="fc-category-slug"
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="e.g. main-meals"
                    className={fieldErrors.slug ? 'admin-input-invalid' : ''}
                    aria-invalid={fieldErrors.slug ? 'true' : undefined}
                  />
                  {fieldErrors.slug ? (
                    <p className="admin-field-error" role="alert">{fieldErrors.slug}</p>
                  ) : null}
                </div>

                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="fc-category-description" optional>
                    Short Description
                  </AdminFieldLabel>
                  <textarea
                    id="fc-category-description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Brief description for this menu section"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      name="status"
                      checked={formData.status}
                      onChange={handleChange}
                    />
                    Active Category
                  </label>
                </div>

                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="fc-category-icon-file" required>
                    Category Icon Upload
                  </AdminFieldLabel>
                  <div className={`image-upload-zone${fieldErrors.icon ? ' admin-input-invalid' : ''}`} style={{ padding: '12px' }}>
                    <input
                      type="file"
                      accept={FOOD_CORNER_CATEGORY_ICON_ACCEPT}
                      id="fc-category-icon-file"
                      onChange={handleIconUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="fc-category-icon-file" style={{ cursor: 'pointer', margin: 0 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-sidebar-active)' }}>
                        Browse Files
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0' }}>
                        PNG, JPG, JPEG, SVG, WEBP (max 2 MB)
                      </p>
                    </label>
                  </div>
                  {fieldErrors.icon ? (
                    <p className="admin-field-error" role="alert">{fieldErrors.icon}</p>
                  ) : null}
                </div>

                {formData.icon ? (
                  <div className="upload-preview-container">
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Preview:</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span className="fc-admin-icon-preview fc-admin-icon-preview--large">
                        <FoodCornerCategoryIcon
                          icon={formData.icon}
                          imgClassName="fc-admin-icon-preview-img"
                        />
                      </span>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <label
                          htmlFor="fc-category-icon-file"
                          className="action-btn-secondary"
                          style={{ cursor: 'pointer', margin: 0, padding: '8px 12px', fontSize: '0.85rem' }}
                        >
                          Replace Image
                        </label>
                        <button
                          type="button"
                          className="action-btn-secondary"
                          onClick={handleRemoveIcon}
                          style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                        >
                          Remove Image
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
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

export default AdminFoodCornerCategories;
