import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaPlus, FaEdit, FaTrash, FaSave, FaExternalLinkAlt, FaSearch, FaGripVertical, FaImage,
  FaExclamationCircle,
} from 'react-icons/fa';
import aboutUsService from '../../../services/aboutUsService';
import { getImageUrl } from '../../../services/api';
import { emptyAboutPageForm, mapAboutPageFromApi } from '../../../constants/aboutPageDefaults';
import {
  ABOUT_IMAGE_ACCEPT,
  ABOUT_IMAGE_TYPE_ERROR,
  isValidAboutImageDataUrl,
  validateAboutImageFile,
} from '../../../utils/aboutImageValidation';
import {
  validateAboutListItem,
  validateAboutPageSave,
  getFieldError,
  setPathValue,
  getPathValue,
  patchFieldError,
  fieldDomId,
  sanitizeOwnerNameInput,
  sanitizeOwnerPhoneInput,
  sanitizeOwnerSinceYearInput,
} from '../../../utils/aboutFormValidation';
import {
  ADMIN_TEXT_LIMITS,
  boundAdminText,
  formatCharCounter,
  sanitizeAdminText,
} from '../../../utils/adminTextValidation';
import AdminFieldLabel from '../../../components/admin/AdminFieldLabel';
import AdminFieldLegend from '../../../components/admin/AdminFieldLegend';
import { useToast } from '../../../context/ToastContext';
import useAdminSearch from '../../../hooks/useAdminSearch';
import { filterByAdminSearch, ADMIN_NO_MATCH_MESSAGE } from '../../../utils/adminSearch';
import './AdminAboutUs.css';

const SECTIONS = [
  { id: 'intro', label: '1. Introduction' },
  { id: 'story', label: '2. Our Story' },
  { id: 'mvp', label: '3. Mission / Vision / Promise' },
  { id: 'offers', label: '4. What We Offer' },
  { id: 'stats', label: '5. Statistics' },
  { id: 'owner', label: '6. Owner Info' },
];

const ICON_OPTIONS = [
  'FiCalendar', 'FiUsers', 'FiCoffee', 'FiAward', 'FiTarget', 'FiEye', 'FiHeart',
  'FiStar', 'FiShoppingBag', 'FiGrid', 'FiMapPin', 'FiPhone', 'FiCheck',
];

const PAGE_SIZE = 8;

const ABOUT_TEXT_LIMITS = {
  sectionTitle: ADMIN_TEXT_LIMITS.sectionTitle.max,
  sectionDescription: ADMIN_TEXT_LIMITS.sectionDescription.max,
  missionTitle: ADMIN_TEXT_LIMITS.missionTitle.max,
  missionDescription: ADMIN_TEXT_LIMITS.missionDescription.max,
  ownerName: ADMIN_TEXT_LIMITS.ownerName.max,
  ownerDesignation: ADMIN_TEXT_LIMITS.ownerDesignation.max,
  ownerQuote: ADMIN_TEXT_LIMITS.ownerQuote.max,
  ownerExperience: ADMIN_TEXT_LIMITS.ownerExperience.max,
  ownerBadge: ADMIN_TEXT_LIMITS.ownerBadge.max,
};

const MULTILINE_ABOUT_PATHS = new Set([
  'heroParagraphs.0',
  'storyDescription',
  'owner.quote',
]);

const AboutTextControl = ({
  value = '',
  onChange,
  onBlur,
  maxLength,
  multiline = false,
  rows = 3,
  className = '',
  ...rest
}) => {
  const handleChange = (event) => {
    let nextValue = event.target.value;
    if (maxLength) nextValue = boundAdminText(nextValue, maxLength);
    onChange(nextValue);
  };

  const sharedProps = {
    value,
    onChange: handleChange,
    onBlur,
    className,
    maxLength,
    ...rest,
  };

  return (
    <>
      {multiline ? (
        <textarea rows={rows} {...sharedProps} />
      ) : (
        <input type="text" {...sharedProps} />
      )}
      {maxLength ? (
        <span className="admin-char-counter">{formatCharCounter(value, maxLength)}</span>
      ) : null}
    </>
  );
};

const FieldError = ({ message }) => (
  <p className="about-admin-field-error" role="alert">
    <FaExclamationCircle aria-hidden="true" />
    <span>{message}</span>
  </p>
);

const ValidatedField = ({
  path,
  label,
  required = false,
  optional = false,
  error,
  className = '',
  children,
}) => (
  <div
    id={path ? fieldDomId(path) : undefined}
    className={`about-admin-field ${className}`.trim()}
    data-field-path={path || undefined}
  >
    <AdminFieldLabel required={required} optional={optional}>
      {label}
    </AdminFieldLabel>
    {children}
    {error && <FieldError message={error} />}
  </div>
);

