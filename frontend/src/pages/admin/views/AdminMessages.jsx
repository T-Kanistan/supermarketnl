import { useState, useEffect, useCallback } from 'react';
import { FaTrash, FaEnvelopeOpenText, FaEye, FaWhatsapp } from 'react-icons/fa';
import enquiryService from '../../../services/enquiryService';
import { useToast } from '../../../context/ToastContext';
import { ENQUIRY_STATUSES, getStatusClassName, getStatusBadgeLabel } from '../../../constants/enquiryMessages';
import { invalidateDashboardStats } from '../../../utils/dashboardStatsRefresh';
import useAdminSearch from '../../../hooks/useAdminSearch';
import { ADMIN_NO_MATCH_MESSAGE } from '../../../utils/adminSearch';

const STATUS_FILTERS = [
  { value: 'all', label: 'All Enquiries' },
  { value: 'New', label: 'New' },
  { value: 'Read', label: 'Read' },
  { value: 'Replied', label: 'Replied' },
  { value: 'Closed', label: 'Closed' },
];

const TYPE_FILTERS = [
  { value: 'all', label: 'All Types' },
  { value: 'contact-us', label: 'Contact Us' },
  { value: 'product-enquiry', label: 'Product Enquiry' },
  { value: 'food-corner-enquiry', label: 'Food Corner' },
];

const TYPE_LABELS = {
  'contact-us': 'Contact Us',
  'product-enquiry': 'Product',
  'food-corner-enquiry': 'Food Corner',
};

const SOURCE_LABELS = {
  website: 'Website',
  whatsapp: 'WhatsApp',
};

const truncateText = (text, maxLength = 80) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

