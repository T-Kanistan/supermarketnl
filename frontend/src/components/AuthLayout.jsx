import { FaShieldAlt } from 'react-icons/fa';
import { useCMS } from '../context/CMSContext';
import { getImageUrl } from '../services/api';

const AuthLayout = ({ formTitle, formSubtitle, children }) => {
  const { cmsData } = useCMS();
  const storeName = cmsData?.storeName || 'Wins Wereld Winkel';
  const storeLogo = cmsData?.logo ? getImageUrl(cmsData.logo) : '/logo.png';

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
              <h2>{formTitle}</h2>
              {formSubtitle ? <p>{formSubtitle}</p> : null}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
