import { useState, useEffect, useCallback, useMemo } from 'react';
import { FaPlus, FaEdit, FaTrash, FaQuestionCircle, FaArrowUp, FaArrowDown, FaSave, FaSearch } from 'react-icons/fa';
import faqService from '../../../services/faqService';
import { sortFaqsByOrder, stripLeadingNumberFromQuestion } from '../../../utils/faqUtils';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import {
  MAX_FAQ_COUNT,
  FAQ_LIMIT_REACHED_TOOLTIP,
  FAQ_LIMIT_REACHED_WARNING,
} from '../../../constants/faqLimits';
import { invalidateDashboardStats } from '../../../utils/dashboardStatsRefresh';
import useAdminSearch from '../../../hooks/useAdminSearch';
import { filterByAdminSearch, statusSearchLabel, ADMIN_NO_MATCH_MESSAGE } from '../../../utils/adminSearch';

import { ADMIN_TEXT_LIMITS } from '../../../utils/adminTextValidation';
import AdminFieldLabel from '../../../components/admin/AdminFieldLabel';

const FAQ_QUESTION_MAX_LENGTH = ADMIN_TEXT_LIMITS.faqQuestion.max;
const FAQ_ANSWER_MAX_LENGTH = ADMIN_TEXT_LIMITS.faqAnswer.max;

