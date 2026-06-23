export const MANAGER_PERMISSIONS = ['products', 'offers', 'enquiries', 'content'];

export const ADMIN_ONLY_DASHBOARD_ROUTES = [
  'site-settings',
  'categories',
  'food-corner-categories',
  'managers',
];

export const MANAGER_ALLOWED_DASHBOARD_ROUTES = [
  '',
  'products',
  'food-corner-items',
  'announcements',
  'messages',
  'vacancies',
  'job-applications',
  'banners',
  'homepage-about',
  'faqs',
  'testimonials',
  'profile',
  'change-password',
];

export const normalizeRole = (role) => {
  const raw = String(role || '').trim().toLowerCase();
  if (!raw) return '';
  if (raw === 'admin' || raw === 'super_admin' || raw === 'superadmin' || raw === 'super admin') {
    return 'admin';
  }
  if (raw === 'manager') return 'manager';
  return raw;
};

export const isSuperAdmin = (user) => {
  if (!user) return false;
  if (user.permissions?.includes('*')) return true;
  return normalizeRole(user.role) === 'admin';
};

export const isManagerRole = (user) => normalizeRole(user?.role) === 'manager';

export const getDashboardBase = (pathname = '') =>
  pathname.startsWith('/manager/dashboard') ? '/manager/dashboard' : '/admin/dashboard';

export const getDashboardHome = (user) =>
  isManagerRole(user) ? '/manager/dashboard' : '/admin/dashboard';

export const getDashboardRouteSegment = (pathname = '') => {
  const normalized = pathname.replace(/\/$/, '');
  for (const root of ['/admin/dashboard', '/manager/dashboard']) {
    if (normalized === root) return '';
    if (normalized.startsWith(`${root}/`)) {
      const remainder = normalized.slice(root.length + 1);
      return remainder.split('/')[0] || '';
    }
  }
  return '';
};

export const canManagerAccessRoute = (routeSegment) => {
  if (!routeSegment || routeSegment === '') return true;
  return MANAGER_ALLOWED_DASHBOARD_ROUTES.includes(routeSegment);
};

export const hasPermission = (user, permission) => {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  return user.permissions?.includes(permission);
};
