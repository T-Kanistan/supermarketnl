import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaQuestionCircle, FaArrowUp, FaArrowDown, FaSave } from 'react-icons/fa';
import faqService from '../../../services/faqService';
import { sortFaqsByOrder, stripLeadingNumberFromQuestion } from '../../../utils/faqUtils';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

export const AdminFaqs = () => {
  const [faqs, setFaqs] = useState([]);
  const [orderValues, setOrderValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);

  const { addToast } = useToast();
  const { isAdmin } = useAuth();

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    status: 'active',
    displayOrder: '',
  });

  const syncOrderValues = (list) => {
    const next = {};
    list.forEach((faq, index) => {
      next[faq.id] = faq.displayOrder ?? faq.order ?? index + 1;
    });
    setOrderValues(next);
  };

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await faqService.getAllFaqs();
      const sorted = sortFaqsByOrder(Array.isArray(data) ? data : []);
      setFaqs(sorted);
      syncOrderValues(sorted);
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

  const moveFaq = async (index, direction) => {
    const faq = faqs[index];
    if (!faq) return;
    try {
      if (direction < 0) {
        await faqService.moveFaqUp(faq.id);
      } else {
        await faqService.moveFaqDown(faq.id);
      }
      fetchFaqs();
    } catch (err) {
      console.error('Failed to move FAQ', err);
      addToast(err.response?.data?.message || 'Failed to move FAQ', 'error');
    }
  };

  const handleDragStart = (index) => setDragIndex(index);

  const handleDrop = (index) => {
    if (dragIndex === null || dragIndex === index) return;
    setFaqs((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      syncOrderValues(
        next.map((faq, position) => ({
          ...faq,
          displayOrder: position + 1,
          order: position + 1,
        }))
      );
      return next;
    });
    setDragIndex(null);
  };

  const handleOrderChange = (faqId, value) => {
    setOrderValues((prev) => ({
      ...prev,
      [faqId]: value,
    }));
  };

  const saveOrder = async () => {
    const orders = faqs.map((faq) => ({
      faqId: faq.id,
      displayOrder: Number(orderValues[faq.id]),
    }));

    if (orders.some((entry) => !Number.isInteger(entry.displayOrder) || entry.displayOrder < 1)) {
      addToast('Each FAQ must have a valid order number of 1 or higher', 'error');
      return;
    }

    const uniqueOrders = new Set(orders.map((entry) => entry.displayOrder));
    if (uniqueOrders.size !== orders.length) {
      addToast('Order values must be unique', 'error');
      return;
    }

    setIsSavingOrder(true);
    try {
      await faqService.saveFaqOrder(orders);
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
    setFormData({
      question: '',
      answer: '',
      status: 'active',
      displayOrder: String((faqs.length || 0) + 1),
    });
    setIsModalOpen(true);
  };

  const openEditModal = (faq) => {
    setEditingFaq(faq);
    setFormData({
      question: stripLeadingNumberFromQuestion(faq.question || ''),
      answer: faq.answer || '',
      status: faq.status || 'active',
      displayOrder: String(faq.displayOrder ?? faq.order ?? ''),
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      addToast('Only administrators can delete FAQs', 'error');
      return;
    }
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
    if (!formData.question?.trim() || formData.question.trim().length < 5) {
      addToast('Question must be at least 5 characters', 'error');
      return;
    }
    if (!formData.answer?.trim() || formData.answer.trim().length < 10) {
      addToast('Answer must be at least 10 characters', 'error');
      return;
    }

    const displayOrder = Number(formData.displayOrder);
    if (!Number.isInteger(displayOrder) || displayOrder < 1) {
      addToast('Order must be a positive number', 'error');
      return;
    }

    const payload = {
      question: stripLeadingNumberFromQuestion(formData.question),
      answer: formData.answer.trim(),
      status: formData.status,
      displayOrder,
    };

    setIsSubmitting(true);
    try {
      if (editingFaq) {
        await faqService.updateFaq(editingFaq.id, payload);
        addToast('FAQ updated successfully', 'success');
      } else {
        await faqService.createFaq(payload);
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
                    <input
                      type="number"
                      min="1"
                      className="admin-order-input"
                      value={orderValues[faq.id] ?? faq.displayOrder ?? faq.order ?? index + 1}
                      onChange={(e) => handleOrderChange(faq.id, e.target.value)}
                      aria-label={`Order for ${stripLeadingNumberFromQuestion(faq.question)}`}
                    />
                  </td>
                  <td style={{ fontWeight: 600 }}>{stripLeadingNumberFromQuestion(faq.question)}</td>
                  <td style={{ color: 'var(--admin-text-sub)' }}>{faq.answer}</td>
                  <td>
                    <span className={`status-badge-admin ${faq.status}`}>{faq.status}</span>
                  </td>
                  <td>
                    <div className="cell-actions">
                      <button type="button" className="btn-action-cell edit" onClick={() => openEditModal(faq)} title="Edit FAQ">
                        <FaEdit />
                      </button>
                      <button type="button" className="btn-action-cell" onClick={() => moveFaq(index, -1)} title="Move up">
                        <FaArrowUp />
                      </button>
                      <button type="button" className="btn-action-cell" onClick={() => moveFaq(index, 1)} title="Move down">
                        <FaArrowDown />
                      </button>
                      {isAdmin && (
                        <button type="button" className="btn-action-cell delete" onClick={() => handleDelete(faq.id)} title="Delete FAQ">
                          <FaTrash />
                        </button>
                      )}
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
                  <input type="text" name="question" value={formData.question} onChange={handleChange} minLength={5} maxLength={300} required />
                </div>
                <div className="admin-form-group">
                  <label>Answer text</label>
                  <textarea name="answer" value={formData.answer} onChange={handleChange} rows="4" minLength={10} maxLength={5000} required />
                </div>
                <div className="admin-form-group">
                  <label>Order</label>
                  <input
                    type="number"
                    name="displayOrder"
                    min="1"
                    value={formData.displayOrder}
                    onChange={handleChange}
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
