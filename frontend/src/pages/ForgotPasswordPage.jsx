import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';
import AuthLayout from '../components/AuthLayout';
import './Auth.css';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      addToast('Please enter your registered email address', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authService.forgotPassword(email.trim());
      setSubmitted(true);
      addToast(result.message || 'Password reset link has been sent to your email.', 'success');
    } catch (error) {
      addToast(error.message || 'Unable to send reset email. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      formTitle="Forgot Password"
      formSubtitle={
        submitted
          ? 'Check your inbox for a password reset link. The link expires in 15 minutes.'
          : 'Enter your registered email address and we will send you a reset link.'
      }
    >
      {!submitted ? (
        <form className="modern-auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="forgot-email">Email Address</label>
            <div className="input-with-icon">
              <FaEnvelope className="input-icon" />
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className={`primary-login-btn brand-login-btn ${isSubmitting ? 'loading' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? <span className="loader" /> : 'Send Reset Link'}
          </button>
        </form>
      ) : (
        <p className="auth-success-note">
          Did not receive an email? Check your spam folder or try again in a few minutes.
        </p>
      )}

      <p className="auth-redirect auth-back-link">
        <Link to="/login">
          <FaArrowLeft /> Back to Sign In
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