const focusFirstInvalidField = (path) => {
  if (!path) return;
  requestAnimationFrame(() => {
    const el = document.getElementById(fieldDomId(path));
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const focusable = el?.querySelector('input:not([type="file"]), textarea, select');
    focusable?.focus({ preventScroll: true });
  });
};

const InvalidFileTypeModal = ({ onClose }) => (
  <div className="about-admin-file-error-overlay" onClick={onClose} role="presentation">
    <div
      className="about-admin-file-error-modal"
      onClick={(e) => e.stopPropagation()}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="about-invalid-file-title"
      aria-describedby="about-invalid-file-message"
    >
      <div className="about-admin-file-error-icon" aria-hidden="true">
        <FaImage />
      </div>
      <h3 id="about-invalid-file-title">Invalid File Type</h3>
      <p id="about-invalid-file-message">{ABOUT_IMAGE_TYPE_ERROR}</p>
      <button type="button" className="about-admin-file-error-ok" onClick={onClose} autoFocus>
        OK
      </button>
    </div>
  </div>
);

const ImageField = ({
  path,
  label,
  value,
  onChange,
  inputId,
  required = false,
  optional = false,
  error = '',
  onBlur,
}) => {
  const [showInvalidModal, setShowInvalidModal] = useState(false);
  const [localError, setLocalError] = useState('');
  const displayError = error || localError;
  const hasPreview = Boolean(
    value && (!value.startsWith('data:') || isValidAboutImageDataUrl(value))
  );
  const preview = hasPreview
    ? (value.startsWith('data:') ? value : getImageUrl(value))
    : null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const validation = validateAboutImageFile(file);
    if (!validation.valid) {
      if (validation.error === ABOUT_IMAGE_TYPE_ERROR) {
        setShowInvalidModal(true);
      } else {
        setLocalError(validation.error);
      }
      return;
    }

    setLocalError('');
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  };

  const fieldBody = (
    <>
      {preview && (
        <div className="about-admin-image-preview">
          <img src={preview} alt={label} />
        </div>
      )}
      <input
        id={inputId}
        type="file"
        accept={ABOUT_IMAGE_ACCEPT}
        className={displayError ? 'about-admin-input-invalid' : ''}
        onChange={handleFileChange}
        onBlur={onBlur}
      />
    </>
  );

  if (path) {
    return (
      <ValidatedField path={path} label={label} required={required} error={displayError} className="full">
        {fieldBody}
        {showInvalidModal && (
          <InvalidFileTypeModal onClose={() => setShowInvalidModal(false)} />
        )}
      </ValidatedField>
    );
  }

  return (
    <div className="about-admin-field">
      <AdminFieldLabel htmlFor={inputId} required={required} optional={optional}>
        {label}
      </AdminFieldLabel>
      {fieldBody}
      {displayError && <FieldError message={displayError} />}
      {showInvalidModal && (
        <InvalidFileTypeModal onClose={() => setShowInvalidModal(false)} />
      )}
    </div>
  );
};

const StatusToggle = ({ checked, onChange, label = 'Active' }) => (
  <label className="about-admin-toggle">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span>{label}</span>
  </label>
);

const EMPTY_MODAL_FORM = {
  marker: '',
  title: '',
  description: '',
  icon: 'FiCalendar',
  value: '',
  suffix: '',
  label: '',
  image: '',
  isActive: true,
};

const ModalField = ({ fieldKey, label, required, optional, error, children }) => (
  <label data-modal-field={fieldKey}>
    <AdminFieldLegend required={required} optional={optional}>
      {label}
    </AdminFieldLegend>
    {children}
    {error ? <FieldError message={error} /> : null}
  </label>
);

const paginate = (items, page, search, getFields) => {
  const filtered = filterByAdminSearch(items, search, getFields);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  return {
    items: filtered.slice(start, start + PAGE_SIZE),
    total: filtered.length,
    totalPages,
    page: safePage,
  };
};

const introHasVisibleContent = (page) =>
  Boolean(
    page.heroEyebrow ||
      page.heroHeading ||
      page.heroHighlight ||
      page.heroParagraphs?.some((p) => String(p || '').trim()) ||
      page.heroImage
  );

