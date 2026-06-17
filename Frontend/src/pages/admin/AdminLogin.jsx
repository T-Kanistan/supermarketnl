import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaShieldAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import '../Auth.css'; // Reuse the existing premium auth styles

export const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please enter both email and password', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await login(email, password);
      addToast(`Welcome back, ${loggedUser.name}!`, 'success');
      
      // Navigate to the page they tried to visit, or dashboard
      const origin = location.state?.from?.pathname || '/admin/dashboard';
      navigate(origin, { replace: true });
    } catch (err) {
      addToast(err.message || 'Login failed. Please verify credentials.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modern-auth-page" style={{ paddingTop: '40px' }}>
      <div className="auth-split-layout">
        
        {/* Left Side: Branding */}
        <div className="auth-brand-side">
          <div className="brand-overlay" style={{ background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.6) 0%, rgba(15, 23, 42, 0.95) 100%)' }}></div>
          <div className="brand-content">
            <div className="trust-badge animate-fade-in-up">
              <FaShieldAlt className="shield-icon" />
              <span>Supermarket Management Console</span>
            </div>
            <h1 className="brand-heading animate-fade-in-up delay-1">Admin Portal</h1>
            <p className="brand-subtext animate-fade-in-up delay-2">
              Log in to update site catalogs, manage banner promotions, view client enquiries, and configure system CMS settings.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="auth-form-side">
          <div className="auth-form-card animate-fade-in">
            <div className="form-header">
              <h2>Sign In</h2>
              <p>Enter your credentials to access the console.</p>
            </div>

            <form className="modern-auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-with-icon">
                  <FaEnvelope className="input-icon" />
                  <input 
                    type="email" 
                    id="email" 
                    placeholder="admin@supermarket.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-with-icon">
                  <FaLock className="input-icon" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="password" 
                    placeholder="Enter your password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className={`primary-login-btn ${isSubmitting ? 'loading' : ''}`} 
                disabled={isSubmitting}
                style={{ marginTop: '20px' }}
              >
                {isSubmitting ? <span className="loader"></span> : 'Secure Sign In'}
              </button>
            </form>
            
            <p className="auth-redirect" style={{ marginTop: '30px' }}>
              Are you a client? <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} style={{ color: 'var(--primary-green)', fontWeight: 600 }}>Return to Storefront</a>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
