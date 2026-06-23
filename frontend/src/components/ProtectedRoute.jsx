import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccessDenied from './AccessDenied';
import {
  canManagerAccessRoute,
  getDashboardHome,
  getDashboardRouteSegment,
  isManagerRole,
  isSuperAdmin,
  normalizeRole,
} from '../constants/managerPermissions';

export const ProtectedRoute = ({ children, adminOnly = false, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="admin-loading-screen"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#f8fafc',
          color: '#1e3a8a',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          className="loader"
          style={{
            borderTopColor: '#3b82f6',
            width: '40px',
            height: '40px',
            borderWidth: '4px',
            marginBottom: '16px',
          }}
        />
        <p style={{ fontWeight: 600 }}>Verifying credentials...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles?.length) {
    const role = normalizeRole(user.role);
    const normalizedAllowed = allowedRoles.map(normalizeRole);
    if (!normalizedAllowed.includes(role)) {
      return <Navigate to={getDashboardHome(user)} replace />;
    }
  }

  const onAdminDashboard = location.pathname.startsWith('/admin/dashboard');
  const onManagerDashboard = location.pathname.startsWith('/manager/dashboard');

  if (onAdminDashboard && isManagerRole(user)) {
    return <Navigate to="/manager/dashboard" replace />;
  }

  if (onManagerDashboard && isSuperAdmin(user)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (adminOnly && !isSuperAdmin(user)) {
    return <AccessDenied />;
  }

  if (isManagerRole(user)) {
    const routeSegment = getDashboardRouteSegment(location.pathname);
    if (!canManagerAccessRoute(routeSegment)) {
      return <AccessDenied />;
    }
  }

  return children;
};

export default ProtectedRoute;