export const AdminAboutUs = () => {
  const { addToast } = useToast();
  const [activeSection, setActiveSection] = useState('intro');
  const [aboutPage, setAboutPage] = useState(() => emptyAboutPageForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { searchInput, searchQuery, onSearchChange, clearSearch, hasActiveSearch } = useAdminSearch();
  const [listPage, setListPage] = useState(1);
  const [dragIndex, setDragIndex] = useState(null);
  const [modal, setModal] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [saveAttempted, setSaveAttempted] = useState(false);

  const validateLiveField = useCallback((path, page) => {
    const error = getFieldError(path, page);
    setFieldErrors((prev) => patchFieldError(prev, path, error));
    return error;
  }, []);

  const setFieldValue = useCallback((path, value, { sanitize } = {}) => {
    const nextValue = sanitize ? sanitize(value) : value;
    setTouched((prev) => ({ ...prev, [path]: true }));

    let nextPage = null;
    setAboutPage((prev) => {
      nextPage = setPathValue(prev, path, nextValue);
      return nextPage;
    });

    if (nextPage) {
      const error = getFieldError(path, nextPage);
      setFieldErrors((fe) => patchFieldError(fe, path, error));
    }
  }, []);

  const handleFieldBlur = useCallback((path) => {
    setTouched((prev) => ({ ...prev, [path]: true }));
    setAboutPage((prev) => {
      const current = getPathValue(prev, path);
      if (typeof current === 'string') {
        const sanitized = sanitizeAdminText(current, {
          collapse: !MULTILINE_ABOUT_PATHS.has(path),
        });
        const next = sanitized !== current ? setPathValue(prev, path, sanitized) : prev;
        validateLiveField(path, next);
        return next;
      }
      validateLiveField(path, prev);
      return prev;
    });
  }, [validateLiveField]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await aboutUsService.getAboutUsAdmin();
      if (data?.aboutPage) {
        setAboutPage(mapAboutPageFromApi(data.aboutPage));
      }
    } catch {
      addToast('Failed to load About Us content', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setListPage(1); clearSearch(); }, [activeSection, clearSearch]);

  const updateField = (path, value, options) => {
    setFieldValue(path, value, options);
  };

  const updateList = (key, updater) => {
    setAboutPage((prev) => ({
      ...prev,
      [key]: updater(prev[key] || []),
    }));
  };

  const handleSave = async () => {
    setSaveAttempted(true);
    const validation = validateAboutPageSave(aboutPage);
    if (!validation.valid) {
      setFieldErrors(validation.fieldErrors || {});
      setTouched((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.keys(validation.fieldErrors || {}).map((key) => [key, true])
        ),
      }));
      setSaveError(validation.error);
      if (validation.firstErrorSection) {
        setActiveSection(validation.firstErrorSection);
      }
      focusFirstInvalidField(validation.firstErrorField);
      addToast(validation.error, 'error');
      return;
    }

    setSaveError('');
    setFieldErrors({});
    setTouched({});
    setSaveAttempted(false);
    setSaving(true);
    try {
      const data = await aboutUsService.updateAboutUs(aboutPage);
      if (data?.aboutPage) {
        setAboutPage(mapAboutPageFromApi(data.aboutPage));
      }
      addToast('About Us page saved successfully', 'success');
      setSaveError('');
      setFieldErrors({});
    } catch (err) {
      addToast(err.message || 'Failed to save About Us content', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openModal = (type, item = null) => setModal({ type, item });
  const closeModal = () => setModal(null);

  const saveModal = (form) => {
    const { type, item } = modal;
    const keyMap = {
      timeline: 'storyTimeline',
      mvp: 'mvpCards',
      offers: 'offerings',
      stats: 'stats',
    };
    const key = keyMap[type];
    if (!key) return;

    updateList(key, (list) => {
      const next = [...(list || [])];
      if (item?.id) {
        const index = next.findIndex((entry) => entry.id === item.id);
        if (index >= 0) {
          next[index] = { ...next[index], ...form };
          return next;
        }
      }
      if (item) {
        const index = next.findIndex((entry) => entry === item);
        if (index >= 0) {
          next[index] = { ...next[index], ...form };
          return next;
        }
      }
      next.push({
        ...form,
        displayOrder: next.length + 1,
        isActive: form.isActive !== false,
      });
      return next;
    });
    closeModal();
  };

  const deleteItem = (key, item) => {
    const label = item?.title || item?.label || item?.marker || 'this item';
    if (!window.confirm(`Delete "${label}" permanently?`)) return;
    updateList(key, (list) => {
      if (item?.id) return (list || []).filter((entry) => entry.id !== item.id);
      return (list || []).filter((entry) => entry !== item);
    });
  };

  const handleDrag = (key, from, to) => {
    if (from === null || from === to) return;
    updateList(key, (list) => {
      const next = [...(list || [])];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next.map((entry, index) => ({ ...entry, displayOrder: index + 1 }));
    });
    setDragIndex(null);
  };

  const listConfig = useMemo(() => {
    if (activeSection === 'story') {
      return {
        key: 'storyTimeline',
        items: aboutPage.storyTimeline || [],
        getFields: (i) => [i.marker, i.title, i.body, i.description],
        modalType: 'timeline',
        empty: 'No timeline items yet.',
      };
    }
    if (activeSection === 'mvp') {
      return {
        key: 'mvpCards',
        items: aboutPage.mvpCards || [],
        getFields: (i) => [i.title, i.body, i.description],
        modalType: 'mvp',
        empty: 'No cards yet.',
      };
    }
    if (activeSection === 'offers') {
      return {
        key: 'offerings',
        items: aboutPage.offerings || [],
        getFields: (i) => [i.title, i.body, i.description],
        modalType: 'offers',
        empty: 'No offers yet.',
      };
    }
    if (activeSection === 'stats') {
      return {
        key: 'stats',
        items: aboutPage.stats || [],
        getFields: (i) => [i.label, i.value],
        modalType: 'stats',
        empty: 'No statistics yet.',
      };
    }
    return null;
  }, [activeSection, aboutPage]);

  const pagedList = listConfig
    ? paginate(listConfig.items, listPage, searchQuery, listConfig.getFields)
    : null;

  if (loading) return <div className="about-admin-loading">Loading About Us Management...</div>;

  return (
    <div className="about-admin">
      <header className="about-admin-header">
        <div>
          <h1>About Us Management</h1>
          <p>Manage all content on the public About Us page.</p>
        </div>
        <div className="about-admin-header-actions">
          <a href="/about-us" target="_blank" rel="noreferrer" className="about-admin-btn outline">
            <FaExternalLinkAlt /> Preview Page
          </a>
          <button type="button" className="about-admin-btn primary" onClick={handleSave} disabled={saving}>
            <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      {saveError && <p className="about-admin-save-error">{saveError}</p>}

      <nav className="about-admin-tabs">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`about-admin-tab${activeSection === s.id ? ' active' : ''}`}
            onClick={() => setActiveSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <div className="about-admin-panel">
        {activeSection === 'intro' && (
          <div className="about-admin-grid">
            <ValidatedField path="heroEyebrow" label="About Badge Text" required error={fieldErrors.heroEyebrow}>
              <AboutTextControl
                value={aboutPage.heroEyebrow}
                className={fieldErrors.heroEyebrow ? 'about-admin-input-invalid' : ''}
                maxLength={ABOUT_TEXT_LIMITS.sectionTitle}
                onChange={(value) => updateField('heroEyebrow', value)}
                onBlur={() => handleFieldBlur('heroEyebrow')}
              />
            </ValidatedField>
            <ValidatedField path="heroHeading" label="Main Heading" required error={fieldErrors.heroHeading}>
              <AboutTextControl
                value={aboutPage.heroHeading}
                className={fieldErrors.heroHeading ? 'about-admin-input-invalid' : ''}
                maxLength={ABOUT_TEXT_LIMITS.sectionTitle}
                onChange={(value) => updateField('heroHeading', value)}
                onBlur={() => handleFieldBlur('heroHeading')}
              />
            </ValidatedField>
            <ValidatedField path="heroHighlight" label="Highlight Heading Text" required error={fieldErrors.heroHighlight}>
              <AboutTextControl
                value={aboutPage.heroHighlight}
                className={fieldErrors.heroHighlight ? 'about-admin-input-invalid' : ''}
                maxLength={ABOUT_TEXT_LIMITS.sectionTitle}
                onChange={(value) => updateField('heroHighlight', value)}
                onBlur={() => handleFieldBlur('heroHighlight')}
              />
            </ValidatedField>
            {[0, 1, 2, 3].map((i) => (
              i === 0 ? (
                <ValidatedField
                  key="para-0"
                  path="heroParagraphs.0"
                  label="Description Paragraph 1"
                  required
                  error={fieldErrors['heroParagraphs.0']}
                  className="full"
                >
                  <AboutTextControl
                    multiline
                    rows={3}
                    value={aboutPage.heroParagraphs?.[0] || ''}
                    className={fieldErrors['heroParagraphs.0'] ? 'about-admin-input-invalid' : ''}
                    maxLength={ABOUT_TEXT_LIMITS.sectionDescription}
                    onChange={(value) => updateField('heroParagraphs.0', value)}
                    onBlur={() => handleFieldBlur('heroParagraphs.0')}
                  />
                </ValidatedField>
              ) : (
                <div className="about-admin-field full" key={`para-${i}`}>
                  <AdminFieldLabel optional>{`Description Paragraph ${i + 1}`}</AdminFieldLabel>
                  <textarea
                    rows={3}
                    value={aboutPage.heroParagraphs?.[i] || ''}
                    maxLength={ABOUT_TEXT_LIMITS.sectionDescription}
                    onChange={(e) => {
                      const paragraphs = [...(aboutPage.heroParagraphs || [])];
                      paragraphs[i] = boundAdminText(e.target.value, ABOUT_TEXT_LIMITS.sectionDescription);
                      updateField('heroParagraphs', paragraphs);
                    }}
                  />
                  <span className="admin-char-counter">
                    {formatCharCounter(aboutPage.heroParagraphs?.[i], ABOUT_TEXT_LIMITS.sectionDescription)}
                  </span>
                </div>
              )
            ))}
            <div className="about-admin-field">
              <AdminFieldLabel optional>Button 1 Text</AdminFieldLabel>
              <input value={aboutPage.button1Text} onChange={(e) => updateField('button1Text', e.target.value)} />
            </div>
            <div className="about-admin-field">
              <AdminFieldLabel optional>Button 1 URL</AdminFieldLabel>
              <input value={aboutPage.button1Url} onChange={(e) => updateField('button1Url', e.target.value)} />
            </div>
            <div className="about-admin-field">
              <AdminFieldLabel optional>Button 2 Text</AdminFieldLabel>
              <input value={aboutPage.button2Text} onChange={(e) => updateField('button2Text', e.target.value)} />
            </div>
            <div className="about-admin-field">
              <AdminFieldLabel optional>Button 2 URL</AdminFieldLabel>
              <input value={aboutPage.button2Url} onChange={(e) => updateField('button2Url', e.target.value)} />
            </div>
            <div className="about-admin-field">
              <AdminFieldLabel optional>Serving Since Badge Text</AdminFieldLabel>
              <input value={aboutPage.heroBadge} onChange={(e) => updateField('heroBadge', e.target.value)} />
            </div>
            <div className="about-admin-field">
              <AdminFieldLabel optional>Display Order</AdminFieldLabel>
              <input type="number" min={1} value={aboutPage.heroDisplayOrder} onChange={(e) => updateField('heroDisplayOrder', Number(e.target.value))} />
            </div>
            <StatusToggle checked={aboutPage.heroIsActive !== false} onChange={(v) => updateField('heroIsActive', v)} />
            {introHasVisibleContent(aboutPage) && aboutPage.heroIsActive === false && (
              <p className="about-admin-visibility-notice">
                This section is hidden on the public About Us page. Turn on Active to publish it.
              </p>
            )}
            <ImageField
              path="heroImage"
              label="About Main Image"
              value={aboutPage.heroImage}
              onChange={(v) => {
                setTouched((prev) => ({ ...prev, heroImage: true }));
                updateField('heroImage', v);
              }}
              inputId="about-hero-img"
              required
              error={fieldErrors.heroImage}
              onBlur={() => handleFieldBlur('heroImage')}
            />
          </div>
        )}

        {activeSection === 'story' && (
          <>
            <div className="about-admin-grid">
              <ValidatedField path="storyTitle" label="Story Section Title" required error={fieldErrors.storyTitle}>
                <AboutTextControl
                  value={aboutPage.storyTitle}
                  className={fieldErrors.storyTitle ? 'about-admin-input-invalid' : ''}
                  maxLength={ABOUT_TEXT_LIMITS.sectionTitle}
                  onChange={(value) => updateField('storyTitle', value)}
                  onBlur={() => handleFieldBlur('storyTitle')}
                />
              </ValidatedField>
              <ValidatedField path="storyDescription" label="Story Description" required error={fieldErrors.storyDescription} className="full">
                <AboutTextControl
                  multiline
                  rows={3}
                  value={aboutPage.storyDescription}
                  className={fieldErrors.storyDescription ? 'about-admin-input-invalid' : ''}
                  maxLength={ABOUT_TEXT_LIMITS.sectionDescription}
                  onChange={(value) => updateField('storyDescription', value)}
                  onBlur={() => handleFieldBlur('storyDescription')}
                />
              </ValidatedField>
              <ImageField
                path="storyImage"
                label="Our Story Image"
                value={aboutPage.storyImage}
                onChange={(v) => {
                  setTouched((prev) => ({ ...prev, storyImage: true }));
                  updateField('storyImage', v);
                }}
                inputId="about-story-img"
                required
                error={fieldErrors.storyImage}
                onBlur={() => handleFieldBlur('storyImage')}
              />
              <StatusToggle checked={aboutPage.storyIsActive !== false} onChange={(v) => updateField('storyIsActive', v)} />
            </div>
          </>
        )}

        {activeSection === 'owner' && (
          <div className="about-admin-grid">
            <ValidatedField path="owner.name" label="Owner Name" required error={fieldErrors['owner.name']}>
              <AboutTextControl
                value={aboutPage.owner?.name || ''}
                className={fieldErrors['owner.name'] ? 'about-admin-input-invalid' : ''}
                maxLength={ABOUT_TEXT_LIMITS.ownerName}
                onChange={(value) => updateField('owner.name', value, { sanitize: sanitizeOwnerNameInput })}
                onBlur={() => handleFieldBlur('owner.name')}
              />
            </ValidatedField>
            <ValidatedField path="owner.designation" label="Designation" required error={fieldErrors['owner.designation']}>
              <AboutTextControl
                value={aboutPage.owner?.designation || ''}
                className={fieldErrors['owner.designation'] ? 'about-admin-input-invalid' : ''}
                maxLength={ABOUT_TEXT_LIMITS.ownerDesignation}
                onChange={(value) => updateField('owner.designation', value)}
                onBlur={() => handleFieldBlur('owner.designation')}
              />
            </ValidatedField>
            <ValidatedField path="owner.quote" label="Quote" required error={fieldErrors['owner.quote']} className="full">
              <AboutTextControl
                multiline
                rows={3}
                value={aboutPage.owner?.quote || ''}
                className={fieldErrors['owner.quote'] ? 'about-admin-input-invalid' : ''}
                maxLength={ABOUT_TEXT_LIMITS.ownerQuote}
                onChange={(value) => updateField('owner.quote', value)}
                onBlur={() => handleFieldBlur('owner.quote')}
              />
            </ValidatedField>
            <ValidatedField path="owner.phone" label="Phone Number" required error={fieldErrors['owner.phone']}>
              <input
                type="tel"
                value={aboutPage.owner?.phone || ''}
                className={fieldErrors['owner.phone'] ? 'about-admin-input-invalid' : ''}
                placeholder="+31659046526 or +31659046526 / +310644234955"
                onChange={(e) => updateField('owner.phone', e.target.value, { sanitize: sanitizeOwnerPhoneInput })}
                onBlur={() => handleFieldBlur('owner.phone')}
              />
            </ValidatedField>
            <ValidatedField path="owner.location" label="Address" required error={fieldErrors['owner.location']}>
              <input
                value={aboutPage.owner?.location || ''}
                className={fieldErrors['owner.location'] ? 'about-admin-input-invalid' : ''}
                onChange={(e) => updateField('owner.location', e.target.value)}
                onBlur={() => handleFieldBlur('owner.location')}
              />
            </ValidatedField>
            <ValidatedField path="owner.sinceYear" label="Since Year" required error={fieldErrors['owner.sinceYear']}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={aboutPage.owner?.sinceYear || ''}
                className={fieldErrors['owner.sinceYear'] ? 'about-admin-input-invalid' : ''}
                placeholder="2022"
                onChange={(e) => updateField('owner.sinceYear', e.target.value, { sanitize: sanitizeOwnerSinceYearInput })}
                onBlur={() => handleFieldBlur('owner.sinceYear')}
              />
            </ValidatedField>
            <ValidatedField path="owner.yearsServing" label="Experience Text" required error={fieldErrors['owner.yearsServing']}>
              <AboutTextControl
                value={aboutPage.owner?.yearsServing || ''}
                className={fieldErrors['owner.yearsServing'] ? 'about-admin-input-invalid' : ''}
                maxLength={ABOUT_TEXT_LIMITS.ownerExperience}
                onChange={(value) => updateField('owner.yearsServing', value)}
                onBlur={() => handleFieldBlur('owner.yearsServing')}
              />
            </ValidatedField>
            <ValidatedField path="owner.badge" label="Badge Text" required error={fieldErrors['owner.badge']}>
              <AboutTextControl
                value={aboutPage.owner?.badge || ''}
                className={fieldErrors['owner.badge'] ? 'about-admin-input-invalid' : ''}
                maxLength={ABOUT_TEXT_LIMITS.ownerBadge}
                onChange={(value) => updateField('owner.badge', value)}
                onBlur={() => handleFieldBlur('owner.badge')}
              />
            </ValidatedField>
            <StatusToggle checked={aboutPage.owner?.isActive !== false} onChange={(v) => updateField('owner.isActive', v)} />
            {Boolean(aboutPage.owner?.name || aboutPage.owner?.quote || aboutPage.owner?.photo) &&
              aboutPage.owner?.isActive === false && (
              <p className="about-admin-visibility-notice">
                Owner info is hidden on the public About Us page. Turn on Active to publish it.
              </p>
            )}
            <ImageField
              path="owner.photo"
              label="Profile Photo"
              value={aboutPage.owner?.photo}
              onChange={(v) => {
                setTouched((prev) => ({ ...prev, 'owner.photo': true }));
                updateField('owner.photo', v);
              }}
              inputId="about-owner-img"
              required
              error={fieldErrors['owner.photo']}
              onBlur={() => handleFieldBlur('owner.photo')}
            />
          </div>
        )}

        {listConfig && (
          <>
            <div className="about-admin-list-toolbar">
              <div className="about-admin-search">
                <FaSearch />
                <input
                  placeholder="Search..."
                  value={searchInput}
                  onChange={(e) => {
                    onSearchChange(e);
                    setListPage(1);
                  }}
                />
              </div>
              <button type="button" className="about-admin-btn primary" onClick={() => openModal(listConfig.modalType)}>
                <FaPlus /> Add
              </button>
            </div>

            {pagedList.items.length === 0 ? (
              <p className="about-admin-empty">
                {hasActiveSearch ? ADMIN_NO_MATCH_MESSAGE : listConfig.empty}
              </p>
            ) : (
              <div className="about-admin-list">
                {pagedList.items.map((item, idx) => {
                  const globalIndex = listConfig.items.indexOf(item);
                  return (
                    <div
                      key={item.id || `${item.title || item.label}-${idx}`}
                      className="about-admin-list-item"
                      draggable
                      onDragStart={() => setDragIndex(globalIndex)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrag(listConfig.key, dragIndex, globalIndex)}
                    >
                      <FaGripVertical className="about-admin-drag" />
                      <div className="about-admin-list-body">
                        <strong>
                          {(listConfig.getFields(item) || []).filter(Boolean).slice(0, 2).join(' — ') ||
                            item.title ||
                            item.label}
                        </strong>
                        {item.description && <p>{item.description}</p>}
                        {activeSection === 'stats' && (
                          <span className="about-admin-meta">{item.value}{item.suffix} — {item.icon}</span>
                        )}
                      </div>
                      <StatusToggle
                        checked={item.isActive !== false}
                        onChange={(v) => updateList(listConfig.key, (list) => {
                          const next = [...list];
                          const i = item.id
                            ? next.findIndex((x) => x.id === item.id)
                            : next.findIndex((x) => x === item);
                          if (i >= 0) next[i] = { ...next[i], isActive: v };
                          return next;
                        })}
                      />
                      <button type="button" className="icon-btn" onClick={() => openModal(listConfig.modalType, item)}><FaEdit /></button>
                      <button type="button" className="icon-btn danger" onClick={() => deleteItem(listConfig.key, item)}><FaTrash /></button>
                    </div>
                  );
                })}
              </div>
            )}

            {pagedList.totalPages > 1 && (
              <div className="about-admin-pagination">
                <button type="button" disabled={pagedList.page <= 1} onClick={() => setListPage((p) => p - 1)}>Previous</button>
                <span>Page {pagedList.page} of {pagedList.totalPages} ({pagedList.total} items)</span>
                <button type="button" disabled={pagedList.page >= pagedList.totalPages} onClick={() => setListPage((p) => p + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {modal && (
        <ItemModal
          key={`${modal.type}-${modal.item?.id ?? 'new'}`}
          type={modal.type}
          item={modal.item}
          onClose={closeModal}
          onSave={saveModal}
        />
      )}
    </div>
  );
};

const ItemModal = ({ type, item, onClose, onSave }) => {
  const [form, setForm] = useState(() => item || { ...EMPTY_MODAL_FORM });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const set = (key, val) => {
    setTouched((prev) => ({ ...prev, [key]: true }));

    let nextForm = null;
    setForm((prev) => {
      nextForm = { ...prev, [key]: val };
      return nextForm;
    });

    if (nextForm) {
      const result = validateAboutListItem(type, nextForm);
      const error = result.fieldErrors?.[key] || null;
      setFieldErrors((prevErrors) => patchFieldError(prevErrors, key, error));
    }
  };

  const blur = (key) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    setForm((current) => {
      const result = validateAboutListItem(type, current);
      const error = result.fieldErrors?.[key] || null;
      setFieldErrors((prev) => patchFieldError(prev, key, error));
      return current;
    });
  };

  const handleSave = () => {
    const validation = validateAboutListItem(type, form);
    if (!validation.valid) {
      setFieldErrors(validation.fieldErrors || {});
      setTouched(Object.fromEntries(Object.keys(validation.fieldErrors || {}).map((k) => [k, true])));
      const firstKey = Object.keys(validation.fieldErrors || {})[0];
      if (firstKey) {
        requestAnimationFrame(() => {
          const el = document.querySelector(`[data-modal-field="${firstKey}"] input, [data-modal-field="${firstKey}"] textarea`);
          el?.focus();
        });
      }
      return;
    }
    onSave(form);
  };

  const modalInputClass = (key) => (fieldErrors[key] ? 'about-admin-input-invalid' : '');

  return (
    <div className="about-admin-modal-backdrop" onClick={onClose}>
      <div className="about-admin-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{item ? 'Edit' : 'Add'} {type}</h3>
        {type === 'timeline' && (
          <>
            <ModalField fieldKey="marker" label="Timeline Year/Date" required error={fieldErrors.marker}>
              <AboutTextControl
                value={form.marker}
                className={modalInputClass('marker')}
                maxLength={ABOUT_TEXT_LIMITS.sectionTitle}
                onChange={(value) => set('marker', value)}
                onBlur={() => blur('marker')}
              />
            </ModalField>
            <ModalField fieldKey="title" label="Timeline Title" required error={fieldErrors.title}>
              <AboutTextControl
                value={form.title}
                className={modalInputClass('title')}
                maxLength={ABOUT_TEXT_LIMITS.sectionTitle}
                onChange={(value) => set('title', value)}
                onBlur={() => blur('title')}
              />
            </ModalField>
            <ModalField fieldKey="description" label="Description" required error={fieldErrors.description}>
              <AboutTextControl
                multiline
                rows={3}
                value={form.description}
                className={modalInputClass('description')}
                maxLength={ABOUT_TEXT_LIMITS.sectionDescription}
                onChange={(value) => set('description', value)}
                onBlur={() => blur('description')}
              />
            </ModalField>
            <div className="about-admin-field">
              <AdminFieldLabel optional>Icon</AdminFieldLabel>
              <select value={form.icon} onChange={(e) => set('icon', e.target.value)}>
                {ICON_OPTIONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>
          </>
        )}
        {(type === 'mvp' || type === 'offers') && (
          <>
            <ModalField fieldKey="title" label="Title" required error={fieldErrors.title}>
              <AboutTextControl
                value={form.title}
                className={modalInputClass('title')}
                maxLength={type === 'mvp' ? ABOUT_TEXT_LIMITS.missionTitle : ABOUT_TEXT_LIMITS.sectionTitle}
                onChange={(value) => set('title', value)}
                onBlur={() => blur('title')}
              />
            </ModalField>
            <ModalField fieldKey="description" label="Description" required error={fieldErrors.description}>
              <AboutTextControl
                multiline
                rows={3}
                value={form.description}
                className={modalInputClass('description')}
                maxLength={type === 'mvp' ? ABOUT_TEXT_LIMITS.missionDescription : ABOUT_TEXT_LIMITS.sectionDescription}
                onChange={(value) => set('description', value)}
                onBlur={() => blur('description')}
              />
            </ModalField>
            {type === 'mvp' && (
              <div className="about-admin-field">
                <AdminFieldLabel optional>Icon</AdminFieldLabel>
                <select value={form.icon} onChange={(e) => set('icon', e.target.value)}>
                  {ICON_OPTIONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                </select>
              </div>
            )}
            {type === 'offers' && (
              <div data-modal-field="image">
                <ImageField
                  label="Offer Image"
                  value={form.image || ''}
                  onChange={(v) => {
                    setTouched((prev) => ({ ...prev, image: true }));
                    set('image', v);
                  }}
                  inputId="about-offer-modal-img"
                  required
                  error={fieldErrors.image}
                  onBlur={() => blur('image')}
                />
              </div>
            )}
          </>
        )}
        {type === 'stats' && (
          <>
            <ModalField fieldKey="label" label="Statistic Title" required error={fieldErrors.label}>
              <AboutTextControl
                value={form.label}
                className={modalInputClass('label')}
                maxLength={ABOUT_TEXT_LIMITS.sectionTitle}
                onChange={(value) => set('label', value)}
                onBlur={() => blur('label')}
              />
            </ModalField>
            <ModalField fieldKey="value" label="Number" required error={fieldErrors.value}>
              <input type="number" value={form.value} className={modalInputClass('value')} onChange={(e) => set('value', e.target.value)} onBlur={() => blur('value')} />
            </ModalField>
            <div className="about-admin-field">
              <AdminFieldLabel optional>Suffix</AdminFieldLabel>
              <input value={form.suffix} onChange={(e) => set('suffix', e.target.value)} placeholder="K+, +, %" />
            </div>
            <div className="about-admin-field">
              <AdminFieldLabel optional>Icon</AdminFieldLabel>
              <select value={form.icon || 'FiUsers'} onChange={(e) => set('icon', e.target.value)}>
                {ICON_OPTIONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>
          </>
        )}
        <div className="about-admin-modal-actions">
          <button type="button" className="about-admin-btn outline" onClick={onClose}>Cancel</button>
          <button type="button" className="about-admin-btn primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default AdminAboutUs;
