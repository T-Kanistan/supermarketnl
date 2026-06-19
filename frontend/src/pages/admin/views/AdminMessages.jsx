import { useState, useEffect, useCallback, useMemo } from 'react';
import { FaTrash, FaEnvelopeOpenText, FaEye, FaEnvelope, FaCheck, FaEnvelopeOpen } from 'react-icons/fa';
import cmsService from '../../../services/cmsService';
import { useToast } from '../../../context/ToastContext';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Messages' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

const truncateText = (text, maxLength = 80) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

export const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null);

  const { addToast } = useToast();

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await cmsService.getContactMessages();
      setMessages(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (err) {
      console.error('Failed to load enquiries', err);
      addToast('Failed to load enquiries', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    let isMounted = true;
    const initMessages = async () => {
      await Promise.resolve();
      if (isMounted) {
        fetchMessages();
      }
    };
    initMessages();
    return () => { isMounted = false; };
  }, [fetchMessages]);

  const filteredMessages = useMemo(() => {
    if (filter === 'unread') return messages.filter((msg) => !msg.isRead);
    if (filter === 'read') return messages.filter((msg) => msg.isRead);
    return messages;
  }, [messages, filter]);

  const unreadCount = useMemo(() => messages.filter((msg) => !msg.isRead).length, [messages]);

  const handleView = async (msg) => {
    setSelectedMessage(msg);
    if (!msg.isRead) {
      try {
        await cmsService.markContactMessageRead(msg.id, true);
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m))
        );
        setSelectedMessage((prev) => (prev ? { ...prev, isRead: true } : prev));
      } catch (err) {
        console.error('Failed to mark message as read', err);
      }
    }
  };

  const handleToggleRead = async (msg) => {
    const nextRead = !msg.isRead;
    try {
      await cmsService.markContactMessageRead(msg.id, nextRead);
      addToast(nextRead ? 'Message marked as read' : 'Message marked as unread', 'success');
      fetchMessages();
      if (selectedMessage?.id === msg.id) {
        setSelectedMessage((prev) => (prev ? { ...prev, isRead: nextRead } : prev));
      }
    } catch (err) {
      console.error('Failed to update message status', err);
      addToast('Failed to update message status', 'error');
    }
  };

  const handleReplyEmail = (msg) => {
    const subject = encodeURIComponent(`Re: ${msg.subject}`);
    const body = encodeURIComponent(
      `Hi ${msg.name},\n\nThank you for contacting us regarding "${msg.subject}".\n\n\n\n---\nOriginal message:\n${msg.message}`
    );
    window.open(`mailto:${msg.email}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message permanently?')) return;
    try {
      await cmsService.deleteContactMessage(id);
      addToast('Enquiry message deleted', 'success');
      if (selectedMessage?.id === id) setSelectedMessage(null);
      fetchMessages();
    } catch (err) {
      console.error('Failed to delete message', err);
      addToast('Failed to delete message', 'error');
    }
  };

  return (
    <div>
      <div className="view-header">
        <div className="view-title-wrap">
          <h2>Client Contact Enquiries</h2>
          <p>
            Read customer requests, product queries, and messages sent through the Contact Us form.
            {unreadCount > 0 && (
              <span className="messages-unread-count"> {unreadCount} unread</span>
            )}
          </p>
        </div>
        <select
          className="admin-filter-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter messages"
        >
          {FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', animation: 'pulse 1.5s infinite ease-in-out' }}>
          <div style={{ height: '30px', width: '200px', background: '#cbd5e1', marginBottom: '20px' }}></div>
          <div style={{ height: '150px', background: '#cbd5e1' }}></div>
        </div>
      ) : filteredMessages.length > 0 ? (
        <div className="table-responsive-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '12%' }}>Sender Name</th>
                <th style={{ width: '18%' }}>Contact Info</th>
                <th style={{ width: '16%' }}>Subject</th>
                <th style={{ width: '24%' }}>Message</th>
                <th style={{ width: '8%' }}>Status</th>
                <th style={{ width: '10%' }}>Date</th>
                <th style={{ width: '12%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.map((msg) => (
                <tr key={msg.id} className={!msg.isRead ? 'message-row-unread' : ''}>
                  <td style={{ fontWeight: 600 }}>{msg.name}</td>
                  <td>
                    <div>📧 {msg.email}</div>
                    {msg.phone && <div>📞 {msg.phone}</div>}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--admin-sidebar-active)' }}>{msg.subject}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--admin-text-sub)' }}>
                    {truncateText(msg.message)}
                  </td>
                  <td>
                    <span className={`status-badge-admin ${msg.isRead ? 'read' : 'unread'}`}>
                      {msg.isRead ? 'Read' : 'New'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(msg.date).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <div className="cell-actions">
                      <button className="btn-action-cell view" onClick={() => handleView(msg)} title="View message">
                        <FaEye />
                      </button>
                      <button className="btn-action-cell reply" onClick={() => handleReplyEmail(msg)} title="Reply via email">
                        <FaEnvelope />
                      </button>
                      <button
                        className="btn-action-cell edit"
                        onClick={() => handleToggleRead(msg)}
                        title={msg.isRead ? 'Mark as unread' : 'Mark as read'}
                      >
                        {msg.isRead ? <FaEnvelopeOpen /> : <FaCheck />}
                      </button>
                      <button className="btn-action-cell delete" onClick={() => handleDelete(msg.id)} title="Delete message">
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="dashboard-panel admin-empty-state">
          <FaEnvelopeOpenText className="admin-empty-icon" />
          <h3>{filter === 'all' ? 'Inbox is empty!' : `No ${filter} messages`}</h3>
          <p>
            {filter === 'all'
              ? 'No customer enquiries have been received yet.'
              : 'Try changing the filter to see other messages.'}
          </p>
        </div>
      )}

      {selectedMessage && (
        <div className="admin-modal-overlay" onClick={() => setSelectedMessage(null)}>
          <div className="admin-modal-container message-view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedMessage.subject}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setSelectedMessage(null)}>×</button>
            </div>
            <div className="modal-body message-view-body">
              <div className="message-view-meta">
                <div><strong>From:</strong> {selectedMessage.name}</div>
                <div><strong>Email:</strong> {selectedMessage.email}</div>
                {selectedMessage.phone && <div><strong>Phone:</strong> {selectedMessage.phone}</div>}
                <div><strong>Date:</strong> {new Date(selectedMessage.date).toLocaleString()}</div>
                <div>
                  <strong>Status:</strong>{' '}
                  <span className={`status-badge-admin ${selectedMessage.isRead ? 'read' : 'unread'}`}>
                    {selectedMessage.isRead ? 'Read' : 'New'}
                  </span>
                </div>
              </div>
              <div className="message-view-content">
                <strong>Message</strong>
                <p>{selectedMessage.message}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="action-btn-secondary" onClick={() => handleToggleRead(selectedMessage)}>
                {selectedMessage.isRead ? 'Mark as Unread' : 'Mark as Read'}
              </button>
              <button type="button" className="action-btn-primary" onClick={() => handleReplyEmail(selectedMessage)}>
                <FaEnvelope /> Reply via Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
