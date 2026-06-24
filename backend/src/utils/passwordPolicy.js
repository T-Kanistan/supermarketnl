export const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters and include uppercase, lowercase, and a number.';

export const validatePasswordStrength = (password) => {
  const value = String(password || '');

  if (value.length < 8) {
    return { valid: false, message: PASSWORD_POLICY_MESSAGE };
  }
  if (!/[A-Z]/.test(value)) {
    return { valid: false, message: PASSWORD_POLICY_MESSAGE };
  }
  if (!/[a-z]/.test(value)) {
    return { valid: false, message: PASSWORD_POLICY_MESSAGE };
  }
  if (!/[0-9]/.test(value)) {
    return { valid: false, message: PASSWORD_POLICY_MESSAGE };
  }

  return { valid: true, message: '' };
};
