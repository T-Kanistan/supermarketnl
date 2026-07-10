import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FaPlus, FaSearch, FaEdit, FaTrash, FaEye, FaStar, FaRegStar, FaCopy,
  FaTags, FaCheckCircle, FaClock, FaBolt, FaGift, FaLayerGroup, FaCalendarAlt,
  FaFire, FaTimes, FaImage, FaArrowRight, FaToggleOn, FaToggleOff,
} from 'react-icons/fa';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import offerService from '../../../services/offerService';
import { getImageUrl } from '../../../services/api';
import { validateOfferDates } from '../../../utils/offerDateValidation';
import './AdminOffersManager.css';
import { CMS_IMAGE_ACCEPT, rejectInvalidCmsImageFile } from '../../../utils/imageUploadValidation';
import useAdminSearch from '../../../hooks/useAdminSearch';
import { matchesAdminSearch, statusSearchLabel, ADMIN_NO_MATCH_MESSAGE } from '../../../utils/adminSearch';
import AdminFieldLabel from '../../../components/admin/AdminFieldLabel';

/**
 * Offers Management studio — fully wired to the live backend:
 *  - Offers      -> /api/offers (+ /api/offers/all for admin reads)
 *  - Categories  -> /api/offers/categories(/manage)
 *  - Hero Banners -> /api/offers/hero-banners
 *  - Promo Banner  -> /api/offers/banner
 *  - Image upload-> /api/upload/offer-image
 * No placeholder data or local-only state remains.
 */

const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Percentage Discount' },
  { value: 'flat', label: 'Flat Discount' },
  { value: 'bogo', label: 'Buy 1 Get 1' },
  { value: 'combo', label: 'Combo Deal' },
];

const PRODUCT_OFFER_TYPES = [
  { value: 'Supermarket', label: 'Supermarket' },
  { value: 'Food Corner', label: 'Food Corner' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'title-az', label: 'Title: A → Z' },
  { value: 'title-za', label: 'Title: Z → A' },
  { value: 'order', label: 'Sort Order' },
];

