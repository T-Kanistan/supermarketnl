import { useState, useEffect, useMemo, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaBoxOpen, FaStar, FaRegStar } from 'react-icons/fa';
import productService from '../../../services/productService';
import categoryService from '../../../services/categoryService';
import { getImageUrl } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

export const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    categoryId: 'grocery',
    price: 0.00,
    stock: 0,
    weight: '1KG',
    image: '',
    type: 'grocery', // grocery or food
    // Food corner specific fields
    rating: 4.5,
    reviews: 0,
    badge: '',
    startTime: '11:00',
    endTime: '22:00',
    displayTime: '11:00 AM - 10:00 PM',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const prodData = await productService.getProducts();
      const catData = await categoryService.getCategories();
      setProducts(prodData);
      setCategories(catData);
    } catch (err) {
      console.error('Failed to load catalog details', err);
      addToast('Failed to load catalog details', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    let isMounted = true;
    const initProducts = async () => {
      await Promise.resolve();
      if (isMounted) {
        fetchData();
      }
    };
    initProducts();
    return () => { isMounted = false; };
  }, [fetchData]);

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
      addToast('Failed to update status', 'error');
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
      addToast('Failed to update featured state', 'error');
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      categoryId: categories[0]?.id || 'grocery',
      price: 0,
      stock: 0,
      weight: '',
      image: '',
      type: 'grocery',
      rating: 4.8,
      reviews: 20,
      badge: '',
      startTime: '08:00',
      endTime: '22:00',
      displayTime: '8:00 AM - 10:00 PM',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      categoryId: product.categoryId || 'grocery',
      price: product.price || 0,
      stock: product.stock || 0,
      weight: product.weight || '',
      image: product.image || '',
      type: product.type || 'grocery',
      rating: product.rating || 4.8,
      reviews: product.reviews || 20,
      badge: product.badge || '',
      startTime: product.startTime || '08:00',
      endTime: product.endTime || '22:00',
      displayTime: product.displayTime || '8:00 AM - 10:00 PM',
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
    if (!formData.name) {
      addToast('Product name is required', 'error');
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
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save product', err);
      addToast('Failed to save product', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter & Search Logic
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || prod.type === typeFilter;
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

  const getCategoryName = (catId) => {
    // Check main categories first
    const cat = categories.find((c) => c.id === catId);
    if (cat) return cat.name;
    // Otherwise return capitalized catId (e.g. Breakfast, Lunch for food corner)
    return catId ? catId.charAt(0).toUpperCase() + catId.slice(1) : 'General';
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
            onChange={(e) => { setTypeFilter(e.target.value); setCategoryFilter('all'); setCurrentPage(1); }}
          >
            <option value="all">All Types</option>
            <option value="grocery">Grocery (Supermarket)</option>
            <option value="food">Food Corner (Kitchen)</option>
          </select>

          <select 
            className="filter-select-admin" 
            value={categoryFilter} 
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Categories</option>
            {typeFilter !== 'food' && categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
            {typeFilter === 'food' && (
              <>
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snacks">Snacks</option>
                <option value="Beverages">Beverages</option>
                <option value="Desserts">Desserts</option>
              </>
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
                  <td>
                    <img 
                      src={getImageUrl(prod.image)} 
                      alt={prod.name} 
                      className="table-image-preview" 
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'; }}
                    />
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{prod.name}</div>
                    {prod.weight && <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{prod.weight}</span>}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', background: prod.type === 'food' ? '#fef3c7' : '#dcfce7', color: prod.type === 'food' ? '#b45309' : '#15803d', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      {prod.type === 'food' ? 'Food Corner' : 'Grocery'}
                    </span>
                  </td>
                  <td>{getCategoryName(prod.categoryId)}</td>
                  <td style={{ fontWeight: 600 }}>€{(prod.price || 12.99).toFixed(2)}</td>
                  <td>
                    {prod.type === 'food' ? (
                      <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                        🕒 {prod.displayTime || 'Always'}
                      </span>
                    ) : (
                      <span style={{ color: prod.stock > 0 ? '#15803d' : '#b91c1c', fontWeight: 600 }}>
                        {prod.stock > 0 ? `${prod.stock} items` : 'Out of stock'}
                      </span>
                    )}
                  </td>
                  <td>
                    <button 
                      onClick={() => handleFeaturedToggle(prod)} 
                      style={{ cursor: 'pointer', fontSize: '1.2rem', color: '#eab308' }}
                      title={prod.isFeatured ? 'Unmark Featured' : 'Mark Featured'}
                    >
                      {prod.isFeatured ? <FaStar /> : <FaRegStar />}
                    </button>
                  </td>
                  <td>
                    <label className="toggle-switch-admin">
                      <input 
                        type="checkbox" 
                        checked={prod.status === 'active'} 
                        onChange={() => handleStatusToggle(prod)} 
                      />
                      <span className="toggle-slider-admin"></span>
                    </label>
                  </td>
                  <td>
                    <div className="cell-actions">
                      <button className="btn-action-cell edit" onClick={() => openEditModal(prod)} title="Edit Product">
                        <FaEdit />
                      </button>
                      <button className="btn-action-cell delete" onClick={() => handleDelete(prod.id)} title="Delete Product">
                        <FaTrash />
                      </button>
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
        <div className="admin-modal-overlay">
          <div className="admin-modal-container" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Product Item' : 'Add Catalog Product'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="admin-form-group">
                  <label>Product Catalog Type</label>
                  <select name="type" value={formData.type} onChange={handleChange}>
                    <option value="grocery">Grocery (Supermarket Section)</option>
                    <option value="food">Food Corner (Kitchen Section)</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Product Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder="e.g. Farm Fresh Apples" 
                    required 
                  />
                </div>

                <div className="admin-form-group row-split">
                  <div>
                    <label>Category Section</label>
                    <select name="categoryId" value={formData.categoryId} onChange={handleChange}>
                      {formData.type !== 'food' ? (
                        categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))
                      ) : (
                        ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Desserts'].map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
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

                {formData.type === 'grocery' ? (
                  <div className="admin-form-group row-split">
                    <div>
                      <label>Stock Count</label>
                      <input 
                        type="number" 
                        name="stock" 
                        value={formData.stock} 
                        onChange={handleChange} 
                        required 
                      />
                    </div>
                    <div>
                      <label>Weight / Unit Size</label>
                      <input 
                        type="text" 
                        name="weight" 
                        value={formData.weight} 
                        onChange={handleChange} 
                        placeholder="e.g. 5KG or 1L" 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="admin-form-group row-split">
                    <div>
                      <label>Cooking Start Time</label>
                      <input 
                        type="text" 
                        name="startTime" 
                        value={formData.startTime} 
                        onChange={handleChange} 
                        placeholder="e.g. 11:30" 
                      />
                    </div>
                    <div>
                      <label>Cooking End Time</label>
                      <input 
                        type="text" 
                        name="endTime" 
                        value={formData.endTime} 
                        onChange={handleChange} 
                        placeholder="e.g. 15:00" 
                      />
                    </div>
                  </div>
                )}

                {formData.type === 'food' && (
                  <div className="admin-form-group row-split">
                    <div>
                      <label>Menu Display Timings text</label>
                      <input 
                        type="text" 
                        name="displayTime" 
                        value={formData.displayTime} 
                        onChange={handleChange} 
                        placeholder="e.g. 11:30 AM - 3:00 PM" 
                      />
                    </div>
                    <div>
                      <label>Special Pill Badge</label>
                      <input 
                        type="text" 
                        name="badge" 
                        value={formData.badge} 
                        onChange={handleChange} 
                        placeholder="e.g. Best Seller / Popular" 
                      />
                    </div>
                  </div>
                )}

                <div className="admin-form-group row-split">
                  <div>
                    <label>Image URL</label>
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

                {formData.image && (
                  <div className="upload-preview-container">
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Preview:</p>
                    <img 
                      src={getImageUrl(formData.image)} 
                      alt="Product Preview" 
                      className="upload-preview-img"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'; }}
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
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
