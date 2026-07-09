const AdminFieldLabel = ({
  htmlFor,
  children,
  required = false,
  optional = false,
  className = '',
}) => (
  <label htmlFor={htmlFor} className={className}>
    {children}
    {required ? (
      <span className="admin-field-required" aria-hidden="true">
        {' '}
        *
      </span>
    ) : null}
    {!required && optional ? (
      <span className="admin-field-optional"> (Optional)</span>
    ) : null}
  </label>
);

export default AdminFieldLabel;
