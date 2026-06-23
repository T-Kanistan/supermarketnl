import { FaLock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardHome, normalizeRole } from '../constants/managerPermissions';

const isDashboardRole = (user) => {
  const role = normalizeRole(user?.role);
  return role === 'admin' || role === 'manager';
};

export const AccessDenied = ({ message, title = 'Access Denied' }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleReturn = async () => {
    if (user && isDashboardRole(user)) {
      navigate(getDashboardHome(user));
      return;
    }
    await logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-panel admin-empty-state" style={{ maxWidth: '640px', margin: '40px auto' }}>
      <FaLock className="admin-empty-icon" style={{ color: '#ef4444' }} />
      <h3>{title}</h3>
      <p>{message || 'Unauthorized access. You do not have permission to access this module.'}</p>
      <button
        type="button"
        className="action-btn-primary"
        style={{ marginTop: '20px' }}
        onClick={handleReturn}
      >
        {user && isDashboardRole(user) ? 'Return to Dashboard' : 'Back to Login'}
      </button>
    </div>
  );
};

export default AccessDenied;
