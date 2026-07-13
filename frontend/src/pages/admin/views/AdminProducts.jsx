import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaBoxOpen, FaStar, FaRegStar, FaSlidersH } from 'react-icons/fa';
import productService from '../../../services/productService';
import foodCornerCategoryService from '../../../services/foodCornerCategoryService';
import { getImageUrl } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { formatCategoryName } from '../../../utils/formatCategoryName';
import { invalidateDashboardStats } from '../../../utils/dashboardStatsRefresh';
import { CMS_IMAGE_ACCEPT, rejectInvalidCmsImageFile } from '../../../utils/imageUploadValidation';
import useAdminSearch from '../../../hooks/useAdminSearch';
import { matchesAdminSearch, statusSearchLabel, ADMIN_NO_MATCH_MESSAGE } from '../../../utils/adminSearch';
import {
  ADMIN_TEXT_LIMITS,
  boundAdminText,
  formatCharCounter,
  sanitizeAdminText,
  validateAdminText,
} from '../../../utils/adminTextValidation';
import AdminFieldLabel from '../../../components/admin/AdminFieldLabel';

export const AdminProducts = () => {
  const { productName, weightUnit, productDescription, menuTiming } = ADMIN_TEXT_LIMITS;
  const { isAdmin, isManager } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isFoodCornerRoute = location.pathname.endsWith('/food-corner');
  const isGroceryCatalog = !isFoodCornerRoute;
  const resolveCatalogType = () =>
    isFoodCornerRoute || searchParams.get('type') === 'food-corner' ? 'food-corner' : 'grocery';
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [foodCornerCategories, setFoodCornerCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Batch Price Adjustment States
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustFormData, setAdjustFormData] = useState({
    productType: 'grocery',
    categoryId: '',
    adjustmentType: 'percentage',
    direction: 'decrease',
    value: '',
  });

  const { searchInput, searchQuery, onSearchChange } = useAdminSearch();
  const [typeFilter, setTypeFilter] = useState(resolveCatalogType);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    productName: '',
    categoryId: '',
    price: '',
    stockStatus: 'in_stock',
    weightUnit: '',
    imageUrl: '',
    productType: 'grocery',
    featuredProduct: false,
    showOnHomepage: false,
    menuDisplayTiming: '',
    description: '',
    status: 'active',
  });
  const [formErrors, setFormErrors] = useState({});
  const formFieldRefs = useRef({});

  const mapProductType = (value) => {
    const raw = value == null ? '' : String(value).trim().toLowerCase();
    if (!raw) return 'grocery';
    if (raw === 'food' || raw === 'food-corner' || raw === 'food corner' || raw === 'foodcorner') return 'food-corner';
    if (raw === 'grocery' || raw === 'supermarket' || raw === 'supermarket section') return 'grocery';
    return 'grocery';
  };

  const formatPriceForForm = (price) => {
    if (price === undefined || price === null || price === '') return '';
    const parsed = Number(price);
    return Number.isFinite(parsed) ? parsed : '';
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
    setTypeFilter(resolveCatalogType());
  }, [location.pathname, searchParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isModalOpen && !isAdjustModalOpen) return undefined;

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
  }, [isModalOpen, isAdjustModalOpen]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormErrors({});
  };

  const handleStatusToggle = async (product) => {
    const currentStatus = product.status === 'inactive' ? 'inactive' : 'active';
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const updated = await productService.updateProductStatus(product.id, nextStatus);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? { ...p, status: updated?.status || nextStatus }
            : p
        )
      );
      addToast(
        `Product "${product.productName || product.name}" is now ${nextStatus}`,
        'success'
      );
      invalidateDashboardStats();
    } catch (e) {
      console.error('Failed to update status', e);
      addToast(e.message || e.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const handleFeaturedToggle = async (product) => {
    const nextFeatured = !(product.showOnHomepage ?? product.featuredProduct ?? product.isFeatured);
    try {
      await productService.updateProduct(product.id, {
        showOnHomepage: nextFeatured,
        featuredProduct: nextFeatured,
        isFeatured: nextFeatured,
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? { ...p, showOnHomepage: nextFeatured, featuredProduct: nextFeatured, isFeatured: nextFeatured }
            : p
        )
      );
      addToast(`Product "${product.name}" featured state updated`, 'success');
    } catch (e) {
      console.error('Failed to update featured state', e);
      addToast(e.message || e.response?.data?.message || 'Failed to update featured state', 'error');
    }
  };

  const openAddModal = async () => {
    if (!isAdmin) {
      addToast('Only administrators can add products', 'error');
      return;
    }
    setEditingProduct(null);
    const selectedProductType = isGroceryCatalog ? 'grocery' : 'food-corner';
    const cats = await loadModalCategories(selectedProductType);
    setFormData({
      productName: '',
      categoryId: cats[0]?.categoryId || cats[0]?.id || '',
      price: '',
      stockStatus: 'in_stock',
      weightUnit: '',
      imageUrl: '',
      productType: selectedProductType,
      featuredProduct: false,
      showOnHomepage: false,
      menuDisplayTiming: '',
      description: '',
      status: 'active',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openAdjustModal = () => {
    if (!isAdmin) {
      addToast('Only administrators can perform batch price adjustments', 'error');
      return;
    }
    const currentType = isGroceryCatalog ? 'grocery' : 'food-corner';
    const cats = currentType === 'food-corner' ? foodCornerCategories : categories;
    setAdjustFormData({
      productType: currentType,
      categoryId: cats[0]?.categoryId || cats[0]?.id || cats[0]?.slug || '',
      adjustmentType: 'percentage',
      direction: 'decrease',
      value: '',
    });
    setIsAdjustModalOpen(true);
  };

  const handleAdjustChange = (e) => {
    const { name, value } = e.target;
    if (name === 'productType') {
      if (isGroceryCatalog) return;
      const cats = value === 'food-corner' ? foodCornerCategories : categories;
      setAdjustFormData((prev) => ({
        ...prev,
        productType: value,
        categoryId: cats[0]?.categoryId || cats[0]?.id || cats[0]?.slug || '',
      }));
      return;
    }
    setAdjustFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      addToast('Only administrators can perform batch price adjustments', 'error');
      return;
    }
    if (!adjustFormData.categoryId) {
      addToast('Please select a category', 'error');
      return;
    }
    const val = Number(adjustFormData.value);
    if (Number.isNaN(val) || val <= 0) {
      addToast('Adjustment value must be a positive number greater than 0', 'error');
      return;
    }

    const directionLabel = adjustFormData.direction === 'increase' ? 'increase' : 'decrease';
    const typeLabel = adjustFormData.adjustmentType === 'percentage' ? '%' : '€';
    const catName = getCategoryName(adjustFormData.categoryId, adjustFormData.productType);
    
    const confirmMessage = `Are you sure you want to ${directionLabel} the prices of all active products in category "${catName}" by ${adjustFormData.direction === 'increase' ? '+' : '-'}${val}${typeLabel}? This action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) return;

    setIsAdjusting(true);
    try {
      const response = await productService.batchAdjustPrices(adjustFormData);
      addToast(response.message || 'Batch price adjustment completed successfully', 'success');
      setIsAdjustModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Batch price adjustment failed', err);
      addToast(err.message || err.response?.data?.message || 'Failed to adjust prices', 'error');
    } finally {
      setIsAdjusting(false);
    }
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
    const productType = isGroceryCatalog ? 'grocery' : mapProductType(product.productType || product.type);
    if (isGroceryCatalog && mapProductType(product.productType || product.type) !== 'grocery') {
      addToast('Food Corner items must be edited from Food Corner Management.', 'error');
      return;
    }
    setEditingProduct(product);
    setFormData({
      productName: product.productName || product.name || '',
      categoryId: resolveFormCategoryId(product, productType),
      price: formatPriceForForm(product.price),
      stockStatus: product.stockStatus || (product.stock > 0 ? 'in_stock' : 'out_of_stock'),
      weightUnit: product.weightUnit || product.weight || '',
      imageUrl: product.imageUrl || product.image || '',
      productType,
      featuredProduct: Boolean(product.showOnHomepage ?? product.featuredProduct ?? product.isFeatured),
      showOnHomepage: Boolean(product.showOnHomepage ?? product.featuredProduct ?? product.isFeatured),
      menuDisplayTiming: product.menuDisplayTiming || product.displayTime || '',
      description: product.description || product.shortDescription || '',
      status: product.status === 'inactive' ? 'inactive' : 'active',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name === 'showOnHomepage') {
        setFormData((prev) => ({
          ...prev,
          showOnHomepage: checked,
          featuredProduct: checked,
        }));
        return;
      }
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    if (name === 'productType') {
      if (isGroceryCatalog) return;
      const isFoodCorner = mapProductType(value) === 'food-corner';
      const cats = isFoodCorner ? foodCornerCategories : categories;
      setFormData((prev) => ({
        ...prev,
        productType: value,
        categoryId: cats[0]?.categoryId || cats[0]?.id || cats[0]?.slug || '',
        ...(isFoodCorner
          ? {
              stockStatus: 'in_stock',
              weightUnit: '',
              showOnHomepage: false,
              featuredProduct: false,
            }
          : {
              menuDisplayTiming: '',
              description: '',
            }),
      }));
      setFormErrors((prev) => ({
        ...prev,
        productType: '',
        weightUnit: '',
        stockStatus: '',
        menuDisplayTiming: '',
        description: '',
        imageUrl: '',
      }));
      return;
    }
    if (name === 'description') {
      setFormData((prev) => ({
        ...prev,
        description: boundAdminText(value, productDescription.max),
      }));
      setFormErrors((prev) => ({ ...prev, description: '' }));
      return;
    }
    if (name === 'productName') {
      setFormData((prev) => ({
        ...prev,
        productName: boundAdminText(value, productName.max),
      }));
      setFormErrors((prev) => ({ ...prev, productName: '' }));
      return;
    }
    if (name === 'weightUnit') {
      setFormData((prev) => ({
        ...prev,
        weightUnit: boundAdminText(value, weightUnit.max),
      }));
      setFormErrors((prev) => ({ ...prev, weightUnit: '' }));
      return;
    }
    if (name === 'price') {
      setFormData((prev) => ({ ...prev, price: value }));
      setFormErrors((prev) => ({ ...prev, price: '' }));
      return;
    }
    if (name === 'menuDisplayTiming') {
      setFormData((prev) => ({
        ...prev,
        menuDisplayTiming: boundAdminText(value, menuTiming.max),
      }));
      setFormErrors((prev) => ({ ...prev, menuDisplayTiming: '' }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const sanitizeText = (value, { collapse = true } = {}) => sanitizeAdminText(value, { collapse });

  const normalizeForCompare = (value) => sanitizeText(value).toLowerCase();

  const isDuplicateProductName = (candidate, draft) => {
    const normalizedName = normalizeForCompare(candidate);
    if (!normalizedName) return false;
    return products.some((product) => {
      if (editingProduct && product.id === editingProduct.id) return false;
      const sameType = mapProductType(product.productType || product.type) === mapProductType(draft.productType);
      const sameCategory = String(product.categoryId || '') === String(draft.categoryId || '');
      const sameName = normalizeForCompare(product.productName || product.name) === normalizedName;
      return sameType && sameCategory && sameName;
    });
  };

  const validMenuTiming = (value) => {
    const cleaned = sanitizeText(value);
    const match = cleaned.match(/^((0[1-9])|(1[0-2])):([0-5][0-9])\s?(AM|PM)\s*-\s*((0[1-9])|(1[0-2])):([0-5][0-9])\s?(AM|PM)$/i);
    return Boolean(match);
  };

  const validateProductForm = (draft) => {
    const errors = {};
    const catalogType = isGroceryCatalog ? 'grocery' : mapProductType(draft.productType);
    const isFoodCorner = catalogType === 'food-corner';
    const cleanedName = sanitizeText(draft.productName);
    const cleanedDescription = sanitizeText(draft.description);
    const cleanedTiming = sanitizeText(draft.menuDisplayTiming);
    const imageValue = String(draft.imageUrl || '').trim();

    if (!draft.productType) {
      errors.productType = 'Please select a product catalog type.';
    }
    if (!cleanedName) {
      errors.productName = 'Please enter the product name.';
    } else {
      const nameError = validateAdminText(cleanedName, {
        min: productName.min,
        max: productName.max,
        rangeMessage: 'Product name must be between 2 and 100 characters.',
        maxMessage: 'Product name must be between 2 and 100 characters.',
      });
      if (nameError) {
        errors.productName = nameError;
      } else if (!/^[A-Za-z0-9\s\-'"&()]+$/.test(cleanedName)) {
        errors.productName = "Only letters, numbers, spaces, hyphens (-), apostrophes ('), ampersands (&), and parentheses () are allowed.";
      } else if (isDuplicateProductName(cleanedName, draft)) {
        errors.productName = 'This product already exists.';
      }
    }

    if (!draft.categoryId) {
      errors.categoryId = 'Please select a category.';
    }

    const rawPrice = String(draft.price ?? '').trim();
    if (!rawPrice) {
      errors.price = 'Please enter the product price.';
    } else if (!/^\d+(\.\d{1,2})?$/.test(rawPrice)) {
      errors.price = 'Please enter a valid price.';
    } else {
      const parsedPrice = Number(rawPrice);
      if (!Number.isFinite(parsedPrice)) errors.price = 'Please enter a valid price.';
      else if (parsedPrice <= 0) errors.price = 'Price must be greater than €0.';
      else if (parsedPrice > 9999.99) errors.price = 'Please enter a valid price.';
    }

    if (!isFoodCorner) {
      if (!draft.stockStatus || !['in_stock', 'out_of_stock'].includes(draft.stockStatus)) {
        errors.stockStatus = 'Please select a stock status.';
      }

      const cleanedWeightUnit = sanitizeText(draft.weightUnit);
      const weightUnitError = validateAdminText(cleanedWeightUnit, {
        required: true,
        max: weightUnit.max,
        requiredMessage: 'Please enter the weight or unit size.',
        maxMessage: `Weight / unit size cannot exceed ${weightUnit.max} characters.`,
      });
      if (weightUnitError) errors.weightUnit = weightUnitError;

      if (draft.description !== undefined && String(draft.description).trim()) {
        const groceryDescription = sanitizeText(draft.description, { collapse: false });
        if (groceryDescription.length > productDescription.max) {
          errors.description = `Description cannot exceed ${productDescription.max} characters.`;
        }
      }
    }

    if (isFoodCorner) {
      if (!cleanedTiming) {
        errors.menuDisplayTiming = 'Please enter the menu display time.';
      } else if (cleanedTiming.length > menuTiming.max) {
        errors.menuDisplayTiming = `Menu display timing cannot exceed ${menuTiming.max} characters.`;
      } else if (!validMenuTiming(cleanedTiming)) {
        errors.menuDisplayTiming = 'Please enter a valid time range.';
      }
      if (cleanedDescription.length > productDescription.max) {
        errors.description = `Description cannot exceed ${productDescription.max} characters.`;
      }
      const needsImage = !editingProduct;
      if (needsImage && (!imageValue || imageValue.startsWith('blob:'))) {
        errors.imageUrl = 'Please upload a product image.';
      } else if (imageValue && !imageValue.startsWith('blob:') && !/\.(jpe?g|png|webp)(\?.*)?$/i.test(imageValue) && !/^data:image\/(jpeg|jpg|png|webp);/i.test(imageValue)) {
        errors.imageUrl = 'Only JPG, JPEG, PNG, and WEBP images are allowed.';
      }
    }

    return errors;
  };

  const focusFirstInvalidField = (errors) => {
    const order = ['productType', 'productName', 'categoryId', 'price', 'stockStatus', 'weightUnit', 'menuDisplayTiming', 'description', 'imageUrl'];
    const firstKey = order.find((key) => errors[key]);
    if (!firstKey) return;
    const node = formFieldRefs.current[firstKey];
    if (node && typeof node.focus === 'function') {
      node.focus();
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleFieldBlur = (e) => {
    const { name, value } = e.target;
    if (!['productName', 'description', 'menuDisplayTiming', 'weightUnit', 'price'].includes(name)) return;
    let nextValue = value;
    if (['productName', 'description', 'menuDisplayTiming', 'weightUnit'].includes(name)) {
      nextValue = sanitizeText(value, name === 'description' ? { collapse: false } : undefined);
    }
    const next = { ...formData, [name]: nextValue };
    setFormData(next);
    const errors = validateProductForm(next);
    setFormErrors((prev) => ({ ...prev, [name]: errors[name] || '' }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMime.includes(String(file.type || '').toLowerCase())) {
      addToast('Only JPG, JPEG, PNG, and WEBP images are allowed.', 'error');
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      addToast('Image size must not exceed 2 MB.', 'error');
      e.target.value = '';
      return;
    }
    if (rejectInvalidCmsImageFile(file, (msg) => addToast(msg, 'error'), e.target)) return;

    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, imageUrl: previewUrl }));
    setFormErrors((prev) => ({ ...prev, imageUrl: '' }));

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
      invalidateDashboardStats();
      fetchData();
    } catch (err) {
      console.error('Failed to delete product', err);
      addToast('Failed to delete product', 'error');
    }
  };

  const buildSubmitPayload = (draft) => {
    const catalogType = isGroceryCatalog ? 'grocery' : mapProductType(draft.productType);
    const isFoodCorner = catalogType === 'food-corner';
    const base = {
      productType: catalogType,
      productName: sanitizeText(draft.productName),
      categoryId: draft.categoryId,
      price: Number(String(draft.price).trim()),
      imageUrl: String(draft.imageUrl || '').trim(),
      status: draft.status,
    };

    if (isFoodCorner) {
      return {
        ...base,
        menuDisplayTiming: sanitizeText(draft.menuDisplayTiming),
        description: sanitizeText(draft.description, { collapse: false }),
      };
    }

    return {
      ...base,
      stockStatus: draft.stockStatus,
      weightUnit: sanitizeText(draft.weightUnit),
      showOnHomepage: Boolean(draft.showOnHomepage),
      featuredProduct: Boolean(draft.showOnHomepage),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingProduct && !isAdmin) {
      addToast('Only administrators can add products', 'error');
      return;
    }
    const cleanedForm = {
      ...formData,
      productType: isGroceryCatalog ? 'grocery' : formData.productType,
      productName: sanitizeText(formData.productName),
      weightUnit: sanitizeText(formData.weightUnit),
      menuDisplayTiming: sanitizeText(formData.menuDisplayTiming),
      description: sanitizeText(formData.description, { collapse: false }),
      imageUrl: String(formData.imageUrl || '').trim(),
    };
    setFormData(cleanedForm);

    const errors = validateProductForm(cleanedForm);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      addToast(Object.values(errors)[0], 'error');
      requestAnimationFrame(() => focusFirstInvalidField(errors));
      return;
    }

    const submitPayload = buildSubmitPayload(cleanedForm);

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, submitPayload);
        addToast('Product updated successfully', 'success');
      } else {
        await productService.createProduct(submitPayload);
        addToast('New product added successfully', 'success');
      }
      invalidateDashboardStats();
      closeModal();
      fetchData();
    } catch (err) {
      console.error('Failed to save product', err);
      const message = err.message || err.response?.data?.message || 'Failed to save product';
      if (message.includes('already exists')) {
        setFormErrors((prev) => ({ ...prev, productName: 'This product already exists.' }));
        requestAnimationFrame(() => focusFirstInvalidField({ productName: true }));
      }
      addToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      if (fcCat) return formatCategoryName(fcCat.categoryName || fcCat.name);
    }

    const cat = categories.find((c) => c.id === catId);
    if (cat) return formatCategoryName(cat.name);
    return formatCategoryName(catId) || 'General';
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, categoryFilter, statusFilter]);

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const productType = mapProductType(prod.productType || prod.type);
      const productStatus = prod.status === 'inactive' ? 'inactive' : 'active';
      const categoryName = getCategoryName(prod.categoryId, productType);
      const matchesSearch = matchesAdminSearch(searchQuery, [
        prod.productName,
        prod.name,
        categoryName,
        prod.categoryId,
        prod.weightUnit,
        prod.unit,
        prod.price,
        statusSearchLabel(productStatus),
        prod.stockStatus,
        productType,
      ]);
      const matchesType = productType === mapProductType(typeFilter);
      const matchesCategory = categoryFilter === 'all' || prod.categoryId === categoryFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && productStatus === 'active') ||
        (statusFilter === 'inactive' && productStatus === 'inactive');
      return matchesSearch && matchesType && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, typeFilter, categoryFilter, statusFilter, categories, foodCornerCategories]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const offset = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(offset, offset + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  const renderStatusBadge = (status) => {
    const isActive = status !== 'inactive';
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
          <h2>{typeFilter === 'food-corner' ? 'Food Corner Items' : 'Catalog Products'}</h2>
          <p>
            {isManager
              ? typeFilter === 'food-corner'
                ? 'View and edit food corner menu items, pricing, availability, and featured status.'
                : 'View and edit grocery products, pricing, stock, and featured status.'
              : 'Create, update, and manage inventory products and ready-to-eat restaurant items.'}
          </p>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="action-btn-secondary" onClick={openAdjustModal}>
              <FaSlidersH /> Adjust Prices
            </button>
            <button className="action-btn-primary" onClick={openAddModal}>
              <FaPlus /> Add Product
            </button>
          </div>
        )}
      </div>

      {/* Search and Filters Controls */}
      <div className="table-controls">
        <div className="search-box-admin">
          <FaSearch className="search-icon-admin" />
          <input 
            type="text" 
            placeholder="Search by name, category, price, status..." 
            value={searchInput}
            onChange={(e) => onSearchChange(e)}
          />
        </div>

        <div className="filter-group-admin product-status-filters">
          <button
            type="button"
            className={`status-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
          >
            All Products
          </button>
          <button
            type="button"
            className={`status-filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}
          >
            Active Products
          </button>
          <button
            type="button"
            className={`status-filter-btn ${statusFilter === 'inactive' ? 'active' : ''}`}
            onClick={() => { setStatusFilter('inactive'); setCurrentPage(1); }}
          >
            Inactive Products
          </button>
        </div>

        <div className="filter-group-admin">
          <select 
            className="filter-select-admin" 
            value={categoryFilter} 
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Categories</option>
            {typeFilter !== 'food-corner' && categories.map(cat => (
              <option key={cat.id} value={cat.id}>{formatCategoryName(cat.name)}</option>
            ))}
            {typeFilter === 'food-corner' && (
              foodCornerCategories.map((cat) => (
                <option key={cat.id || cat.slug} value={cat.id || cat.slug}>
                  {formatCategoryName(cat.categoryName || cat.name)}
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
                  <td data-label="Price" style={{ fontWeight: 600 }}>
                    {prod.price != null && Number.isFinite(Number(prod.price))
                      ? `€${Number(prod.price).toFixed(2)}`
                      : '—'}
                  </td>
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
                      style={{ cursor: 'pointer', fontSize: '1.2rem', color: '#eab308', background: 'none', border: 'none' }}
                      title={(prod.showOnHomepage || prod.featuredProduct || prod.isFeatured) ? 'Unmark Featured' : 'Mark Featured'}
                    >
                      {(prod.showOnHomepage || prod.featuredProduct || prod.isFeatured) ? <FaStar /> : <FaRegStar />}
                    </button>
                  </td>
                  <td data-label="Status">
                    <div className="product-status-cell">
                      {renderStatusBadge(prod.status)}
                      <label className="toggle-switch-admin" title={prod.status === 'active' ? 'Set inactive' : 'Set active'}>
                        <input 
                          type="checkbox" 
                          checked={prod.status !== 'inactive'} 
                          onChange={() => handleStatusToggle(prod)} 
                        />
                        <span className="toggle-slider-admin"></span>
                      </label>
                    </div>
                  </td>
                  <td data-label="Actions" className="admin-actions-cell">
                    <div className="cell-actions">
                      <button
                        className="btn-action-cell edit"
                        onClick={() => openEditModal(prod)}
                        title={typeFilter === 'food-corner' ? 'Edit Food Corner Item' : 'Edit Product'}
                      >
                        <FaEdit />
                      </button>
                      {isAdmin ? (
                        <button className="btn-action-cell delete" onClick={() => handleDelete(prod.id)} title="Delete Product">
                          <FaTrash />
                        </button>
                      ) : null}
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
          <h3>{searchQuery ? ADMIN_NO_MATCH_MESSAGE : 'No products found!'}</h3>
          <p>
            {searchQuery
              ? 'Try a different search term or clear filters.'
              : 'Try refining your search filter or click "Add Product" to add a new catalog item.'}
          </p>
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
              <h3>
                {editingProduct
                  ? isGroceryCatalog
                    ? 'Edit Grocery Product'
                    : 'Edit Food Corner Item'
                  : isGroceryCatalog
                    ? 'Add Grocery Product'
                    : 'Add Food Corner Item'}
              </h3>
              <button type="button" className="modal-close-btn" onClick={closeModal} aria-label="Close modal">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {(() => {
                  const isGroceryProduct = isGroceryCatalog || mapProductType(formData.productType) === 'grocery';
                  const isFoodCornerProduct = !isGroceryProduct;

                  return (
                    <>
                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="productName" required>Product Name</AdminFieldLabel>
                  <input 
                    type="text" 
                    name="productName" 
                    value={formData.productName} 
                    onChange={handleChange} 
                    onBlur={handleFieldBlur}
                    placeholder="e.g. Farm Fresh Apples" 
                    maxLength={productName.max}
                    ref={(el) => { formFieldRefs.current.productName = el; }}
                    className={formErrors.productName ? 'admin-input-invalid' : ''}
                    required 
                  />
                  <div className="admin-field-meta">
                    {formErrors.productName ? (
                      <p className="admin-field-error" role="alert">{formErrors.productName}</p>
                    ) : (
                      <span />
                    )}
                    <span className="admin-char-counter">{formatCharCounter(formData.productName, productName.max)}</span>
                  </div>
                </div>

                <div className="admin-form-group row-split">
                  <div>
                    <AdminFieldLabel htmlFor="categoryId" required>Category Section</AdminFieldLabel>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleChange}
                      required
                      ref={(el) => { formFieldRefs.current.categoryId = el; }}
                      className={formErrors.categoryId ? 'admin-input-invalid' : ''}
                    >
                      {formData.productType !== 'food-corner' ? (
                        categories.map((cat) => (
                          <option key={cat.id || cat.categoryId} value={cat.categoryId || cat.id}>{formatCategoryName(cat.name || cat.categoryName)}</option>
                        ))
                      ) : (
                        foodCornerCategories.map((cat) => (
                          <option key={cat.id || cat.slug} value={cat.categoryId || cat.id || cat.slug}>
                            {formatCategoryName(cat.categoryName || cat.name)}
                          </option>
                        ))
                      )}
                    </select>
                    {formErrors.categoryId ? <p className="admin-field-error" role="alert">{formErrors.categoryId}</p> : null}
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="price" required>Price (€)</AdminFieldLabel>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0.01"
                      name="price" 
                      value={formData.price === '' ? '' : formData.price}
                      onChange={handleChange}
                      onBlur={handleFieldBlur}
                      placeholder="0.00"
                      ref={(el) => { formFieldRefs.current.price = el; }}
                      className={formErrors.price ? 'admin-input-invalid' : ''}
                    />
                    {formErrors.price ? <p className="admin-field-error" role="alert">{formErrors.price}</p> : null}
                  </div>
                </div>

                {isGroceryProduct ? (
                  <div className="admin-form-group row-split">
                    <div>
                      <AdminFieldLabel htmlFor="stockStatus" required>Stock Status</AdminFieldLabel>
                      <select
                        name="stockStatus"
                        value={formData.stockStatus}
                        onChange={handleChange}
                        ref={(el) => { formFieldRefs.current.stockStatus = el; }}
                        className={formErrors.stockStatus ? 'admin-input-invalid' : ''}
                        required
                      >
                        <option value="in_stock">In Stock</option>
                        <option value="out_of_stock">Out of Stock</option>
                      </select>
                      {formErrors.stockStatus ? (
                        <p className="admin-field-error" role="alert">{formErrors.stockStatus}</p>
                      ) : null}
                    </div>
                    <div>
                      <AdminFieldLabel htmlFor="weightUnit" required>Weight / Unit Size</AdminFieldLabel>
                      <input 
                        type="text" 
                        name="weightUnit" 
                        value={formData.weightUnit} 
                        onChange={handleChange}
                        onBlur={handleFieldBlur}
                        placeholder="e.g. 5KG or 1L"
                        maxLength={weightUnit.max}
                        ref={(el) => { formFieldRefs.current.weightUnit = el; }}
                        className={formErrors.weightUnit ? 'admin-input-invalid' : ''}
                        required
                      />
                      <div className="admin-field-meta">
                        {formErrors.weightUnit ? (
                          <p className="admin-field-error" role="alert">{formErrors.weightUnit}</p>
                        ) : (
                          <span />
                        )}
                        <span className="admin-char-counter">{formatCharCounter(formData.weightUnit, weightUnit.max)}</span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {isFoodCornerProduct && (
                  <>
                    <div className="admin-form-group">
                      <AdminFieldLabel htmlFor="menuDisplayTiming" required>Menu Display Timings</AdminFieldLabel>
                      <input
                        type="text"
                        name="menuDisplayTiming"
                        value={formData.menuDisplayTiming}
                        onChange={handleChange}
                        onBlur={handleFieldBlur}
                        placeholder="06:00 PM - 10:00 PM"
                        maxLength={menuTiming.max}
                        ref={(el) => { formFieldRefs.current.menuDisplayTiming = el; }}
                        className={formErrors.menuDisplayTiming ? 'admin-input-invalid' : ''}
                      />
                      <div className="admin-field-meta">
                        {formErrors.menuDisplayTiming ? (
                          <p className="admin-field-error" role="alert">{formErrors.menuDisplayTiming}</p>
                        ) : (
                          <span />
                        )}
                        <span className="admin-char-counter">{formatCharCounter(formData.menuDisplayTiming, menuTiming.max)}</span>
                      </div>
                    </div>
                    <div className="admin-form-group">
                      <AdminFieldLabel htmlFor="description" optional>Description</AdminFieldLabel>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        onBlur={handleFieldBlur}
                        rows={3}
                        placeholder="Short description for the menu item"
                        maxLength={productDescription.max}
                        ref={(el) => { formFieldRefs.current.description = el; }}
                        className={formErrors.description ? 'admin-input-invalid' : ''}
                      />
                      <div className="admin-field-meta">
                        {formErrors.description ? (
                          <p className="admin-field-error" role="alert">{formErrors.description}</p>
                        ) : (
                          <span />
                        )}
                        <span className="admin-char-counter">{formatCharCounter(formData.description, productDescription.max)}</span>
                      </div>
                    </div>
                  </>
                )}

                <div className="admin-form-group">
                  <AdminFieldLabel required={isFoodCornerProduct} optional={isGroceryProduct}>
                    Product Image
                  </AdminFieldLabel>
                  <div className="row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="admin-field-hint" style={{ fontWeight: 600, color: '#334155' }}>Image URL</label>
                      <input 
                        type="text" 
                        name="imageUrl" 
                        value={formData.imageUrl} 
                        onChange={handleChange} 
                        placeholder="/uploads/products/..." 
                        ref={(el) => { formFieldRefs.current.imageUrl = el; }}
                        className={formErrors.imageUrl ? 'admin-input-invalid' : ''}
                      />
                      {formErrors.imageUrl ? <p className="admin-field-error" role="alert">{formErrors.imageUrl}</p> : null}
                    </div>
                    <div>
                      <label className="admin-field-hint" style={{ fontWeight: 600, color: '#334155' }}>Or Upload Product Image</label>
                      <div className="image-upload-zone" style={{ padding: '8px' }}>
                        <input 
                          type="file" 
                          accept={CMS_IMAGE_ACCEPT} 
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
                </div>

                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="product-status">Product Status</AdminFieldLabel>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {isGroceryProduct ? (
                  <div className="admin-form-group">
                    <label className="admin-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600, color: '#334155' }}>
                      <input
                        type="checkbox"
                        name="showOnHomepage"
                        checked={formData.showOnHomepage}
                        onChange={handleChange}
                      />
                      Show on Homepage (Featured Products)
                    </label>
                  </div>
                ) : null}

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
                    </>
                  );
                })()}
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

      {/* Batch Price Adjustment Modal */}
      {isAdjustModalOpen && (
        <div
          className="admin-modal-overlay"
          onClick={() => setIsAdjustModalOpen(false)}
          role="presentation"
        >
          <div
            className="admin-modal-container"
            style={{ maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Batch Price Adjustment</h3>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => setIsAdjustModalOpen(false)} 
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAdjustSubmit}>
              <div className="modal-body">
                <div style={{ marginBottom: '16px', padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, borderLeft: '4px solid #dc2626', lineHeight: 1.4 }}>
                  ⚠️ <strong>Warning:</strong> This operation will bulk update prices of all active products in the selected category directly in the database. This action is irreversible.
                </div>

                <div className="admin-form-group">
                  <AdminFieldLabel required>Category Section</AdminFieldLabel>
                  <select 
                    name="categoryId" 
                    value={adjustFormData.categoryId} 
                    onChange={handleAdjustChange} 
                    required
                  >
                    {adjustFormData.productType !== 'food-corner' ? (
                      categories.map((cat) => (
                        <option key={cat.id || cat.categoryId} value={cat.categoryId || cat.id}>
                          {formatCategoryName(cat.name || cat.categoryName)}
                        </option>
                      ))
                    ) : (
                      foodCornerCategories.map((cat) => (
                        <option key={cat.id || cat.slug} value={cat.categoryId || cat.id || cat.slug}>
                          {formatCategoryName(cat.categoryName || cat.name)}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="admin-form-group row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <AdminFieldLabel required>Adjustment Direction</AdminFieldLabel>
                    <select 
                      name="direction" 
                      value={adjustFormData.direction} 
                      onChange={handleAdjustChange} 
                      required
                    >
                      <option value="decrease">Decrease Price (-)</option>
                      <option value="increase">Increase Price (+)</option>
                    </select>
                  </div>
                  <div>
                    <AdminFieldLabel required>Adjustment Type</AdminFieldLabel>
                    <select 
                      name="adjustmentType" 
                      value={adjustFormData.adjustmentType} 
                      onChange={handleAdjustChange} 
                      required
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (€)</option>
                    </select>
                  </div>
                </div>

                <div className="admin-form-group">
                  <AdminFieldLabel required>
                    Adjustment Value {adjustFormData.adjustmentType === 'percentage' ? '(%)' : '(€)'}
                  </AdminFieldLabel>
                  <input 
                    type="number" 
                    step="any"
                    name="value" 
                    value={adjustFormData.value} 
                    onChange={handleAdjustChange} 
                    placeholder={adjustFormData.adjustmentType === 'percentage' ? 'e.g. 10' : 'e.g. 1.50'}
                    required 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="action-btn-secondary" 
                  onClick={() => setIsAdjustModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="action-btn-primary" 
                  style={{ background: '#dc2626', borderColor: '#dc2626' }}
                  disabled={isAdjusting}
                >
                  {isAdjusting ? 'Applying...' : 'Apply Adjustment'}
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
