/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import { hasPermission, isManagerRole, isSuperAdmin, normalizeRole } from '../constants/managerPermissions';

const normalizeUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    role: normalizeRole(user.role) || user.role,
    displayRole: user.displayRole || user.role,
  };
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(normalizeUser(currentUser));
      } catch (err) {
        console.error('Auth verification failed:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (loginValue, password, rememberMe = true) => {
    setLoading(true);
    try {
      const loggedUser = await authService.login(loginValue, password, rememberMe);
      const normalizedUser = normalizeUser(loggedUser);
      setUser(normalizedUser);
      return normalizedUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    return await authService.changePassword(currentPassword, newPassword, confirmPassword);
  };

  const displayName = user?.name || user?.fullName || 'User';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        changePassword,
        displayName,
        isAdmin: isSuperAdmin(user),
        isManager: isManagerRole(user),
        can: (permission) => hasPermission(user, permission),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
