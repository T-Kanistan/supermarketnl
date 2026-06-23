import { useState, useEffect, useCallback } from 'react';
import {
  FaPlus, FaEdit, FaTrash, FaUsers, FaEye, FaBan, FaCheckCircle, FaUserCircle,
} from 'react-icons/fa';
import managerService from '../../../services/managerService';
import { useToast } from '../../../context/ToastContext';

const emptyForm = {
  fullName: '',
  email: '',
  username: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
  status: true,
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const AdminManagers = () => {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingManager, setEditingManager] = useState(null);
  const [viewingManager, setViewingManager] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const { addToast } = useToast();

  const fetchManagers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await managerService.getManagers();
      setManagers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load managers', err);
      addToast('Failed to load manager accounts', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  const openAddModal = () => {
    setEditingManager(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (mgr) => {
    setEditingManager(mgr);
    setFormData({
      fullName: mgr.fullName || '',
      email: mgr.email || '',
      username: mgr.username || '',
      phoneNumber: mgr.phoneNumber || '',
      password: '',
      confirmPassword: '',
      status: mgr.status !== false,
    });
    setIsModalOpen(true);
  };

  const openViewModal = (mgr) => {
    setViewingManager(mgr);
    setIsViewModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this manager account permanently?')) return;
    try {
      await managerService.deleteManager(id);
      addToast('Manager account deleted successfully', 'success');
      fetchManagers();
    } catch (err) {
      addToast(err.message || 'Failed to delete account', 'error');
    }
  };

  const handleToggleStatus = async (mgr) => {
    try {
      await managerService.toggleManagerStatus(mgr.id, !mgr.status);
      addToast(
        mgr.status ? 'Manager deactivated successfully' : 'Manager activated successfully',
        'success'
      );
      fetchManagers();
    } catch (err) {
      addToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.username) {
      addToast('Full name, email, and username are required', 'error');
      return;
    }

    if (!editingManager) {
      if (!formData.password || formData.password.length < 6) {
        addToast('Password must be at least 6 characters', 'error');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        addToast('Passwords do not match', 'error');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (editingManager) {
        await managerService.updateManager(editingManager.id, {
          fullName: formData.fullName,
          email: formData.email,
          username: formData.username,
          phoneNumber: formData.phoneNumber,
          status: formData.status,
        });
        addToast('Manager updated successfully', 'success');
      } else {
        await managerService.createManager({
          fullName: formData.fullName,
          email: formData.email,
          username: formData.username,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          status: formData.status,
        });
        addToast('Manager created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchManagers();
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Failed to save account', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'M';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div>
      <div className="view-header">
        <div className="view-title-wrap">
          <h2>Manager User Accounts</h2>
          <p>Create and manage manager accounts with role-based access control.</p>
        </div>
        <button type="button" className="action-btn-primary" onClick={openAddModal}>
          <FaPlus /> Create Manager
        </button>
      </div>

      {loading ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', animation: 'pulse 1.5s infinite ease-in-out' }}>
          <div style={{ height: '30px', width: '200px', background: '#cbd5e1', marginBottom: '20px' }} />
          <div style={{ height: '150px', background: '#cbd5e1' }} />
        </div>
      ) : managers.length > 0 ? (
        <div className="table-responsive-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Manager Name</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {managers.map((mgr) => (
                <tr key={mgr.id}>
                  <td>
                    {mgr.profileImage ? (
                      <img
                        src={mgr.profileImage}
                        alt={mgr.fullName}
                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                        }}
                      >
                        {getInitials(mgr.fullName)}
                      </div>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>{mgr.fullName}</td>
                  <td>{mgr.email || '—'}</td>
                  <td>{mgr.phoneNumber || '—'}</td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        background: mgr.status ? '#dcfce7' : '#fee2e2',
                        color: mgr.status ? '#166534' : '#991b1b',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    >
                      {mgr.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{formatDate(mgr.createdAt)}</td>
                  <td>
                    <div className="cell-actions">
                      <button type="button" className="btn-action-cell" onClick={() => openViewModal(mgr)} title="View">
                        <FaEye />
                      </button>
                      <button type="button" className="btn-action-cell edit" onClick={() => openEditModal(mgr)} title="Edit">
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        className="btn-action-cell"
                        onClick={() => handleToggleStatus(mgr)}
                        title={mgr.status ? 'Disable' : 'Enable'}
                      >
                        {mgr.status ? <FaBan /> : <FaCheckCircle />}
                      </button>
                      <button type="button" className="btn-action-cell delete" onClick={() => handleDelete(mgr.id)} title="Delete">
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
          <FaUsers className="admin-empty-icon" />
          <h3>No Managers Found</h3>
          <p>Create a manager account to grant access to catalog, offers, enquiries, and content modules.</p>
        </div>
      )}

      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container">
            <div className="modal-header">
              <h3>{editingManager ? 'Edit Manager' : 'Create Manager Account'}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="admin-form-group">
                  <label htmlFor="fullName">Full Name</label>
                  <input id="fullName" type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
                </div>

                <div className="admin-form-group">
                  <label htmlFor="email">Email Address</label>
                  <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>

                <div className="admin-form-group">
                  <label htmlFor="username">Username</label>
                  <input id="username" type="text" name="username" value={formData.username} onChange={handleChange} required />
                </div>

                <div className="admin-form-group">
                  <label htmlFor="phoneNumber">Phone Number <span style={{ color: '#64748b', fontWeight: 400 }}>(optional)</span></label>
                  <input id="phoneNumber" type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
                </div>

                {!editingManager && (
                  <>
                    <div className="admin-form-group">
                      <label htmlFor="password">Password</label>
                      <input id="password" type="password" name="password" value={formData.password} onChange={handleChange} minLength={6} required />
                    </div>
                    <div className="admin-form-group">
                      <label htmlFor="confirmPassword">Confirm Password</label>
                      <input id="confirmPassword" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} minLength={6} required />
                    </div>
                  </>
                )}

                <div className="admin-form-group">
                  <label htmlFor="status">Status</label>
                  <select id="status" name="status" value={formData.status ? 'active' : 'inactive'} onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value === 'active' }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="action-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingManager ? 'Update Manager' : 'Create Manager'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewModalOpen && viewingManager && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container">
            <div className="modal-header">
              <h3>Manager Details</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsViewModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <FaUserCircle style={{ fontSize: '3rem', color: '#3b82f6' }} />
                <div>
                  <h4 style={{ margin: 0 }}>{viewingManager.fullName}</h4>
                  <span style={{ color: '#64748b' }}>@{viewingManager.username}</span>
                </div>
              </div>
              <p><strong>Email:</strong> {viewingManager.email || '—'}</p>
              <p><strong>Phone:</strong> {viewingManager.phoneNumber || '—'}</p>
              <p><strong>Status:</strong> {viewingManager.status ? 'Active' : 'Inactive'}</p>
              <p><strong>Created:</strong> {formatDate(viewingManager.createdAt)}</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="action-btn-secondary" onClick={() => setIsViewModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagers;
