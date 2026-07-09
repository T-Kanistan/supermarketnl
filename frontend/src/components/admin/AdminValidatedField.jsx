import {
  boundAdminText,
  formatCharCounter,
  sanitizeAdminText,
} from '../../utils/adminTextValidation';
import AdminFieldLabel from './AdminFieldLabel';

const AdminValidatedField = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error = '',
  maxLength,
  minLength,
  required = false,
  optional = false,
  type = 'text',
  as = 'input',
  rows = 3,
  placeholder = '',
  id,
  showCounter = true,
  sanitizeOnBlur = true,
  className = '',
}) => {
  const fieldId = id || name;
  const isInvalid = Boolean(error);

  const handleChange = (e) => {
    let nextValue = e.target.value;
    if (maxLength) nextValue = boundAdminText(nextValue, maxLength);
    onChange(name, nextValue);
  };

  const handleBlur = () => {
    if (sanitizeOnBlur && onBlur) {
      onBlur(name, sanitizeAdminText(value));
    } else if (onBlur) {
      onBlur(name, value);
    }
  };

  const inputClassName = [className, isInvalid ? 'admin-input-invalid' : ''].filter(Boolean).join(' ');

  const commonProps = {
    id: fieldId,
    name,
    value: value ?? '',
    onChange: handleChange,
    onBlur: handleBlur,
    placeholder,
    required,
    className: inputClassName,
    'aria-invalid': isInvalid ? 'true' : undefined,
    ...(maxLength ? { maxLength } : {}),
    ...(minLength ? { minLength } : {}),
  };

  return (
    <div className="admin-form-group">
      {label ? (
        <AdminFieldLabel htmlFor={fieldId} required={required} optional={optional}>
          {label}
        </AdminFieldLabel>
      ) : null}
      {as === 'textarea' ? (
        <textarea {...commonProps} rows={rows} />
      ) : (
        <input type={type} {...commonProps} />
      )}
      <div className="admin-field-meta">
        {error ? (
          <p className="admin-field-error" role="alert">
            {error}
          </p>
        ) : (
          <span />
        )}
        {showCounter && maxLength ? (
          <span className="admin-char-counter">{formatCharCounter(value, maxLength)}</span>
        ) : null}
      </div>
    </div>
  );
};

export default AdminValidatedField;
