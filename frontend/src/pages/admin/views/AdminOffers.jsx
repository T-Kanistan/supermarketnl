import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FaPlus, FaEdit, FaTrash, FaSearch, FaTags, FaStar, FaRegStar, FaImage, FaEye,
} from 'react-icons/fa';
import offerService from '../../../services/offerService';
import { getImageUrl } from '../../../services/api';
import { validateOfferDates } from '../../../utils/offerDateValidation';
import { useToast } from '../../../context/ToastContext';
import { CMS_IMAGE_ACCEPT, rejectInvalidCmsImageFile } from '../../../utils/imageUploadValidation';
import useAdminSearch from '../../../hooks/useAdminSearch';
import { matchesAdminSearch, statusSearchLabel, ADMIN_NO_MATCH_MESSAGE } from '../../../utils/adminSearch';
import AdminValidatedField from '../../../components/admin/AdminValidatedField';
import AdminFieldLabel from '../../../components/admin/AdminFieldLabel';
import { ADMIN_TEXT_LIMITS, validateAdminText } from '../../../utils/adminTextValidation';
import '../../OffersPage.css';

const PREDEFINED_CATEGORIES = [
  'Flash Sale',
  'Buy 1 Get 1 Deals',
  'Combo Deals',
  'Weekend Specials',
  'Seasonal Offers',
];

const DISCOUNT_TYPE_OPTIONS = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'flat', label: 'Flat Price' },
  { value: 'bogo', label: 'Buy 1 Get 1' },
  { value: 'combo', label: 'Combo' },
];

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&q=80&w=800';

const OFFER_TEXT_FIELDS = ['title', 'description', 'offerBadge'];

const emptyOfferFieldErrors = () =>
  Object.fromEntries(OFFER_TEXT_FIELDS.map((field) => [field, '']));

const validateOfferField = (name, value) => {
  const { offerTitle, offerDescription, offerBadge } = ADMIN_TEXT_LIMITS;

  switch (name) {
    case 'title':
      return validateAdminText(value, {
        required: true,
        max: offerTitle.max,
        requiredMessage: 'Offer title is required',
        maxMessage: `Offer title cannot exceed ${offerTitle.max} characters.`,
      });
    case 'description':
      return validateAdminText(value, {
        max: offerDescription.max,
        maxMessage: `Description cannot exceed ${offerDescription.max} characters.`,
      });
    case 'offerBadge':
      return validateAdminText(value, {
        max: offerBadge.max,
        maxMessage: `Offer badge cannot exceed ${offerBadge.max} characters.`,
      });
    default:
      return '';
  }
};

const emptyForm = {
  title: '',
  subtitle: '',
  description: '',
  category: PREDEFINED_CATEGORIES[0],
  offerDepartment: 'Supermarket',
  discountType: 'percentage',
  discountValue: '',
  originalPrice: '',
  offerPrice: '',
  offerBadge: '',
  image: '',
  startDate: '',
  endDate: '',
  status: 'active',
  sortOrder: 0,
};

const emptyBanner = {
  heroImage: '',
  heroTitle: '',
  heroSubtitle: '',
  heroDescription: '',
  heroButtonText: '',
  heroButtonLink: '',
  promoImage: '',
  promoTitle: '',
  promoSubtitle: '',
  promoDescription: '',
  promoButtonText: '',
  promoButtonLink: '',
};

