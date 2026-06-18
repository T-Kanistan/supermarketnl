import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Public components & pages
import Header from './components/Header';
import Home from './pages/Home';
import ProductsPage from './pages/ProductsPage';
import FoodCorner from './pages/FoodCorner';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import FAQPage from './pages/FAQPage';
import OffersPage from './pages/OffersPage';
import TermsPage from './pages/TermsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

// Admin components & pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboardLayout from './pages/admin/AdminDashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Admin subviews
import AdminOverview from './pages/admin/views/AdminOverview';
import AdminSiteSettings from './pages/admin/views/AdminSiteSettings';
import AdminBanners from './pages/admin/views/AdminBanners';
import AdminCategories from './pages/admin/views/AdminCategories';
import AdminProducts from './pages/admin/views/AdminProducts';
import AdminFaqs from './pages/admin/views/AdminFaqs';
import AdminTestimonials from './pages/admin/views/AdminTestimonials';
import AdminAnnouncements from './pages/admin/views/AdminAnnouncements';
import AdminMessages from './pages/admin/views/AdminMessages';
import AdminManagers from './pages/admin/views/AdminManagers';
import AdminProfile from './pages/admin/views/AdminProfile';

// Context Providers
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CMSProvider } from './context/CMSContext';
import { EnquiryProvider } from './context/EnquiryContext';

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
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/food-corner" element={<FoodCorner />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/offers" element={<OffersPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  
                  {/* Legacy client logins redirects to admin login */}
                  <Route path="/login" element={<Navigate to="/admin/login" replace />} />
                  <Route path="/register" element={<Navigate to="/admin/login" replace />} />

                  {/* Admin routes */}
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
