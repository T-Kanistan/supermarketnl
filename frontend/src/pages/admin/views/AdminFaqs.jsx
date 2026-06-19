import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaQuestionCircle, FaArrowUp, FaArrowDown, FaSave } from 'react-icons/fa';
import faqService from '../../../services/faqService';
import { useToast } from '../../../context/ToastContext';

export const AdminFaqs = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);

  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    status: 'active',
  });

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await faqService.getAllFaqs();
      setFaqs(
        [...data].sort((a, b) => {
          const orderDiff = (a.order || 0) - (b.order || 0);
          if (orderDiff !== 0) return orderDiff;
          return new Date(a.createdAt) - new Date(b.createdAt);
        })
      );
    } catch (err) {
      console.error('Failed to load FAQs', err);
      addToast('Failed to load FAQs board', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const moveFaq = (index, direction) => {
    setFaqs((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleDragStart = (index) => setDragIndex(index);

  const handleDrop = (index) => {
    if (dragIndex === null || dragIndex === index) return;
    setFaqs((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(null);
  };

  const saveOrder = async () => {
    setIsSavingOrder(true);
    try {
      const orders = faqs.map((faq, index) => ({ id: faq.id, order: index + 1 }));
      await faqService.reorderFaqs(orders);
      addToast('FAQ order saved successfully', 'success');
      fetchFaqs();
    } catch (err) {
      console.error('Failed to save FAQ order', err);
      addToast('Failed to save FAQ order', 'error');
    } finally {
      setIsSavingOrder(false);
    }
  };

  const openAddModal = () => {
    setEditingFaq(null);
    setFormData({ question: '', answer: '', status: 'active' });
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
        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" className="action-btn-secondary" onClick={saveOrder} disabled={isSavingOrder || !faqs.length}>
            <FaSave /> {isSavingOrder ? 'Saving...' : 'Save Order'}
          </button>
          <button type="button" className="action-btn-primary" onClick={openAddModal}>
            <FaPlus /> Add FAQ
          </button>
        </div>
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
                <th style={{ width: '8%' }}>Order</th>
                <th style={{ width: '28%' }}>Question</th>
                <th style={{ width: '42%' }}>Answer</th>
                <th style={{ width: '10%' }}>Status</th>
                <th style={{ width: '12%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((faq, index) => (
                <tr
                  key={faq.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(index)}
                >
                  <td>
                    <div className="cell-actions">
                      <button type="button" className="btn-action-cell" onClick={() => moveFaq(index, -1)} title="Move up">
                        <FaArrowUp />
                      </button>
                      <button type="button" className="btn-action-cell" onClick={() => moveFaq(index, 1)} title="Move down">
                        <FaArrowDown />
                      </button>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{faq.question}</td>
                  <td style={{ color: 'var(--admin-text-sub)' }}>{faq.answer}</td>
                  <td>
                    <span className={`status-badge-admin ${faq.status}`}>{faq.status}</span>
                  </td>
                  <td>
                    <div className="cell-actions">
                      <button type="button" className="btn-action-cell edit" onClick={() => openEditModal(faq)} title="Edit FAQ">
                        <FaEdit />
                      </button>
                      <button type="button" className="btn-action-cell delete" onClick={() => handleDelete(faq.id)} title="Delete FAQ">
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
          <p>Click &quot;Add FAQ&quot; above to create one.</p>
        </div>
      )}

      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{editingFaq ? 'Edit FAQ' : 'Add New FAQ'}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="admin-form-group">
                  <label>Question text</label>
                  <input type="text" name="question" value={formData.question} onChange={handleChange} required />
                </div>
                <div className="admin-form-group">
                  <label>Answer text</label>
                  <textarea name="answer" value={formData.answer} onChange={handleChange} rows="4" required />
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
