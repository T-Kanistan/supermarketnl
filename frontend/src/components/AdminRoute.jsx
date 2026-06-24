import ProtectedRoute from './ProtectedRoute';

export const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>
);

export default AdminRoute;
