import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="admin-loading-screen" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f8fafc',
        color: '#1e3a8a',
        fontFamily: 'sans-serif'
      }}>
        <div className="loader" style={{ borderTopColor: '#3b82f6', width: '40px', height: '40px', borderWidth: '4px', marginBottom: '16px' }}></div>
        <p style={{ fontWeight: 600 }}>Verifying credentials...</p>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save the current location they tried to go to
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // User role is not allowed, redirect to main dashboard
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
