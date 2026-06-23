import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FaTrash,
  FaEnvelopeOpenText,
  FaEye,
  FaEnvelope,
  FaCheck,
  FaWhatsapp,
  FaTimes,
} from 'react-icons/fa';
import enquiryService from '../../../services/enquiryService';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

const STATUS_FILTERS = [
  { value: 'all', label: 'All Enquiries' },
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' },
  { value: 'closed', label: 'Closed' },
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

const truncateText = (text, maxLength = 80) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

const formatStatusLabel = (enquiry) => {
  if (enquiry.status === 'new' && !enquiry.isRead) return 'new';
  return enquiry.status || 'new';
};

export const AdminMessages = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const { addToast } = useToast();
  const { isAdmin } = useAuth();

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.enquiryType = typeFilter;
      if (search.trim()) params.search = search.trim();

      const { data } = await enquiryService.getEnquiries(params);
      setEnquiries(data.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)));
    } catch (err) {
      console.error('Failed to load enquiries', err);
      addToast('Failed to load enquiries', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, statusFilter, typeFilter, search]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  const unreadCount = useMemo(
    () => enquiries.filter((item) => item.status === 'new' && !item.isRead).length,
    [enquiries]
  );

  const handleView = async (enquiry) => {
    setSelectedEnquiry(enquiry);
    setReplyText('');
    if (enquiry.status === 'new' && !enquiry.isRead) {
      try {
        const updated = await enquiryService.markAsRead(enquiry.id);
        setEnquiries((prev) => prev.map((item) => (item.id === enquiry.id ? updated : item)));
        setSelectedEnquiry(updated);
      } catch (err) {
        console.error('Failed to mark enquiry as read', err);
      }
    }
  };

  const handleMarkRead = async (enquiry) => {
    try {
      const updated = await enquiryService.markAsRead(enquiry.id);
      addToast('Enquiry marked as read', 'success');
      setEnquiries((prev) => prev.map((item) => (item.id === enquiry.id ? updated : item)));
      if (selectedEnquiry?.id === enquiry.id) setSelectedEnquiry(updated);
    } catch (err) {
      console.error('Failed to mark enquiry as read', err);
      addToast('Failed to update enquiry status', 'error');
    }
  };

  const handleClose = async (enquiry) => {
    try {
      const updated = await enquiryService.closeEnquiry(enquiry.id);
      addToast('Enquiry closed', 'success');
      setEnquiries((prev) => prev.map((item) => (item.id === enquiry.id ? updated : item)));
      if (selectedEnquiry?.id === enquiry.id) setSelectedEnquiry(updated);
    } catch (err) {
      console.error('Failed to close enquiry', err);
      addToast('Failed to close enquiry', 'error');
    }
  };

  const handleReplyEmail = async () => {
    if (!selectedEnquiry) return;
    if (!replyText.trim()) {
      addToast('Please enter a reply message', 'error');
      return;
    }

    setIsReplying(true);
    try {
      const updated = await enquiryService.sendReply(selectedEnquiry.id, replyText.trim());
      addToast('Reply sent successfully', 'success');
      setEnquiries((prev) => prev.map((item) => (item.id === selectedEnquiry.id ? updated : item)));
      setSelectedEnquiry(updated);
      setReplyText('');
    } catch (err) {
      console.error('Failed to send reply', err);
      addToast(err.response?.data?.message || 'Failed to send reply', 'error');
    } finally {
      setIsReplying(false);
    }
  };

  const handleMailto = (enquiry) => {
    const subject = encodeURIComponent(`Re: ${enquiry.subject}`);
    const body = encodeURIComponent(
      `Hi ${enquiry.senderName || enquiry.name},\n\nThank you for contacting us.\n\n\n---\nOriginal message:\n${enquiry.message}`
    );
    window.open(`mailto:${enquiry.email}?subject=${subject}&body=${body}`, '_blank');
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
          <p>
            Manage contact, product, and food corner enquiries from the storefront.
            {unreadCount > 0 && (
              <span className="messages-unread-count"> {unreadCount} new</span>
            )}
          </p>
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
                <th>Subject</th>
                <th>Message</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((enquiry) => {
                const statusClass = formatStatusLabel(enquiry);
                const isUnread = enquiry.status === 'new' && !enquiry.isRead;

                return (
                  <tr key={enquiry.id} className={isUnread ? 'message-row-unread' : ''}>
                    <td style={{ fontWeight: 600 }}>{enquiry.senderName || enquiry.name}</td>
                    <td>
                      <div>📧 {enquiry.email}</div>
                      {enquiry.phone && <div>📞 {enquiry.phone}</div>}
                    </td>
                    <td>
                      <span className="status-badge-admin scheduled">
                        {TYPE_LABELS[enquiry.enquiryType] || enquiry.enquiryType}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--admin-sidebar-active)' }}>{enquiry.subject}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--admin-text-sub)' }}>
                      {truncateText(enquiry.messagePreview || enquiry.message)}
                    </td>
                    <td>
                      <span className={`status-badge-admin ${statusClass === 'new' ? 'unread' : statusClass}`}>
                        {statusClass}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {new Date(enquiry.createdAt || enquiry.date).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <div className="cell-actions">
                        <button className="btn-action-cell view" onClick={() => handleView(enquiry)} title="View enquiry">
                          <FaEye />
                        </button>
                        <button className="btn-action-cell reply" onClick={() => { handleView(enquiry); }} title="Reply via email">
                          <FaEnvelope />
                        </button>
                        <button className="btn-action-cell edit" onClick={() => handleMarkRead(enquiry)} title="Mark as read">
                          <FaCheck />
                        </button>
                        {enquiry.whatsappLink && (
                          <button className="btn-action-cell" onClick={() => handleWhatsApp(enquiry)} title="WhatsApp customer">
                            <FaWhatsapp />
                          </button>
                        )}
                        {isAdmin && (
                          <button className="btn-action-cell delete" onClick={() => handleDelete(enquiry.id)} title="Delete enquiry">
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
                {selectedEnquiry.productName && <div><strong>Product:</strong> {selectedEnquiry.productName}</div>}
                {selectedEnquiry.quantityRequired && (
                  <div><strong>Quantity:</strong> {selectedEnquiry.quantityRequired}</div>
                )}
                <div><strong>Date:</strong> {new Date(selectedEnquiry.createdAt || selectedEnquiry.date).toLocaleString()}</div>
                <div>
                  <strong>Status:</strong>{' '}
                  <span className={`status-badge-admin ${formatStatusLabel(selectedEnquiry) === 'new' ? 'unread' : formatStatusLabel(selectedEnquiry)}`}>
                    {formatStatusLabel(selectedEnquiry)}
                  </span>
                </div>
              </div>
              <div className="message-view-content">
                <strong>Message</strong>
                <p>{selectedEnquiry.message}</p>
              </div>
              {selectedEnquiry.replyLogs?.length > 0 && (
                <div className="message-view-content">
                  <strong>Reply History</strong>
                  {selectedEnquiry.replyLogs.map((log) => (
                    <p key={log._id || log.repliedAt} style={{ marginTop: '8px' }}>
                      {log.replyMessage}
                      <br />
                      <small style={{ color: '#64748b' }}>
                        {new Date(log.repliedAt).toLocaleString()}
                      </small>
                    </p>
                  ))}
                </div>
              )}
              <div className="admin-form-group" style={{ marginTop: '16px' }}>
                <label>Email Reply</label>
                <textarea
                  rows="4"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply to the customer..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="action-btn-secondary" onClick={() => handleMarkRead(selectedEnquiry)}>
                <FaCheck /> Mark Read
              </button>
              <button type="button" className="action-btn-secondary" onClick={() => handleClose(selectedEnquiry)}>
                <FaTimes /> Close
              </button>
              {selectedEnquiry.whatsappLink && (
                <button type="button" className="action-btn-secondary" onClick={() => handleWhatsApp(selectedEnquiry)}>
                  <FaWhatsapp /> WhatsApp
                </button>
              )}
              <button type="button" className="action-btn-secondary" onClick={() => handleMailto(selectedEnquiry)}>
                <FaEnvelope /> Open in Email Client
              </button>
              <button
                type="button"
                className="action-btn-primary"
                onClick={handleReplyEmail}
                disabled={isReplying}
              >
                {isReplying ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
