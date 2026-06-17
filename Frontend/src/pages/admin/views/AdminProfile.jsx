import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

export const AdminProfile = () => {
  const { user, changePassword } = useAuth();
  const { addToast } = useToast();

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = passwordForm;

    if (!oldPassword || !newPassword || !confirmPassword) {
      addToast('Please fill in all password fields', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast('New password and confirm password do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      addToast('New password must be at least 6 characters', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(oldPassword, newPassword);
      addToast('Password changed successfully!', 'success');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      addToast(err.message || 'Incorrect old password', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-grid-two-col">
      {/* Profile Details Panel */}
      <div className="dashboard-panel">
        <h3 className="panel-title">My Account Profile</h3>
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              fontSize: '1.75rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{user?.name}</h4>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'capitalize' }}>Role Access: {user?.role}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Full Name</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>{user?.name || 'N/A'}</span>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Email Address</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>{user?.email || 'N/A'}</span>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Security Status</span>
              <span style={{ fontSize: '0.85rem', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>Active & Authenticated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Panel */}
      <div className="dashboard-panel">
        <h3 className="panel-title">Change Password</h3>
        <form onSubmit={handlePasswordSubmit}>
          <div className="admin-form-group">
            <label>Current Password</label>
            <input 
              type="password" 
              name="oldPassword" 
              value={passwordForm.oldPassword} 
              onChange={handlePasswordChange} 
              placeholder="Enter current password" 
              required 
            />
          </div>

          <div className="admin-form-group">
            <label>New Password</label>
            <input 
              type="password" 
              name="newPassword" 
              value={passwordForm.newPassword} 
              onChange={handlePasswordChange} 
              placeholder="Minimum 6 characters" 
              minLength="6"
              required 
            />
          </div>

          <div className="admin-form-group">
            <label>Confirm New Password</label>
            <input 
              type="password" 
              name="confirmPassword" 
              value={passwordForm.confirmPassword} 
              onChange={handlePasswordChange} 
              placeholder="Re-enter new password" 
              minLength="6"
              required 
            />
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button 
              type="button" 
              className="action-btn-secondary"
              onClick={() => {
                setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                addToast('Form fields cleared', 'info');
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={`action-btn-primary ${isSubmitting ? 'disabled' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProfile;