const normalizeStatus = (status) => {
  if (!status) return 'New';
  const value = String(status);
  if (ENQUIRY_STATUSES.includes(value)) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

export const AdminMessages = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [stats, setStats] = useState({
    newEnquiries: 0,
    readEnquiries: 0,
    repliedEnquiries: 0,
    closedEnquiries: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const { searchInput, searchQuery, onSearchChange, hasActiveSearch } = useAdminSearch();
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [viewStatus, setViewStatus] = useState('New');
  const [statusSaving, setStatusSaving] = useState(false);

  const { addToast } = useToast();

  const fetchStats = useCallback(async () => {
    try {
      const data = await enquiryService.getStats();
      setStats({
        newEnquiries: data.newEnquiries || 0,
        readEnquiries: data.readEnquiries || 0,
        repliedEnquiries: data.repliedEnquiries || 0,
        closedEnquiries: data.closedEnquiries || 0,
      });
    } catch (err) {
      console.error('Failed to load enquiry stats', err);
    }
  }, []);

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.enquiryType = typeFilter;
      if (searchQuery) params.search = searchQuery;

      const { data } = await enquiryService.getEnquiries(params);
      const items = Array.isArray(data) ? data : [];
      setEnquiries(
        [...items].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
      );
    } catch (err) {
      console.error('Failed to load enquiries', err);
      addToast('Failed to load enquiries', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, statusFilter, typeFilter, searchQuery]);

  useEffect(() => {
    fetchEnquiries();
    fetchStats();
  }, [fetchEnquiries, fetchStats]);

  const updateEnquiryInList = (updated) => {
    setEnquiries((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    if (selectedEnquiry?.id === updated.id) {
      setSelectedEnquiry(updated);
      setViewStatus(normalizeStatus(updated.status));
    }
  };

  const persistStatusChange = async (enquiry, nextStatus, { closeOnSuccess = false } = {}) => {
    const currentStatus = normalizeStatus(enquiry.status);
    if (currentStatus === nextStatus) {
      if (closeOnSuccess) setSelectedEnquiry(null);
      return enquiry;
    }

    setStatusSaving(true);
    try {
      const updated = await enquiryService.updateStatus(enquiry.id, nextStatus);
      updateEnquiryInList(updated);
      await Promise.all([fetchStats(), fetchEnquiries()]);
      invalidateDashboardStats();
      addToast(`Status updated to ${nextStatus}`, 'success');
      if (closeOnSuccess) setSelectedEnquiry(null);
      return updated;
    } catch (err) {
      console.error('Failed to update enquiry status', err);
      addToast(err.response?.data?.message || 'Failed to update status', 'error');
      throw err;
    } finally {
      setStatusSaving(false);
    }
  };

  const handleView = async (enquiry) => {
    const currentStatus = normalizeStatus(enquiry.status);
    setSelectedEnquiry(enquiry);
    setViewStatus(currentStatus);

    if (currentStatus === 'New') {
      try {
        const updated = await persistStatusChange(enquiry, 'Read');
        setViewStatus(normalizeStatus(updated.status));
      } catch {
        setViewStatus(currentStatus);
      }
    }
  };

  const handleSaveStatus = async () => {
    if (!selectedEnquiry) return;
    try {
      await persistStatusChange(selectedEnquiry, viewStatus, { closeOnSuccess: true });
    } catch {
      // Toast already shown in persistStatusChange
    }
  };

  const closeViewModal = () => {
    if (statusSaving) return;
    setSelectedEnquiry(null);
  };

  const handleWhatsApp = (enquiry) => {
    if (!enquiry.whatsappLink) {
      addToast('No phone number available for WhatsApp', 'error');
      return;
    }
    window.open(enquiry.whatsappLink, '_blank', 'noopener,noreferrer');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this enquiry?')) return;
    try {
      await enquiryService.deleteEnquiry(id);
      addToast('Enquiry deleted', 'success');
      if (selectedEnquiry?.id === id) setSelectedEnquiry(null);
      fetchEnquiries();
      fetchStats();
      invalidateDashboardStats();
    } catch (err) {
      console.error('Failed to delete enquiry', err);
      addToast(err.response?.data?.message || 'Failed to delete enquiry', 'error');
    }
  };

  const selectedStatus = selectedEnquiry ? normalizeStatus(selectedEnquiry.status) : 'New';
  const statusChangedInView = selectedEnquiry && viewStatus !== selectedStatus;

  return (
    <div>
      <div className="view-header">
        <div className="view-title-wrap">
          <h2>Customer Enquiries</h2>
          <p>Manage contact, product, and food corner enquiries from the storefront.</p>
        </div>
        <div className="view-header-filters">
          <input
            type="search"
            className="admin-filter-select"
            placeholder="Search enquiries..."
            value={searchInput}
            onChange={onSearchChange}
          />
          <select
            className="admin-filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by type"
          >
            {TYPE_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            className="admin-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            {STATUS_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="enquiry-stats-grid">
        <div className="enquiry-stat-card enquiry-stat-new">
          <span className="enquiry-stat-label">New Enquiries</span>
          <strong>{stats.newEnquiries}</strong>
        </div>
        <div className="enquiry-stat-card enquiry-stat-read">
          <span className="enquiry-stat-label">Read Enquiries</span>
          <strong>{stats.readEnquiries}</strong>
        </div>
        <div className="enquiry-stat-card enquiry-stat-replied">
          <span className="enquiry-stat-label">Replied Enquiries</span>
          <strong>{stats.repliedEnquiries}</strong>
        </div>
        <div className="enquiry-stat-card enquiry-stat-closed">
          <span className="enquiry-stat-label">Closed Enquiries</span>
          <strong>{stats.closedEnquiries}</strong>
        </div>
      </div>

      {loading ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', animation: 'pulse 1.5s infinite ease-in-out' }}>
          <div style={{ height: '30px', width: '200px', background: '#cbd5e1', marginBottom: '20px' }} />
          <div style={{ height: '150px', background: '#cbd5e1' }} />
        </div>
      ) : enquiries.length > 0 ? (
        <div className="table-responsive-wrapper">
          <table className="admin-table admin-messages-table">
            <thead>
              <tr>
                <th>Sender Name</th>
                <th>Contact Info</th>
                <th>Type</th>
                <th>Source</th>
                <th>Subject</th>
                <th>Message</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((enquiry) => {
                const currentStatus = normalizeStatus(enquiry.status);
                const isUnread = currentStatus === 'New';

                return (
                  <tr key={enquiry.id} className={isUnread ? 'message-row-unread' : ''}>
                    <td data-label="Sender Name" style={{ fontWeight: 600 }}>{enquiry.senderName || enquiry.name}</td>
                    <td data-label="Contact Info">
                      <div className="admin-table-ellipsis" title={enquiry.email || ''}>{enquiry.email}</div>
                      {enquiry.phone && <div className="admin-table-ellipsis" title={enquiry.phone}>{enquiry.phone}</div>}
                    </td>
                    <td data-label="Type">
                      <span className="status-badge-admin scheduled">
                        {TYPE_LABELS[enquiry.enquiryType] || enquiry.enquiryType}
                      </span>
                    </td>
                    <td data-label="Source">
                      <span className={`status-badge-admin ${enquiry.source === 'whatsapp' ? 'active' : 'scheduled'}`}>
                        {SOURCE_LABELS[enquiry.source] || 'Website'}
                      </span>
                    </td>
                    <td data-label="Subject" style={{ fontWeight: 600, color: 'var(--admin-sidebar-active)' }}>{enquiry.subject}</td>
                    <td data-label="Message" style={{ fontSize: '0.85rem', color: 'var(--admin-text-sub)' }}>
                      {truncateText(enquiry.messagePreview || enquiry.message)}
                    </td>
                    <td data-label="Status">
                      <span
                        className={`enquiry-status-badge ${getStatusClassName(currentStatus)}`}
                        aria-label={`Status: ${currentStatus}`}
                      >
                        {getStatusBadgeLabel(currentStatus)}
                      </span>
                    </td>
                    <td data-label="Date" className="admin-table-date-cell">
                      <span className="admin-table-date">
                        {new Date(enquiry.createdAt || enquiry.date).toLocaleDateString()}
                      </span>
                    </td>
                    <td data-label="Actions">
                      <div className="cell-actions">
                        <button
                          type="button"
                          className="btn-action-cell view"
                          onClick={() => handleView(enquiry)}
                          title="View enquiry"
                        >
                          <FaEye />
                        </button>
                        {enquiry.source === 'whatsapp' && enquiry.whatsappLink && (
                          <button
                            type="button"
                            className="btn-action-cell"
                            onClick={() => handleWhatsApp(enquiry)}
                            title="WhatsApp customer"
                          >
                            <FaWhatsapp />
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-action-cell delete"
                          onClick={() => handleDelete(enquiry.id)}
                          title="Delete enquiry"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="dashboard-panel admin-empty-state">
          <FaEnvelopeOpenText className="admin-empty-icon" />
          <h3>{hasActiveSearch ? ADMIN_NO_MATCH_MESSAGE : 'No enquiries found'}</h3>
          {!hasActiveSearch ? (
            <p>Customer enquiries will appear here when submitted from the storefront.</p>
          ) : null}
        </div>
      )}

      {selectedEnquiry && (
        <div className="admin-modal-overlay" onClick={closeViewModal}>
          <div className="admin-modal-container message-view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedEnquiry.subject}</h3>
              <button type="button" className="modal-close-btn" onClick={closeViewModal} disabled={statusSaving}>×</button>
            </div>
            <div className="modal-body message-view-body">
              <div className="message-view-meta">
                <div><strong>From:</strong> {selectedEnquiry.senderName || selectedEnquiry.name}</div>
                <div><strong>Email:</strong> {selectedEnquiry.email}</div>
                {selectedEnquiry.phone && <div><strong>Phone:</strong> {selectedEnquiry.phone}</div>}
                <div><strong>Type:</strong> {TYPE_LABELS[selectedEnquiry.enquiryType] || selectedEnquiry.enquiryType}</div>
                <div><strong>Source:</strong> {SOURCE_LABELS[selectedEnquiry.source] || 'Website'}</div>
                {selectedEnquiry.productName && <div><strong>Product:</strong> {selectedEnquiry.productName}</div>}
                {selectedEnquiry.quantityRequired && (
                  <div><strong>Quantity:</strong> {selectedEnquiry.quantityRequired}</div>
                )}
                <div><strong>Date:</strong> {new Date(selectedEnquiry.createdAt || selectedEnquiry.date).toLocaleString()}</div>
                <div><strong>Last Updated:</strong> {new Date(selectedEnquiry.updatedAt || selectedEnquiry.createdAt).toLocaleString()}</div>
                <div>
                  <strong>Current Status:</strong>{' '}
                  <span className={`enquiry-status-badge ${getStatusClassName(selectedStatus)}`}>
                    {getStatusBadgeLabel(selectedStatus)}
                  </span>
                </div>
              </div>
              <div className="message-view-content">
                <strong>Message</strong>
                <p>{selectedEnquiry.message}</p>
              </div>
              <div className="enquiry-view-status-panel">
                <strong>Update Status</strong>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--admin-text-sub)' }}>
                  Change the enquiry status here. New enquiries are marked as Read when opened.
                </p>
                <div className="enquiry-view-status-row">
                  <select
                    id={`status-modal-${selectedEnquiry.id}`}
                    className={`enquiry-status-select ${getStatusClassName(viewStatus)}`}
                    value={viewStatus}
                    onChange={(e) => setViewStatus(e.target.value)}
                    disabled={statusSaving}
                    aria-label="Enquiry status"
                  >
                    {ENQUIRY_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="action-btn-primary"
                    onClick={handleSaveStatus}
                    disabled={statusSaving || !statusChangedInView}
                  >
                    {statusSaving ? 'Saving…' : 'Update Status'}
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {selectedEnquiry.source === 'whatsapp' && selectedEnquiry.whatsappLink && (
                <button type="button" className="action-btn-secondary" onClick={() => handleWhatsApp(selectedEnquiry)}>
                  <FaWhatsapp /> WhatsApp
                </button>
              )}
              <button type="button" className="action-btn-secondary" onClick={closeViewModal} disabled={statusSaving}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
