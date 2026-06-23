import { FaLock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardHome } from '../constants/managerPermissions';

export const AccessDenied = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="dashboard-panel admin-empty-state" style={{ maxWidth: '640px', margin: '40px auto' }}>
      <FaLock className="admin-empty-icon" style={{ color: '#ef4444' }} />
      <h3>Access Denied</h3>
      <p>Unauthorized access. You do not have permission to access this module.</p>
      <button
        type="button"
        className="action-btn-primary"
        style={{ marginTop: '20px' }}
        onClick={() => navigate(getDashboardHome(user))}
      >
        Return to Dashboard
      </button>
    </div>
  );
};

export default AccessDenied;
