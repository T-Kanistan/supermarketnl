import { useState, useEffect, useCallback, useMemo } from 'react';
import { FaTrash, FaBriefcase, FaDownload } from 'react-icons/fa';
import jobApplicationService from '../../../services/jobApplicationService';
import { getImageUrl } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'New Application' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'hired', label: 'Hired' },
];

const STATUS_FILTERS = [{ value: 'all', label: 'All Statuses' }, ...STATUS_OPTIONS];

const formatStatusLabel = (status) =>
  STATUS_OPTIONS.find((item) => item.value === status)?.label || status;

export const AdminJobApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const { addToast } = useToast();
  const { isAdmin } = useAuth();

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const data = await jobApplicationService.getApplications(params);
      setApplications(
        [...data].sort(
          (a, b) => new Date(b.appliedDate || b.createdAt) - new Date(a.appliedDate || a.createdAt)
        )
      );
    } catch (err) {
      console.error('Failed to load job applications', err);
      addToast('Failed to load job applications', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, statusFilter, search]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const pendingCount = useMemo(
    () => applications.filter((item) => item.status === 'pending').length,
    [applications]
  );

  const handleStatusChange = async (application, status) => {
    try {
      const updated = await jobApplicationService.updateStatus(application.id, status);
      addToast('Application status updated', 'success');
      setApplications((prev) => prev.map((item) => (item.id === application.id ? updated : item)));
      if (selected?.id === application.id) setSelected(updated);
    } catch (err) {
      console.error('Failed to update application status', err);
      addToast('Failed to update application status', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm('Delete this job application?')) return;
    try {
      await jobApplicationService.deleteApplication(id);
      addToast('Application deleted', 'success');
      if (selected?.id === id) setSelected(null);
      setApplications((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Failed to delete application', err);
      addToast(err.response?.data?.message || 'Failed to delete application', 'error');
    }
  };

  return (
    <div className="dashboard-panel" style={{ padding: 0 }}>
      <div className="dashboard-panel-header" style={{ padding: '24px' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FaBriefcase /> Job Applications
          </h2>
          <p style={{ color: '#64748b', marginTop: 6 }}>
            Manage vacancy applications submitted from the careers page.
            {pendingCount > 0 ? ` ${pendingCount} new application${pendingCount === 1 ? '' : 's'}.` : ''}
          </p>
        </div>
      </div>

      <div style={{ padding: '0 24px 16px', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-filter-select"
        >
          {STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Search applicant, job, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-search-input"
          style={{ minWidth: 260 }}
        />
      </div>

      {loading ? (
        <p style={{ padding: 24 }}>Loading applications...</p>
      ) : applications.length === 0 ? (
        <p style={{ padding: 24, color: '#64748b' }}>No job applications found.</p>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Applicant Name</th>
                <th>Vacancy</th>
                <th>Department</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Applied Date</th>
                <th>Status</th>
                <th>CV Download</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td data-label="Applicant Name" style={{ fontWeight: 600 }}>{app.applicantName}</td>
                  <td data-label="Vacancy">{app.jobTitle}</td>
                  <td data-label="Department">{app.department || '—'}</td>
                  <td data-label="Email">{app.email}</td>
                  <td data-label="Phone">{app.phoneNumber}</td>
                  <td data-label="Applied Date">{new Date(app.appliedDate || app.createdAt).toLocaleString()}</td>
                  <td data-label="Status">
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app, e.target.value)}
                      className="admin-status-select"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </td>
                  <td data-label="CV">
                    {app.cvFile ? (
                      <a
                        href={getImageUrl(app.cvFile)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-link-btn"
                      >
                        <FaDownload /> Download
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td data-label="Actions">
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className="btn-action-cell view"
                        onClick={() => setSelected(app)}
                        title="View details"
                      >
                        View
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          className="btn-action-cell delete"
                          onClick={() => handleDelete(app.id)}
                          title="Delete application"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="admin-modal-overlay" onClick={() => setSelected(null)}>
          <div className="admin-modal-container message-view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selected.applicantName}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setSelected(null)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="modal-body message-view-body">
              <div className="message-view-meta">
                <div><strong>Job:</strong> {selected.jobTitle}</div>
                <div><strong>Department:</strong> {selected.department || '—'}</div>
                <div><strong>Email:</strong> {selected.email}</div>
                <div><strong>Phone:</strong> {selected.phoneNumber}</div>
                <div><strong>Address:</strong> {selected.address || '—'}</div>
                <div>
                  <strong>Status:</strong>{' '}
                  <span className={`status-badge-admin ${selected.status}`}>
                    {formatStatusLabel(selected.status)}
                  </span>
                </div>
                <div>
                  <strong>Applied:</strong>{' '}
                  {new Date(selected.appliedDate || selected.createdAt).toLocaleString()}
                </div>
              </div>
              {selected.cvFile && (
                <div className="message-view-content">
                  <strong>CV / Resume</strong>
                  <p>
                    <a
                      href={getImageUrl(selected.cvFile)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-link-btn"
                    >
                      <FaDownload /> Download CV
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminJobApplications;
