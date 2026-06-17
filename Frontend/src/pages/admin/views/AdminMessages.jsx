import { useState, useEffect, useCallback } from 'react';
import { FaTrash, FaEnvelopeOpenText } from 'react-icons/fa';
import cmsService from '../../../services/cmsService';
import { useToast } from '../../../context/ToastContext';

export const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const { addToast } = useToast();

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await cmsService.getContactMessages();
      // Sort message newest first
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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message permanently?')) return;
    try {
      await cmsService.deleteContactMessage(id);
      addToast('Enquiry message deleted', 'success');
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
          <p>Read customer requests, product queries, and messages sent through the Contact Us form.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', animation: 'pulse 1.5s infinite ease-in-out' }}>
          <div style={{ height: '30px', width: '200px', background: '#cbd5e1', marginBottom: '20px' }}></div>
          <div style={{ height: '150px', background: '#cbd5e1' }}></div>
        </div>
      ) : messages.length > 0 ? (
        <div className="table-responsive-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Sender Name</th>
                <th style={{ width: '20%' }}>Contact Info</th>
                <th style={{ width: '20%' }}>Subject</th>
                <th style={{ width: '30%' }}>Message</th>
                <th style={{ width: '10%' }}>Date</th>
                <th style={{ width: '5%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => (
                <tr key={msg.id}>
                  <td style={{ fontWeight: 600 }}>{msg.name}</td>
                  <td>
                    <div>📧 {msg.email}</div>
                    {msg.phone && <div>📞 {msg.phone}</div>}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--admin-sidebar-active)' }}>{msg.subject}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--admin-text-sub)', whiteSpace: 'pre-line' }}>{msg.message}</td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(msg.date).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <button className="btn-action-cell delete" onClick={() => handleDelete(msg.id)} title="Delete message">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="dashboard-panel admin-empty-state">
          <FaEnvelopeOpenText className="admin-empty-icon" />
          <h3>Inbox is empty!</h3>
          <p>No customer enquiries have been received yet.</p>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
