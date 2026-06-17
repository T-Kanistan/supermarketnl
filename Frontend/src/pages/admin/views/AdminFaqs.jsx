import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaQuestionCircle } from 'react-icons/fa';
import faqService from '../../../services/faqService';
import { useToast } from '../../../context/ToastContext';

export const AdminFaqs = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);

  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    status: 'active',
  });

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await faqService.getFaqs();
      setFaqs(data);
    } catch (err) {
      console.error('Failed to load FAQs', err);
      addToast('Failed to load FAQs board', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    let isMounted = true;
    const initFaqs = async () => {
      await Promise.resolve();
      if (isMounted) {
        fetchFaqs();
      }
    };
    initFaqs();
    return () => { isMounted = false; };
  }, [fetchFaqs]);

  const openAddModal = () => {
    setEditingFaq(null);
    setFormData({
      question: '',
      answer: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (faq) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question || '',
      answer: faq.answer || '',
      status: faq.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this FAQ?')) return;
    try {
      await faqService.deleteFaq(id);
      addToast('FAQ deleted successfully', 'success');
      fetchFaqs();
    } catch (err) {
      console.error('Failed to delete FAQ', err);
      addToast('Failed to delete FAQ', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.question || !formData.answer) {
      addToast('Question and answer are both required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingFaq) {
        await faqService.updateFaq(editingFaq.id, formData);
        addToast('FAQ updated successfully', 'success');
      } else {
        await faqService.createFaq(formData);
        addToast('New FAQ added successfully', 'success');
      }
      setIsModalOpen(false);
      fetchFaqs();
    } catch (err) {
      console.error('Failed to save FAQ', err);
      addToast('Failed to save FAQ', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="view-header">
        <div className="view-title-wrap">
          <h2>FAQs Board</h2>
          <p>Create and update Frequently Asked Questions displayed on the store help page.</p>
        </div>
        <button className="action-btn-primary" onClick={openAddModal}>
          <FaPlus /> Add FAQ
        </button>
      </div>

      {loading ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', animation: 'pulse 1.5s infinite ease-in-out' }}>
          <div style={{ height: '30px', width: '200px', background: '#cbd5e1', marginBottom: '20px' }}></div>
          <div style={{ height: '150px', background: '#cbd5e1' }}></div>
        </div>
      ) : faqs.length > 0 ? (
        <div className="table-responsive-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Question</th>
                <th style={{ width: '45%' }}>Answer</th>
                <th style={{ width: '10%' }}>Status</th>
                <th style={{ width: '15%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((faq) => (
                <tr key={faq.id}>
                  <td style={{ fontWeight: 600 }}>{faq.question}</td>
                  <td style={{ color: 'var(--admin-text-sub)' }}>{faq.answer}</td>
                  <td>
                    <span className={`status-badge-admin ${faq.status}`}>
                      {faq.status}
                    </span>
                  </td>
                  <td>
                    <div className="cell-actions">
                      <button className="btn-action-cell edit" onClick={() => openEditModal(faq)} title="Edit FAQ">
                        <FaEdit />
                      </button>
                      <button className="btn-action-cell delete" onClick={() => handleDelete(faq.id)} title="Delete FAQ">
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
          <FaQuestionCircle className="admin-empty-icon" />
          <h3>No FAQs found!</h3>
          <p>Click "Add FAQ" above to create one.</p>
        </div>
      )}

      {/* Add / Edit FAQ Modal */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{editingFaq ? 'Edit FAQ' : 'Add New FAQ'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="admin-form-group">
                  <label>Question text</label>
                  <input 
                    type="text" 
                    name="question" 
                    value={formData.question} 
                    onChange={handleChange} 
                    placeholder="e.g. 1. What are your opening hours?" 
                    required 
                  />
                </div>

                <div className="admin-form-group">
                  <label>Answer text</label>
                  <textarea 
                    name="answer" 
                    value={formData.answer} 
                    onChange={handleChange} 
                    rows="4"
                    placeholder="Provide details answer here..." 
                    required 
                  />
                </div>

                <div className="admin-form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="action-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFaqs;