const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const formatDateLabel = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export const AdminOffers = () => {
  const { addToast } = useToast();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState(emptyOfferFieldErrors);
  const [offerImageError, setOfferImageError] = useState('');
  const [heroImageError, setHeroImageError] = useState('');
  const [offerDateTouched, setOfferDateTouched] = useState(false);

  const [previewOffer, setPreviewOffer] = useState(null);

  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [bannerData, setBannerData] = useState(emptyBanner);
  const [isBannerSubmitting, setIsBannerSubmitting] = useState(false);

  const { searchInput, searchQuery, onSearchChange } = useAdminSearch();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, statusFilter]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await offerService.getOffers({ admin: true });
      setOffers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load offers', err);
      addToast(err.message || 'Failed to load offers', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isModalOpen && !isBannerModalOpen && !previewOffer) return undefined;
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
  }, [isModalOpen, isBannerModalOpen, previewOffer]);

  const categoryOptions = useMemo(() => {
    const set = new Set(PREDEFINED_CATEGORIES);
    offers.forEach((o) => o.category && set.add(o.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [offers]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOffer(null);
    setOfferDateTouched(false);
    setFieldErrors(emptyOfferFieldErrors());
    setOfferImageError('');
  };

  const offerDateValidation = useMemo(
    () => validateOfferDates(formData.startDate, formData.endDate),
    [formData.startDate, formData.endDate]
  );

  const showOfferDateErrors = offerDateTouched || Boolean(formData.startDate || formData.endDate);

  const openAddModal = () => {
    setEditingOffer(null);
    setOfferDateTouched(false);
    setFieldErrors(emptyOfferFieldErrors());
    setOfferImageError('');
    setFormData({ ...emptyForm, sortOrder: offers.length });
    setIsModalOpen(true);
  };

  const openEditModal = (offer) => {
    setEditingOffer(offer);
    setOfferDateTouched(false);
    setFieldErrors(emptyOfferFieldErrors());
    setOfferImageError('');
    setFormData({
      title: offer.title || '',
      subtitle: offer.subtitle || '',
      description: offer.description || '',
      category: offer.category || PREDEFINED_CATEGORIES[0],
      offerDepartment: offer.offerDepartment || offer.offerType || 'Supermarket',
      discountType: offer.discountType || 'percentage',
      discountValue: offer.discountValue ?? '',
      originalPrice: offer.originalPrice ?? '',
      offerPrice: offer.offerPrice ?? '',
      offerBadge: offer.offerBadge || '',
      image: offer.image || offer.imageUrl || '',
      startDate: toDateInput(offer.startDate),
      endDate: toDateInput(offer.endDate),
      status: offer.status === 'inactive' ? 'inactive' : 'active',
      sortOrder: offer.sortOrder ?? 0,
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'startDate' || name === 'endDate') {
      setOfferDateTouched(true);
    }
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleValidatedChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleValidatedBlur = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: validateOfferField(name, value) }));
  };

  const validateOfferForm = () => {
    const errors = Object.fromEntries(
      OFFER_TEXT_FIELDS.map((field) => [field, validateOfferField(field, formData[field])])
    );
    setFieldErrors(errors);

    if (Object.values(errors).some(Boolean)) return false;
    if (!formData.category.trim()) {
      addToast('Offer category is required', 'error');
      return false;
    }
    if (!formData.image?.trim() || formData.image.startsWith('blob:')) {
      addToast('Please upload an offer image before saving', 'error');
      return false;
    }
    return true;
  };

  const handleImageUpload = async (field) => async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (
      rejectInvalidCmsImageFile(
        file,
        (msg) => {
          setOfferImageError(msg);
          addToast(msg, 'error');
        },
        e.target
      )
    ) {
      return;
    }

    setOfferImageError('');
    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, [field]: previewUrl }));
    try {
      const uploadedUrl = await offerService.uploadOfferImage(file);
      setFormData((prev) => ({ ...prev, [field]: uploadedUrl }));
      addToast('Image uploaded successfully', 'success');
    } catch (err) {
      console.error('Image upload failed', err);
      const message = err.response?.data?.message || err.message || 'Failed to upload image';
      setOfferImageError(message);
      addToast(message, 'error');
      setFormData((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateOfferForm()) return;

    setOfferDateTouched(true);
    if (!offerDateValidation.valid) {
      addToast(
        offerDateValidation.endDateError || offerDateValidation.startDateError || 'Please fix offer dates',
        'error'
      );
      return;
    }

    const payload = { ...formData, buttonText: 'Enquiry' };

    setIsSubmitting(true);
    try {
      if (editingOffer) {
        await offerService.updateOffer(editingOffer.id, payload);
        addToast('Offer updated successfully', 'success');
      } else {
        await offerService.createOffer(payload);
        addToast('New offer created successfully', 'success');
      }
      closeModal();
      fetchData();
    } catch (err) {
      console.error('Failed to save offer', err);
      addToast(err.message || 'Failed to save offer', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this offer permanently?')) return;
    try {
      await offerService.deleteOffer(id);
      addToast('Offer deleted successfully', 'success');
      fetchData();
    } catch (err) {
      console.error('Failed to delete offer', err);
      addToast(err.message || 'Failed to delete offer', 'error');
    }
  };

  const handleStatusToggle = async (offer) => {
    const nextStatus = offer.status === 'inactive' ? 'active' : 'inactive';
    try {
      const updated = await offerService.updateOfferStatus(offer.id, nextStatus);
      setOffers((prev) =>
        prev.map((o) => (o.id === offer.id ? { ...o, status: updated?.status || nextStatus } : o))
      );
      addToast(`Offer "${offer.title}" is now ${nextStatus}`, 'success');
    } catch (err) {
      console.error('Failed to update status', err);
      addToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleFeaturedToggle = async (offer) => {
    const nextFeatured = !offer.featured;
    try {
      await offerService.updateOfferPartial(offer.id, { featured: nextFeatured });
      setOffers((prev) =>
        prev.map((o) => (o.id === offer.id ? { ...o, featured: nextFeatured } : o))
      );
      addToast(`Offer "${offer.title}" ${nextFeatured ? 'marked as featured' : 'unfeatured'}`, 'success');
    } catch (err) {
      console.error('Failed to update featured state', err);
      addToast(err.message || 'Failed to update featured state', 'error');
    }
  };

  const handleReorder = async (offer, direction) => {
    const sorted = [...offers].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const index = sorted.findIndex((o) => o.id === offer.id);
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;

    const current = sorted[index];
    const neighbor = sorted[swapIndex];
    const currentOrder = current.sortOrder ?? index;
    const neighborOrder = neighbor.sortOrder ?? swapIndex;

    try {
      await Promise.all([
        offerService.updateOfferPartial(current.id, { sortOrder: neighborOrder }),
        offerService.updateOfferPartial(neighbor.id, { sortOrder: currentOrder }),
      ]);
      fetchData();
    } catch (err) {
      console.error('Failed to reorder offers', err);
      addToast(err.message || 'Failed to reorder offers', 'error');
    }
  };

  // ----- Banner management -----
  const openBannerModal = async () => {
    try {
      const banner = await offerService.getBanner();
      setBannerData({ ...emptyBanner, ...(banner || {}) });
      setIsBannerModalOpen(true);
    } catch (err) {
      console.error('Failed to load banner', err);
      addToast(err.message || 'Failed to load banner settings', 'error');
    }
  };

  const handleBannerChange = (e) => {
    const { name, value } = e.target;
    setBannerData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBannerImageUpload = (field) => async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (
      rejectInvalidCmsImageFile(
        file,
        (msg) => {
          setHeroImageError(msg);
          addToast(msg, 'error');
        },
        e.target
      )
    ) {
      return;
    }

    setHeroImageError('');
    const previewUrl = URL.createObjectURL(file);
    setBannerData((prev) => ({ ...prev, [field]: previewUrl }));
    try {
      const uploadedUrl = await offerService.uploadOfferImage(file);
      setBannerData((prev) => ({ ...prev, [field]: uploadedUrl }));
      addToast('Banner image uploaded', 'success');
    } catch (err) {
      console.error('Banner image upload failed', err);
      const message = err.response?.data?.message || err.message || 'Failed to upload banner image';
      setHeroImageError(message);
      addToast(message, 'error');
      setBannerData((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleBannerSubmit = async (e) => {
    e.preventDefault();
    if (bannerData.heroImage?.startsWith('blob:')) {
      addToast('Please wait for images to finish uploading', 'error');
      return;
    }
    setIsBannerSubmitting(true);
    try {
      await offerService.updateBanner(bannerData);
      addToast('Hero banner updated successfully', 'success');
      setIsBannerModalOpen(false);
    } catch (err) {
      console.error('Failed to update banner', err);
      addToast(err.message || 'Failed to update banner', 'error');
    } finally {
      setIsBannerSubmitting(false);
    }
  };

  const filteredOffers = useMemo(() => {
    return offers
      .filter((offer) => {
        const offerStatus = offer.status === 'inactive' ? 'inactive' : 'active';
        const matchesSearch = matchesAdminSearch(searchQuery, [
          offer.title,
          offer.subtitle,
          offer.productName,
          offer.category,
          statusSearchLabel(offerStatus),
          offer.featured ? 'featured' : '',
        ]);
        const matchesCategory = categoryFilter === 'all' || offer.category === categoryFilter;
        const matchesStatus = statusFilter === 'all' || offerStatus === statusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [offers, searchQuery, categoryFilter, statusFilter]);

  const paginatedOffers = useMemo(() => {
    const offset = (currentPage - 1) * itemsPerPage;
    return filteredOffers.slice(offset, offset + itemsPerPage);
  }, [filteredOffers, currentPage]);

  const totalPages = Math.ceil(filteredOffers.length / itemsPerPage) || 1;

  const renderStatusBadge = (offer) => {
    if (offer.isScheduled) {
      return (
        <span className="product-status-badge inactive" style={{ background: '#fef3c7', color: '#b45309' }}>
          🟡 Scheduled
        </span>
      );
    }
    const isActive = offer.status !== 'inactive';
    return (
      <span className={`product-status-badge ${isActive ? 'active' : 'inactive'}`}>
        {isActive ? '🟢 Active' : '🔴 Inactive'}
      </span>
    );
  };

  return (
    <div>
      <div className="view-header">
        <div className="view-title-wrap">
          <h2>Offers Management</h2>
          <p>Create, schedule, and manage promotional offers, featured deals, and the offers page banners.</p>
        </div>
        <div className="view-header-actions">
          <button className="action-btn-secondary" onClick={openBannerModal}>
            <FaImage /> Manage Hero Banner
          </button>
          <button className="action-btn-primary" onClick={openAddModal}>
            <FaPlus /> Add Offer
          </button>
        </div>
      </div>

      <div className="table-controls">
        <div className="search-box-admin">
          <FaSearch className="search-icon-admin" />
          <input
            type="text"
            placeholder="Search by title, product, category, status..."
            value={searchInput}
            onChange={onSearchChange}
          />
        </div>

        <div className="filter-group-admin product-status-filters">
          <button
            type="button"
            className={`status-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
          >
            All
          </button>
          <button
            type="button"
            className={`status-filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}
          >
            Active
          </button>
          <button
            type="button"
            className={`status-filter-btn ${statusFilter === 'inactive' ? 'active' : ''}`}
            onClick={() => { setStatusFilter('inactive'); setCurrentPage(1); }}
          >
            Inactive
          </button>
        </div>

        <div className="filter-group-admin">
          <select
            className="filter-select-admin"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Categories</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', animation: 'pulse 1.5s infinite ease-in-out' }}>
          <div style={{ height: '30px', width: '200px', background: '#cbd5e1', marginBottom: '20px' }}></div>
          <div style={{ height: '200px', background: '#cbd5e1' }}></div>
        </div>
      ) : paginatedOffers.length > 0 ? (
        <div className="table-responsive-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Category</th>
                <th>Badge</th>
                <th>Price</th>
                <th>Validity</th>
                <th>Featured</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOffers.map((offer) => (
                <tr key={offer.id}>
                  <td data-label="Image">
                    <img
                      src={getImageUrl(offer.image || offer.imageUrl)}
                      alt={offer.title}
                      className="table-image-preview"
                      onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                    />
                  </td>
                  <td data-label="Title">
                    <div style={{ fontWeight: 600 }}>{offer.title}</div>
                    {offer.subtitle && (
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{offer.subtitle}</span>
                    )}
                  </td>
                  <td data-label="Category">
                    <span style={{ fontSize: '0.8rem', background: '#eff6ff', color: '#1e3a8a', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      {offer.category}
                    </span>
                  </td>
                  <td data-label="Badge">{offer.offerBadge || '—'}</td>
                  <td data-label="Price" style={{ fontWeight: 600 }}>
                    {offer.offerPrice != null ? `€${Number(offer.offerPrice).toFixed(2)}` : '—'}
                    {offer.originalPrice != null && (
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8', textDecoration: 'line-through', marginLeft: 6 }}>
                        €{Number(offer.originalPrice).toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td data-label="Validity">
                    {offer.isScheduled ? (
                      <span style={{ color: '#b45309', fontWeight: 600, fontSize: '0.8rem' }}>
                        Starts {formatDateLabel(offer.startDate)}
                      </span>
                    ) : offer.isExpired ? (
                      <span style={{ color: '#b91c1c', fontWeight: 600, fontSize: '0.8rem' }}>Expired</span>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                        {formatDateLabel(offer.endDate) === '—' ? 'No expiry' : `Till ${formatDateLabel(offer.endDate)}`}
                      </span>
                    )}
                  </td>
                  <td data-label="Featured">
                    <button
                      onClick={() => handleFeaturedToggle(offer)}
                      style={{ cursor: 'pointer', fontSize: '1.2rem', color: '#eab308', background: 'none', border: 'none' }}
                      title={offer.featured ? 'Unmark Featured' : 'Mark Featured'}
                    >
                      {offer.featured ? <FaStar /> : <FaRegStar />}
                    </button>
                  </td>
                  <td data-label="Order">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button
                        type="button"
                        onClick={() => handleReorder(offer, 'up')}
                        style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem', lineHeight: 1 }}
                        title="Move up"
                      >
                        ▲
                      </button>
                      <span style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>{offer.sortOrder ?? 0}</span>
                      <button
                        type="button"
                        onClick={() => handleReorder(offer, 'down')}
                        style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem', lineHeight: 1 }}
                        title="Move down"
                      >
                        ▼
                      </button>
                    </div>
                  </td>
                  <td data-label="Status">
                    <div className="product-status-cell">
                      {renderStatusBadge(offer)}
                      <label className="toggle-switch-admin" title={offer.status === 'inactive' ? 'Activate' : 'Deactivate'}>
                        <input
                          type="checkbox"
                          checked={offer.status !== 'inactive'}
                          onChange={() => handleStatusToggle(offer)}
                        />
                        <span className="toggle-slider-admin"></span>
                      </label>
                    </div>
                  </td>
                  <td data-label="Actions" className="admin-actions-cell">
                    <div className="cell-actions">
                      <button className="btn-action-cell" onClick={() => setPreviewOffer(offer)} title="Preview Offer" style={{ color: '#0ea5e9' }}>
                        <FaEye />
                      </button>
                      <button className="btn-action-cell edit" onClick={() => openEditModal(offer)} title="Edit Offer">
                        <FaEdit />
                      </button>
                      <button className="btn-action-cell delete" onClick={() => handleDelete(offer.id)} title="Delete Offer">
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <span className="pagination-text">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredOffers.length)} to {Math.min(currentPage * itemsPerPage, filteredOffers.length)} of {filteredOffers.length} entries
              </span>
              <div className="pagination-btns">
                <button className="pagination-btn-nav" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                  Previous
                </button>
                <button className="pagination-btn-nav" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="dashboard-panel admin-empty-state">
          <FaTags className="admin-empty-icon" />
          <h3>{searchQuery ? ADMIN_NO_MATCH_MESSAGE : 'No offers found!'}</h3>
          <p>
            {searchQuery
              ? 'Try a different search term or clear filters.'
              : 'Try refining your filters or click "Add Offer" to create your first promotional offer.'}
          </p>
        </div>
      )}

      {/* Add / Edit Offer Modal */}
      {isModalOpen && (
        <div className="admin-modal-overlay" onClick={closeModal} role="presentation">
          <div className="admin-modal-container" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingOffer ? 'Edit Offer' : 'Add New Offer'}</h3>
              <button type="button" className="modal-close-btn" onClick={closeModal} aria-label="Close modal">&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <AdminValidatedField
                  label="Offer Title"
                  name="title"
                  value={formData.title}
                  onChange={handleValidatedChange}
                  onBlur={handleValidatedBlur}
                  error={fieldErrors.title}
                  maxLength={ADMIN_TEXT_LIMITS.offerTitle.max}
                  required
                  placeholder="e.g. Mega Flash Sale"
                />

                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="offer-subtitle" optional>Subtitle</AdminFieldLabel>
                  <input id="offer-subtitle" type="text" name="subtitle" value={formData.subtitle} onChange={handleChange} placeholder="e.g. Save up to 50% this weekend" />
                </div>

                <AdminValidatedField
                  label="Description"
                  name="description"
                  optional
                  value={formData.description}
                  onChange={handleValidatedChange}
                  onBlur={handleValidatedBlur}
                  error={fieldErrors.description}
                  maxLength={ADMIN_TEXT_LIMITS.offerDescription.max}
                  as="textarea"
                  rows={3}
                  placeholder="Short description for the offer card"
                />

                <div className="admin-form-group row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <AdminFieldLabel htmlFor="offer-category" required>Category</AdminFieldLabel>
                    <input id="offer-category" type="text" name="category" value={formData.category} onChange={handleChange} list="offer-categories" placeholder="e.g. Flash Sale" required />
                    <datalist id="offer-categories">
                      {categoryOptions.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                  <AdminValidatedField
                    label="Offer Badge"
                    name="offerBadge"
                    optional
                    value={formData.offerBadge}
                    onChange={handleValidatedChange}
                    onBlur={handleValidatedBlur}
                    error={fieldErrors.offerBadge}
                    maxLength={ADMIN_TEXT_LIMITS.offerBadge.max}
                    placeholder="e.g. 20% OFF"
                  />
                </div>

                <div className="admin-form-group row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <AdminFieldLabel htmlFor="offer-department" optional>Offer Type</AdminFieldLabel>
                    <select id="offer-department" name="offerDepartment" value={formData.offerDepartment} onChange={handleChange}>
                      <option value="Supermarket">Supermarket</option>
                      <option value="Food Corner">Food Corner</option>
                    </select>
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="offer-discount-type" optional>Discount Type</AdminFieldLabel>
                    <select id="offer-discount-type" name="discountType" value={formData.discountType} onChange={handleChange}>
                      {DISCOUNT_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="admin-form-group row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <AdminFieldLabel htmlFor="offer-discount-value" optional>Discount Value</AdminFieldLabel>
                    <input id="offer-discount-value" type="number" step="0.01" name="discountValue" value={formData.discountValue} onChange={handleChange} placeholder="e.g. 20" />
                  </div>
                  <div />
                </div>

                <div className="admin-form-group row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <AdminFieldLabel htmlFor="offer-original-price" optional>Original Price (€)</AdminFieldLabel>
                    <input id="offer-original-price" type="number" step="0.01" name="originalPrice" value={formData.originalPrice} onChange={handleChange} placeholder="Optional" />
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="offer-price" optional>Offer Price (€)</AdminFieldLabel>
                    <input id="offer-price" type="number" step="0.01" name="offerPrice" value={formData.offerPrice} onChange={handleChange} placeholder="Optional" />
                  </div>
                </div>

                <div className="admin-form-group row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <AdminFieldLabel htmlFor="offer-start-date" required>Start Date</AdminFieldLabel>
                    <input id="offer-start-date" type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
                    {showOfferDateErrors && offerDateValidation.startDateError && (
                      <p className="offer-form-field-error" role="alert">{offerDateValidation.startDateError}</p>
                    )}
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="offer-end-date" required>End Date (Expiry)</AdminFieldLabel>
                    <input
                      id="offer-end-date"
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      min={formData.startDate || undefined}
                      required
                    />
                    {showOfferDateErrors && offerDateValidation.endDateError && (
                      <p className="offer-form-field-error" role="alert">{offerDateValidation.endDateError}</p>
                    )}
                  </div>
                </div>

                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="offer-image" required>Offer Image</AdminFieldLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center' }}>
                    <input id="offer-image" type="text" name="image" value={formData.image} onChange={handleChange} placeholder="/uploads/offers/..." required />
                    <div className={`image-upload-zone${offerImageError ? ' admin-input-invalid' : ''}`} style={{ padding: '8px' }}>
                      <input type="file" accept={CMS_IMAGE_ACCEPT} id="offer-img" onChange={handleImageUpload('image')} style={{ display: 'none' }} />
                      <label htmlFor="offer-img" style={{ cursor: 'pointer', margin: 0 }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-sidebar-active)' }}>Browse</p>
                      </label>
                    </div>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                    JPG, JPEG, PNG, WEBP · Max 5 MB
                  </p>
                  {offerImageError ? <p className="admin-field-error" role="alert">{offerImageError}</p> : null}
                  {formData.image && (
                    <div className="upload-preview-container">
                      <img
                        src={formData.image.startsWith('blob:') ? formData.image : getImageUrl(formData.image)}
                        alt="Offer Preview"
                        className="upload-preview-img"
                        onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                      />
                    </div>
                  )}
                </div>

                <div className="admin-form-group row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <AdminFieldLabel htmlFor="offer-sort-order" optional>Sort Order</AdminFieldLabel>
                    <input id="offer-sort-order" type="number" name="sortOrder" value={formData.sortOrder} onChange={handleChange} />
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="offer-status">Status</AdminFieldLabel>
                    <select id="offer-status" name="status" value={formData.status} onChange={handleChange}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="action-btn-primary" disabled={isSubmitting || !offerDateValidation.valid || Object.values(fieldErrors).some(Boolean)}>
                  {isSubmitting ? 'Saving...' : 'Save Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Banner Management Modal */}
      {isBannerModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsBannerModalOpen(false)} role="presentation">
          <div className="admin-modal-container" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Hero Banner</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsBannerModalOpen(false)} aria-label="Close modal">&times;</button>
            </div>

            <form onSubmit={handleBannerSubmit}>
              <div className="modal-body">
                <h4 style={{ color: '#1e3a8a', marginBottom: 12 }}>Hero Banner</h4>
                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="offer-hero-image" optional>Hero Background Image</AdminFieldLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center' }}>
                    <input id="offer-hero-image" type="text" name="heroImage" value={bannerData.heroImage} onChange={handleBannerChange} placeholder="/uploads/offers/..." />
                    <div className={`image-upload-zone${heroImageError ? ' admin-input-invalid' : ''}`} style={{ padding: '8px' }}>
                      <input type="file" accept={CMS_IMAGE_ACCEPT} id="hero-img" onChange={handleBannerImageUpload('heroImage')} style={{ display: 'none' }} />
                      <label htmlFor="hero-img" style={{ cursor: 'pointer', margin: 0 }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-sidebar-active)' }}>Browse</p>
                      </label>
                    </div>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                    JPG, JPEG, PNG, WEBP · Max 5 MB
                  </p>
                  {heroImageError ? <p className="admin-field-error" role="alert">{heroImageError}</p> : null}
                  {bannerData.heroImage && (
                    <div className="upload-preview-container">
                      <img
                        src={bannerData.heroImage.startsWith('blob:') ? bannerData.heroImage : getImageUrl(bannerData.heroImage)}
                        alt="Hero Preview"
                        className="upload-preview-img"
                        onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                      />
                    </div>
                  )}
                </div>
                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="offer-hero-title" optional>Hero Title</AdminFieldLabel>
                  <input id="offer-hero-title" type="text" name="heroTitle" value={bannerData.heroTitle} onChange={handleBannerChange} />
                </div>
                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="offer-hero-subtitle" optional>Hero Subtitle</AdminFieldLabel>
                  <input id="offer-hero-subtitle" type="text" name="heroSubtitle" value={bannerData.heroSubtitle} onChange={handleBannerChange} />
                </div>
                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="offer-hero-description" optional>Hero Description</AdminFieldLabel>
                  <textarea id="offer-hero-description" name="heroDescription" value={bannerData.heroDescription} onChange={handleBannerChange} rows={2} />
                </div>
                <div className="admin-form-group row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <AdminFieldLabel htmlFor="offer-hero-button-text" optional>Hero Button Text</AdminFieldLabel>
                    <input id="offer-hero-button-text" type="text" name="heroButtonText" value={bannerData.heroButtonText} onChange={handleBannerChange} />
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="offer-hero-button-link" optional>Hero Button Link</AdminFieldLabel>
                    <input id="offer-hero-button-link" type="text" name="heroButtonLink" value={bannerData.heroButtonLink} onChange={handleBannerChange} />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" onClick={() => setIsBannerModalOpen(false)}>Cancel</button>
                <button type="submit" className="action-btn-primary" disabled={isBannerSubmitting}>
                  {isBannerSubmitting ? 'Saving...' : 'Save Hero Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewOffer && (
        <div className="admin-modal-overlay" onClick={() => setPreviewOffer(null)} role="presentation">
          <div className="admin-modal-container" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Offer Preview</h3>
              <button type="button" className="modal-close-btn" onClick={() => setPreviewOffer(null)} aria-label="Close modal">&times;</button>
            </div>
            <div className="modal-body">
              <div className="offer-card offer-card--preview">
                <div className="offer-card-image-wrap">
                  <img
                    src={getImageUrl(previewOffer.image || previewOffer.imageUrl)}
                    alt={previewOffer.title}
                    className="offer-card-image"
                    onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                  />
                  {previewOffer.category && (
                    <span className="offer-card-category-badge">{previewOffer.category}</span>
                  )}
                  {previewOffer.isExpired && <span className="offer-card-expired">Expired</span>}
                </div>
                <div className="offer-card-body">
                  <h3 className="offer-card-title">{previewOffer.title}</h3>
                  <span className={`offer-card-type-badge ${(previewOffer.offerDepartment || previewOffer.offerType) === 'Food Corner' ? 'offer-card-type-badge--food' : 'offer-card-type-badge--supermarket'}`}>
                    {(previewOffer.offerDepartment || previewOffer.offerType) === 'Food Corner' ? '🍽 Food Corner' : '🛒 Supermarket'}
                  </span>
                  {previewOffer.endDate && (
                    <p className="offer-card-validity">Valid Till: {formatDateLabel(previewOffer.endDate)}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="action-btn-secondary" onClick={() => setPreviewOffer(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOffers;
