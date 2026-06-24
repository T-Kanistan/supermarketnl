import { useState, useEffect, useCallback } from 'react';
import { FaTrash, FaEnvelopeOpenText, FaEye, FaWhatsapp, FaEdit } from 'react-icons/fa';
import enquiryService from '../../../services/enquiryService';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { ENQUIRY_STATUSES, getStatusClassName } from '../../../constants/enquiryMessages';

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
  const [search, setSearch] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const { addToast } = useToast();
  const { isAdmin } = useAuth();

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
      if (search.trim()) params.search = search.trim();

      const { data } = await enquiryService.getEnquiries(params);
      setEnquiries(
        data.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
      );
    } catch (err) {
      console.error('Failed to load enquiries', err);
      addToast('Failed to load enquiries', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, statusFilter, typeFilter, search]);

  useEffect(() => {
    fetchEnquiries();
    fetchStats();
  }, [fetchEnquiries, fetchStats]);

  const updateEnquiryInList = (updated) => {
    setEnquiries((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    if (selectedEnquiry?.id === updated.id) {
      setSelectedEnquiry(updated);
    }
  };

  const handleStatusChange = async (enquiry, nextStatus) => {
    const currentStatus = normalizeStatus(enquiry.status);
    if (currentStatus === nextStatus) return;

    setStatusUpdatingId(enquiry.id);
    try {
      const updated = await enquiryService.updateStatus(enquiry.id, nextStatus);
      updateEnquiryInList(updated);
      fetchStats();
      addToast(`Status updated to ${nextStatus}`, 'success');
    } catch (err) {
      console.error('Failed to update enquiry status', err);
      addToast(err.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleView = async (enquiry) => {
    setSelectedEnquiry(enquiry);
    if (normalizeStatus(enquiry.status) === 'New') {
      await handleStatusChange(enquiry, 'Read');
    }
  };

  const handleWhatsApp = (enquiry) => {
    if (!enquiry.whatsappLink) {
      addToast('No phone number available for WhatsApp', 'error');
      return;
    }
    window.open(enquiry.whatsappLink, '_blank', 'noopener,noreferrer');
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      addToast('Only administrators can delete enquiries', 'error');
      return;
    }
    if (!window.confirm('Delete this enquiry?')) return;
    try {
      await enquiryService.deleteEnquiry(id);
      addToast('Enquiry deleted', 'success');
      if (selectedEnquiry?.id === id) setSelectedEnquiry(null);
      fetchEnquiries();
      fetchStats();
    } catch (err) {
      console.error('Failed to delete enquiry', err);
      addToast(err.response?.data?.message || 'Failed to delete enquiry', 'error');
    }
  };

  return (
    <div>
      <div className="view-header">
        <div className="view-title-wrap">
          <h2>Customer Enquiries</h2>
          <p>Manage contact, product, and food corner enquiries from the storefront.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="search"
            className="admin-filter-select"
            placeholder="Search enquiries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: '180px' }}
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
          <table className="admin-table">
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
                const isUpdating = statusUpdatingId === enquiry.id;

                return (
                  <tr key={enquiry.id} className={isUnread ? 'message-row-unread' : ''}>
                    <td style={{ fontWeight: 600 }}>{enquiry.senderName || enquiry.name}</td>
                    <td>
                      <div>{enquiry.email}</div>
                      {enquiry.phone && <div>{enquiry.phone}</div>}
                    </td>
                    <td>
                      <span className="status-badge-admin scheduled">
                        {TYPE_LABELS[enquiry.enquiryType] || enquiry.enquiryType}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge-admin ${enquiry.source === 'whatsapp' ? 'active' : 'scheduled'}`}>
                        {SOURCE_LABELS[enquiry.source] || 'Website'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--admin-sidebar-active)' }}>{enquiry.subject}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--admin-text-sub)' }}>
                      {truncateText(enquiry.messagePreview || enquiry.message)}
                    </td>
                    <td>
                      <select
                        id={`status-row-${enquiry.id}`}
                        className={`enquiry-status-select ${getStatusClassName(currentStatus)}`}
                        value={currentStatus}
                        onChange={(e) => handleStatusChange(enquiry, e.target.value)}
                        disabled={isUpdating}
                        aria-label={`Change status for ${enquiry.senderName}`}
                      >
                        {ENQUIRY_STATUSES.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {new Date(enquiry.createdAt || enquiry.date).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <div className="cell-actions">
                        <button
                          type="button"
                          className="btn-action-cell view"
                          onClick={() => handleView(enquiry)}
                          title="View enquiry"
                        >
                          <FaEye />
                        </button>
                        <button
                          type="button"
                          className="btn-action-cell edit"
                          onClick={() => document.getElementById(`status-row-${enquiry.id}`)?.focus()}
                          title="Edit status"
                          aria-label="Edit status"
                        >
                          <FaEdit />
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
                        {isAdmin && (
                          <button
                            type="button"
                            className="btn-action-cell delete"
                            onClick={() => handleDelete(enquiry.id)}
                            title="Delete enquiry"
                          >
                            <FaTrash />
                          </button>
                        )}
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
          <h3>No enquiries found</h3>
          <p>Customer enquiries will appear here when submitted from the storefront.</p>
        </div>
      )}

      {selectedEnquiry && (
        <div className="admin-modal-overlay" onClick={() => setSelectedEnquiry(null)}>
          <div className="admin-modal-container message-view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedEnquiry.subject}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setSelectedEnquiry(null)}>×</button>
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
                  <strong>Status:</strong>{' '}
                  <select
                    id={`status-modal-${selectedEnquiry.id}`}
                    className={`enquiry-status-select ${getStatusClassName(normalizeStatus(selectedEnquiry.status))}`}
                    value={normalizeStatus(selectedEnquiry.status)}
                    onChange={(e) => handleStatusChange(selectedEnquiry, e.target.value)}
                    disabled={statusUpdatingId === selectedEnquiry.id}
                  >
                    {ENQUIRY_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="message-view-content">
                <strong>Message</strong>
                <p>{selectedEnquiry.message}</p>
              </div>
            </div>
            <div className="modal-footer">
              {selectedEnquiry.source === 'whatsapp' && selectedEnquiry.whatsappLink && (
                <button type="button" className="action-btn-secondary" onClick={() => handleWhatsApp(selectedEnquiry)}>
                  <FaWhatsapp /> WhatsApp
                </button>
              )}
              <button type="button" className="action-btn-primary" onClick={() => setSelectedEnquiry(null)}>
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