export const AdminFaqs = () => {
  const [faqs, setFaqs] = useState([]);
  const [orderValues, setOrderValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const { searchInput, searchQuery, onSearchChange, hasActiveSearch } = useAdminSearch();

  const { addToast } = useToast();
  const { isAdmin } = useAuth();

  const faqCount = faqs.length;
  const isLimitReached = useMemo(() => faqCount >= MAX_FAQ_COUNT, [faqCount]);
  const filteredFaqs = useMemo(
    () =>
      filterByAdminSearch(faqs, searchQuery, (faq) => [
        stripLeadingNumberFromQuestion(faq.question),
        faq.question,
        faq.answer,
        statusSearchLabel(faq.status),
      ]),
    [faqs, searchQuery]
  );

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    status: 'active',
    displayOrder: '',
  });
  const [fieldErrors, setFieldErrors] = useState({
    question: '',
    answer: '',
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
    if (isLimitReached) {
      addToast(FAQ_LIMIT_REACHED_WARNING, 'warning');
      return;
    }

    setEditingFaq(null);
    setFormData({
      question: '',
      answer: '',
      status: 'active',
      displayOrder: String((faqs.length || 0) + 1),
    });
    setFieldErrors({ question: '', answer: '' });
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
    setFieldErrors({ question: '', answer: '' });
    setIsModalOpen(true);
  };

  const sanitizeText = (value) =>
    String(value || '')
      .replace(/\s+/g, ' ')
      .trim();

  const normalizeComparable = (value) =>
    String(value || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

  const getDuplicateErrors = useCallback(
    (draft) => {
      const normalizedQuestion = normalizeComparable(stripLeadingNumberFromQuestion(draft.question || ''));
      const normalizedAnswer = normalizeComparable(draft.answer);

      const others = faqs.filter((faq) => faq.id !== editingFaq?.id);

      const questionExists =
        Boolean(normalizedQuestion) &&
        others.some(
          (faq) =>
            normalizeComparable(stripLeadingNumberFromQuestion(faq.question || '')) === normalizedQuestion
        );

      const answerExists =
        Boolean(normalizedAnswer) &&
        others.some((faq) => normalizeComparable(faq.answer) === normalizedAnswer);

      return {
        question: questionExists
          ? 'This FAQ question already exists. Please enter a different question.'
          : '',
        answer: answerExists ? 'This FAQ answer already exists.' : '',
      };
    },
    [faqs, editingFaq]
  );

  const validateDuplicateFields = useCallback(
    (draft) => {
      const duplicateErrors = getDuplicateErrors(draft);
      setFieldErrors((prev) => ({
        ...prev,
        question:
          prev.question === 'This FAQ question already exists. Please enter a different question.' ||
          duplicateErrors.question
            ? duplicateErrors.question
            : prev.question,
        answer:
          prev.answer === 'This FAQ answer already exists.' || duplicateErrors.answer
            ? duplicateErrors.answer
            : prev.answer,
      }));
      return duplicateErrors;
    },
    [getDuplicateErrors]
  );

  const getFieldValidationErrors = useCallback((draft) => {
    const question = sanitizeText(stripLeadingNumberFromQuestion(draft.question || ''));
    const answer = sanitizeText(draft.answer || '');
    return {
      question: !question
        ? 'Please enter a FAQ question.'
        : question.length > FAQ_QUESTION_MAX_LENGTH
          ? 'Question cannot exceed 150 characters.'
          : '',
      answer: !answer
        ? 'Please enter a FAQ answer.'
        : answer.length > FAQ_ANSWER_MAX_LENGTH
          ? 'Answer cannot exceed 1000 characters.'
          : '',
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const limit = name === 'question'
        ? FAQ_QUESTION_MAX_LENGTH
        : name === 'answer'
          ? FAQ_ANSWER_MAX_LENGTH
          : null;
      const boundedValue = limit ? String(value || '').slice(0, limit) : value;
      const next = { ...prev, [name]: boundedValue };
      if (name === 'question' || name === 'answer') {
        const contentErrors = getFieldValidationErrors(next);
        setFieldErrors((prevErrors) => ({
          ...prevErrors,
          [name]: contentErrors[name],
        }));
        validateDuplicateFields(next);
      }
      return next;
    });
  };

  const handleFieldBlur = (e) => {
    const { name, value } = e.target;
    if (name !== 'question' && name !== 'answer') return;
    const trimmedValue = sanitizeText(value);
    const next = { ...formData, [name]: trimmedValue };
    setFormData(next);
    const contentErrors = getFieldValidationErrors(next);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: contentErrors[name],
    }));
    validateDuplicateFields(next);
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
      invalidateDashboardStats();
      fetchFaqs();
    } catch (err) {
      console.error('Failed to delete FAQ', err);
      addToast('Failed to delete FAQ', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedQuestion = sanitizeText(stripLeadingNumberFromQuestion(formData.question || ''));
    const normalizedAnswer = sanitizeText(formData.answer || '');
    const contentErrors = getFieldValidationErrors({
      ...formData,
      question: normalizedQuestion,
      answer: normalizedAnswer,
    });
    setFieldErrors((prev) => ({
      ...prev,
      ...contentErrors,
    }));
    if (contentErrors.question || contentErrors.answer) {
      addToast(contentErrors.question || contentErrors.answer, 'error');
      return;
    }

    const duplicateErrors = validateDuplicateFields({
      ...formData,
      question: normalizedQuestion,
      answer: normalizedAnswer,
    });
    if (duplicateErrors.question || duplicateErrors.answer) {
      addToast(duplicateErrors.question || duplicateErrors.answer, 'error');
      return;
    }

    const displayOrder = Number(formData.displayOrder);
    if (!Number.isInteger(displayOrder) || displayOrder < 1) {
      addToast('Order must be a positive number', 'error');
      return;
    }

    const payload = {
      question: normalizedQuestion,
      answer: normalizedAnswer,
      status: formData.status,
      displayOrder,
    };

    setIsSubmitting(true);
    try {
      if (editingFaq) {
        await faqService.updateFaq(editingFaq.id, payload);
        addToast('FAQ updated successfully', 'success');
      } else {
        if (isLimitReached) {
          addToast(FAQ_LIMIT_REACHED_WARNING, 'warning');
          return;
        }
        await faqService.createFaq(payload);
        addToast('New FAQ added successfully', 'success');
      }
      invalidateDashboardStats();
      setIsModalOpen(false);
      fetchFaqs();
    } catch (err) {
      console.error('Failed to save FAQ', err);
      const serverMessage = err.response?.data?.message || 'Failed to save FAQ';
      if (serverMessage.includes('question already exists')) {
        setFieldErrors((prev) => ({
          ...prev,
          question: 'This FAQ question already exists. Please enter a different question.',
        }));
      } else if (serverMessage.includes('answer already exists')) {
        setFieldErrors((prev) => ({
          ...prev,
          answer: 'This FAQ answer already exists.',
        }));
      }
      addToast(serverMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="view-header">
        <div className="view-title-wrap">
          <h2>
            FAQs ({faqCount}/{MAX_FAQ_COUNT})
          </h2>
          <p>Create and update Frequently Asked Questions displayed on the store help page.</p>
          <span className="faq-count-badge">
            Total FAQs: {faqCount} / {MAX_FAQ_COUNT}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" className="action-btn-secondary" onClick={saveOrder} disabled={isSavingOrder || !faqs.length}>
            <FaSave /> {isSavingOrder ? 'Saving...' : 'Save Order'}
          </button>
          <button
            type="button"
            className="action-btn-primary"
            onClick={openAddModal}
            disabled={isLimitReached}
            title={isLimitReached ? FAQ_LIMIT_REACHED_TOOLTIP : 'Add a new FAQ'}
          >
            <FaPlus /> Add FAQ
          </button>
        </div>
      </div>

      {isLimitReached ? (
        <div className="faq-limit-warning" role="status">
          {FAQ_LIMIT_REACHED_WARNING}
        </div>
      ) : null}

      <div className="table-controls">
        <div className="search-box-admin">
          <FaSearch className="search-icon-admin" />
          <input
            type="text"
            placeholder="Search by question or answer..."
            value={searchInput}
            onChange={onSearchChange}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', animation: 'pulse 1.5s infinite ease-in-out' }}>
          <div style={{ height: '30px', width: '200px', background: '#cbd5e1', marginBottom: '20px' }}></div>
          <div style={{ height: '150px', background: '#cbd5e1' }}></div>
        </div>
      ) : filteredFaqs.length > 0 ? (
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
              {filteredFaqs.map((faq) => {
                const index = faqs.findIndex((item) => item.id === faq.id);
                return (
                <tr
                  key={faq.id}
                  draggable={!hasActiveSearch}
                  onDragStart={() => !hasActiveSearch && handleDragStart(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => !hasActiveSearch && handleDrop(index)}
                >
                  <td data-label="Order">
                    <input
                      type="number"
                      min="1"
                      className="admin-order-input"
                      value={orderValues[faq.id] ?? faq.displayOrder ?? faq.order ?? index + 1}
                      onChange={(e) => handleOrderChange(faq.id, e.target.value)}
                      aria-label={`Order for ${stripLeadingNumberFromQuestion(faq.question)}`}
                    />
                  </td>
                  <td data-label="Question" style={{ fontWeight: 600 }}>{stripLeadingNumberFromQuestion(faq.question)}</td>
                  <td data-label="Answer" style={{ color: 'var(--admin-text-sub)' }}>{faq.answer}</td>
                  <td data-label="Status">
                    <span className={`status-badge-admin ${faq.status}`}>{faq.status}</span>
                  </td>
                  <td data-label="Actions">
                    <div className="cell-actions">
                      <button type="button" className="btn-action-cell edit" onClick={() => openEditModal(faq)} title="Edit FAQ">
                        <FaEdit />
                      </button>
                      <button type="button" className="btn-action-cell" onClick={() => moveFaq(index, -1)} title="Move up" disabled={hasActiveSearch}>
                        <FaArrowUp />
                      </button>
                      <button type="button" className="btn-action-cell" onClick={() => moveFaq(index, 1)} title="Move down" disabled={hasActiveSearch}>
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
              );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="dashboard-panel admin-empty-state">
          <FaQuestionCircle className="admin-empty-icon" />
          <h3>{hasActiveSearch ? ADMIN_NO_MATCH_MESSAGE : 'No FAQs found!'}</h3>
          <p>
            {hasActiveSearch
              ? 'Try a different search term.'
              : 'Click "Add FAQ" above to create one.'}
          </p>
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
                  <AdminFieldLabel htmlFor="faq-question" required>
                    Question text
                  </AdminFieldLabel>
                  <input
                    id="faq-question"
                    type="text"
                    name="question"
                    value={formData.question}
                    onChange={handleChange}
                    onBlur={handleFieldBlur}
                    maxLength={FAQ_QUESTION_MAX_LENGTH}
                    required
                    className={fieldErrors.question ? 'admin-input-invalid' : ''}
                    aria-invalid={Boolean(fieldErrors.question)}
                  />
                  <p style={{ marginTop: '6px', fontSize: '0.8rem', color: '#64748b' }}>
                    {formData.question.length} / {FAQ_QUESTION_MAX_LENGTH}
                  </p>
                  {fieldErrors.question ? (
                    <p className="admin-field-error" role="alert">{fieldErrors.question}</p>
                  ) : null}
                </div>
                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="faq-answer" required>
                    Answer text
                  </AdminFieldLabel>
                  <textarea
                    id="faq-answer"
                    name="answer"
                    value={formData.answer}
                    onChange={handleChange}
                    onBlur={handleFieldBlur}
                    rows="4"
                    maxLength={FAQ_ANSWER_MAX_LENGTH}
                    required
                    className={fieldErrors.answer ? 'admin-input-invalid' : ''}
                    aria-invalid={Boolean(fieldErrors.answer)}
                  />
                  <p style={{ marginTop: '6px', fontSize: '0.8rem', color: '#64748b' }}>
                    {formData.answer.length} / {FAQ_ANSWER_MAX_LENGTH}
                  </p>
                  {fieldErrors.answer ? (
                    <p className="admin-field-error" role="alert">{fieldErrors.answer}</p>
                  ) : null}
                </div>
                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="faq-order" required>
                    Order
                  </AdminFieldLabel>
                  <input
                    id="faq-order"
                    type="number"
                    name="displayOrder"
                    min="1"
                    value={formData.displayOrder}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="faq-status">Status</AdminFieldLabel>
                  <select id="faq-status" name="status" value={formData.status} onChange={handleChange}>
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
