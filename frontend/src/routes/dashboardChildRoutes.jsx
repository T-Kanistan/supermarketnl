import { Navigate, Route, useLocation } from 'react-router-dom';
import { lazy } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import { getDashboardBase } from '../constants/managerPermissions';

const AdminOverview = lazy(() => import('../pages/admin/views/AdminOverview'));
const AdminSiteSettings = lazy(() => import('../pages/admin/views/AdminSiteSettings'));
const AdminAboutUs = lazy(() => import('../pages/admin/views/AdminAboutUs'));
const AdminHomepageAbout = lazy(() => import('../pages/admin/views/AdminHomepageAbout'));
const AdminBanners = lazy(() => import('../pages/admin/views/AdminBanners'));
const AdminCategories = lazy(() => import('../pages/admin/views/AdminCategories'));
const AdminFoodCornerCategories = lazy(() => import('../pages/admin/views/AdminFoodCornerCategories'));
const AdminProducts = lazy(() => import('../pages/admin/views/AdminProducts'));
const AdminFaqs = lazy(() => import('../pages/admin/views/AdminFaqs'));
const AdminTestimonials = lazy(() => import('../pages/admin/views/AdminTestimonials'));
const AdminAnnouncements = lazy(() => import('../pages/admin/views/AdminAnnouncements'));
const AdminMessages = lazy(() => import('../pages/admin/views/AdminMessages'));
const AdminJobApplications = lazy(() => import('../pages/admin/views/AdminJobApplications'));
const AdminVacancies = lazy(() => import('../pages/admin/views/AdminVacancies'));
const AdminManagers = lazy(() => import('../pages/admin/views/AdminManagers'));
const AdminProfile = lazy(() => import('../pages/admin/views/AdminProfile'));

const DashboardRedirect = ({ suffix }) => {
  const base = getDashboardBase(useLocation().pathname);
  return <Navigate to={`${base}${suffix}`} replace />;
};

export const dashboardChildRoutes = (
  <>
    <Route index element={<AdminOverview />} />
    <Route path="site-settings" element={<ProtectedRoute adminOnly><AdminSiteSettings /></ProtectedRoute>} />
    <Route path="about-us" element={<ProtectedRoute adminOnly><AdminAboutUs /></ProtectedRoute>} />
    <Route path="homepage-about" element={<AdminHomepageAbout />} />
    <Route path="banners" element={<AdminBanners />} />
    <Route path="categories" element={<ProtectedRoute adminOnly><AdminCategories /></ProtectedRoute>} />
    <Route
      path="food-corner-categories"
      element={
        <ProtectedRoute adminOnly>
          <AdminFoodCornerCategories />
        </ProtectedRoute>
      }
    />
    <Route
      path="food-corner-items"
      element={<DashboardRedirect suffix="/food-corner" />}
    />
    <Route path="food-corner" element={<AdminProducts />} />
    <Route path="products" element={<AdminProducts />} />
    <Route path="faqs" element={<AdminFaqs />} />
    <Route path="testimonials" element={<AdminTestimonials />} />
    <Route path="announcements" element={<AdminAnnouncements />} />
    <Route path="messages" element={<AdminMessages />} />
    <Route path="vacancies" element={<AdminVacancies />} />
    <Route path="job-applications" element={<AdminJobApplications />} />
    <Route path="change-password" element={<DashboardRedirect suffix="/profile" />} />
    <Route
      path="managers"
      element={
        <ProtectedRoute adminOnly>
          <AdminManagers />
        </ProtectedRoute>
      }
    />
    <Route path="profile" element={<AdminProfile />} />
  </>
);
