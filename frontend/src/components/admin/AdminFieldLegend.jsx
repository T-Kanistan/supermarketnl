const AdminFieldLegend = ({ children, required = false, optional = false, className = '' }) => (
  <span className={`admin-form-field-title ${className}`.trim()}>
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
  </span>
);

export default AdminFieldLegend;
