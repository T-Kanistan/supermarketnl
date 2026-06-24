import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaShieldAlt, FaSignInAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCMS } from '../context/CMSContext';
import { getImageUrl } from '../services/api';
import { normalizeRole } from '../constants/managerPermissions';
import './Auth.css';

const DASHBOARD_ACCESS_DENIED =
  'Access Denied. You are not authorized to access the dashboard.';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const { login: signIn, logout } = useAuth();
  const { addToast } = useToast();
  const { cmsData } = useCMS();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const storeName = cmsData?.storeName || 'Wins Wereld Winkel';
  const storeLogo = cmsData?.logo ? getImageUrl(cmsData.logo) : '/logo.png';

  useEffect(() => {
    if (searchParams.get('expired') === '1') {
      addToast('Session expired. Please sign in again.', 'error');
    }
  }, [searchParams, addToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAccessDenied(false);

    if (!email.trim() || !password) {
      addToast('Please enter your email and password', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await signIn(email.trim(), password, rememberMe);
      const role = normalizeRole(loggedUser?.role);

      if (role !== 'admin' && role !== 'manager') {
        await logout();
        setAccessDenied(true);
        addToast(DASHBOARD_ACCESS_DENIED, 'error');
        return;
      }

      addToast(`Welcome back, ${loggedUser.name || loggedUser.fullName}!`, 'success');

      const from = location.state?.from?.pathname;
      if (role === 'admin') {
        if (from && from.startsWith('/admin/dashboard')) {
          navigate(from, { replace: true });
        } else {
          navigate('/admin/dashboard', { replace: true });
        }
        return;
      }

      if (role === 'manager') {
        if (from && from.startsWith('/manager/dashboard')) {
          navigate(from, { replace: true });
        } else {
          navigate('/manager/dashboard', { replace: true });
        }
        return;
      }
    } catch (err) {
      addToast(err.message || 'Invalid email or password', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modern-auth-page login-page-enter">
      <div className="auth-split-layout">
        <div className="auth-brand-side">
          <div className="brand-overlay" />
          <div className="brand-content">
            <div className="brand-logo-wrap animate-fade-in-up">
              <img
                src={storeLogo}
                alt={storeName}
                onError={(e) => {
                  e.target.src = '/logo.png';
                }}
              />
            </div>
            <h1 className="brand-welcome animate-fade-in-up delay-1">Welcome Back!</h1>
            <p className="brand-tagline animate-fade-in-up delay-2">
              Secure access for Admins and Managers.
            </p>
            <div className="brand-feature-box animate-fade-in-up delay-3">
              <div className="brand-feature-icon">
                <FaShieldAlt />
              </div>
              <div>
                <strong>Secure Management Portal</strong>
                <p>Manage products, offers, enquiries and store content with ease.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-form-side">
          <div className="auth-form-card animate-fade-in">
            <div className="form-header">
              <h2>Sign In</h2>
              <p>Enter your credentials to access the dashboard.</p>
            </div>

            {accessDenied ? (
              <div className="login-access-denied" role="alert">
                {DASHBOARD_ACCESS_DENIED}
              </div>
            ) : null}

            <form className="modern-auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-with-icon">
                  <FaEnvelope className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-with-icon">
                  <FaLock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember Me
                </label>
                <Link to="/forgot-password" className="forgot-link">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                className={`primary-login-btn brand-login-btn ${isSubmitting ? 'loading' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="loader" />
                ) : (
                  <>
                    <FaSignInAlt className="sign-in-icon" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="social-login-divider">
              <span>OR</span>
            </div>

            <p className="auth-redirect">
              Return to storefront?{' '}
              <Link to="/" onClick={(e) => e.stopPropagation()}>
                Back to Home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
