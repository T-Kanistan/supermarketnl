import AdminFieldLabel from './AdminFieldLabel';

const AdminFormGroup = ({
  label,
  htmlFor,
  required = false,
  optional = false,
  error = '',
  children,
  className = '',
  meta,
}) => (
  <div className={`admin-form-group ${className}`.trim()}>
    {label ? (
      <AdminFieldLabel htmlFor={htmlFor} required={required} optional={optional}>
        {label}
      </AdminFieldLabel>
    ) : null}
    {children}
    {error ? (
      <p className="admin-field-error" role="alert">
        {error}
      </p>
    ) : null}
    {meta || null}
  </div>
);

export default AdminFormGroup;
