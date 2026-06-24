export const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters and include uppercase, lowercase, and a number.';

export const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { id: 'upper', label: 'At least 1 uppercase letter', test: (value) => /[A-Z]/.test(value) },
  { id: 'lower', label: 'At least 1 lowercase letter', test: (value) => /[a-z]/.test(value) },
  { id: 'number', label: 'At least 1 number', test: (value) => /[0-9]/.test(value) },
];

export const validatePasswordStrength = (password) => {
  const value = String(password || '');
  const failed = PASSWORD_REQUIREMENTS.find((rule) => !rule.test(value));

  if (failed) {
    return { valid: false, message: PASSWORD_POLICY_MESSAGE };
  }

  return { valid: true, message: '' };
};

export const getPasswordRequirementStatus = (password) =>
  PASSWORD_REQUIREMENTS.map((rule) => ({
    ...rule,
    met: rule.test(String(password || '')),
  }));
