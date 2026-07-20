import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FaPlus, FaSearch, FaEdit, FaTrash, FaEye, FaStar, FaRegStar, FaCopy,
  FaTags, FaCheckCircle, FaClock, FaBolt, FaGift, FaLayerGroup, FaCalendarAlt,
  FaFire, FaTimes, FaImage, FaToggleOn, FaToggleOff,
} from 'react-icons/fa';
import { useToast } from '../../../context/ToastContext';
import offerService from '../../../services/offerService';
import { getImageUrl } from '../../../services/api';
import {
  validateOfferDates,
  getOfferStartMinDate,
  getTodayYmd,
  toYmd,
  compareYmd,
} from '../../../utils/offerDateValidation';
import './AdminOffersManager.css';
import { CMS_IMAGE_ACCEPT, CMS_IMAGE_MAX_BYTES, validateCmsImageFile } from '../../../utils/imageUploadValidation';
import useAdminSearch from '../../../hooks/useAdminSearch';
import { matchesAdminSearch, statusSearchLabel, ADMIN_NO_MATCH_MESSAGE } from '../../../utils/adminSearch';
import AdminFieldLabel from '../../../components/admin/AdminFieldLabel';
import {
  ADMIN_TEXT_LIMITS,
  boundAdminText,
  formatCharCounter,
  sanitizeAdminText,
  validateAdminText,
} from '../../../utils/adminTextValidation';

const OFFER_SUBTITLE_MAX = 200;
const OFFER_BUTTON_TEXT_MAX = 50;
const OFFER_CATEGORY_NAME_MAX = ADMIN_TEXT_LIMITS.categoryName.max;
const HERO_FIELD_LIMITS = {
  heroTitle: 150,
  heroSubtitle: 200,
  heroDescription: 600,
  heroButtonText: 50,
};

const emptyOfferFieldErrors = {
  title: '',
  subtitle: '',
  description: '',
  badge: '',
  buttonText: '',
  category: '',
};

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
    case 'subtitle':
      return validateAdminText(value, {
        max: OFFER_SUBTITLE_MAX,
        maxMessage: `Subtitle cannot exceed ${OFFER_SUBTITLE_MAX} characters.`,
      });
    case 'description':
      return validateAdminText(value, {
        max: offerDescription.max,
        maxMessage: `Description cannot exceed ${offerDescription.max} characters.`,
      });
    case 'badge':
      return validateAdminText(value, {
        max: offerBadge.max,
        maxMessage: `Offer badge cannot exceed ${offerBadge.max} characters.`,
      });
    case 'buttonText':
      return validateAdminText(value, {
        max: OFFER_BUTTON_TEXT_MAX,
        maxMessage: `Button text cannot exceed ${OFFER_BUTTON_TEXT_MAX} characters.`,
      });
    case 'category':
      return String(value ?? '').trim() ? '' : 'Offer category is required';
    default:
      return '';
  }
};

const validateOfferCategoryName = (value) =>
  validateAdminText(value, {
    required: true,
    max: OFFER_CATEGORY_NAME_MAX,
    requiredMessage: 'Category name is required',
    maxMessage: `Category name cannot exceed ${OFFER_CATEGORY_NAME_MAX} characters.`,
  });

const validateHeroField = (name, value) => {
  const max = HERO_FIELD_LIMITS[name];
  if (!max) return '';
  return validateAdminText(value, {
    max,
    maxMessage: `Cannot exceed ${max} characters.`,
  });
};

