import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import SeoHead from './components/SeoHead';
import AdminRoute from './components/AdminRoute';
import ManagerRoute from './components/ManagerRoute';
import { dashboardChildRoutes } from './routes/dashboardChildRoutes';

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
const VacanciesPage = lazy(() => import('./pages/VacanciesPage'));
const CareerApplyPage = lazy(() => import('./pages/CareerApplyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AdminDashboardLayout = lazy(() => import('./pages/admin/AdminDashboardLayout'));

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
              <SeoHead />
              <div className="app">
                <Header />
                <main>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/products" element={<ProductsPage />} />
                      <Route path="/food-corner" element={<FoodCorner />} />
                      <Route path="/contact-us" element={<ContactPage />} />
                      <Route path="/contact" element={<Navigate to="/contact-us" replace />} />
                      <Route path="/about-us" element={<AboutPage />} />
                      <Route path="/about" element={<Navigate to="/about-us" replace />} />
                      <Route path="/faq" element={<FAQPage />} />
                      <Route path="/offers" element={<OffersPage />} />
                      <Route path="/vacancies" element={<VacanciesPage />} />
                      <Route path="/careers/apply/:vacancyId" element={<CareerApplyPage />} />
                      <Route path="/terms" element={<TermsPage />} />
                      <Route path="/privacy" element={<PrivacyPolicyPage />} />

                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/reset-password" element={<ResetPasswordPage />} />
                      <Route path="/register" element={<Navigate to="/login" replace />} />

                      <Route path="/admin" element={<Navigate to="/login" replace />} />
                      <Route path="/admin/" element={<Navigate to="/login" replace />} />
                      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
                      <Route path="/manager" element={<Navigate to="/login" replace />} />
                      <Route path="/manager/" element={<Navigate to="/login" replace />} />

                      <Route
                        path="/admin/dashboard"
                        element={
                          <AdminRoute>
                            <AdminDashboardLayout />
                          </AdminRoute>
                        }
                      >
                        {dashboardChildRoutes}
                      </Route>

                      <Route
                        path="/manager/dashboard"
                        element={
                          <ManagerRoute>
                            <AdminDashboardLayout />
                          </ManagerRoute>
                        }
                      >
                        {dashboardChildRoutes}
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
