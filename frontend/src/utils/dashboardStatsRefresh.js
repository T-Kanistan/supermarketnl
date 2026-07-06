const DASHBOARD_STATS_INVALIDATE = 'dashboard-stats-invalidate';

export const invalidateDashboardStats = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DASHBOARD_STATS_INVALIDATE));
  }
};

export const subscribeDashboardStatsInvalidation = (callback) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(DASHBOARD_STATS_INVALIDATE, callback);
  return () => window.removeEventListener(DASHBOARD_STATS_INVALIDATE, callback);
};
