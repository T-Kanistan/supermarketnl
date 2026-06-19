import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';

import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CMSProvider } from './context/CMSContext';
import { EnquiryProvider } from './context/EnquiryContext';

const Home = lazy(() => import('./pages/Home'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const FoodCorner = lazy(() => import('./pages/FoodCorner'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const OffersPage = lazy(() => import('./pages/OffersPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboardLayout = lazy(() => import('./pages/admin/AdminDashboardLayout'));
const AdminOverview = lazy(() => import('./pages/admin/views/AdminOverview'));
const AdminSiteSettings = lazy(() => import('./pages/admin/views/AdminSiteSettings'));
const AdminHomepageAbout = lazy(() => import('./pages/admin/views/AdminHomepageAbout'));
const AdminBanners = lazy(() => import('./pages/admin/views/AdminBanners'));
const AdminCategories = lazy(() => import('./pages/admin/views/AdminCategories'));
const AdminProducts = lazy(() => import('./pages/admin/views/AdminProducts'));
const AdminFaqs = lazy(() => import('./pages/admin/views/AdminFaqs'));
const AdminTestimonials = lazy(() => import('./pages/admin/views/AdminTestimonials'));
const AdminAnnouncements = lazy(() => import('./pages/admin/views/AdminAnnouncements'));
const AdminMessages = lazy(() => import('./pages/admin/views/AdminMessages'));
const AdminManagers = lazy(() => import('./pages/admin/views/AdminManagers'));
const AdminProfile = lazy(() => import('./pages/admin/views/AdminProfile'));

const PageLoader = () => (
  <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
);

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CMSProvider>
          <EnquiryProvider>
            <Router>
              <ScrollToTop />
              <div className="app">
                <Header />
                <main>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/products" element={<ProductsPage />} />
                      <Route path="/food-corner" element={<FoodCorner />} />
                      <Route path="/contact" element={<ContactPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/faq" element={<FAQPage />} />
                      <Route path="/offers" element={<OffersPage />} />
                      <Route path="/terms" element={<TermsPage />} />
                      <Route path="/privacy" element={<PrivacyPolicyPage />} />

                      <Route path="/login" element={<Navigate to="/admin/login" replace />} />
                      <Route path="/register" element={<Navigate to="/admin/login" replace />} />

                      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
                      <Route path="/admin/" element={<Navigate to="/admin/login" replace />} />
                      <Route path="/admin/login" element={<AdminLogin />} />
                      <Route
                        path="/admin/dashboard"
                        element={
                          <ProtectedRoute>
                            <AdminDashboardLayout />
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<AdminOverview />} />
                        <Route path="site-settings" element={<AdminSiteSettings />} />
                        <Route path="homepage-about" element={<AdminHomepageAbout />} />
                        <Route path="banners" element={<AdminBanners />} />
                        <Route path="categories" element={<AdminCategories />} />
                        <Route path="products" element={<AdminProducts />} />
                        <Route path="faqs" element={<AdminFaqs />} />
                        <Route path="testimonials" element={<AdminTestimonials />} />
                        <Route path="announcements" element={<AdminAnnouncements />} />
                        <Route path="messages" element={<AdminMessages />} />
                        <Route
                          path="managers"
                          element={
                            <ProtectedRoute allowedRoles={['admin']}>
                              <AdminManagers />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="profile" element={<AdminProfile />} />
                      </Route>
                    </Routes>
                  </Suspense>
                </main>
                <Footer />
              </div>
            </Router>
          </EnquiryProvider>
        </CMSProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
