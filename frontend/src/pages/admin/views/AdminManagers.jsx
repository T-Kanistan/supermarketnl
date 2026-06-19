import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaKey, FaUsers } from 'react-icons/fa';
import authService from '../../../services/authService';
import { useToast } from '../../../context/ToastContext';

export const AdminManagers = () => {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editingManager, setEditingManager] = useState(null);
  const [targetManager, setTargetManager] = useState(null);

  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    password: '',
  });

  const fetchManagers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authService.getManagers();
      setManagers(data);
    } catch (err) {
      console.error('Failed to load managers', err);
      addToast('Failed to load managers accounts', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    let isMounted = true;
    const initManagers = async () => {
      await Promise.resolve();
      if (isMounted) {
        fetchManagers();
      }
    };
    initManagers();
    return () => { isMounted = false; };
  }, [fetchManagers]);

  const openAddModal = () => {
    setEditingManager(null);
    setFormData({
      name: '',
      email: '',
      password: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (mgr) => {
    setEditingManager(mgr);
    setFormData({
      name: mgr.name || '',
      email: mgr.email || '',
      password: '', // do not display password
    });
    setIsModalOpen(true);
  };

  const openPasswordModal = (mgr) => {
    setTargetManager(mgr);
    setPasswordForm({ password: '' });
    setIsPasswordModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ password: e.target.value });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this manager account permanently?')) return;
    try {
      await authService.deleteManager(id);
      addToast('Manager account deleted successfully', 'success');
      fetchManagers();
    } catch (err) {
      console.error('Failed to delete manager', err);
      addToast('Failed to delete account', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      addToast('Name and Email are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingManager) {
        await authService.updateManager(editingManager.id, {
          name: formData.name,
          email: formData.email,
        });
        addToast('Manager details updated successfully', 'success');
      } else {
        if (!formData.password) {
          addToast('Password is required when creating an account', 'error');
          setIsSubmitting(false);
          return;
        }
        await authService.createManager(formData);
        addToast('New manager created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchManagers();
    } catch (err) {
      console.error('Failed to save manager', err);
      addToast(err.message || 'Failed to save account', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.password) {
      addToast('Please enter a new password', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.resetManagerPassword(targetManager.id, passwordForm.password);
      addToast(`Password reset successfully for "${targetManager.name}"`, 'success');
      setIsPasswordModalOpen(false);
    } catch (err) {
      console.error('Failed to reset password', err);
      addToast('Failed to reset password', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="view-header">
        <div className="view-title-wrap">
          <h2>Manager User Accounts</h2>
          <p>Configure access control and credentials for manager-level operators.</p>
        </div>
        <button className="action-btn-primary" onClick={openAddModal}>
          <FaPlus /> Create Manager
        </button>
      </div>

      {loading ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', animation: 'pulse 1.5s infinite ease-in-out' }}>
          <div style={{ height: '30px', width: '200px', background: '#cbd5e1', marginBottom: '20px' }}></div>
          <div style={{ height: '150px', background: '#cbd5e1' }}></div>
        </div>
      ) : managers.length > 0 ? (
        <div className="table-responsive-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Manager Name</th>
                <th>Email Address</th>
                <th>Role Access</th>
                <th>Password Operations</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {managers.map((mgr) => (
                <tr key={mgr.id}>
                  <td style={{ fontWeight: 600 }}>{mgr.name}</td>
                  <td>{mgr.email}</td>
                  <td>
                    <span style={{ fontSize: '0.8rem', background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '12px', fontWeight: 600, textTransform: 'capitalize' }}>
                      {mgr.role}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="action-btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => openPasswordModal(mgr)}
                    >
                      <FaKey style={{ fontSize: '0.75rem' }} /> Reset Password
                    </button>
                  </td>
                  <td>
                    <div className="cell-actions">
                      <button className="btn-action-cell edit" onClick={() => openEditModal(mgr)} title="Edit Manager">
                        <FaEdit />
                      </button>
                      <button className="btn-action-cell delete" onClick={() => handleDelete(mgr.id)} title="Delete Manager">
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
          <h3>No managers registered!</h3>
          <p>Click "Create Manager" above to authorize an operator account.</p>
        </div>
      )}

      {/* Add / Edit Manager Modal */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container">
            <div className="modal-header">
              <h3>{editingManager ? 'Edit Manager Details' : 'Create Manager Account'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="admin-form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder="e.g. John Manager" 
                    required 
                  />
                </div>

                <div className="admin-form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    placeholder="manager@supermarket.com" 
                    required 
                  />
                </div>

                {!editingManager && (
                  <div className="admin-form-group">
                    <label>Account Password</label>
                    <input 
                      type="password" 
                      name="password" 
                      value={formData.password} 
                      onChange={handleChange} 
                      placeholder="Minimum 6 characters" 
                      minLength="6"
                      required 
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="action-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isPasswordModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container">
            <div className="modal-header">
              <h3>Reset Password for: {targetManager?.name}</h3>
              <button className="modal-close-btn" onClick={() => setIsPasswordModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleResetPasswordSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '20px' }}>
                  Please enter a new password for <strong>{targetManager?.email}</strong>.
                </p>
                <div className="admin-form-group">
                  <label>New Password</label>
                  <input 
                    type="password" 
                    value={passwordForm.password} 
                    onChange={handlePasswordChange} 
                    placeholder="Enter new password" 
                    minLength="6"
                    required 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" onClick={() => setIsPasswordModalOpen(false)}>Cancel</button>
                <button type="submit" className="action-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagers;
