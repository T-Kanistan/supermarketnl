import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaSave, FaArrowLeft, FaPlus, FaTrash, FaFileContract, FaShieldAlt } from 'react-icons/fa';
import { useToast } from '../../../context/ToastContext';
import legalPagesService from '../../../services/legalPagesService';
import { mergeLegalPages, emptyLegalSection } from '../../../constants/legalPageDefaults';

const TABS = [
  { key: 'terms', label: 'Terms & Conditions', icon: FaFileContract },
  { key: 'privacy', label: 'Privacy Policy', icon: FaShieldAlt },
];

const AdminLegalPages = () => {
  const [formData, setFormData] = useState(() => mergeLegalPages(null));
  const [activeTab, setActiveTab] = useState('terms');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const loadPages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await legalPagesService.getLegalPages();
      setFormData(mergeLegalPages(data));
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

  const updatePageField = (pageKey, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [pageKey]: { ...prev[pageKey], [field]: value },
    }));
  };

  const updateSection = (pageKey, index, field, value) => {
    setFormData((prev) => {
      const sections = prev[pageKey].sections.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      );
      return { ...prev, [pageKey]: { ...prev[pageKey], sections } };
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
  };

  const removeSection = (pageKey, index) => {
    setFormData((prev) => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        sections: prev[pageKey].sections.filter((_, i) => i !== index),
      },
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updated = await legalPagesService.updateLegalPages(formData);
      setFormData(mergeLegalPages(updated));
      addToast('Legal pages updated successfully', 'success');
    } catch (err) {
      const message =
        err.validationErrors?.join('. ') || err.response?.data?.message || 'Failed to save legal pages';
      addToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Link to="/admin/dashboard/site-settings" className="view-back-link">
          <FaArrowLeft aria-hidden="true" /> Back
        </Link>
        <div className="admin-page-loading">Loading legal pages...</div>
      </div>
    );
  }

  const page = formData[activeTab];

  return (
    <div>
      <Link to="/admin/dashboard/site-settings" className="view-back-link">
        <FaArrowLeft aria-hidden="true" /> Back
      </Link>

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
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon aria-hidden="true" /> {tab.label}
            </button>
          );
        })}
      </div>

      <form id="legal-pages-form" onSubmit={handleSubmit} className="dashboard-panel" style={{ padding: '24px' }}>
        <div className="settings-subsection">
          <h4>Page Header</h4>
          <div className="admin-form-group row-split">
            <div>
              <label>Page Title</label>
              <input
                type="text"
                value={page.title}
                onChange={(e) => updatePageField(activeTab, 'title', e.target.value)}
                placeholder="Terms and Conditions"
                maxLength={120}
                required
              />
            </div>
            <div>
              <label>Last Updated</label>
              <input
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

          {page.sections.length === 0 ? (
            <p style={{ color: '#64748b', margin: '12px 0' }}>
              No sections yet. Click &ldquo;Add Section&rdquo; to create one.
            </p>
          ) : (
            page.sections.map((section, index) => (
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
                  <label>Heading</label>
                  <input
                    type="text"
                    value={section.heading}
                    onChange={(e) => updateSection(activeTab, index, 'heading', e.target.value)}
                    placeholder="e.g. 1. General"
                    maxLength={150}
                  />
                </div>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label>Body</label>
                  <textarea
                    value={section.body}
                    onChange={(e) => updateSection(activeTab, index, 'body', e.target.value)}
                    rows="4"
                    placeholder="Write the section content here..."
                    maxLength={5000}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </form>
    </div>
  );
};

export default AdminLegalPages;
