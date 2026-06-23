import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaShieldAlt } from 'react-icons/fa';
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
          <div
            className="brand-overlay"
            style={{
              background:
                'linear-gradient(135deg, rgba(0, 78, 137, 0.65) 0%, rgba(15, 23, 42, 0.95) 100%)',
            }}
          />
          <div className="brand-content">
            <div className="trust-badge animate-fade-in-up">
              <FaShieldAlt className="shield-icon" />
              <span>Secure Management Portal</span>
            </div>
            <h1 className="brand-heading animate-fade-in-up delay-1">{storeName}</h1>
            <p className="brand-subtext animate-fade-in-up delay-2">
              Admin and Manager access to manage products, offers, enquiries, and store content.
            </p>
          </div>
        </div>

        <div className="auth-form-side">
          <div className="auth-form-card animate-fade-in">
            <div className="login-brand-logo">
              <img
                src={storeLogo}
                alt={storeName}
                onError={(e) => {
                  e.target.src = '/logo.png';
                }}
              />
            </div>

            <div className="form-header">
              <h2>Sign In</h2>
              <p>Enter your credentials to access the dashboard.</p>
            </div>

            {accessDenied ? (
              <div
                className="login-access-denied"
                role="alert"
                style={{
                  marginBottom: '20px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontWeight: 600,
                  lineHeight: 1.5,
                }}
              >
                {DASHBOARD_ACCESS_DENIED}
              </div>
            ) : null}

            {import.meta.env.DEV ? (
              <p className="auth-credentials-hint">
                Dev login: <strong>admin@winswereldwinkel.nl</strong> or{' '}
                <strong>admin@store.com</strong> / <strong>Admin@123</strong>
              </p>
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
                    placeholder="admin@winswereldwinkel.nl"
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
                <Link to="/contact" className="forgot-link">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                className={`primary-login-btn brand-login-btn ${isSubmitting ? 'loading' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? <span className="loader" /> : 'Login'}
              </button>
            </form>

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
