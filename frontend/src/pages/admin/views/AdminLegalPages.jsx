import { useState, useEffect, useCallback, useMemo } from 'react';
import { FaSave, FaPlus, FaTrash, FaFileContract, FaShieldAlt, FaSearch } from 'react-icons/fa';
import { useToast } from '../../../context/ToastContext';
import legalPagesService from '../../../services/legalPagesService';
import { mergeLegalPages, emptyLegalSection } from '../../../constants/legalPageDefaults';
import {
  LEGAL_PAGES_INCOMPLETE,
  LEGAL_PAGE_TITLE_LIMIT,
  LEGAL_SECTION_BODY_LIMIT,
  LEGAL_SECTION_HEADING_LIMIT,
  getPageTitleFieldId,
  getSectionFieldId,
  validateLegalPageTitle,
  validateLegalPagesForm,
  validateLegalSection,
  focusFirstLegalSectionError,
} from '../../../utils/legalPagesValidation';
import useAdminSearch from '../../../hooks/useAdminSearch';
import { filterByAdminSearch, ADMIN_NO_MATCH_MESSAGE } from '../../../utils/adminSearch';
import { boundAdminText, formatCharCounter } from '../../../utils/adminTextValidation';
import AdminFieldLabel from '../../../components/admin/AdminFieldLabel';

const TABS = [
  { key: 'terms', label: 'Terms & Conditions', icon: FaFileContract },
  { key: 'privacy', label: 'Privacy Policy', icon: FaShieldAlt },
];

const emptySectionErrors = () => ({ terms: [], privacy: [] });
const emptyPageErrors = () => ({ terms: {}, privacy: {} });