/**
 * Offers Management studio — fully wired to the live backend:
 *  - Offers      -> /api/offers (+ /api/offers/all for admin reads)
 *  - Categories  -> /api/offers/categories(/manage)
 *  - Hero Banner -> /api/offers/banner (singleton hero form)
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
const mapApiOffer = (offer) => {
  const lifecycleStatus = offer.lifecycleStatus || offer.status || (offer.active ? 'active' : 'inactive');
  return {
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
    status: lifecycleStatus,
    lifecycleStatus,
    active: lifecycleStatus !== 'inactive' && lifecycleStatus !== 'draft',
    isScheduled: Boolean(offer.isScheduled) || lifecycleStatus === 'scheduled',
    isExpired: Boolean(offer.isExpired) || lifecycleStatus === 'expired',
    featured: Boolean(offer.featured),
    sortOrder: offer.sortOrder ?? 0,
    createdAt: offer.createdAt || new Date().toISOString(),
    serverToday: offer.serverToday || '',
  };
};

const emptyOfferForm = {
  title: '', subtitle: '', description: '', category: '',
  discountType: 'percentage', offerDepartment: 'Supermarket',
  discountValue: '', originalPrice: '', offerPrice: '',
  badge: '', buttonText: 'Enquiry', buttonLink: '',
  startDate: '', endDate: '', image: '',
  active: true, featured: false, sortOrder: 0,
};

const emptyHeroForm = {
  heroImage: '',
  heroTitle: '',
  heroSubtitle: '',
  heroDescription: '',
  heroButtonText: '',
  heroButtonLink: '',
  heroOverlay: 55,
  heroStatus: 'active',
};

const HERO_IMAGE_MAX_BYTES = CMS_IMAGE_MAX_BYTES;

const ITEMS_PER_PAGE = 5;

const getLifecycleStatus = (offer, todayYmd) => {
  if (!offer) return 'active';

  const stored = String(offer.lifecycleStatus || offer.status || '').toLowerCase();
  if (stored === 'deleted' || stored === 'draft') return stored;

  const today = todayYmd || offer.serverToday || getTodayYmd();
  const start = toYmd(offer.startDate);
  const end = toYmd(offer.endDate);

  if (start && end) {
    if (compareYmd(today, start) < 0) return 'scheduled';
    if (compareYmd(today, end) > 0) return 'expired';
    // Inside window: respect manual pause
    if (stored === 'inactive') return 'inactive';
    return 'active';
  }

  if (stored && ['scheduled', 'active', 'expired', 'inactive'].includes(stored)) {
    return stored;
  }
  if (offer?.isScheduled) return 'scheduled';
  if (offer?.isExpired) return 'expired';
  if (offer?.active === false) return 'inactive';
  return 'active';
};

const isExpired = (offer, todayYmd) => getLifecycleStatus(offer, todayYmd) === 'expired';
const isScheduled = (offer, todayYmd) => getLifecycleStatus(offer, todayYmd) === 'scheduled';

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
  const [offerFieldErrors, setOfferFieldErrors] = useState(emptyOfferFieldErrors);
  const [categoryNameError, setCategoryNameError] = useState('');
  const [heroFieldErrors, setHeroFieldErrors] = useState({});
  const [offerImageError, setOfferImageError] = useState('');
  const [heroImageError, setHeroImageError] = useState('');
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

  // Hero banner (singleton)
  const [heroForm, setHeroForm] = useState(emptyHeroForm);
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroImageUploading, setHeroImageUploading] = useState(false);

  const loadHeroBanner = useCallback(async () => {
    try {
      const banner = await offerService.getBanner();
      if (!banner) return;
      setHeroForm({
        heroImage: banner.heroImage || '',
        heroTitle: banner.heroTitle || '',
        heroSubtitle: banner.heroSubtitle || '',
        heroDescription: banner.heroDescription || '',
        heroButtonText: banner.heroButtonText || '',
        heroButtonLink: banner.heroButtonLink || '',
        heroOverlay: banner.heroOverlayOpacity != null
          ? Math.round(Number(banner.heroOverlayOpacity) * 100)
          : 55,
        heroStatus: banner.heroStatus === 'inactive' ? 'inactive' : 'active',
      });
    } catch (err) {
      console.error('Failed to load hero banner', err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'hero') {
      loadHeroBanner();
    }
  }, [activeTab, loadHeroBanner]);

  const anyModalOpen = isOfferModalOpen || isCategoryModalOpen || previewOffer || deleteTarget || deleteCategoryTarget;

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
  const serverToday = useMemo(
    () => offers.find((o) => o.serverToday)?.serverToday || getTodayYmd(),
    [offers]
  );

  const stats = useMemo(() => {
    const total = offers.length;
    const expired = offers.filter((o) => getLifecycleStatus(o, serverToday) === 'expired').length;
    const active = offers.filter((o) => getLifecycleStatus(o, serverToday) === 'active').length;
    const scheduled = offers.filter((o) => getLifecycleStatus(o, serverToday) === 'scheduled').length;
    const featured = offers.filter((o) => o.featured).length;
    return { total, active, expired, scheduled, featured };
  }, [offers, serverToday]);

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
      const status = getLifecycleStatus(offer, serverToday);
      const matchesSearch = matchesAdminSearch(searchQuery, [
        offer.title,
        offer.subtitle,
        offer.productName,
        offer.category,
        status,
        statusSearchLabel(status === 'active'),
        offer.featured ? 'featured' : '',
      ]);
      const matchesCategory = categoryFilter === 'all' || offer.category === categoryFilter;
      let matchesStatus = true;
      if (statusFilter === 'active') matchesStatus = status === 'active';
      else if (statusFilter === 'scheduled') matchesStatus = status === 'scheduled';
      else if (statusFilter === 'inactive') matchesStatus = status === 'inactive';
      else if (statusFilter === 'expired') matchesStatus = status === 'expired';
      else if (statusFilter === 'draft') matchesStatus = status === 'draft';
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
  }, [offers, searchQuery, categoryFilter, statusFilter, sortOption, serverToday]);

  const totalPages = Math.ceil(filteredOffers.length / ITEMS_PER_PAGE) || 1;
  const paginatedOffers = useMemo(() => {
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOffers.slice(offset, offset + ITEMS_PER_PAGE);
  }, [filteredOffers, currentPage]);

  // --- Offer handlers (UI only) ---
  const openAddOffer = () => {
    setEditingOffer(null);
    setOfferDateTouched(false);
    setOfferImageError('');
    setOfferFieldErrors(emptyOfferFieldErrors);
    setOfferForm({ ...emptyOfferForm, sortOrder: offers.length + 1 });
    setIsOfferModalOpen(true);
  };

  const openEditOffer = (offer) => {
    setEditingOffer(offer);
    setOfferDateTouched(false);
    setOfferImageError('');
    setOfferFieldErrors(emptyOfferFieldErrors);
    const status = getLifecycleStatus(offer, serverToday);
    setOfferForm({
      ...emptyOfferForm,
      ...offer,
      discountValue: offer.discountValue ?? '',
      originalPrice: offer.originalPrice ?? '',
      offerPrice: offer.offerPrice ?? '',
      // Enabled unless manually inactive/draft
      active: status !== 'inactive' && status !== 'draft',
    });
    setIsOfferModalOpen(true);
  };

  const closeOfferModal = () => {
    setIsOfferModalOpen(false);
    setEditingOffer(null);
    setOfferDateTouched(false);
    setOfferImageError('');
    setOfferFieldErrors(emptyOfferFieldErrors);
  };

  const offerDateValidation = useMemo(
    () =>
      validateOfferDates(offerForm.startDate, offerForm.endDate, {
        today: serverToday,
        existingStartDate: editingOffer?.startDate || '',
      }),
    [offerForm.startDate, offerForm.endDate, serverToday, editingOffer]
  );

  const startDateMin = useMemo(
    () =>
      getOfferStartMinDate({
        today: serverToday,
        existingStartDate: editingOffer?.startDate || '',
      }),
    [serverToday, editingOffer]
  );

  const showOfferDateErrors = offerDateTouched || Boolean(offerForm.startDate || offerForm.endDate);

  const handleOfferChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'startDate' || name === 'endDate') {
      setOfferDateTouched(true);
    }

    const textLimits = {
      title: ADMIN_TEXT_LIMITS.offerTitle.max,
      subtitle: OFFER_SUBTITLE_MAX,
      description: ADMIN_TEXT_LIMITS.offerDescription.max,
      badge: ADMIN_TEXT_LIMITS.offerBadge.max,
      buttonText: OFFER_BUTTON_TEXT_MAX,
    };

    let nextValue = type === 'checkbox' ? checked : value;
    if (typeof nextValue === 'string' && textLimits[name]) {
      nextValue = boundAdminText(nextValue, textLimits[name]);
    }

    setOfferForm((prev) => {
      const next = { ...prev, [name]: nextValue };
      // Keep end date from falling before start when start moves forward.
      if (name === 'startDate' && next.endDate && next.endDate < value) {
        next.endDate = value;
      }
      return next;
    });

    if (Object.prototype.hasOwnProperty.call(emptyOfferFieldErrors, name) || name === 'category') {
      setOfferFieldErrors((prev) => ({
        ...prev,
        [name]: validateOfferField(name, nextValue),
      }));
    }
  };

  const handleOfferBlur = (e) => {
    const { name, value } = e.target;
    if (!Object.prototype.hasOwnProperty.call(emptyOfferFieldErrors, name) && name !== 'category') {
      return;
    }
    const cleaned = sanitizeAdminText(value, { collapse: name !== 'description' });
    setOfferForm((prev) => ({ ...prev, [name]: cleaned }));
    setOfferFieldErrors((prev) => ({
      ...prev,
      [name]: validateOfferField(name, cleaned),
    }));
  };

  const handleOfferImage = (field) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { valid, error } = validateCmsImageFile(file, { maxBytes: CMS_IMAGE_MAX_BYTES });
    if (!valid) {
      setOfferImageError(error);
      addToast(error, 'error');
      e.target.value = '';
      return;
    }

    setOfferImageError('');
    setOfferForm((prev) => ({ ...prev, [field]: URL.createObjectURL(file) }));
    try {
      const uploadedUrl = await offerService.uploadOfferImage(file);
      setOfferForm((prev) => ({ ...prev, [field]: uploadedUrl }));
      addToast('Image uploaded', 'success');
    } catch (err) {
      console.error('Offer image upload failed', err);
      const message =
        err.response?.data?.message || err.message || 'Failed to upload image';
      setOfferImageError(message);
      addToast(message, 'error');
      setOfferForm((prev) => ({ ...prev, [field]: '' }));
    } finally {
      e.target.value = '';
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

    const nextErrors = {
      title: validateOfferField('title', offerForm.title),
      subtitle: validateOfferField('subtitle', offerForm.subtitle),
      description: validateOfferField('description', offerForm.description),
      badge: validateOfferField('badge', offerForm.badge),
      buttonText: validateOfferField('buttonText', offerForm.buttonText),
      category: validateOfferField('category', offerForm.category),
    };
    setOfferFieldErrors(nextErrors);

    const firstError = Object.values(nextErrors).find(Boolean);
    if (firstError) {
      addToast(firstError, 'error');
      return;
    }

    if (!offerForm.image || offerForm.image.startsWith('blob:')) {
      setOfferImageError('Please upload an offer image (and wait for it to finish)');
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
    const status = getLifecycleStatus(offer, serverToday);
    const currentlyEnabled = status !== 'inactive' && status !== 'draft';
    const nextStatus = currentlyEnabled ? 'inactive' : 'active';
    try {
      await offerService.updateOfferStatus(offer.id, nextStatus);
      addToast(`Offer "${offer.title}" ${currentlyEnabled ? 'disabled' : 'enabled'}`, 'success');
      await loadOffers();
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
    setEditingCategory(null);
    setCategoryNameError('');
    setCategoryForm({ name: '', active: true });
    setIsCategoryModalOpen(true);
  };
  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryNameError('');
    setCategoryForm({ name: cat.name, active: cat.active });
    setIsCategoryModalOpen(true);
  };
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const name = sanitizeAdminText(categoryForm.name);
    const nameError = validateOfferCategoryName(name);
    setCategoryNameError(nameError);
    if (nameError) {
      addToast(nameError, 'error');
      return;
    }
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

  const handleHeroChange = (e) => {
    const { name, value } = e.target;
    const max = HERO_FIELD_LIMITS[name];
    const nextValue = max ? boundAdminText(value, max) : value;
    setHeroForm((prev) => ({ ...prev, [name]: nextValue }));
    if (max) {
      setHeroFieldErrors((prev) => ({
        ...prev,
        [name]: validateHeroField(name, nextValue),
      }));
    }
  };

  const handleHeroImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { valid, error } = validateCmsImageFile(file, { maxBytes: HERO_IMAGE_MAX_BYTES });
    if (!valid) {
      setHeroImageError(error);
      addToast(error, 'error');
      e.target.value = '';
      return;
    }

    setHeroImageError('');
    const preview = URL.createObjectURL(file);
    setHeroForm((prev) => ({ ...prev, heroImage: preview }));
    setHeroImageUploading(true);
    try {
      const uploadedUrl = await offerService.uploadOfferImage(file);
      setHeroForm((prev) => ({ ...prev, heroImage: uploadedUrl }));
      addToast('Banner image uploaded', 'success');
    } catch (err) {
      console.error('Hero banner image upload failed', err);
      const message =
        err.response?.data?.message || err.message || 'Failed to upload banner image';
      setHeroImageError(message);
      addToast(message, 'error');
      setHeroForm((prev) => ({ ...prev, heroImage: '' }));
    } finally {
      setHeroImageUploading(false);
      e.target.value = '';
    }
  };

  const handleHeroSubmit = async (e) => {
    e.preventDefault();
    if (!heroForm.heroImage) {
      addToast('Banner image is required', 'error');
      return;
    }
    if (heroForm.heroImage.startsWith('blob:')) {
      addToast('Please wait for the image to finish uploading', 'error');
      return;
    }

    const nextHeroErrors = {
      heroTitle: validateHeroField('heroTitle', heroForm.heroTitle),
      heroSubtitle: validateHeroField('heroSubtitle', heroForm.heroSubtitle),
      heroDescription: validateHeroField('heroDescription', heroForm.heroDescription),
      heroButtonText: validateHeroField('heroButtonText', heroForm.heroButtonText),
    };
    setHeroFieldErrors(nextHeroErrors);
    const firstHeroError = Object.values(nextHeroErrors).find(Boolean);
    if (firstHeroError) {
      addToast(firstHeroError, 'error');
      return;
    }

    setHeroSaving(true);
    try {
      await offerService.updateBanner({
        heroImage: heroForm.heroImage || '',
        heroTitle: heroForm.heroTitle,
        heroSubtitle: heroForm.heroSubtitle,
        heroDescription: heroForm.heroDescription,
        heroButtonText: heroForm.heroButtonText,
        heroButtonLink: heroForm.heroButtonLink,
        heroOverlayOpacity: Number(heroForm.heroOverlay) / 100,
        heroStatus: heroForm.heroStatus === 'inactive' ? 'inactive' : 'active',
      });
      addToast('Hero banner saved', 'success');
      await loadHeroBanner();
    } catch (err) {
      console.error('Failed to save hero banner', err);
      addToast(err.message || 'Failed to save hero banner', 'error');
    } finally {
      setHeroSaving(false);
    }
  };

  const renderStatusBadge = (offer) => {
    const status = getLifecycleStatus(offer, serverToday);
    if (status === 'scheduled') {
      return <span className="product-status-badge inactive" style={{ background: '#fef3c7', color: '#b45309' }}>🟡 Scheduled</span>;
    }
    if (status === 'expired') {
      return <span className="product-status-badge inactive" style={{ background: '#fee2e2', color: '#b91c1c' }}>🔴 Expired</span>;
    }
    if (status === 'draft') {
      return <span className="product-status-badge inactive" style={{ background: '#e2e8f0', color: '#475569' }}>Draft</span>;
    }
    if (status === 'inactive') {
      return <span className="product-status-badge inactive">⚪ Inactive</span>;
    }
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
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
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
              <table className="admin-table admin-offers-table">
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
                          <button className="btn-action-cell delete" onClick={() => setDeleteTarget(offer)} title="Delete"><FaTrash /></button>
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
        <div className="offm-banner-layout">
          <form className="offm-banner-form" onSubmit={handleHeroSubmit}>
            <h3>Hero Banner</h3>

            <div className="admin-form-group">
              <AdminFieldLabel htmlFor="hero-banner-upload" required>Banner Image</AdminFieldLabel>
              <div className={`image-upload-zone${heroImageError ? ' admin-input-invalid' : ''}`}>
                <input
                  type="file"
                  accept={CMS_IMAGE_ACCEPT}
                  id="hero-banner-upload"
                  onChange={handleHeroImage}
                  style={{ display: 'none' }}
                />
                <label htmlFor="hero-banner-upload" style={{ cursor: 'pointer', margin: 0, color: 'var(--admin-sidebar-active)', fontWeight: 600 }}>
                  <FaImage /> {heroImageUploading ? 'Uploading…' : 'Upload Banner Image'}
                </label>
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  JPG, JPEG, PNG, WEBP · Max 5 MB
                </p>
                {heroForm.heroImage ? (
                  <img
                    src={heroForm.heroImage.startsWith('blob:') ? heroForm.heroImage : getImageUrl(heroForm.heroImage)}
                    alt="Banner preview"
                    style={{ display: 'block', marginTop: 12, maxWidth: 220, borderRadius: 8 }}
                  />
                ) : null}
              </div>
              {heroImageError ? (
                <p className="admin-field-error" role="alert">{heroImageError}</p>
              ) : null}
            </div>

            <div className="admin-form-group">
              <AdminFieldLabel htmlFor="offm-hero-title" optional>Title</AdminFieldLabel>
              <input
                id="offm-hero-title"
                type="text"
                name="heroTitle"
                value={heroForm.heroTitle}
                onChange={handleHeroChange}
                maxLength={HERO_FIELD_LIMITS.heroTitle}
                className={heroFieldErrors.heroTitle ? 'admin-input-invalid' : ''}
              />
              <div className="admin-field-meta">
                {heroFieldErrors.heroTitle ? (
                  <p className="admin-field-error" role="alert">{heroFieldErrors.heroTitle}</p>
                ) : (
                  <span />
                )}
                <span className="admin-char-counter">
                  {formatCharCounter(heroForm.heroTitle, HERO_FIELD_LIMITS.heroTitle)}
                </span>
              </div>
            </div>
            <div className="admin-form-group">
              <AdminFieldLabel htmlFor="offm-hero-subtitle" optional>Subtitle</AdminFieldLabel>
              <input
                id="offm-hero-subtitle"
                type="text"
                name="heroSubtitle"
                value={heroForm.heroSubtitle}
                onChange={handleHeroChange}
                maxLength={HERO_FIELD_LIMITS.heroSubtitle}
                className={heroFieldErrors.heroSubtitle ? 'admin-input-invalid' : ''}
              />
              <div className="admin-field-meta">
                {heroFieldErrors.heroSubtitle ? (
                  <p className="admin-field-error" role="alert">{heroFieldErrors.heroSubtitle}</p>
                ) : (
                  <span />
                )}
                <span className="admin-char-counter">
                  {formatCharCounter(heroForm.heroSubtitle, HERO_FIELD_LIMITS.heroSubtitle)}
                </span>
              </div>
            </div>
            <div className="admin-form-group">
              <AdminFieldLabel htmlFor="offm-hero-description" optional>Description</AdminFieldLabel>
              <textarea
                id="offm-hero-description"
                name="heroDescription"
                rows={2}
                value={heroForm.heroDescription}
                onChange={handleHeroChange}
                maxLength={HERO_FIELD_LIMITS.heroDescription}
                className={heroFieldErrors.heroDescription ? 'admin-input-invalid' : ''}
              />
              <div className="admin-field-meta">
                {heroFieldErrors.heroDescription ? (
                  <p className="admin-field-error" role="alert">{heroFieldErrors.heroDescription}</p>
                ) : (
                  <span />
                )}
                <span className="admin-char-counter">
                  {formatCharCounter(heroForm.heroDescription, HERO_FIELD_LIMITS.heroDescription)}
                </span>
              </div>
            </div>
            <div className="admin-form-group row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <AdminFieldLabel htmlFor="offm-hero-button-text" optional>Button Text</AdminFieldLabel>
                <input
                  id="offm-hero-button-text"
                  type="text"
                  name="heroButtonText"
                  value={heroForm.heroButtonText}
                  onChange={handleHeroChange}
                  maxLength={HERO_FIELD_LIMITS.heroButtonText}
                  className={heroFieldErrors.heroButtonText ? 'admin-input-invalid' : ''}
                />
                <div className="admin-field-meta">
                  {heroFieldErrors.heroButtonText ? (
                    <p className="admin-field-error" role="alert">{heroFieldErrors.heroButtonText}</p>
                  ) : (
                    <span />
                  )}
                  <span className="admin-char-counter">
                    {formatCharCounter(heroForm.heroButtonText, HERO_FIELD_LIMITS.heroButtonText)}
                  </span>
                </div>
              </div>
              <div>
                <AdminFieldLabel htmlFor="offm-hero-button-link" optional>Button URL</AdminFieldLabel>
                <input id="offm-hero-button-link" type="text" name="heroButtonLink" value={heroForm.heroButtonLink} onChange={handleHeroChange} />
              </div>
            </div>
            <div className="admin-form-group">
              <AdminFieldLabel htmlFor="offm-hero-overlay" optional>Overlay Opacity: {heroForm.heroOverlay}%</AdminFieldLabel>
              <input type="range" min="0" max="90" name="heroOverlay" value={heroForm.heroOverlay} onChange={handleHeroChange} className="offm-range" />
            </div>
            <div className="admin-form-group">
              <AdminFieldLabel htmlFor="offm-hero-status" required>Status</AdminFieldLabel>
              <select id="offm-hero-status" name="heroStatus" value={heroForm.heroStatus} onChange={handleHeroChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button type="submit" className="action-btn-primary" style={{ marginTop: 8 }} disabled={heroSaving || heroImageUploading}>
              {heroSaving ? 'Saving…' : 'Save Hero Banner'}
            </button>
          </form>

          <div className="offm-banner-preview-wrap">
            <span className="offm-preview-label">Live Preview</span>
            <div
              className="offm-hero-preview pos-left"
              style={{
                backgroundImage: heroForm.heroImage
                  ? `url(${heroForm.heroImage.startsWith('blob:') ? heroForm.heroImage : getImageUrl(heroForm.heroImage)})`
                  : 'none',
                backgroundColor: '#0f172a',
              }}
            >
              <div
                className="offm-hero-overlay"
                style={{
                  backgroundColor: '#0f172a',
                  opacity: Number(heroForm.heroOverlay) / 100,
                }}
              />
              <div className="offm-hero-content">
                {heroForm.heroSubtitle ? (
                  <span className="offm-hero-eyebrow">{heroForm.heroSubtitle}</span>
                ) : null}
                {heroForm.heroTitle ? (
                  <h2>{heroForm.heroTitle}</h2>
                ) : null}
                {heroForm.heroDescription ? (
                  <p>{heroForm.heroDescription}</p>
                ) : null}
                <div className="offm-hero-btns">
                  <span className="offm-hero-btn primary">
                    Shop Offers
                  </span>
                  <span className="offm-hero-btn secondary">
                    View Products
                  </span>
                </div>
              </div>
              {heroForm.heroStatus === 'inactive' && (
                <div className="offm-disabled-flag">Inactive</div>
              )}
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
                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="offm-offer-title" required>Offer Title</AdminFieldLabel>
                  <input
                    id="offm-offer-title"
                    type="text"
                    name="title"
                    value={offerForm.title}
                    onChange={handleOfferChange}
                    onBlur={handleOfferBlur}
                    placeholder="e.g. Mega Flash Sale"
                    maxLength={ADMIN_TEXT_LIMITS.offerTitle.max}
                    required
                    className={offerFieldErrors.title ? 'admin-input-invalid' : ''}
                    aria-invalid={Boolean(offerFieldErrors.title)}
                  />
                  <div className="admin-field-meta">
                    {offerFieldErrors.title ? (
                      <p className="admin-field-error" role="alert">{offerFieldErrors.title}</p>
                    ) : (
                      <span />
                    )}
                    <span className="admin-char-counter">
                      {formatCharCounter(offerForm.title, ADMIN_TEXT_LIMITS.offerTitle.max)}
                    </span>
                  </div>
                </div>
                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="offm-offer-subtitle" optional>Subtitle</AdminFieldLabel>
                  <input
                    id="offm-offer-subtitle"
                    type="text"
                    name="subtitle"
                    value={offerForm.subtitle}
                    onChange={handleOfferChange}
                    onBlur={handleOfferBlur}
                    maxLength={OFFER_SUBTITLE_MAX}
                    className={offerFieldErrors.subtitle ? 'admin-input-invalid' : ''}
                  />
                  <div className="admin-field-meta">
                    {offerFieldErrors.subtitle ? (
                      <p className="admin-field-error" role="alert">{offerFieldErrors.subtitle}</p>
                    ) : (
                      <span />
                    )}
                    <span className="admin-char-counter">
                      {formatCharCounter(offerForm.subtitle, OFFER_SUBTITLE_MAX)}
                    </span>
                  </div>
                </div>
                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="offm-offer-description" optional>Description</AdminFieldLabel>
                  <textarea
                    id="offm-offer-description"
                    name="description"
                    rows={3}
                    value={offerForm.description}
                    onChange={handleOfferChange}
                    onBlur={handleOfferBlur}
                    maxLength={ADMIN_TEXT_LIMITS.offerDescription.max}
                    className={offerFieldErrors.description ? 'admin-input-invalid' : ''}
                  />
                  <div className="admin-field-meta">
                    {offerFieldErrors.description ? (
                      <p className="admin-field-error" role="alert">{offerFieldErrors.description}</p>
                    ) : (
                      <span />
                    )}
                    <span className="admin-char-counter">
                      {formatCharCounter(offerForm.description, ADMIN_TEXT_LIMITS.offerDescription.max)}
                    </span>
                  </div>
                </div>

                <div className="admin-form-group row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <AdminFieldLabel htmlFor="offm-offer-category" required>Offer Category</AdminFieldLabel>
                    <select
                      id="offm-offer-category"
                      name="category"
                      value={offerForm.category}
                      onChange={handleOfferChange}
                      className={offerFieldErrors.category ? 'admin-input-invalid' : ''}
                      required
                    >
                      <option value="">{categoryNames.length ? 'Select a category' : 'No categories — add one in the Categories tab'}</option>
                      {categoryNames.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {offerFieldErrors.category ? (
                      <p className="admin-field-error" role="alert">{offerFieldErrors.category}</p>
                    ) : null}
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

                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="offm-offer-badge" optional>Offer Badge</AdminFieldLabel>
                  <input
                    id="offm-offer-badge"
                    type="text"
                    name="badge"
                    value={offerForm.badge}
                    onChange={handleOfferChange}
                    onBlur={handleOfferBlur}
                    placeholder="e.g. 20% OFF, BUY 1 GET 1, COMBO DEAL"
                    maxLength={ADMIN_TEXT_LIMITS.offerBadge.max}
                    className={offerFieldErrors.badge ? 'admin-input-invalid' : ''}
                  />
                  <div className="admin-field-meta">
                    {offerFieldErrors.badge ? (
                      <p className="admin-field-error" role="alert">{offerFieldErrors.badge}</p>
                    ) : (
                      <span />
                    )}
                    <span className="admin-char-counter">
                      {formatCharCounter(offerForm.badge, ADMIN_TEXT_LIMITS.offerBadge.max)}
                    </span>
                  </div>
                </div>
                <div className="admin-form-group row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <AdminFieldLabel htmlFor="offm-offer-button-text" optional>Button Text</AdminFieldLabel>
                    <input
                      id="offm-offer-button-text"
                      type="text"
                      name="buttonText"
                      value={offerForm.buttonText}
                      onChange={handleOfferChange}
                      onBlur={handleOfferBlur}
                      maxLength={OFFER_BUTTON_TEXT_MAX}
                      className={offerFieldErrors.buttonText ? 'admin-input-invalid' : ''}
                    />
                    <div className="admin-field-meta">
                      {offerFieldErrors.buttonText ? (
                        <p className="admin-field-error" role="alert">{offerFieldErrors.buttonText}</p>
                      ) : (
                        <span />
                      )}
                      <span className="admin-char-counter">
                        {formatCharCounter(offerForm.buttonText, OFFER_BUTTON_TEXT_MAX)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="offm-offer-button-link" optional>Button URL</AdminFieldLabel>
                    <input id="offm-offer-button-link" type="text" name="buttonLink" value={offerForm.buttonLink} onChange={handleOfferChange} placeholder="#enquiry for WhatsApp enquiry" />
                  </div>
                </div>

                <div className="admin-form-group row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <AdminFieldLabel htmlFor="offm-start-date" required>Start Date</AdminFieldLabel>
                    <input
                      id="offm-start-date"
                      type="date"
                      name="startDate"
                      value={offerForm.startDate}
                      onChange={handleOfferChange}
                      min={startDateMin}
                      required
                    />
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
                      min={offerForm.startDate || startDateMin || undefined}
                      required
                    />
                    {showOfferDateErrors && offerDateValidation.endDateError && (
                      <p className="offm-field-error" role="alert">{offerDateValidation.endDateError}</p>
                    )}
                  </div>
                </div>

                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="offm-offer-image" required>Offer Image</AdminFieldLabel>
                  <div className={`image-upload-zone offm-upload-mini${offerImageError ? ' admin-input-invalid' : ''}`}>
                    <input type="file" accept={CMS_IMAGE_ACCEPT} id="up-image" onChange={handleOfferImage('image')} style={{ display: 'none' }} />
                    <label htmlFor="up-image" style={{ cursor: 'pointer', margin: 0, color: 'var(--admin-sidebar-active)', fontWeight: 600, fontSize: '0.82rem' }}>
                      <FaImage /> Upload
                    </label>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                    JPG, JPEG, PNG, WEBP · Max 5 MB
                  </p>
                  {offerImageError ? (
                    <p className="admin-field-error" role="alert">{offerImageError}</p>
                  ) : null}
                  {offerForm.image && <img src={getImageUrl(offerForm.image)} alt="Offer" className="offm-upload-preview" />}
                </div>

                <div className="admin-form-group"><AdminFieldLabel htmlFor="offm-sort-order" optional>Sort Order</AdminFieldLabel><input id="offm-sort-order" type="number" name="sortOrder" value={offerForm.sortOrder} onChange={handleOfferChange} /></div>

                <div className="offm-toggle-grid">
                  <label className="offm-switch-row">
                    <span>
                      Enabled
                      <small style={{ display: 'block', fontWeight: 400, color: '#64748b', marginTop: 2 }}>
                        When enabled, status becomes Scheduled / Active / Expired automatically from the dates.
                      </small>
                    </span>
                    <span className="toggle-switch-admin">
                      <input type="checkbox" name="active" checked={offerForm.active} onChange={handleOfferChange} />
                      <span className="toggle-slider-admin" />
                    </span>
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
                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="offm-category-name" required>Category Name</AdminFieldLabel>
                  <input
                    id="offm-category-name"
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => {
                      const next = boundAdminText(e.target.value, OFFER_CATEGORY_NAME_MAX);
                      setCategoryForm((p) => ({ ...p, name: next }));
                      setCategoryNameError(validateOfferCategoryName(next));
                    }}
                    placeholder="e.g. Flash Sale"
                    maxLength={OFFER_CATEGORY_NAME_MAX}
                    required
                    className={categoryNameError ? 'admin-input-invalid' : ''}
                  />
                  <div className="admin-field-meta">
                    {categoryNameError ? (
                      <p className="admin-field-error" role="alert">{categoryNameError}</p>
                    ) : (
                      <span />
                    )}
                    <span className="admin-char-counter">
                      {formatCharCounter(categoryForm.name, OFFER_CATEGORY_NAME_MAX)}
                    </span>
                  </div>
                </div>
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
