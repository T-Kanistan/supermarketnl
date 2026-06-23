import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaBoxOpen, FaStar, FaRegStar } from 'react-icons/fa';
import productService from '../../../services/productService';
import foodCornerCategoryService from '../../../services/foodCornerCategoryService';
import { getImageUrl } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

export const AdminProducts = () => {
  const { isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  // Route-driven type view:
  // - /admin/dashboard/products            => grocery only
  // - /admin/dashboard/products?type=food-corner => food-corner only
  const initialType = searchParams.get('type') === 'food-corner' ? 'food-corner' : 'grocery';
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [foodCornerCategories, setFoodCornerCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    productName: '',
    categoryId: '',
    price: 0,
    stockStatus: 'in_stock',
    weightUnit: '',
    imageUrl: '',
    productType: 'grocery',
    featuredProduct: false,
    menuDisplayTiming: '',
  });

  const mapProductType = (value) => {
    const raw = value == null ? '' : String(value).trim().toLowerCase();
    if (!raw) return 'grocery';
    if (raw === 'food' || raw === 'food-corner' || raw === 'food corner' || raw === 'foodcorner') return 'food-corner';
    if (raw === 'grocery' || raw === 'supermarket' || raw === 'supermarket section') return 'grocery';
    return 'grocery';
  };

  const loadModalCategories = useCallback(async (productType) => {
    try {
      const cats = await productService.getProductCategories(productType);
      if (mapProductType(productType) === 'food-corner') {
        setFoodCornerCategories(Array.isArray(cats) ? cats : []);
      } else {
        setCategories(Array.isArray(cats) ? cats : []);
      }
      return cats;
    } catch (err) {
      console.error('Failed to load categories', err);
      return [];
    }
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      loadModalCategories(formData.productType);
    }
  }, [isModalOpen, formData.productType, loadModalCategories]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const prodData = await productService.getProducts({ admin: true });

      const [catData, fcCatData] = await Promise.all([
        productService.getProductCategories('grocery'),
        foodCornerCategoryService.getCategories({ public: true }),
      ]);

      setProducts(Array.isArray(prodData) ? prodData : []);
      setCategories(Array.isArray(catData) ? catData : []);
      setFoodCornerCategories(Array.isArray(fcCatData) ? fcCatData : []);
    } catch (err) {
      console.error('Failed to load catalog details', err);
      addToast(err.response?.data?.message || 'Failed to load catalog details', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    setTypeFilter(searchParams.get('type') === 'food-corner' ? 'food-corner' : 'grocery');
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    setEditingProduct(null);
  };

  const handleStatusToggle = async (product) => {
    const nextStatus = product.status === 'active' ? 'inactive' : 'active';
    try {
      await productService.updateProduct(product.id, { status: nextStatus });
      setProducts((prev) => 
        prev.map((p) => p.id === product.id ? { ...p, status: nextStatus } : p)
      );
      addToast(`Product "${product.name}" status updated to ${nextStatus}`, 'success');
    } catch (e) {
      console.error('Failed to update status', e);
      addToast(e.message || e.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const handleFeaturedToggle = async (product) => {
    const nextFeatured = !product.isFeatured;
    try {
      await productService.updateProduct(product.id, { isFeatured: nextFeatured });
      setProducts((prev) => 
        prev.map((p) => p.id === product.id ? { ...p, isFeatured: nextFeatured } : p)
      );
      addToast(`Product "${product.name}" featured state updated`, 'success');
    } catch (e) {
      console.error('Failed to update featured state', e);
      addToast(e.message || e.response?.data?.message || 'Failed to update featured state', 'error');
    }
  };

  const openAddModal = async () => {
    setEditingProduct(null);
    const selectedProductType = typeFilter === 'food-corner' ? 'food-corner' : 'grocery';
    const cats = await loadModalCategories(selectedProductType);
    setFormData({
      productName: '',
      categoryId: cats[0]?.categoryId || cats[0]?.id || '',
      price: 0,
      stockStatus: 'in_stock',
      weightUnit: '',
      imageUrl: '',
      productType: selectedProductType,
      featuredProduct: false,
      menuDisplayTiming: '',
    });
    setIsModalOpen(true);
  };

  const resolveFormCategoryId = (product, productType) => {
    const rawId = product.categoryId || '';
    const rawName = product.categoryName || '';
    const options = mapProductType(productType) === 'food-corner' ? foodCornerCategories : categories;
    const match = options.find(
      (cat) =>
        [cat.categoryId, cat.id, cat.slug, cat._id].filter(Boolean).some((value) => value === rawId) ||
        cat.name === rawName ||
        cat.categoryName === rawName
    );
    return match?.categoryId || match?.id || match?.slug || rawId || '';
  };

  const openEditModal = (product) => {
    const productType = mapProductType(product.productType || product.type);
    setEditingProduct(product);
    setFormData({
      productName: product.productName || product.name || '',
      categoryId: resolveFormCategoryId(product, productType),
      price: product.price || 0,
      stockStatus: product.stockStatus || (product.stock > 0 ? 'in_stock' : 'out_of_stock'),
      weightUnit: product.weightUnit || product.weight || '',
      imageUrl: product.imageUrl || product.image || '',
      productType,
      featuredProduct: Boolean(product.featuredProduct ?? product.isFeatured),
      menuDisplayTiming: product.menuDisplayTiming || product.displayTime || '',
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    if (name === 'productType') {
      setFormData((prev) => ({
        ...prev,
        productType: value,
        categoryId: '',
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, imageUrl: previewUrl }));

    try {
      const uploadedUrl = await productService.uploadProductImage(file);
      setFormData((prev) => ({ ...prev, imageUrl: uploadedUrl }));
      addToast('Image uploaded successfully', 'success');
    } catch (err) {
      console.error('Image upload failed', err);
      addToast(err.response?.data?.message || 'Failed to upload image', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      addToast('Only administrators can permanently delete products', 'error');
      return;
    }
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await productService.deleteProduct(id);
      addToast('Product deleted successfully', 'success');
      fetchData();
    } catch (err) {
      console.error('Failed to delete product', err);
      addToast('Failed to delete product', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productName) {
      addToast('Product name is required', 'error');
      return;
    }
    if (!formData.imageUrl?.trim() || formData.imageUrl.startsWith('blob:')) {
      addToast('Please upload a product image before saving', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, formData);
        addToast('Product updated successfully', 'success');
      } else {
        await productService.createProduct(formData);
        addToast('New product added successfully', 'success');
      }
      closeModal();
      fetchData();
    } catch (err) {
      console.error('Failed to save product', err);
      addToast(err.message || err.response?.data?.message || 'Failed to save product', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const name = prod.productName || prod.name || '';
      const productType = mapProductType(prod.productType || prod.type);
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = productType === mapProductType(typeFilter);
      const matchesCategory = categoryFilter === 'all' || prod.categoryId === categoryFilter;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [products, searchQuery, typeFilter, categoryFilter]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const offset = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(offset, offset + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  const getCategoryName = (catId, productType = 'grocery') => {
    if (mapProductType(productType) === 'food-corner') {
      const fcCat = foodCornerCategories.find(
        (c) =>
          c.slug === catId ||
          c.id === catId ||
          c._id === catId ||
          c.categoryName === catId ||
          c.name === catId
      );
      if (fcCat) return fcCat.categoryName || fcCat.name;
    }

    const cat = categories.find((c) => c.id === catId);
    if (cat) return cat.name;
    return catId || 'General';
  };

  return (
    <div>
      <div className="view-header">
        <div className="view-title-wrap">
          <h2>Catalog Products</h2>
          <p>Create, update, and manage inventory products and ready-to-eat restaurant items.</p>
        </div>
        <button className="action-btn-primary" onClick={openAddModal}>
          <FaPlus /> Add Product
        </button>
      </div>

      {/* Search and Filters Controls */}
      <div className="table-controls">
        <div className="search-box-admin">
          <FaSearch className="search-icon-admin" />
          <input 
            type="text" 
            placeholder="Search by product name..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="filter-group-admin">
          <select 
            className="filter-select-admin" 
            value={typeFilter} 
            disabled
          >
            <option value={typeFilter}>
              {typeFilter === 'food-corner' ? 'Food Corner (Kitchen)' : 'Grocery (Supermarket)'}
            </option>
          </select>

          <select 
            className="filter-select-admin" 
            value={categoryFilter} 
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Categories</option>
            {typeFilter !== 'food-corner' && categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
            {typeFilter === 'food-corner' && (
              foodCornerCategories.map((cat) => (
                <option key={cat.id || cat.slug} value={cat.id || cat.slug}>
                  {cat.categoryName || cat.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', animation: 'pulse 1.5s infinite ease-in-out' }}>
          <div style={{ height: '30px', width: '200px', background: '#cbd5e1', marginBottom: '20px' }}></div>
          <div style={{ height: '200px', background: '#cbd5e1' }}></div>
        </div>
      ) : paginatedProducts.length > 0 ? (
        <div className="table-responsive-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product Name</th>
                <th>Type</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock / Availability</th>
                <th>Featured</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((prod) => (
                <tr key={prod.id}>
                  <td data-label="Image">
                    <img 
                      src={getImageUrl(prod.imageUrl || prod.image)} 
                      alt={prod.productName || prod.name} 
                      className="table-image-preview" 
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'; }}
                    />
                  </td>
                  <td data-label="Product Name">
                    <div style={{ fontWeight: 600 }}>{prod.productName || prod.name}</div>
                    {(prod.weightUnit || prod.weight) && (
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{prod.weightUnit || prod.weight}</span>
                    )}
                  </td>
                  <td data-label="Type">
                    <span style={{ fontSize: '0.8rem', background: mapProductType(prod.productType || prod.type) === 'food-corner' ? '#fef3c7' : '#dcfce7', color: mapProductType(prod.productType || prod.type) === 'food-corner' ? '#b45309' : '#15803d', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      {mapProductType(prod.productType || prod.type) === 'food-corner' ? 'Food Corner' : 'Grocery'}
                    </span>
                  </td>
                  <td data-label="Category">{getCategoryName(prod.categoryId, prod.productType || prod.type)}</td>
                  <td data-label="Price" style={{ fontWeight: 600 }}>€{(prod.price || 12.99).toFixed(2)}</td>
                  <td data-label="Stock / Availability">
                    {mapProductType(prod.productType || prod.type) === 'food-corner' ? (
                      <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                        🕒 {prod.menuDisplayTiming || prod.displayTime || 'Always'}
                      </span>
                    ) : (
                      <span style={{ color: (prod.stockStatus === 'in_stock' || prod.stock > 0) ? '#15803d' : '#b91c1c', fontWeight: 600 }}>
                        {(prod.stockStatus === 'in_stock' || prod.stock > 0) ? 'In Stock' : 'Out of Stock'}
                      </span>
                    )}
                  </td>
                  <td data-label="Featured">
                    <button 
                      onClick={() => handleFeaturedToggle(prod)} 
                      style={{ cursor: 'pointer', fontSize: '1.2rem', color: '#eab308' }}
                      title={(prod.featuredProduct || prod.isFeatured) ? 'Unmark Featured' : 'Mark Featured'}
                    >
                      {(prod.featuredProduct || prod.isFeatured) ? <FaStar /> : <FaRegStar />}
                    </button>
                  </td>
                  <td data-label="Status">
                    <label className="toggle-switch-admin">
                      <input 
                        type="checkbox" 
                        checked={prod.status === 'active'} 
                        onChange={() => handleStatusToggle(prod)} 
                      />
                      <span className="toggle-slider-admin"></span>
                    </label>
                  </td>
                  <td data-label="Actions" className="admin-actions-cell">
                    <div className="cell-actions">
                      <button className="btn-action-cell edit" onClick={() => openEditModal(prod)} title="Edit Product">
                        <FaEdit />
                      </button>
                      {isAdmin && (
                        <button className="btn-action-cell delete" onClick={() => handleDelete(prod.id)} title="Delete Product">
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="admin-pagination">
              <span className="pagination-text">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredProducts.length)} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} entries
              </span>
              <div className="pagination-btns">
                <button 
                  className="pagination-btn-nav" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Previous
                </button>
                <button 
                  className="pagination-btn-nav" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="dashboard-panel admin-empty-state">
          <FaBoxOpen className="admin-empty-icon" />
          <h3>No products found!</h3>
          <p>Try refining your search filter or click "Add Product" to add a new catalog item.</p>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div
          className="admin-modal-overlay"
          onClick={closeModal}
          role="presentation"
        >
          <div
            className="admin-modal-container admin-product-modal"
            style={{ maxWidth: '650px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Product Item' : 'Add Catalog Product'}</h3>
              <button type="button" className="modal-close-btn" onClick={closeModal} aria-label="Close modal">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="admin-form-group">
                  <label>Product Catalog Type</label>
                  <select name="productType" value={formData.productType} onChange={handleChange}>
                    <option value="grocery">Grocery (Supermarket Section)</option>
                    <option value="food-corner">Food Corner (Kitchen Section)</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Product Name</label>
                  <input 
                    type="text" 
                    name="productName" 
                    value={formData.productName} 
                    onChange={handleChange} 
                    placeholder="e.g. Farm Fresh Apples" 
                    required 
                  />
                </div>

                <div className="admin-form-group row-split">
                  <div>
                    <label>Category Section</label>
                    <select name="categoryId" value={formData.categoryId} onChange={handleChange} required>
                      {formData.productType !== 'food-corner' ? (
                        categories.map((cat) => (
                          <option key={cat.id || cat.categoryId} value={cat.categoryId || cat.id}>{cat.name || cat.categoryName}</option>
                        ))
                      ) : (
                        foodCornerCategories.map((cat) => (
                          <option key={cat.id || cat.slug} value={cat.categoryId || cat.id || cat.slug}>
                            {cat.categoryName || cat.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div>
                    <label>Price (€)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      name="price" 
                      value={formData.price} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>

                {formData.productType === 'grocery' ? (
                  <div className="admin-form-group row-split">
                    <div>
                      <label>Stock Status</label>
                      <select
                        name="stockStatus"
                        value={formData.stockStatus}
                        onChange={handleChange}
                        required
                      >
                        <option value="in_stock">In Stock</option>
                        <option value="out_of_stock">Out of Stock</option>
                      </select>
                    </div>
                    <div>
                      <label>Weight / Unit Size</label>
                      <input 
                        type="text" 
                        name="weightUnit" 
                        value={formData.weightUnit} 
                        onChange={handleChange} 
                        placeholder="e.g. 5KG or 1L" 
                      />
                    </div>
                  </div>
                ) : null}

                {formData.productType === 'food-corner' && (
                  <div className="admin-form-group">
                    <label>Menu Display Timings</label>
                    <input
                      type="text"
                      name="menuDisplayTiming"
                      value={formData.menuDisplayTiming}
                      onChange={handleChange}
                      placeholder="06:00 PM - 10:00 PM"
                    />
                  </div>
                )}

                <div className="admin-form-group row-split">
                  <div>
                    <label>Image URL</label>
                    <input 
                      type="text" 
                      name="imageUrl" 
                      value={formData.imageUrl} 
                      onChange={handleChange} 
                      placeholder="/uploads/products/..." 
                      required 
                    />
                  </div>
                  <div>
                    <label>Or Upload Product Image</label>
                    <div className="image-upload-zone" style={{ padding: '8px' }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        id="prod-file" 
                        onChange={handleImageUpload} 
                        style={{ display: 'none' }} 
                      />
                      <label htmlFor="prod-file" style={{ cursor: 'pointer', margin: 0 }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-sidebar-active)' }}>
                          Browse Files
                        </p>
                      </label>
                    </div>
                  </div>
                </div>

                {formData.imageUrl && (
                  <div className="upload-preview-container">
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Preview:</p>
                    <img 
                      src={formData.imageUrl.startsWith('blob:') ? formData.imageUrl : getImageUrl(formData.imageUrl)} 
                      alt="Product Preview" 
                      className="upload-preview-img"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'; }}
                    />
                  </div>
                )}

                <div className="admin-form-group">
                  <label className="admin-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600, color: '#334155' }}>
                    <input
                      type="checkbox"
                      name="featuredProduct"
                      checked={formData.featuredProduct}
                      onChange={handleChange}
                    />
                    Show on homepage (Featured Products)
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="action-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
