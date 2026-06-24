import ProtectedRoute from './ProtectedRoute';

export const ManagerRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['manager']}>{children}</ProtectedRoute>
);

export default ManagerRoute;