const AdminLegalPages = () => {
  const [formData, setFormData] = useState(() => mergeLegalPages(null));
  const [activeTab, setActiveTab] = useState('terms');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sectionErrors, setSectionErrors] = useState(emptySectionErrors);
  const [pageErrors, setPageErrors] = useState(emptyPageErrors);
  const [touchedSections, setTouchedSections] = useState(emptySectionErrors);
  const [pageTouched, setPageTouched] = useState(emptyPageErrors);
  const {
    searchInput,
    searchQuery,
    onSearchChange,
    clearSearch,
    applySearchNow,
    hasActiveSearch,
  } = useAdminSearch();
  const { addToast } = useToast();

  const loadPages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await legalPagesService.getLegalPages();
      setFormData(mergeLegalPages(data));
      setSectionErrors(emptySectionErrors());
      setPageErrors(emptyPageErrors());
      setTouchedSections(emptySectionErrors());
      setPageTouched(emptyPageErrors());
    } catch (err) {
      console.error('Failed to load legal pages', err);
      addToast('Failed to load legal pages', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    clearSearch();
  };
  const updatePageField = (pageKey, field, value) => {
    const nextValue =
      field === 'title' ? boundAdminText(value, LEGAL_PAGE_TITLE_LIMIT.max) : value;
    setFormData((prev) => ({
      ...prev,
      [pageKey]: { ...prev[pageKey], [field]: nextValue },
    }));
    if (field === 'title') {
      setPageTouched((prev) => ({
        ...prev,
        [pageKey]: { ...(prev[pageKey] || {}), title: true },
      }));
      setPageErrors((prev) => ({
        ...prev,
        [pageKey]: {
          ...(prev[pageKey] || {}),
          title: validateLegalPageTitle(nextValue),
        },
      }));
    }
  };

  const updateSection = (pageKey, index, field, value) => {
    const maxLength =
      field === 'heading'
        ? LEGAL_SECTION_HEADING_LIMIT.max
        : field === 'body'
          ? LEGAL_SECTION_BODY_LIMIT.max
          : null;
    const nextValue = maxLength ? boundAdminText(value, maxLength) : value;

    setFormData((prev) => {
      const sections = prev[pageKey].sections.map((s, i) =>
        i === index ? { ...s, [field]: nextValue } : s
      );
      return { ...prev, [pageKey]: { ...prev[pageKey], sections } };
    });

    setTouchedSections((prevTouched) => {
      const pageTouched = [...(prevTouched[pageKey] || [])];
      pageTouched[index] = {
        ...(pageTouched[index] || {}),
        [field]: true,
      };
      return { ...prevTouched, [pageKey]: pageTouched };
    });

    setSectionErrors((prevErrors) => {
      const pageSections = formData[pageKey].sections.map((s, i) =>
        i === index ? { ...s, [field]: nextValue } : s
      );
      const pageErrors = [...(prevErrors[pageKey] || [])];
      pageErrors[index] = validateLegalSection(pageSections[index]);
      return { ...prevErrors, [pageKey]: pageErrors };
    });
  };

  const markPageTitleTouched = (pageKey) => {
    setPageTouched((prev) => ({
      ...prev,
      [pageKey]: { ...(prev[pageKey] || {}), title: true },
    }));
    setPageErrors((prev) => ({
      ...prev,
      [pageKey]: {
        ...(prev[pageKey] || {}),
        title: validateLegalPageTitle(formData[pageKey]?.title),
      },
    }));
  };

  const markSectionFieldTouched = (pageKey, index, field) => {
    setTouchedSections((prev) => {
      const pageTouched = [...(prev[pageKey] || [])];
      pageTouched[index] = {
        ...(pageTouched[index] || {}),
        [field]: true,
      };
      return { ...prev, [pageKey]: pageTouched };
    });

    setSectionErrors((prev) => {
      const pageErrors = [...(prev[pageKey] || [])];
      pageErrors[index] = validateLegalSection(formData[pageKey].sections[index]);
      return { ...prev, [pageKey]: pageErrors };
    });
  };

  const addSection = (pageKey) => {
    setFormData((prev) => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        sections: [...prev[pageKey].sections, emptyLegalSection()],
      },
    }));
    setSectionErrors((prev) => ({
      ...prev,
      [pageKey]: [...(prev[pageKey] || []), {}],
    }));
    setTouchedSections((prev) => ({
      ...prev,
      [pageKey]: [...(prev[pageKey] || []), {}],
    }));
  };

  const removeSection = (pageKey, index) => {
    setFormData((prev) => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        sections: prev[pageKey].sections.filter((_, i) => i !== index),
      },
    }));
    setSectionErrors((prev) => ({
      ...prev,
      [pageKey]: (prev[pageKey] || []).filter((_, i) => i !== index),
    }));
    setTouchedSections((prev) => ({
      ...prev,
      [pageKey]: (prev[pageKey] || []).filter((_, i) => i !== index),
    }));
  };

  const moveSection = (pageKey, index, direction) => {
    setFormData((prev) => {
      const sections = [...prev[pageKey].sections];
      const target = index + direction;
      if (target < 0 || target >= sections.length) return prev;
      [sections[index], sections[target]] = [sections[target], sections[index]];
      return { ...prev, [pageKey]: { ...prev[pageKey], sections } };
    });
    setSectionErrors((prev) => {
      const pageErrors = [...(prev[pageKey] || [])];
      const target = index + direction;
      if (target < 0 || target >= pageErrors.length) return prev;
      [pageErrors[index], pageErrors[target]] = [pageErrors[target], pageErrors[index]];
      return { ...prev, [pageKey]: pageErrors };
    });
    setTouchedSections((prev) => {
      const pageTouched = [...(prev[pageKey] || [])];
      const target = index + direction;
      if (target < 0 || target >= pageTouched.length) return prev;
      [pageTouched[index], pageTouched[target]] = [pageTouched[target], pageTouched[index]];
      return { ...prev, [pageKey]: pageTouched };
    });
  };

  const validateBeforeSave = () => {
    const validation = validateLegalPagesForm(formData);
    if (validation.isValid) {
      setSectionErrors(emptySectionErrors());
      setPageErrors(emptyPageErrors());
      return true;
    }

    setSectionErrors(validation.sectionErrors);
    setPageErrors(validation.pageErrors);
    setTouchedSections({
      terms: (validation.sectionErrors.terms || []).map((errors) => ({
        heading: Boolean(errors.heading),
        body: Boolean(errors.body),
      })),
      privacy: (validation.sectionErrors.privacy || []).map((errors) => ({
        heading: Boolean(errors.heading),
        body: Boolean(errors.body),
      })),
    });
    setPageTouched({
      terms: { title: Boolean(validation.pageErrors.terms?.title) },
      privacy: { title: Boolean(validation.pageErrors.privacy?.title) },
    });

    const firstError = focusFirstLegalSectionError(validation.sectionErrors, validation.pageErrors);
    if (firstError && firstError.pageKey !== activeTab) {
      clearSearch();
      setActiveTab(firstError.pageKey);
      window.setTimeout(
        () => focusFirstLegalSectionError(validation.sectionErrors, validation.pageErrors),
        0
      );
    }

    addToast(LEGAL_PAGES_INCOMPLETE, 'error');
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateBeforeSave()) return;

    setIsSubmitting(true);
    try {
      const updated = await legalPagesService.updateLegalPages(formData);
      setFormData(mergeLegalPages(updated));
      setSectionErrors(emptySectionErrors());
      setPageErrors(emptyPageErrors());
      setTouchedSections(emptySectionErrors());
      setPageTouched(emptyPageErrors());
      addToast('Legal pages updated successfully', 'success');
    } catch (err) {
      const message =
        err.validationErrors?.join('. ') || err.response?.data?.message || 'Failed to save legal pages';
      addToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const page = formData[activeTab];
  const activeSectionErrors = sectionErrors[activeTab] || [];
  const activePageErrors = pageErrors[activeTab] || {};
  const activeSectionTouched = touchedSections[activeTab] || [];
  const activePageTouched = pageTouched[activeTab] || {};
  const titleInvalid = Boolean(activePageTouched.title && activePageErrors.title);
  const titleFieldId = getPageTitleFieldId(activeTab);

  const visibleSections = useMemo(() => {
    const sections = formData[activeTab]?.sections || [];
    const filtered = filterByAdminSearch(sections, searchQuery, (section) => [
      section.heading,
      section.body,
    ]);
    const filteredSet = new Set(filtered);
    return sections
      .map((section, index) => ({ section, index }))
      .filter(({ section }) => filteredSet.has(section));
  }, [formData, activeTab, searchQuery]);

  if (loading) {
    return (
      <div>
        <div className="admin-page-loading">Loading legal pages...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="view-header">
        <div className="view-title-wrap">
          <h2>Legal Pages</h2>
          <p>Manage the Terms &amp; Conditions and Privacy Policy content shown to customers.</p>
        </div>
        <button
          type="submit"
          form="legal-pages-form"
          className="action-btn-primary"
          disabled={isSubmitting}
        >
          <FaSave /> {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="legal-tabs" role="tablist">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`legal-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.key)}
            >
              <Icon aria-hidden="true" /> {tab.label}
            </button>
          );
        })}
      </div>

      <form id="legal-pages-form" onSubmit={handleSubmit} className="dashboard-panel" style={{ padding: '24px' }} noValidate>
        <div className="settings-subsection">
          <h4>Page Header</h4>
          <div className="admin-form-group row-split">
            <div>
              <AdminFieldLabel htmlFor={titleFieldId} optional>
                Page Title
              </AdminFieldLabel>
              <input
                id={titleFieldId}
                type="text"
                value={page.title}
                onChange={(e) => updatePageField(activeTab, 'title', e.target.value)}
                onBlur={() => markPageTitleTouched(activeTab)}
                placeholder="Terms and Conditions"
                maxLength={LEGAL_PAGE_TITLE_LIMIT.max}
                className={titleInvalid ? 'admin-input-invalid' : ''}
                aria-invalid={titleInvalid}
                required
              />
              <div className="admin-field-meta">
                {titleInvalid ? (
                  <p className="admin-field-error" role="alert">{activePageErrors.title}</p>
                ) : (
                  <span />
                )}
                <span className="admin-char-counter">
                  {formatCharCounter(page.title, LEGAL_PAGE_TITLE_LIMIT.max)}
                </span>
              </div>
            </div>
            <div>
              <AdminFieldLabel htmlFor={`${activeTab}-last-updated`} optional>
                Last Updated
              </AdminFieldLabel>
              <input
                id={`${activeTab}-last-updated`}
                type="text"
                value={page.lastUpdated}
                onChange={(e) => updatePageField(activeTab, 'lastUpdated', e.target.value)}
                placeholder="June 2026"
                maxLength={60}
              />
            </div>
          </div>
        </div>

        <div className="settings-subsection" style={{ marginBottom: 0 }}>
          <div className="dashboard-panel-header" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <h4 style={{ margin: 0 }}>Content Sections</h4>
            <button type="button" className="action-btn-secondary" onClick={() => addSection(activeTab)}>
              <FaPlus /> Add Section
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, margin: '12px 0 16px', maxWidth: 420 }}>
            <input
              type="text"
              value={searchInput}
              onChange={onSearchChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applySearchNow(e);
                }
              }}
              placeholder="Search sections by heading or body..."
              style={{ flex: 1 }}
            />
            <button type="button" className="action-btn-secondary" onClick={applySearchNow}>
              <FaSearch /> Search
            </button>
          </div>

          {page.sections.length === 0 ? (
            <p style={{ color: '#64748b', margin: '12px 0' }}>
              No sections yet. Click &ldquo;Add Section&rdquo; to create one.
            </p>
          ) : visibleSections.length === 0 ? (
            <p style={{ color: '#64748b', margin: '12px 0' }}>
              {hasActiveSearch ? ADMIN_NO_MATCH_MESSAGE : 'No sections yet. Click &ldquo;Add Section&rdquo; to create one.'}
            </p>
          ) : (
            visibleSections.map(({ section, index }) => {
              const errors = activeSectionErrors[index] || {};
              const touched = activeSectionTouched[index] || {};
              const headingInvalid = Boolean(touched.heading && errors.heading);
              const bodyInvalid = Boolean(touched.body && errors.body);
              const headingId = getSectionFieldId(activeTab, index, 'heading');
              const bodyId = getSectionFieldId(activeTab, index, 'body');

              return (
                <div key={`${activeTab}-${index}`} className="legal-section-card">
                  <div className="legal-section-card-top">
                    <span className="legal-section-index">Section {index + 1}</span>
                    <div className="legal-section-actions">
                      <button
                        type="button"
                        className="legal-icon-btn"
                        title="Move up"
                        onClick={() => moveSection(activeTab, index, -1)}
                        disabled={index === 0}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="legal-icon-btn"
                        title="Move down"
                        onClick={() => moveSection(activeTab, index, 1)}
                        disabled={index === page.sections.length - 1}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="legal-icon-btn legal-icon-btn--danger"
                        title="Remove section"
                        onClick={() => removeSection(activeTab, index)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="admin-form-group">
                    <AdminFieldLabel htmlFor={headingId} required>
                      Heading
                    </AdminFieldLabel>
                    <input
                      id={headingId}
                      type="text"
                      value={section.heading}
                      onChange={(e) => updateSection(activeTab, index, 'heading', e.target.value)}
                      onBlur={() => markSectionFieldTouched(activeTab, index, 'heading')}
                      placeholder="e.g. 1. General"
                      maxLength={LEGAL_SECTION_HEADING_LIMIT.max}
                      className={headingInvalid ? 'admin-input-invalid' : ''}
                      aria-invalid={headingInvalid}
                      aria-describedby={headingInvalid ? `${headingId}-error` : undefined}
                    />
                    <div className="admin-field-meta">
                      {headingInvalid ? (
                        <p id={`${headingId}-error`} className="admin-field-error" role="alert">
                          {errors.heading}
                        </p>
                      ) : (
                        <span />
                      )}
                      <span className="admin-char-counter">
                        {formatCharCounter(section.heading, LEGAL_SECTION_HEADING_LIMIT.max)}
                      </span>
                    </div>
                  </div>
                  <div className="admin-form-group" style={{ marginBottom: 0 }}>
                    <AdminFieldLabel htmlFor={bodyId} required>
                      Body
                    </AdminFieldLabel>
                    <textarea
                      id={bodyId}
                      value={section.body}
                      onChange={(e) => updateSection(activeTab, index, 'body', e.target.value)}
                      onBlur={() => markSectionFieldTouched(activeTab, index, 'body')}
                      rows="4"
                      placeholder="Write the section content here..."
                      maxLength={LEGAL_SECTION_BODY_LIMIT.max}
                      className={bodyInvalid ? 'admin-input-invalid' : ''}
                      aria-invalid={bodyInvalid}
                      aria-describedby={bodyInvalid ? `${bodyId}-error` : undefined}
                    />
                    <div className="admin-field-meta">
                      {bodyInvalid ? (
                        <p id={`${bodyId}-error`} className="admin-field-error" role="alert">
                          {errors.body}
                        </p>
                      ) : (
                        <span />
                      )}
                      <span className="admin-char-counter">
                        {formatCharCounter(section.body, LEGAL_SECTION_BODY_LIMIT.max)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </form>
    </div>
  );
};

export default AdminLegalPages;
