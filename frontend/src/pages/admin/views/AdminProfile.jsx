import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import accountService from '../../../services/accountService';

export const AdminProfile = () => {
  const { user, changePassword } = useAuth();
  const { addToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        const data = await accountService.getProfile();
        setProfile(data);
      } catch (err) {
        console.error('Failed to load profile', err);
        addToast(err.response?.data?.message || 'Failed to load profile', 'error');
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, [addToast]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.fullName || profile.name || '',
        email: profile.email || '',
      });
    } else if (user) {
      setProfileForm({
        name: user.fullName || user.name || '',
        email: user.email || '',
      });
    }
  }, [profile, user]);

  const displayProfile = profile || user;
  const fullName = displayProfile?.fullName || displayProfile?.name || 'User';
  const email = displayProfile?.email || 'N/A';
  const role = displayProfile?.displayRole || displayProfile?.role || user?.displayRole || user?.role || 'User';
  const accountStatus = displayProfile?.accountStatus || 'Active';
  const securityStatus = displayProfile?.securityStatus || 'Authenticated';

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      addToast('Name and Email are required', 'error');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const updated = await accountService.updateProfile({
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
      });
      setProfile(updated);
      const storage = localStorage.getItem('supermarket_token') ? localStorage : sessionStorage;
      storage.setItem('supermarket_user', JSON.stringify(updated));
      addToast('Profile updated successfully', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Failed to update profile', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const clearPasswordForm = () => {
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      addToast('Please fill in all password fields', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast('New password and confirm password do not match', 'error');
      return;
    }

    if (newPassword.length < 6 || newPassword.length > 50) {
      addToast('New password must be between 6 and 50 characters', 'error');
      return;
    }

    if (currentPassword === newPassword) {
      addToast('New password must not match current password', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      addToast('Password changed successfully', 'success');
      clearPasswordForm();
    } catch (err) {
      addToast(err.message || 'Current password is incorrect', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const securityBadgeStyle =
    securityStatus === 'Authenticated'
      ? { background: '#dcfce7', color: '#15803d' }
      : { background: '#fee2e2', color: '#b91c1c' };

  return (
    <div className="dashboard-grid-two-col">
      <div className="dashboard-panel">
        <h3 className="panel-title">My Account Profile</h3>
        {loadingProfile ? (
          <div style={{ padding: '24px 0', color: '#64748b' }}>Loading profile...</div>
        ) : (
          <form onSubmit={handleProfileSubmit} style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{fullName}</h4>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                  Role Access: {role}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '20px' }}>
              <div className="admin-form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Account Status
                </span>
                <span style={{ fontSize: '0.85rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  {accountStatus}
                </span>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Security Status
                </span>
                <span style={{ fontSize: '0.85rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, ...securityBadgeStyle }}>
                  {securityStatus}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  className={`action-btn-primary ${isUpdatingProfile ? 'disabled' : ''}`}
                  disabled={isUpdatingProfile}
                >
                  {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <div className="dashboard-panel">
        <h3 className="panel-title">Change Password</h3>
        <form onSubmit={handlePasswordSubmit}>
          <div className="admin-form-group">
            <label>Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
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
              placeholder="6–50 characters"
              minLength={6}
              maxLength={50}
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
              minLength={6}
              maxLength={50}
              required
            />
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="action-btn-secondary"
              onClick={() => {
                clearPasswordForm();
                addToast('Password fields cleared', 'info');
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
