import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FaLock, FaEye, FaEyeSlash, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';
import AuthLayout from '../components/AuthLayout';
import {
  getPasswordRequirementStatus,
  PASSWORD_POLICY_MESSAGE,
  validatePasswordStrength,
} from '../utils/passwordPolicy';
import './Auth.css';

const SUCCESS_MESSAGE = 'Password reset successfully. Please login with your new password.';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requirementStatus = useMemo(
    () => getPasswordRequirementStatus(newPassword),
    [newPassword]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token || !email) {
      addToast('Invalid or expired reset link. Please request a new one.', 'error');
      return;
    }

    const passwordCheck = validatePasswordStrength(newPassword);
    if (!passwordCheck.valid) {
      addToast(PASSWORD_POLICY_MESSAGE, 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authService.resetPassword({
        email: decodeURIComponent(email),
        token,
        newPassword,
        confirmPassword,
      });
      addToast(result.message || SUCCESS_MESSAGE, 'success');
      navigate('/login', { replace: true, state: { resetSuccess: true } });
    } catch (error) {
      addToast(error.message || 'Unable to reset password. The link may have expired.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token || !email) {
    return (
      <AuthLayout
        formTitle="Invalid Reset Link"
        formSubtitle="This password reset link is invalid or has expired."
      >
        <p className="auth-redirect auth-back-link">
          <Link to="/forgot-password">Request a new reset link</Link>
        </p>
        <p className="auth-redirect auth-back-link">
          <Link to="/login">
            <FaArrowLeft /> Back to Sign In
          </Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      formTitle="Reset Password"
      formSubtitle="Create a new password for your account. The reset link expires in 15 minutes."
    >
      <form className="modern-auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="new-password">New Password</label>
          <div className="input-with-icon">
            <FaLock className="input-icon" />
            <input
              id="new-password"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowNewPassword(!showNewPassword)}
              aria-label={showNewPassword ? 'Hide password' : 'Show password'}
            >
              {showNewPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <ul className="password-requirements" aria-live="polite">
          {requirementStatus.map((rule) => (
            <li key={rule.id} className={rule.met ? 'met' : ''}>
              <FaCheckCircle aria-hidden="true" />
              <span>{rule.label}</span>
            </li>
          ))}
        </ul>

        <div className="form-group">
          <label htmlFor="confirm-password">Confirm Password</label>
          <div className="input-with-icon">
            <FaLock className="input-icon" />
            <input
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className={`primary-login-btn brand-login-btn ${isSubmitting ? 'loading' : ''}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? <span className="loader" /> : 'Reset Password'}
        </button>
      </form>

      <p className="auth-redirect auth-back-link">
        <Link to="/login">
          <FaArrowLeft /> Back to Sign In
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