const CATEGORY_ICONS = {
  'Flash Sale': FaBolt,
  'Buy 1 Get 1 Deals': FaGift,
  'Combo Deals': FaLayerGroup,
  'Weekend Specials': FaCalendarAlt,
  'Seasonal Offers': FaFire,
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&q=80&w=800';

const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

// Maps a backend offer document to the shape this studio's table/form expect.
const mapApiOffer = (offer) => ({
  id: offer.id,
  title: offer.title || '',
  subtitle: offer.subtitle || '',
  description: offer.description || '',
  category: offer.category || '',
  discountType: offer.discountType || 'percentage',
  offerDepartment: offer.offerDepartment || offer.offerType || 'Supermarket',
  discountValue: offer.discountValue ?? null,
  originalPrice: offer.originalPrice ?? null,
  offerPrice: offer.offerPrice ?? null,
  badge: offer.offerBadge || '',
  buttonText: offer.buttonText || 'Enquiry',
  buttonLink: offer.buttonLink || '',
  startDate: toDateInput(offer.startDate),
  endDate: toDateInput(offer.endDate),
  image: offer.image || '',
  active: offer.status ? offer.status === 'active' : Boolean(offer.active),
  featured: Boolean(offer.featured),
  sortOrder: offer.sortOrder ?? 0,
  createdAt: offer.createdAt || new Date().toISOString(),
});

const emptyOfferForm = {
  title: '', subtitle: '', description: '', category: '',
  discountType: 'percentage', offerDepartment: 'Supermarket',
  discountValue: '', originalPrice: '', offerPrice: '',
  badge: '', buttonText: 'Enquiry', buttonLink: '',
  startDate: '', endDate: '', image: '',
  active: true, featured: false, sortOrder: 0,
};

const emptyHeroBannerForm = {
  bannerImage: '',
  badgeText: '',
  title: '',
  highlightedTitle: '',
  description: '',
  buttonText: '',
  buttonUrl: '',
  button2Text: '',
  button2Url: '',
  overlayColor: '#0f172a',
  overlay: 55,
  offerType: 'Supermarket',
  offerCategory: '',
  discountType: 'percentage',
  discountValue: '',
  offerBadge: '',
  status: 'draft',
  startDate: '',
  endDate: '',
  sortOrder: 0,
};

const mapApiHeroBanner = (banner) => ({
  id: banner.id,
  bannerImage: banner.bannerImage || banner.backgroundImage || '',
  badgeText: banner.badgeText || '',
  title: banner.title || '',
  highlightedTitle: banner.highlightedTitle || '',
  description: banner.description || '',
  buttonText: banner.buttonText || '',
  buttonUrl: banner.buttonUrl || '',
  button2Text: banner.button2Text || '',
  button2Url: banner.button2Url || '',
  overlayColor: banner.overlayColor || '#0f172a',
  overlay: banner.overlayOpacity != null
    ? Math.round(Number(banner.overlayOpacity) * 100)
    : 55,
  offerType: banner.offerType || 'Supermarket',
  offerCategory: banner.offerCategory || '',
  discountType: banner.discountType || 'percentage',
  discountValue: banner.discountValue ?? '',
  offerBadge: banner.offerBadge || '',
  status: banner.status || banner.effectiveStatus || 'draft',
  effectiveStatus: banner.effectiveStatus || banner.status || 'draft',
  startDate: toDateInput(banner.startDate),
  endDate: toDateInput(banner.endDate),
  sortOrder: banner.sortOrder ?? 0,
});

const emptyPromoForm = {
  promoImage: '',
  promoTitle: '',
  promoSubtitle: '',
  promoDescription: '',
  promoButtonText: '',
  promoButtonLink: '',
  promoOverlay: 45,
  promoOverlayColor: '#0f172a',
};

const ITEMS_PER_PAGE = 5;

const isExpired = (offer) => {
  if (typeof offer?.isExpired === 'boolean') return offer.isExpired;
  if (!offer?.endDate) return false;
  const end = new Date(offer.endDate);
  return !Number.isNaN(end.getTime()) && end.getTime() < Date.now();
};

const isScheduled = (offer) => {
  if (typeof offer?.isScheduled === 'boolean') return offer.isScheduled;
  if (!offer?.startDate) return false;
  const start = new Date(offer.startDate);
  return !Number.isNaN(start.getTime()) && start.getTime() > Date.now();
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

const discountLabel = (offer) => {
  if (offer.badge) return offer.badge;
  switch (offer.discountType) {
    case 'percentage': return offer.discountValue ? `${offer.discountValue}% OFF` : 'Percentage';
    case 'flat': return offer.discountValue ? `€${offer.discountValue} OFF` : 'Flat';
    case 'bogo': return 'Buy 1 Get 1';
    case 'combo': return 'Combo Deal';
    default: return '—';
  }
};

export const AdminOffersManager = () => {
  const { addToast } = useToast();
  const { isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('offers');

  // Offers state (loaded from the backend)
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(true);
  const [offerSaving, setOfferSaving] = useState(false);
  const { searchInput, searchQuery, onSearchChange } = useAdminSearch();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, statusFilter]);

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [offerForm, setOfferForm] = useState(emptyOfferForm);
  const [offerDateTouched, setOfferDateTouched] = useState(false);

  const [previewOffer, setPreviewOffer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Categories state (loaded from the backend)
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', active: true });
  const [categorySaving, setCategorySaving] = useState(false);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState(null);

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const data = await offerService.getOfferCategoriesAdmin();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load offer categories', err);
      addToast(err.message || 'Failed to load categories', 'error');
    } finally {
      setCategoriesLoading(false);
    }
  }, [addToast]);

  const loadOffers = useCallback(async () => {
    setOffersLoading(true);
    try {
      const data = await offerService.getOffers({ admin: true });
      setOffers(Array.isArray(data) ? data.map(mapApiOffer) : []);
    } catch (err) {
      console.error('Failed to load offers', err);
      addToast(err.message || 'Failed to load offers', 'error');
    } finally {
      setOffersLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadCategories();
    loadOffers();
  }, [loadCategories, loadOffers]);

  // Hero banners + promo banner state
  const [heroBanners, setHeroBanners] = useState([]);
  const [heroBannersLoading, setHeroBannersLoading] = useState(false);
  const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
  const [editingHeroBanner, setEditingHeroBanner] = useState(null);
  const [heroBannerForm, setHeroBannerForm] = useState(emptyHeroBannerForm);
  const [heroBannerSaving, setHeroBannerSaving] = useState(false);
  const [deleteHeroTarget, setDeleteHeroTarget] = useState(null);

  const [promoForm, setPromoForm] = useState(emptyPromoForm);
  const [promoSaving, setPromoSaving] = useState(false);

  const loadHeroBanners = useCallback(async () => {
    setHeroBannersLoading(true);
    try {
      const data = await offerService.getHeroBannersAdmin();
      setHeroBanners(Array.isArray(data) ? data.map(mapApiHeroBanner) : []);
    } catch (err) {
      console.error('Failed to load hero banners', err);
      addToast(err.message || 'Failed to load hero banners', 'error');
    } finally {
      setHeroBannersLoading(false);
    }
  }, [addToast]);

  const loadPromoBanner = useCallback(async () => {
    try {
      const banner = await offerService.getBanner();
      if (!banner) return;
      setPromoForm({
        promoImage: banner.promoImage || '',
        promoTitle: banner.promoTitle ?? '',
        promoSubtitle: banner.promoSubtitle ?? '',
        promoDescription: banner.promoDescription ?? '',
        promoButtonText: banner.promoButtonText ?? '',
        promoButtonLink: banner.promoButtonLink ?? '',
        promoOverlayColor: banner.promoOverlayColor || '#0f172a',
        promoOverlay: banner.promoOverlayOpacity != null
          ? Math.round(Number(banner.promoOverlayOpacity) * 100)
          : 45,
      });
    } catch (err) {
      console.error('Failed to load promo banner', err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'hero') {
      loadHeroBanners();
      loadPromoBanner();
    }
  }, [activeTab, loadHeroBanners, loadPromoBanner]);

  const anyModalOpen = isOfferModalOpen || isCategoryModalOpen || isHeroModalOpen || previewOffer || deleteTarget || deleteCategoryTarget || deleteHeroTarget;

  useEffect(() => {
    if (!anyModalOpen) return undefined;
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, [anyModalOpen]);

  // --- Derived data ---
  const stats = useMemo(() => {
    const total = offers.length;
    const expired = offers.filter(isExpired).length;
    const active = offers.filter((o) => o.active && !isExpired(o)).length;
    const featured = offers.filter((o) => o.featured).length;
    return { total, active, expired, featured };
  }, [offers]);

  const categoryNames = useMemo(() => {
    const set = new Set(categories.map((c) => c.name));
    offers.forEach((o) => o.category && set.add(o.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [categories, offers]);

  const offerCountByCategory = useMemo(() => {
    const counts = {};
    offers.forEach((o) => {
      if (o.category) counts[o.category] = (counts[o.category] || 0) + 1;
    });
    return counts;
  }, [offers]);

  const filteredOffers = useMemo(() => {
    let list = offers.filter((offer) => {
      const expired = isExpired(offer);
      const matchesSearch = matchesAdminSearch(searchQuery, [
        offer.title,
        offer.subtitle,
        offer.productName,
        offer.category,
        statusSearchLabel(offer.active),
        offer.featured ? 'featured' : '',
        expired ? 'expired' : '',
      ]);
      const matchesCategory = categoryFilter === 'all' || offer.category === categoryFilter;
      let matchesStatus = true;
      if (statusFilter === 'active') matchesStatus = offer.active && !expired;
      else if (statusFilter === 'inactive') matchesStatus = !offer.active;
      else if (statusFilter === 'expired') matchesStatus = expired;
      else if (statusFilter === 'featured') matchesStatus = offer.featured;
      return matchesSearch && matchesCategory && matchesStatus;
    });

    list = [...list].sort((a, b) => {
      switch (sortOption) {
        case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'title-az': return a.title.localeCompare(b.title);
        case 'title-za': return b.title.localeCompare(a.title);
        case 'order': return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        case 'newest':
        default: return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    return list;
  }, [offers, searchQuery, categoryFilter, statusFilter, sortOption]);

  const totalPages = Math.ceil(filteredOffers.length / ITEMS_PER_PAGE) || 1;
  const paginatedOffers = useMemo(() => {
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOffers.slice(offset, offset + ITEMS_PER_PAGE);
  }, [filteredOffers, currentPage]);

  // --- Offer handlers (UI only) ---
  const openAddOffer = () => {
    if (!isAdmin) { addToast('Only administrators can add offers', 'error'); return; }
    setEditingOffer(null);
    setOfferDateTouched(false);
    setOfferForm({ ...emptyOfferForm, sortOrder: offers.length + 1 });
    setIsOfferModalOpen(true);
  };

  const openEditOffer = (offer) => {
    setEditingOffer(offer);
    setOfferDateTouched(false);
    setOfferForm({
      ...emptyOfferForm, ...offer,
      discountValue: offer.discountValue ?? '',
      originalPrice: offer.originalPrice ?? '',
      offerPrice: offer.offerPrice ?? '',
    });
    setIsOfferModalOpen(true);
  };

  const closeOfferModal = () => { setIsOfferModalOpen(false); setEditingOffer(null); setOfferDateTouched(false); };

  const offerDateValidation = useMemo(
    () => validateOfferDates(offerForm.startDate, offerForm.endDate),
    [offerForm.startDate, offerForm.endDate]
  );

  const showOfferDateErrors = offerDateTouched || Boolean(offerForm.startDate || offerForm.endDate);

  const handleOfferChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'startDate' || name === 'endDate') {
      setOfferDateTouched(true);
    }
    setOfferForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleOfferImage = (field) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (rejectInvalidCmsImageFile(file, (msg) => addToast(msg, 'error'), e.target)) return;

    setOfferForm((prev) => ({ ...prev, [field]: URL.createObjectURL(file) }));
    try {
      const uploadedUrl = await offerService.uploadOfferImage(file);
      setOfferForm((prev) => ({ ...prev, [field]: uploadedUrl }));
      addToast('Image uploaded', 'success');
    } catch (err) {
      console.error('Offer image upload failed', err);
      addToast(err.message || 'Failed to upload image', 'error');
      setOfferForm((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const buildOfferPayload = () => ({
    title: offerForm.title.trim(),
    subtitle: offerForm.subtitle,
    description: offerForm.description,
    category: offerForm.category,
    offerDepartment: offerForm.offerDepartment,
    discountType: offerForm.discountType,
    discountValue: offerForm.discountValue,
    originalPrice: offerForm.originalPrice,
    offerPrice: offerForm.offerPrice,
    offerBadge: offerForm.badge,
    image: offerForm.image,
    startDate: offerForm.startDate || null,
    endDate: offerForm.endDate || null,
    buttonText: offerForm.buttonText?.trim() || 'Enquiry',
    buttonLink: offerForm.buttonLink?.trim() || '',
    featured: Boolean(offerForm.featured),
    status: offerForm.active ? 'active' : 'inactive',
    sortOrder: offerForm.sortOrder,
  });

  const handleSaveOffer = async (e) => {
    e.preventDefault();
    if (!offerForm.title.trim()) { addToast('Offer title is required', 'error'); return; }
    if (!offerForm.category.trim()) { addToast('Offer category is required', 'error'); return; }
    if (!offerForm.image || offerForm.image.startsWith('blob:')) {
      addToast('Please upload an offer image (and wait for it to finish)', 'error');
      return;
    }
    setOfferDateTouched(true);
    if (!offerDateValidation.valid) {
      addToast(
        offerDateValidation.endDateError || offerDateValidation.startDateError || 'Please fix offer dates',
        'error'
      );
      return;
    }
    setOfferSaving(true);
    try {
      if (editingOffer) {
        await offerService.updateOffer(editingOffer.id, buildOfferPayload());
        addToast('Offer updated', 'success');
      } else {
        await offerService.createOffer(buildOfferPayload());
        addToast('Offer created', 'success');
      }
      closeOfferModal();
      await loadOffers();
    } catch (err) {
      console.error('Failed to save offer', err);
      addToast(err.message || 'Failed to save offer', 'error');
    } finally {
      setOfferSaving(false);
    }
  };

  const toggleActive = async (offer) => {
    const nextStatus = offer.active ? 'inactive' : 'active';
    setOffers((prev) => prev.map((o) => (o.id === offer.id ? { ...o, active: !o.active } : o)));
    try {
      await offerService.updateOfferStatus(offer.id, nextStatus);
      addToast(`Offer "${offer.title}" ${offer.active ? 'disabled' : 'enabled'}`, 'success');
    } catch (err) {
      console.error('Failed to update offer status', err);
      addToast(err.message || 'Failed to update offer status', 'error');
      await loadOffers();
    }
  };

  const toggleFeatured = async (offer) => {
    setOffers((prev) => prev.map((o) => (o.id === offer.id ? { ...o, featured: !o.featured } : o)));
    try {
      await offerService.updateOfferPartial(offer.id, { featured: !offer.featured });
      addToast(`Offer "${offer.title}" ${offer.featured ? 'unfeatured' : 'featured'}`, 'success');
    } catch (err) {
      console.error('Failed to update featured flag', err);
      addToast(err.message || 'Failed to update offer', 'error');
      await loadOffers();
    }
  };

  const duplicateOffer = async (offer) => {
    if (!isAdmin) { addToast('Only administrators can duplicate offers', 'error'); return; }
    try {
      await offerService.createOffer({
        title: `${offer.title} (Copy)`,
        subtitle: offer.subtitle,
        description: offer.description,
        category: offer.category,
        offerDepartment: offer.offerDepartment || offer.offerType || 'Supermarket',
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        originalPrice: offer.originalPrice,
        offerPrice: offer.offerPrice,
        offerBadge: offer.badge,
        image: offer.image,
        startDate: offer.startDate || null,
        endDate: offer.endDate || null,
        buttonText: offer.buttonText || 'Enquiry',
        buttonLink: offer.buttonLink || '',
        featured: Boolean(offer.featured),
        status: offer.active ? 'active' : 'inactive',
        sortOrder: offer.sortOrder,
      });
      addToast('Offer duplicated', 'success');
      await loadOffers();
    } catch (err) {
      console.error('Failed to duplicate offer', err);
      addToast(err.message || 'Failed to duplicate offer', 'error');
    }
  };

  const confirmDeleteOffer = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await offerService.deleteOffer(target.id);
      addToast('Offer deleted', 'success');
      await loadOffers();
    } catch (err) {
      console.error('Failed to delete offer', err);
      addToast(err.message || 'Failed to delete offer', 'error');
    }
  };

  // --- Category handlers (wired to backend) ---
  const openAddCategory = () => {
    if (!isAdmin) { addToast('Only administrators can add categories', 'error'); return; }
    setEditingCategory(null);
    setCategoryForm({ name: '', active: true });
    setIsCategoryModalOpen(true);
  };
  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({ name: cat.name, active: cat.active });
    setIsCategoryModalOpen(true);
  };
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const name = categoryForm.name.trim();
    if (!name) { addToast('Category name is required', 'error'); return; }
    setCategorySaving(true);
    try {
      if (editingCategory) {
        await offerService.updateOfferCategory(editingCategory.id, {
          name,
          status: categoryForm.active ? 'active' : 'inactive',
        });
        addToast('Category updated', 'success');
      } else {
        await offerService.createOfferCategory({
          name,
          status: categoryForm.active ? 'active' : 'inactive',
        });
        addToast('Category added', 'success');
      }
      setIsCategoryModalOpen(false);
      await loadCategories();
    } catch (err) {
      console.error('Failed to save category', err);
      addToast(err.message || 'Failed to save category', 'error');
    } finally {
      setCategorySaving(false);
    }
  };
  const toggleCategoryActive = async (cat) => {
    const nextStatus = cat.active ? 'inactive' : 'active';
    setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, active: !c.active, status: nextStatus } : c)));
    try {
      await offerService.toggleOfferCategoryStatus(cat.id, nextStatus);
    } catch (err) {
      console.error('Failed to toggle category status', err);
      addToast(err.message || 'Failed to update category status', 'error');
      await loadCategories();
    }
  };
  const confirmDeleteCategory = async () => {
    const target = deleteCategoryTarget;
    setDeleteCategoryTarget(null);
    try {
      await offerService.deleteOfferCategory(target.id);
      addToast('Category deleted', 'success');
      await loadCategories();
    } catch (err) {
      console.error('Failed to delete category', err);
      addToast(err.message || 'Failed to delete category', 'error');
    }
  };

  const renderHeroStatusBadge = (banner) => {
    const status = banner.effectiveStatus || banner.status;
    if (status === 'expired') {
      return <span className="product-status-badge inactive" style={{ background: '#fee2e2', color: '#b91c1c' }}>Expired</span>;
    }
    if (status === 'draft') {
      return <span className="product-status-badge inactive" style={{ background: '#e2e8f0', color: '#475569' }}>Draft</span>;
    }
    if (status === 'inactive') {
      return <span className="product-status-badge inactive">Inactive</span>;
    }
    if (status === 'scheduled') {
      return <span className="product-status-badge inactive" style={{ background: '#fef3c7', color: '#b45309' }}>Scheduled</span>;
    }
    return <span className="product-status-badge active">Active</span>;
  };

  const openCreateHeroBanner = () => {
    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setEditingHeroBanner(null);
    setHeroBannerForm({
      ...emptyHeroBannerForm,
      startDate: today.toISOString().slice(0, 10),
      endDate: nextYear.toISOString().slice(0, 10),
    });
    setIsHeroModalOpen(true);
  };

  const openEditHeroBanner = (banner) => {
    setEditingHeroBanner(banner);
    setHeroBannerForm({ ...banner });
    setIsHeroModalOpen(true);
  };

  const closeHeroModal = () => {
    setIsHeroModalOpen(false);
    setEditingHeroBanner(null);
    setHeroBannerForm(emptyHeroBannerForm);
  };

  const handleHeroBannerChange = (e) => {
    const { name, value } = e.target;
    setHeroBannerForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleHeroBannerImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (rejectInvalidCmsImageFile(file, (msg) => addToast(msg, 'error'), e.target)) return;

    const preview = URL.createObjectURL(file);
    setHeroBannerForm((prev) => ({ ...prev, bannerImage: preview }));
    try {
      const uploadedUrl = await offerService.uploadOfferImage(file);
      setHeroBannerForm((prev) => ({ ...prev, bannerImage: uploadedUrl }));
      addToast('Banner image uploaded', 'success');
    } catch (err) {
      console.error('Hero banner image upload failed', err);
      addToast(err.message || 'Failed to upload banner image', 'error');
      setHeroBannerForm((prev) => ({ ...prev, bannerImage: '' }));
    }
  };

  const buildHeroBannerPayload = () => ({
    bannerImage: heroBannerForm.bannerImage || '',
    badgeText: heroBannerForm.badgeText,
    title: heroBannerForm.title,
    highlightedTitle: heroBannerForm.highlightedTitle,
    description: heroBannerForm.description,
    buttonText: heroBannerForm.buttonText,
    buttonUrl: heroBannerForm.buttonUrl,
    button2Text: heroBannerForm.button2Text,
    button2Url: heroBannerForm.button2Url,
    overlayColor: heroBannerForm.overlayColor,
    overlayOpacity: Number(heroBannerForm.overlay) / 100,
    offerType: heroBannerForm.offerType,
    offerCategory: heroBannerForm.offerCategory,
    discountType: heroBannerForm.discountType,
    discountValue: heroBannerForm.discountValue === '' || heroBannerForm.discountValue == null
      ? null
      : Number(heroBannerForm.discountValue),
    offerBadge: heroBannerForm.offerBadge,
    status: heroBannerForm.status,
    startDate: heroBannerForm.startDate,
    endDate: heroBannerForm.endDate,
    sortOrder: Number(heroBannerForm.sortOrder) || 0,
  });

  const handleSaveHeroBanner = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      addToast('Only administrators can manage hero banners', 'error');
      return;
    }
    if (!heroBannerForm.title.trim()) {
      addToast('Title is required', 'error');
      return;
    }
    if (!heroBannerForm.startDate || !heroBannerForm.endDate) {
      addToast('Start and end dates are required', 'error');
      return;
    }
    if (heroBannerForm.bannerImage?.startsWith('blob:')) {
      addToast('Please wait for the image to finish uploading', 'error');
      return;
    }

    setHeroBannerSaving(true);
    try {
      const payload = buildHeroBannerPayload();
      if (editingHeroBanner) {
        await offerService.updateHeroBanner(editingHeroBanner.id, payload);
        addToast('Hero banner updated', 'success');
      } else {
        await offerService.createHeroBanner(payload);
        addToast('Hero banner created', 'success');
      }
      closeHeroModal();
      await loadHeroBanners();
    } catch (err) {
      console.error('Failed to save hero banner', err);
      addToast(err.message || 'Failed to save hero banner', 'error');
    } finally {
      setHeroBannerSaving(false);
    }
  };

  const toggleHeroBannerStatus = async (banner) => {
    const nextStatus = banner.status === 'active' ? 'inactive' : 'active';
    try {
      await offerService.updateHeroBannerStatus(banner.id, nextStatus);
      addToast(`Hero banner "${banner.title}" is now ${nextStatus}`, 'success');
      await loadHeroBanners();
    } catch (err) {
      console.error('Failed to update hero banner status', err);
      addToast(err.message || 'Failed to update hero banner status', 'error');
    }
  };

  const confirmDeleteHeroBanner = async () => {
    const target = deleteHeroTarget;
    setDeleteHeroTarget(null);
    try {
      await offerService.deleteHeroBanner(target.id);
      addToast('Hero banner deleted', 'success');
      await loadHeroBanners();
    } catch (err) {
      console.error('Failed to delete hero banner', err);
      addToast(err.message || 'Failed to delete hero banner', 'error');
    }
  };

  const handlePromoChange = (e) => {
    const { name, value } = e.target;
    setPromoForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePromoSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      addToast('Only administrators can update banners', 'error');
      return;
    }
    if (promoForm.promoImage?.startsWith('blob:')) {
      addToast('Please wait for the image to finish uploading', 'error');
      return;
    }
    setPromoSaving(true);
    try {
      await offerService.updateBanner({
        promoImage: promoForm.promoImage || '',
        promoTitle: promoForm.promoTitle,
        promoSubtitle: promoForm.promoSubtitle,
        promoDescription: promoForm.promoDescription,
        promoButtonText: promoForm.promoButtonText,
        promoButtonLink: promoForm.promoButtonLink,
        promoOverlayColor: promoForm.promoOverlayColor,
        promoOverlayOpacity: Number(promoForm.promoOverlay) / 100,
      });
      addToast('Promotion banner saved', 'success');
    } catch (err) {
      console.error('Failed to save promo banner', err);
      addToast(err.message || 'Failed to save promotion banner', 'error');
    } finally {
      setPromoSaving(false);
    }
  };

  const renderStatusBadge = (offer) => {
    if (offer.isScheduled || isScheduled(offer)) {
      return <span className="product-status-badge inactive" style={{ background: '#fef3c7', color: '#b45309' }}>🟡 Scheduled</span>;
    }
    if (!offer.active) return <span className="product-status-badge inactive">⚪ Inactive</span>;
    if (isExpired(offer)) return <span className="product-status-badge inactive" style={{ background: '#fee2e2', color: '#b91c1c' }}>🔴 Expired</span>;
    return <span className="product-status-badge active">🟢 Active</span>;
  };

  const TABS = [
    { id: 'offers', label: 'Offers', icon: FaTags },
    { id: 'categories', label: 'Categories', icon: FaLayerGroup },
    { id: 'hero', label: 'Hero Banner', icon: FaImage },
  ];

  return (
    <div className="offm-page">
      {/* Header */}
      <div className="view-header">
        <div className="view-title-wrap">
          <h2>Offers Management</h2>
          <p>Manage promotional offers, discounts and campaign banners for the website.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="offm-tabs" role="tablist">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`offm-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon /> <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'offers' && (
        <>
          {/* Statistics cards */}
          <div className="offm-stats-grid">
            <div className="offm-stat-card offm-stat-card--total">
              <div className="offm-stat-icon"><FaTags /></div>
              <div className="offm-stat-meta">
                <span className="offm-stat-value">{stats.total}</span>
                <span className="offm-stat-label">Total Offers</span>
              </div>
            </div>
            <div className="offm-stat-card offm-stat-card--active">
              <div className="offm-stat-icon"><FaCheckCircle /></div>
              <div className="offm-stat-meta">
                <span className="offm-stat-value">{stats.active}</span>
                <span className="offm-stat-label">Active Offers</span>
              </div>
            </div>
            <div className="offm-stat-card offm-stat-card--expired">
              <div className="offm-stat-icon"><FaClock /></div>
              <div className="offm-stat-meta">
                <span className="offm-stat-value">{stats.expired}</span>
                <span className="offm-stat-label">Expired Offers</span>
              </div>
            </div>
            <div className="offm-stat-card offm-stat-card--featured">
              <div className="offm-stat-icon"><FaStar /></div>
              <div className="offm-stat-meta">
                <span className="offm-stat-value">{stats.featured}</span>
                <span className="offm-stat-label">Featured Offers</span>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="offm-toolbar">
            <div className="search-box-admin offm-search">
              <FaSearch className="search-icon-admin" />
              <input
                type="text"
                placeholder="Search by title, product, category, status..."
                value={searchInput}
                onChange={onSearchChange}
              />
            </div>
            <div className="offm-toolbar-filters">
              <select className="filter-select-admin" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}>
                <option value="all">All Categories</option>
                {categoryNames.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="filter-select-admin" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
                <option value="featured">Featured</option>
              </select>
              <select className="filter-select-admin" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <button className="action-btn-primary offm-add-btn" onClick={openAddOffer}>
                <FaPlus /> Add New Offer
              </button>
            </div>
          </div>

          {/* Offers table */}
          {paginatedOffers.length > 0 ? (
            <div className="table-responsive-wrapper offm-table-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Offer Title</th>
                    <th>Category</th>
                    <th>Discount</th>
                    <th>Offer Period</th>
                    <th>Status</th>
                    <th>Featured</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOffers.map((offer) => (
                    <tr key={offer.id}>
                      <td data-label="Image">
                        <img src={offer.image || FALLBACK_IMAGE} alt={offer.title} className="table-image-preview" onError={(e) => { e.target.src = FALLBACK_IMAGE; }} />
                      </td>
                      <td data-label="Offer Title">
                        <div style={{ fontWeight: 600 }}>{offer.title}</div>
                        {offer.subtitle && <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{offer.subtitle}</span>}
                      </td>
                      <td data-label="Category">
                        <span className="offm-cat-pill">{offer.category}</span>
                      </td>
                      <td data-label="Discount"><span className="offm-discount-pill">{discountLabel(offer)}</span></td>
                      <td data-label="Offer Period">
                        <span style={{ fontSize: '0.82rem', color: '#475569' }}>
                          {formatDate(offer.startDate)} → {formatDate(offer.endDate)}
                        </span>
                      </td>
                      <td data-label="Status">{renderStatusBadge(offer)}</td>
                      <td data-label="Featured">
                        <button className="offm-icon-toggle" onClick={() => toggleFeatured(offer)} title={offer.featured ? 'Unfeature' : 'Feature'}>
                          {offer.featured ? <FaStar style={{ color: '#eab308' }} /> : <FaRegStar style={{ color: '#94a3b8' }} />}
                        </button>
                      </td>
                      <td data-label="Created"><span style={{ fontSize: '0.82rem', color: '#64748b' }}>{formatDate(offer.createdAt)}</span></td>
                      <td data-label="Actions" className="admin-actions-cell">
                        <div className="cell-actions">
                          <button className="btn-action-cell view" onClick={() => setPreviewOffer(offer)} title="Preview"><FaEye /></button>
                          <button className="btn-action-cell edit" onClick={() => openEditOffer(offer)} title="Edit"><FaEdit /></button>
                          <button className="btn-action-cell" onClick={() => toggleActive(offer)} title={offer.active ? 'Disable' : 'Enable'} style={{ color: offer.active ? '#16a34a' : '#94a3b8' }}>
                            {offer.active ? <FaToggleOn /> : <FaToggleOff />}
                          </button>
                          <button className="btn-action-cell" onClick={() => duplicateOffer(offer)} title="Duplicate" style={{ color: '#6366f1' }}><FaCopy /></button>
                          {isAdmin && (
                            <button className="btn-action-cell delete" onClick={() => setDeleteTarget(offer)} title="Delete"><FaTrash /></button>
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
                    Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredOffers.length)} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredOffers.length)} of {filteredOffers.length} entries
                  </span>
                  <div className="pagination-btns">
                    <button className="pagination-btn-nav" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>Previous</button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button key={i} className={`pagination-btn-nav ${currentPage === i + 1 ? 'offm-page-active' : ''}`} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                    ))}
                    <button className="pagination-btn-nav" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="dashboard-panel admin-empty-state">
              <FaTags className="admin-empty-icon" />
              <h3>{searchQuery ? ADMIN_NO_MATCH_MESSAGE : 'No offers found'}</h3>
              <p>Try adjusting your search or filters, or add a new offer.</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'categories' && (
        <>
          <div className="offm-subhead">
            <div>
              <h3>Offer Categories</h3>
              <p>Organise offers into categories shown on the storefront.</p>
            </div>
            <button className="action-btn-primary" onClick={openAddCategory}><FaPlus /> Add Category</button>
          </div>
          {categoriesLoading ? (
            <div className="offm-empty-state"><p>Loading categories…</p></div>
          ) : categories.length === 0 ? (
            <div className="offm-empty-state">
              <FaLayerGroup className="offm-empty-icon" aria-hidden="true" />
              <h3>No categories yet</h3>
              <p>Click “Add Category” to create your first offer category.</p>
            </div>
          ) : (
            <div className="offm-category-grid">
              {categories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.name] || FaTags;
                const count = offerCountByCategory[cat.name] || 0;
                return (
                  <div key={cat.id} className="offm-category-card">
                    <div className="offm-category-top">
                      <div className="offm-category-icon"><Icon /></div>
                      <span className={`offm-chip ${cat.active ? 'on' : 'off'}`}>{cat.active ? 'Active' : 'Inactive'}</span>
                    </div>
                    <h4 className="offm-category-name">{cat.name}</h4>
                    <p className="offm-category-count">{count} {count === 1 ? 'offer' : 'offers'}</p>
                    <div className="offm-category-actions">
                      <button className="btn-action-cell edit" onClick={() => openEditCategory(cat)} title="Edit"><FaEdit /></button>
                      <button className="btn-action-cell" onClick={() => toggleCategoryActive(cat)} title={cat.active ? 'Disable' : 'Enable'} style={{ color: cat.active ? '#16a34a' : '#94a3b8' }}>
                        {cat.active ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                      <button className="btn-action-cell delete" onClick={() => setDeleteCategoryTarget(cat)} title="Delete"><FaTrash /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'hero' && (
        <>
          <div className="offm-subhead">
            <div>
              <h3>Hero Banner Management</h3>
              <p>Create and schedule hero banners shown at the top of the Offers page.</p>
            </div>
            <button type="button" className="action-btn-primary" onClick={openCreateHeroBanner}>
              <FaPlus /> Add Hero Banner
            </button>
          </div>

          {heroBannersLoading ? (
            <div className="offm-empty-state"><p>Loading hero banners…</p></div>
          ) : heroBanners.length === 0 ? (
            <div className="offm-empty-state">
              <FaImage className="offm-empty-icon" aria-hidden="true" />
              <h3>No hero banners yet</h3>
              <p>Add an active hero banner to display it on the Offers page.</p>
            </div>
          ) : (
            <div className="dashboard-panel" style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Preview</th>
                    <th>Title</th>
                    <th>Schedule</th>
                    <th>Status</th>
                    <th>Order</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {heroBanners.map((banner) => (
                    <tr key={banner.id}>
                      <td data-label="Preview">
                        {banner.bannerImage ? (
                          <img
                            src={getImageUrl(banner.bannerImage)}
                            alt={banner.title}
                            style={{ width: 72, height: 44, objectFit: 'cover', borderRadius: 8 }}
                          />
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No image</span>
                        )}
                      </td>
                      <td data-label="Title">
                        <strong>{banner.title}</strong>
                        {banner.highlightedTitle ? (
                          <div style={{ color: '#64748b', fontSize: '0.82rem' }}>{banner.highlightedTitle}</div>
                        ) : null}
                      </td>
                      <td data-label="Schedule" style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        {formatDate(banner.startDate)} – {formatDate(banner.endDate)}
                      </td>
                      <td data-label="Status">{renderHeroStatusBadge(banner)}</td>
                      <td data-label="Order">{banner.sortOrder ?? 0}</td>
                      <td data-label="Actions" className="admin-actions-cell">
                        <div className="cell-actions">
                          <button className="btn-action-cell edit" onClick={() => openEditHeroBanner(banner)} title="Edit"><FaEdit /></button>
                          <button
                            className="btn-action-cell"
                            onClick={() => toggleHeroBannerStatus(banner)}
                            title={banner.status === 'active' ? 'Deactivate' : 'Activate'}
                            style={{ color: banner.status === 'active' ? '#16a34a' : '#94a3b8' }}
                          >
                            {banner.status === 'active' ? <FaToggleOn /> : <FaToggleOff />}
                          </button>
                          {isAdmin && (
                            <button className="btn-action-cell delete" onClick={() => setDeleteHeroTarget(banner)} title="Delete"><FaTrash /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="offm-banner-layout" style={{ marginTop: 28 }}>
            <form className="offm-banner-form" onSubmit={handlePromoSubmit}>
              <h3>Promotion Banner</h3>
              <div className="admin-form-group">
                <AdminFieldLabel htmlFor="offm-promo-title" optional>Promo Title</AdminFieldLabel>
                <input id="offm-promo-title" type="text" name="promoTitle" value={promoForm.promoTitle} onChange={handlePromoChange} />
              </div>
              <div className="admin-form-group">
                <AdminFieldLabel htmlFor="offm-promo-subtitle" optional>Promo Subtitle</AdminFieldLabel>
                <input id="offm-promo-subtitle" type="text" name="promoSubtitle" value={promoForm.promoSubtitle} onChange={handlePromoChange} />
              </div>
              <div className="admin-form-group">
                <AdminFieldLabel htmlFor="offm-promo-description" optional>Promo Description</AdminFieldLabel>
                <textarea id="offm-promo-description" name="promoDescription" rows={2} value={promoForm.promoDescription} onChange={handlePromoChange} />
              </div>
              <div className="admin-form-group row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <AdminFieldLabel htmlFor="offm-promo-button-text" optional>Promo Button Text</AdminFieldLabel>
                  <input id="offm-promo-button-text" type="text" name="promoButtonText" value={promoForm.promoButtonText} onChange={handlePromoChange} />
                </div>
                <div>
                  <AdminFieldLabel htmlFor="offm-promo-button-link" optional>Promo Button URL</AdminFieldLabel>
                  <input id="offm-promo-button-link" type="text" name="promoButtonLink" value={promoForm.promoButtonLink} onChange={handlePromoChange} />
                </div>
              </div>
              <div className="admin-form-group">
                <AdminFieldLabel htmlFor="offm-promo-overlay" optional>Promo Overlay Opacity: {promoForm.promoOverlay}%</AdminFieldLabel>
                <input type="range" min="0" max="90" name="promoOverlay" value={promoForm.promoOverlay} onChange={handlePromoChange} className="offm-range" />
              </div>
              <button type="submit" className="action-btn-primary" style={{ marginTop: 8 }} disabled={promoSaving}>
                {promoSaving ? 'Saving…' : 'Save Promotion Banner'}
              </button>
            </form>
          </div>
        </>
      )}

      {isHeroModalOpen && (
        <div className="admin-modal-overlay" onClick={closeHeroModal} role="presentation">
          <div className="admin-modal-container" style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingHeroBanner ? 'Edit Hero Banner' : 'Add Hero Banner'}</h3>
              <button type="button" className="modal-close-btn" onClick={closeHeroModal} aria-label="Close">&times;</button>
            </div>
            <form onSubmit={handleSaveHeroBanner}>
              <div className="modal-body">
                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="offm-hero-banner-image" optional>Banner Image</AdminFieldLabel>
                  <div className="image-upload-zone">
                    <input type="file" accept={CMS_IMAGE_ACCEPT} id="hero-banner-upload" onChange={handleHeroBannerImage} style={{ display: 'none' }} />
                    <label htmlFor="hero-banner-upload" style={{ cursor: 'pointer', margin: 0, color: 'var(--admin-sidebar-active)', fontWeight: 600 }}>
                      <FaImage /> Upload Banner Image
                    </label>
                    {heroBannerForm.bannerImage ? (
                      <img src={getImageUrl(heroBannerForm.bannerImage)} alt="Hero banner preview" style={{ display: 'block', marginTop: 12, maxWidth: 220, borderRadius: 8 }} />
                    ) : null}
                  </div>
                </div>
                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="offm-hero-badge" optional>Small Badge Text</AdminFieldLabel>
                  <input id="offm-hero-badge" type="text" name="badgeText" value={heroBannerForm.badgeText} onChange={handleHeroBannerChange} />
                </div>
                <div className="admin-form-group row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <AdminFieldLabel htmlFor="offm-hero-banner-title" required>Title</AdminFieldLabel>
                    <input id="offm-hero-banner-title" type="text" name="title" value={heroBannerForm.title} onChange={handleHeroBannerChange} required />
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="offm-hero-highlighted" optional>Highlighted Title</AdminFieldLabel>
                    <input id="offm-hero-highlighted" type="text" name="highlightedTitle" value={heroBannerForm.highlightedTitle} onChange={handleHeroBannerChange} />
                  </div>
                </div>
                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="offm-hero-banner-description" optional>Description</AdminFieldLabel>
                  <textarea id="offm-hero-banner-description" name="description" rows={3} value={heroBannerForm.description} onChange={handleHeroBannerChange} />
                </div>
                <div className="admin-form-group row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <AdminFieldLabel htmlFor="offm-hero-button-text" optional>Button Text</AdminFieldLabel>
                    <input id="offm-hero-button-text" type="text" name="buttonText" value={heroBannerForm.buttonText} onChange={handleHeroBannerChange} />
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="offm-hero-button-url" optional>Button URL</AdminFieldLabel>
                    <input id="offm-hero-button-url" type="text" name="buttonUrl" value={heroBannerForm.buttonUrl} onChange={handleHeroBannerChange} />
                  </div>
                </div>
                <div className="admin-form-group row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <AdminFieldLabel htmlFor="offm-hero-button2-text" optional>Secondary Button Text</AdminFieldLabel>
                    <input id="offm-hero-button2-text" type="text" name="button2Text" value={heroBannerForm.button2Text} onChange={handleHeroBannerChange} />
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="offm-hero-button2-url" optional>Secondary Button URL</AdminFieldLabel>
                    <input id="offm-hero-button2-url" type="text" name="button2Url" value={heroBannerForm.button2Url} onChange={handleHeroBannerChange} />
                  </div>
                </div>
                <div className="admin-form-group row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <AdminFieldLabel htmlFor="offm-hero-overlay-color" optional>Overlay Color</AdminFieldLabel>
                    <input id="offm-hero-overlay-color" type="color" name="overlayColor" value={heroBannerForm.overlayColor} onChange={handleHeroBannerChange} />
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="offm-hero-overlay-opacity" optional>Overlay Opacity: {heroBannerForm.overlay}%</AdminFieldLabel>
                    <input id="offm-hero-overlay-opacity" type="range" min="0" max="90" name="overlay" value={heroBannerForm.overlay} onChange={handleHeroBannerChange} className="offm-range" />
                  </div>
                </div>
                <div className="admin-form-group row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <AdminFieldLabel htmlFor="offm-hero-offer-type" optional>Offer Type</AdminFieldLabel>
                    <select id="offm-hero-offer-type" name="offerType" value={heroBannerForm.offerType} onChange={handleHeroBannerChange}>
                      {PRODUCT_OFFER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="offm-hero-offer-category" optional>Offer Category</AdminFieldLabel>
                    <input id="offm-hero-offer-category" type="text" name="offerCategory" value={heroBannerForm.offerCategory} onChange={handleHeroBannerChange} list="offm-hero-category-options" />
                    <datalist id="offm-hero-category-options">
                      {categoryNames.map((name) => <option key={name} value={name} />)}
                    </datalist>
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="offm-hero-sort-order" optional>Sort Order</AdminFieldLabel>
                    <input id="offm-hero-sort-order" type="number" name="sortOrder" value={heroBannerForm.sortOrder} onChange={handleHeroBannerChange} />
                  </div>
                </div>
                <div className="admin-form-group row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <AdminFieldLabel htmlFor="offm-hero-discount-type" optional>Discount Type</AdminFieldLabel>
                    <select id="offm-hero-discount-type" name="discountType" value={heroBannerForm.discountType} onChange={handleHeroBannerChange}>
                      {DISCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="offm-hero-discount-value" optional>Discount Value</AdminFieldLabel>
                    <input id="offm-hero-discount-value" type="number" step="0.01" name="discountValue" value={heroBannerForm.discountValue} onChange={handleHeroBannerChange} />
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="offm-hero-offer-badge" optional>Discount Badge</AdminFieldLabel>
                    <input id="offm-hero-offer-badge" type="text" name="offerBadge" value={heroBannerForm.offerBadge} onChange={handleHeroBannerChange} />
                  </div>
                </div>
                <div className="admin-form-group row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <AdminFieldLabel htmlFor="offm-hero-start-date" required>Start Date</AdminFieldLabel>
                    <input id="offm-hero-start-date" type="date" name="startDate" value={heroBannerForm.startDate} onChange={handleHeroBannerChange} required />
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="offm-hero-end-date" required>End Date</AdminFieldLabel>
                    <input id="offm-hero-end-date" type="date" name="endDate" value={heroBannerForm.endDate} onChange={handleHeroBannerChange} required />
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="offm-hero-status" required>Status</AdminFieldLabel>
                    <select id="offm-hero-status" name="status" value={heroBannerForm.status} onChange={handleHeroBannerChange}>
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" onClick={closeHeroModal}>Cancel</button>
                <button type="submit" className="action-btn-primary" disabled={heroBannerSaving}>
                  {heroBannerSaving ? 'Saving…' : editingHeroBanner ? 'Update Banner' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteHeroTarget && (
        <div className="admin-modal-overlay" onClick={() => setDeleteHeroTarget(null)} role="presentation">
          <div className="admin-modal-container" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Hero Banner</h3>
              <button type="button" className="modal-close-btn" onClick={() => setDeleteHeroTarget(null)} aria-label="Close">&times;</button>
            </div>
            <div className="modal-body">
              <p>Delete hero banner <strong>{deleteHeroTarget.title}</strong>? This removes it from the Offers page.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="action-btn-secondary" onClick={() => setDeleteHeroTarget(null)}>Cancel</button>
              <button type="button" className="action-btn-danger" onClick={confirmDeleteHeroBanner}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Offer Modal */}
      {isOfferModalOpen && (
        <div className="admin-modal-overlay" onClick={closeOfferModal} role="presentation">
          <div className="admin-modal-container" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingOffer ? 'Edit Offer' : 'Add New Offer'}</h3>
              <button type="button" className="modal-close-btn" onClick={closeOfferModal} aria-label="Close">&times;</button>
            </div>
            <form onSubmit={handleSaveOffer}>
              <div className="modal-body">
                <div className="admin-form-group"><AdminFieldLabel htmlFor="offm-offer-title" required>Offer Title</AdminFieldLabel><input id="offm-offer-title" type="text" name="title" value={offerForm.title} onChange={handleOfferChange} placeholder="e.g. Mega Flash Sale" required /></div>
                <div className="admin-form-group"><AdminFieldLabel htmlFor="offm-offer-subtitle" optional>Subtitle</AdminFieldLabel><input id="offm-offer-subtitle" type="text" name="subtitle" value={offerForm.subtitle} onChange={handleOfferChange} /></div>
                <div className="admin-form-group"><AdminFieldLabel htmlFor="offm-offer-description" optional>Description</AdminFieldLabel><textarea id="offm-offer-description" name="description" rows={3} value={offerForm.description} onChange={handleOfferChange} /></div>

                <div className="admin-form-group row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <AdminFieldLabel htmlFor="offm-offer-category" required>Offer Category</AdminFieldLabel>
                    <select id="offm-offer-category" name="category" value={offerForm.category} onChange={handleOfferChange}>
                      <option value="">{categoryNames.length ? 'Select a category' : 'No categories — add one in the Categories tab'}</option>
                      {categoryNames.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="offm-offer-department" optional>Offer Type</AdminFieldLabel>
                    <select id="offm-offer-department" name="offerDepartment" value={offerForm.offerDepartment} onChange={handleOfferChange}>
                      {PRODUCT_OFFER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="offm-discount-type" optional>Discount Type</AdminFieldLabel>
                    <select id="offm-discount-type" name="discountType" value={offerForm.discountType} onChange={handleOfferChange}>
                      {DISCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="admin-form-group row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div><AdminFieldLabel htmlFor="offm-discount-value" optional>Discount Value</AdminFieldLabel><input id="offm-discount-value" type="number" step="0.01" name="discountValue" value={offerForm.discountValue} onChange={handleOfferChange} /></div>
                  <div><AdminFieldLabel htmlFor="offm-original-price" optional>Original Price (€)</AdminFieldLabel><input id="offm-original-price" type="number" step="0.01" name="originalPrice" value={offerForm.originalPrice} onChange={handleOfferChange} /></div>
                  <div><AdminFieldLabel htmlFor="offm-offer-price" optional>Offer Price (€)</AdminFieldLabel><input id="offm-offer-price" type="number" step="0.01" name="offerPrice" value={offerForm.offerPrice} onChange={handleOfferChange} /></div>
                </div>

                <div className="admin-form-group"><AdminFieldLabel htmlFor="offm-offer-badge" optional>Offer Badge</AdminFieldLabel><input id="offm-offer-badge" type="text" name="badge" value={offerForm.badge} onChange={handleOfferChange} placeholder="e.g. 20% OFF, BUY 1 GET 1, COMBO DEAL" /></div>
                <div className="admin-form-group row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div><AdminFieldLabel htmlFor="offm-offer-button-text" optional>Button Text</AdminFieldLabel><input id="offm-offer-button-text" type="text" name="buttonText" value={offerForm.buttonText} onChange={handleOfferChange} /></div>
                  <div><AdminFieldLabel htmlFor="offm-offer-button-link" optional>Button URL</AdminFieldLabel><input id="offm-offer-button-link" type="text" name="buttonLink" value={offerForm.buttonLink} onChange={handleOfferChange} placeholder="#enquiry for WhatsApp enquiry" /></div>
                </div>

                <div className="admin-form-group row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <AdminFieldLabel htmlFor="offm-start-date" required>Start Date</AdminFieldLabel>
                    <input id="offm-start-date" type="date" name="startDate" value={offerForm.startDate} onChange={handleOfferChange} required />
                    {showOfferDateErrors && offerDateValidation.startDateError && (
                      <p className="offm-field-error" role="alert">{offerDateValidation.startDateError}</p>
                    )}
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="offm-end-date" required>End Date</AdminFieldLabel>
                    <input
                      id="offm-end-date"
                      type="date"
                      name="endDate"
                      value={offerForm.endDate}
                      onChange={handleOfferChange}
                      min={offerForm.startDate || undefined}
                      required
                    />
                    {showOfferDateErrors && offerDateValidation.endDateError && (
                      <p className="offm-field-error" role="alert">{offerDateValidation.endDateError}</p>
                    )}
                  </div>
                </div>

                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="offm-offer-image" required>Offer Image</AdminFieldLabel>
                  <div className="image-upload-zone offm-upload-mini">
                    <input type="file" accept={CMS_IMAGE_ACCEPT} id="up-image" onChange={handleOfferImage('image')} style={{ display: 'none' }} />
                    <label htmlFor="up-image" style={{ cursor: 'pointer', margin: 0, color: 'var(--admin-sidebar-active)', fontWeight: 600, fontSize: '0.82rem' }}>
                      <FaImage /> Upload
                    </label>
                  </div>
                  {offerForm.image && <img src={getImageUrl(offerForm.image)} alt="Offer" className="offm-upload-preview" />}
                </div>

                <div className="admin-form-group"><AdminFieldLabel htmlFor="offm-sort-order" optional>Sort Order</AdminFieldLabel><input id="offm-sort-order" type="number" name="sortOrder" value={offerForm.sortOrder} onChange={handleOfferChange} /></div>

                <div className="offm-toggle-grid">
                  <label className="offm-switch-row"><span>Active</span>
                    <span className="toggle-switch-admin"><input type="checkbox" name="active" checked={offerForm.active} onChange={handleOfferChange} /><span className="toggle-slider-admin" /></span>
                  </label>
                </div>

                {offerForm.image && (
                  <div className="upload-preview-container">
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Offer Image Preview:</p>
                    <img src={getImageUrl(offerForm.image)} alt="Preview" className="upload-preview-img" />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" onClick={closeOfferModal}>Cancel</button>
                <button type="submit" className="action-btn-primary" disabled={offerSaving || !offerDateValidation.valid}>{offerSaving ? 'Saving…' : (editingOffer ? 'Save Changes' : 'Create Offer')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsCategoryModalOpen(false)} role="presentation">
          <div className="admin-modal-container" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsCategoryModalOpen(false)} aria-label="Close">&times;</button>
            </div>
            <form onSubmit={handleSaveCategory}>
              <div className="modal-body">
                <div className="admin-form-group"><AdminFieldLabel htmlFor="offm-category-name" required>Category Name</AdminFieldLabel><input id="offm-category-name" type="text" value={categoryForm.name} onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Flash Sale" required /></div>
                <label className="offm-switch-row"><span>Active</span>
                  <span className="toggle-switch-admin"><input type="checkbox" checked={categoryForm.active} onChange={(e) => setCategoryForm((p) => ({ ...p, active: e.target.checked }))} /><span className="toggle-slider-admin" /></span>
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" onClick={() => setIsCategoryModalOpen(false)}>Cancel</button>
                <button type="submit" className="action-btn-primary" disabled={categorySaving}>{categorySaving ? 'Saving…' : (editingCategory ? 'Save' : 'Add Category')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Drawer */}
      <div className={`offm-drawer-overlay ${previewOffer ? 'open' : ''}`} onClick={() => setPreviewOffer(null)} role="presentation" />
      <aside className={`offm-drawer ${previewOffer ? 'open' : ''}`} aria-hidden={!previewOffer}>
        {previewOffer && (
          <>
            <div className="offm-drawer-header">
              <h3>Offer Preview</h3>
              <button type="button" className="modal-close-btn" onClick={() => setPreviewOffer(null)} aria-label="Close"><FaTimes /></button>
            </div>
            <div className="offm-drawer-body">
              <div className="offm-preview-card">
                <div className="offm-preview-media">
                  <img src={previewOffer.image || FALLBACK_IMAGE} alt={previewOffer.title} onError={(e) => { e.target.src = FALLBACK_IMAGE; }} />
                  <span className="offm-preview-badge">{discountLabel(previewOffer)}</span>
                  {isExpired(previewOffer) && <span className="offm-preview-expired">Expired</span>}
                </div>
                <div className="offm-preview-info">
                  <span className="offm-cat-pill">{previewOffer.category}</span>
                  <h3>{previewOffer.title}</h3>
                  {previewOffer.subtitle && <p className="offm-preview-sub">{previewOffer.subtitle}</p>}
                  {previewOffer.description && <p className="offm-preview-desc">{previewOffer.description}</p>}
                  {(previewOffer.offerPrice || previewOffer.originalPrice) && (
                    <div className="offm-preview-price">
                      {previewOffer.offerPrice != null && <span className="now">€{Number(previewOffer.offerPrice).toFixed(2)}</span>}
                      {previewOffer.originalPrice != null && <span className="was">€{Number(previewOffer.originalPrice).toFixed(2)}</span>}
                    </div>
                  )}
                  <p className="offm-preview-validity"><FaCalendarAlt /> Valid: {formatDate(previewOffer.startDate)} → {formatDate(previewOffer.endDate)}</p>
                  <div className="offm-preview-actions">
                    <span className="offm-hero-btn primary">Enquiry</span>
                  </div>
                </div>
              </div>
              <p className="offm-preview-note">This is exactly how the offer card will appear on the website.</p>
            </div>
          </>
        )}
      </aside>

      {/* Delete Offer Confirmation */}
      {deleteTarget && (
        <div className="admin-modal-overlay" onClick={() => setDeleteTarget(null)} role="presentation">
          <div className="admin-modal-container offm-confirm" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center', paddingTop: 28 }}>
              <div className="offm-confirm-icon"><FaTrash /></div>
              <h3 style={{ margin: '14px 0 6px' }}>Delete this offer?</h3>
              <p style={{ color: '#64748b' }}>Are you sure you want to delete <strong>{deleteTarget.title}</strong>? This action cannot be undone.</p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="action-btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="action-btn-primary offm-danger-btn" onClick={confirmDeleteOffer}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation */}
      {deleteCategoryTarget && (
        <div className="admin-modal-overlay" onClick={() => setDeleteCategoryTarget(null)} role="presentation">
          <div className="admin-modal-container offm-confirm" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center', paddingTop: 28 }}>
              <div className="offm-confirm-icon"><FaTrash /></div>
              <h3 style={{ margin: '14px 0 6px' }}>Delete this category?</h3>
              <p style={{ color: '#64748b' }}>Are you sure you want to delete <strong>{deleteCategoryTarget.name}</strong>?</p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="action-btn-secondary" onClick={() => setDeleteCategoryTarget(null)}>Cancel</button>
              <button className="action-btn-primary offm-danger-btn" onClick={confirmDeleteCategory}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOffersManager;
