import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaPlus, FaEdit, FaTrash, FaSave, FaExternalLinkAlt, FaSearch, FaGripVertical,
} from 'react-icons/fa';
import aboutUsService from '../../../services/aboutUsService';
import { getImageUrl } from '../../../services/api';
import { emptyAboutPageForm, mergeAboutPage } from '../../../constants/aboutPageDefaults';
import { useToast } from '../../../context/ToastContext';
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

const ImageField = ({ label, value, onChange, inputId }) => {
  const preview = value?.startsWith('data:') ? value : getImageUrl(value);
  return (
    <div className="about-admin-field">
      <label htmlFor={inputId}>{label}</label>
      {preview && (
        <div className="about-admin-image-preview">
          <img src={preview} alt={label} />
        </div>
      )}
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => onChange(reader.result);
          reader.readAsDataURL(file);
        }}
      />
    </div>
  );
};

const StatusToggle = ({ checked, onChange, label = 'Active' }) => (
  <label className="about-admin-toggle">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span>{label}</span>
  </label>
);

const paginate = (items, page, search, getText) => {
  const q = search.trim().toLowerCase();
  const filtered = q
    ? items.filter((item) => getText(item).toLowerCase().includes(q))
    : items;
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

export const AdminAboutUs = () => {
  const { addToast } = useToast();
  const [activeSection, setActiveSection] = useState('intro');
  const [aboutPage, setAboutPage] = useState(() => emptyAboutPageForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [listPage, setListPage] = useState(1);
  const [dragIndex, setDragIndex] = useState(null);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await aboutUsService.getAboutUsAdmin();
      setAboutPage(mergeAboutPage(data?.aboutPage));
    } catch {
      addToast('Failed to load About Us content', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setListPage(1); setSearch(''); }, [activeSection]);

  const updateField = (path, value) => {
    setAboutPage((prev) => {
      const next = structuredClone(prev);
      const keys = path.split('.');
      let ref = next;
      for (let i = 0; i < keys.length - 1; i += 1) ref = ref[keys[i]];
      ref[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const updateList = (key, updater) => {
    setAboutPage((prev) => ({
      ...prev,
      [key]: updater(prev[key] || []),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await aboutUsService.updateAboutUs(aboutPage);
      setAboutPage(mergeAboutPage(data?.aboutPage));
      addToast('About Us page saved successfully', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to save About Us content', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openModal = (type, item = null, index = -1) => setModal({ type, item, index });
  const closeModal = () => setModal(null);

  const saveModal = (form) => {
    const { type, item, index } = modal;
    const keyMap = {
      timeline: 'storyTimeline',
      mvp: 'mvpCards',
      offers: 'offerings',
      stats: 'stats',
    };
    const key = keyMap[type];
    if (!key) return;
    updateList(key, (list) => {
      const next = [...list];
      if (index >= 0) next[index] = { ...next[index], ...form };
      else next.push({ ...form, displayOrder: next.length + 1, isActive: true });
      return next;
    });
    closeModal();
  };

  const deleteItem = (key, index) => {
    updateList(key, (list) => {
      const next = [...list];
      const item = next[index];
      if (item?.id) next[index] = { ...item, isDeleted: true, isActive: false };
      else next.splice(index, 1);
      return next;
    });
  };

  const handleDrag = (key, from, to) => {
    if (from === null || from === to) return;
    updateList(key, (list) => {
      const next = [...list];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next.map((item, i) => ({ ...item, displayOrder: i + 1 }));
    });
    setDragIndex(null);
  };

  const listConfig = useMemo(() => {
    if (activeSection === 'story') {
      return {
        key: 'storyTimeline',
        items: (aboutPage.storyTimeline || []).filter((i) => !i.isDeleted),
        getText: (i) => `${i.marker} ${i.title}`,
        modalType: 'timeline',
        empty: 'No timeline items yet.',
      };
    }
    if (activeSection === 'mvp') {
      return {
        key: 'mvpCards',
        items: (aboutPage.mvpCards || []).filter((i) => !i.isDeleted),
        getText: (i) => i.title,
        modalType: 'mvp',
        empty: 'No cards yet.',
      };
    }
    if (activeSection === 'offers') {
      return {
        key: 'offerings',
        items: (aboutPage.offerings || []).filter((i) => !i.isDeleted),
        getText: (i) => i.title,
        modalType: 'offers',
        empty: 'No offers yet.',
      };
    }
    if (activeSection === 'stats') {
      return {
        key: 'stats',
        items: (aboutPage.stats || []).filter((i) => !i.isDeleted),
        getText: (i) => i.label,
        modalType: 'stats',
        empty: 'No statistics yet.',
      };
    }
    return null;
  }, [activeSection, aboutPage]);

  const pagedList = listConfig
    ? paginate(listConfig.items, listPage, search, listConfig.getText)
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
          <a href="/about" target="_blank" rel="noreferrer" className="about-admin-btn outline">
            <FaExternalLinkAlt /> Preview Page
          </a>
          <button type="button" className="about-admin-btn primary" onClick={handleSave} disabled={saving}>
            <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

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
            <div className="about-admin-field">
              <label>About Badge Text</label>
              <input value={aboutPage.heroEyebrow} onChange={(e) => updateField('heroEyebrow', e.target.value)} />
            </div>
            <div className="about-admin-field">
              <label>Main Heading</label>
              <input value={aboutPage.heroHeading} onChange={(e) => updateField('heroHeading', e.target.value)} />
            </div>
            <div className="about-admin-field">
              <label>Highlight Heading Text</label>
              <input value={aboutPage.heroHighlight} onChange={(e) => updateField('heroHighlight', e.target.value)} />
            </div>
            {[0, 1, 2, 3].map((i) => (
              <div className="about-admin-field full" key={`para-${i}`}>
                <label>{`Description Paragraph ${i + 1}`}</label>
                <textarea
                  rows={3}
                  value={aboutPage.heroParagraphs?.[i] || ''}
                  onChange={(e) => {
                    const paragraphs = [...(aboutPage.heroParagraphs || [])];
                    paragraphs[i] = e.target.value;
                    updateField('heroParagraphs', paragraphs);
                  }}
                />
              </div>
            ))}
            <div className="about-admin-field">
              <label>Button 1 Text</label>
              <input value={aboutPage.button1Text} onChange={(e) => updateField('button1Text', e.target.value)} />
            </div>
            <div className="about-admin-field">
              <label>Button 1 URL</label>
              <input value={aboutPage.button1Url} onChange={(e) => updateField('button1Url', e.target.value)} />
            </div>
            <div className="about-admin-field">
              <label>Button 2 Text</label>
              <input value={aboutPage.button2Text} onChange={(e) => updateField('button2Text', e.target.value)} />
            </div>
            <div className="about-admin-field">
              <label>Button 2 URL</label>
              <input value={aboutPage.button2Url} onChange={(e) => updateField('button2Url', e.target.value)} />
            </div>
            <div className="about-admin-field">
              <label>Serving Since Badge Text</label>
              <input value={aboutPage.heroBadge} onChange={(e) => updateField('heroBadge', e.target.value)} />
            </div>
            <div className="about-admin-field">
              <label>Display Order</label>
              <input type="number" min={1} value={aboutPage.heroDisplayOrder} onChange={(e) => updateField('heroDisplayOrder', Number(e.target.value))} />
            </div>
            <StatusToggle checked={aboutPage.heroIsActive !== false} onChange={(v) => updateField('heroIsActive', v)} />
            <div className="about-admin-field full">
              <ImageField label="About Main Image" value={aboutPage.heroImage} onChange={(v) => updateField('heroImage', v)} inputId="about-hero-img" />
            </div>
          </div>
        )}

        {activeSection === 'story' && (
          <>
            <div className="about-admin-grid">
              <div className="about-admin-field">
                <label>Story Section Title</label>
                <input value={aboutPage.storyTitle} onChange={(e) => updateField('storyTitle', e.target.value)} />
              </div>
              <div className="about-admin-field full">
                <label>Story Description</label>
                <textarea rows={3} value={aboutPage.storyDescription} onChange={(e) => updateField('storyDescription', e.target.value)} />
              </div>
              <div className="about-admin-field full">
                <ImageField label="Our Story Image" value={aboutPage.storyImage} onChange={(v) => updateField('storyImage', v)} inputId="about-story-img" />
              </div>
            </div>
          </>
        )}

        {activeSection === 'owner' && (
          <div className="about-admin-grid">
            <div className="about-admin-field">
              <label>Owner Name</label>
              <input value={aboutPage.owner?.name || ''} onChange={(e) => updateField('owner.name', e.target.value)} />
            </div>
            <div className="about-admin-field">
              <label>Designation</label>
              <input value={aboutPage.owner?.designation || ''} onChange={(e) => updateField('owner.designation', e.target.value)} />
            </div>
            <div className="about-admin-field full">
              <label>Quote</label>
              <textarea rows={3} value={aboutPage.owner?.quote || ''} onChange={(e) => updateField('owner.quote', e.target.value)} />
            </div>
            <div className="about-admin-field">
              <label>Phone Number</label>
              <input value={aboutPage.owner?.phone || ''} onChange={(e) => updateField('owner.phone', e.target.value)} />
            </div>
            <div className="about-admin-field">
              <label>Address</label>
              <input value={aboutPage.owner?.location || ''} onChange={(e) => updateField('owner.location', e.target.value)} />
            </div>
            <div className="about-admin-field">
              <label>Since Year</label>
              <input value={aboutPage.owner?.sinceYear || ''} onChange={(e) => updateField('owner.sinceYear', e.target.value)} />
            </div>
            <div className="about-admin-field">
              <label>Experience Text</label>
              <input value={aboutPage.owner?.yearsServing || ''} onChange={(e) => updateField('owner.yearsServing', e.target.value)} />
            </div>
            <div className="about-admin-field">
              <label>Badge Text</label>
              <input value={aboutPage.owner?.badge || ''} onChange={(e) => updateField('owner.badge', e.target.value)} />
            </div>
            <StatusToggle checked={aboutPage.owner?.isActive !== false} onChange={(v) => updateField('owner.isActive', v)} />
            <div className="about-admin-field full">
              <ImageField label="Profile Photo" value={aboutPage.owner?.photo} onChange={(v) => updateField('owner.photo', v)} inputId="about-owner-img" />
            </div>
          </div>
        )}

        {listConfig && (
          <>
            <div className="about-admin-list-toolbar">
              <div className="about-admin-search">
                <FaSearch />
                <input placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setListPage(1); }} />
              </div>
              <button type="button" className="about-admin-btn primary" onClick={() => openModal(listConfig.modalType)}>
                <FaPlus /> Add
              </button>
            </div>

            {pagedList.items.length === 0 ? (
              <p className="about-admin-empty">{listConfig.empty}</p>
            ) : (
              <div className="about-admin-list">
                {pagedList.items.map((item, idx) => {
                  const globalIndex = listConfig.items.indexOf(item);
                  return (
                    <div
                      key={item.id || `${item.title}-${idx}`}
                      className="about-admin-list-item"
                      draggable
                      onDragStart={() => setDragIndex(globalIndex)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrag(listConfig.key, dragIndex, globalIndex)}
                    >
                      <FaGripVertical className="about-admin-drag" />
                      <div className="about-admin-list-body">
                        <strong>{listConfig.getText(item)}</strong>
                        {item.description && <p>{item.description}</p>}
                        {activeSection === 'stats' && (
                          <span className="about-admin-meta">{item.value}{item.suffix} — {item.icon}</span>
                        )}
                      </div>
                      <StatusToggle
                        checked={item.isActive !== false}
                        onChange={(v) => updateList(listConfig.key, (list) => {
                          const next = [...list];
                          const i = next.findIndex((x) => x === item || x.id === item.id);
                          if (i >= 0) next[i] = { ...next[i], isActive: v };
                          return next;
                        })}
                      />
                      <button type="button" className="icon-btn" onClick={() => openModal(listConfig.modalType, item, globalIndex)}><FaEdit /></button>
                      <button type="button" className="icon-btn danger" onClick={() => deleteItem(listConfig.key, globalIndex)}><FaTrash /></button>
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
  const [form, setForm] = useState(() => item || {
    marker: '', title: '', description: '', icon: 'FiCalendar', value: 0, suffix: '', label: '', image: '', isActive: true,
  });

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="about-admin-modal-backdrop" onClick={onClose}>
      <div className="about-admin-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{item ? 'Edit' : 'Add'} {type}</h3>
        {type === 'timeline' && (
          <>
            <label>Timeline Year/Date<input value={form.marker} onChange={(e) => set('marker', e.target.value)} /></label>
            <label>Timeline Title<input value={form.title} onChange={(e) => set('title', e.target.value)} /></label>
            <label>Description<textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} /></label>
            <label>Icon
              <select value={form.icon} onChange={(e) => set('icon', e.target.value)}>
                {ICON_OPTIONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </label>
          </>
        )}
        {(type === 'mvp' || type === 'offers') && (
          <>
            <label>Title<input value={form.title} onChange={(e) => set('title', e.target.value)} /></label>
            <label>Description<textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} /></label>
            {type === 'mvp' && (
              <label>Icon
                <select value={form.icon} onChange={(e) => set('icon', e.target.value)}>
                  {ICON_OPTIONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                </select>
              </label>
            )}
            {type === 'offers' && (
              <label>Image URL<input value={form.image || ''} onChange={(e) => set('image', e.target.value)} /></label>
            )}
          </>
        )}
        {type === 'stats' && (
          <>
            <label>Statistic Title<input value={form.label} onChange={(e) => set('label', e.target.value)} /></label>
            <label>Number<input type="number" value={form.value} onChange={(e) => set('value', Number(e.target.value))} /></label>
            <label>Suffix<input value={form.suffix} onChange={(e) => set('suffix', e.target.value)} placeholder="K+, +, %" /></label>
            <label>Icon
              <select value={form.icon || 'FiUsers'} onChange={(e) => set('icon', e.target.value)}>
                {ICON_OPTIONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </label>
          </>
        )}
        <div className="about-admin-modal-actions">
          <button type="button" className="about-admin-btn outline" onClick={onClose}>Cancel</button>
          <button type="button" className="about-admin-btn primary" onClick={() => onSave(form)}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default AdminAboutUs;
