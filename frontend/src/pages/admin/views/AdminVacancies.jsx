import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaPlus,
  FaBriefcase,
  FaCheckCircle,
  FaPauseCircle,
  FaTimesCircle,
  FaFilter,
  FaEdit,
  FaCalendarAlt,
  FaPause,
  FaTrash,
  FaEye,
  FaFileAlt,
  FaCheck,
  FaDownload,
} from 'react-icons/fa';
import adminVacancyService from '../../../services/adminVacancyService';
import jobApplicationService from '../../../services/jobApplicationService';
import { getImageUrl } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import useAdminSearch from '../../../hooks/useAdminSearch';
import { ADMIN_NO_MATCH_MESSAGE } from '../../../utils/adminSearch';
import {
  ADMIN_TEXT_LIMITS,
  boundAdminText,
  formatCharCounter,
  sanitizeAdminText,
  validateAdminText,
} from '../../../utils/adminTextValidation';
import AdminFieldLegend from '../../../components/admin/AdminFieldLegend';
import './AdminVacancies.css';

const {
  vacancyTitle,
  vacancyLocation,
  vacancyEmploymentType,
  vacancyWorkingDays,
  vacancyWorkingHours,
  vacancyDescription,
} = ADMIN_TEXT_LIMITS;

const validateVacancyForm = (data) => {
  const errors = {};

  const titleError = validateAdminText(data.title, {
    required: true,
    max: vacancyTitle.max,
    requiredMessage: 'Job title is required',
    maxMessage: `Job title cannot exceed ${vacancyTitle.max} characters`,
  });
  if (titleError) errors.title = titleError;

  const locationError = validateAdminText(data.location, {
    required: true,
    max: vacancyLocation.max,
    requiredMessage: 'Location is required',
    maxMessage: `Location cannot exceed ${vacancyLocation.max} characters`,
  });
  if (locationError) errors.location = locationError;

  const employmentTypeError = validateAdminText(data.employmentType, {
    required: true,
    max: vacancyEmploymentType.max,
    requiredMessage: 'Employment type is required',
    maxMessage: `Employment type cannot exceed ${vacancyEmploymentType.max} characters`,
  });
  if (employmentTypeError) errors.employmentType = employmentTypeError;

  const workingDaysError = validateAdminText(data.workingDays, {
    max: vacancyWorkingDays.max,
    maxMessage: `Working days cannot exceed ${vacancyWorkingDays.max} characters`,
  });
  if (workingDaysError) errors.workingDays = workingDaysError;

  const workingHoursError = validateAdminText(data.workingHours, {
    max: vacancyWorkingHours.max,
    maxMessage: `Working hours cannot exceed ${vacancyWorkingHours.max} characters`,
  });
  if (workingHoursError) errors.workingHours = workingHoursError;

  const descriptionError = validateAdminText(data.description, {
    required: true,
    max: vacancyDescription.max,
    requiredMessage: 'Job description is required',
    maxMessage: `Job description cannot exceed ${vacancyDescription.max} characters`,
    collapse: false,
  });
  if (descriptionError) errors.description = descriptionError;

  return errors;
};

const VACANCIES_PER_PAGE = 8;
const APPLICATIONS_PREVIEW = 6;

const DEPARTMENT_OPTIONS = [
  { value: 'all', label: 'All Departments' },
  { value: 'supermarket', label: 'Supermarket' },
  { value: 'food-corner', label: 'Food Corner' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Extended', label: 'Extended' },
  { value: 'Closed', label: 'Closed' },
  { value: 'Hired', label: 'Hired' },
];

const EMPLOYMENT_TYPES = ['Full Time', 'Part Time'];
const DEPARTMENTS = ['Supermarket', 'Food Corner'];

const emptyForm = () => ({
  title: '',
  department: 'Supermarket',
  employmentType: 'Full Time',
  status: 'Active',
  location: 'Hilversum, Netherlands',
  workingDays: 'Monday – Saturday',
  workingHours: '08:00 AM – 10:00 PM',
  cvRequired: true,
  closingDate: '',
  summary: '',
  description: '',
  icon: 'cashier',
});

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getTodayInputDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toInputDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isClosingDateValid = (closingDate, originalClosingDate = '') => {
  if (!closingDate) return true;

  const original = toInputDate(originalClosingDate);
  if (original && closingDate === original) {
    return true;
  }

  const selected = new Date(`${closingDate}T12:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selected.setHours(0, 0, 0, 0);
  return selected >= today;
};

const vacancyStatusClass = (status) => String(status || '').toLowerCase();

const appStatusMeta = (status) => {
  switch (status) {
    case 'pending':
      return { label: 'New Application', className: 'new' };
    case 'reviewed':
      return { label: 'Under Review', className: 'review' };
    case 'shortlisted':
      return { label: 'Shortlisted', className: 'shortlisted' };
    case 'hired':
      return { label: 'Hired', className: 'hired' };
    case 'rejected':
      return { label: 'Rejected', className: 'rejected' };
    default:
      return { label: status, className: 'review' };
  }
};

export const AdminVacancies = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const initialLoadDone = useRef(false);

  const scrollPageToTop = useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.querySelector('.admin-content-body')?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, closed: 0 });
  const [vacancies, setVacancies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { searchInput, searchQuery, onSearchChange, applySearchNow, hasActiveSearch } = useAdminSearch();
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (departmentFilter !== 'all') params.department = departmentFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const [statsData, vacancyData, applicationData] = await Promise.all([
        adminVacancyService.getStats(),
        adminVacancyService.getVacancies(params),
        jobApplicationService.getApplications(),
      ]);

      setStats(statsData || { total: 0, active: 0, inactive: 0, closed: 0 });
      setVacancies(Array.isArray(vacancyData) ? vacancyData : []);
      setApplications(Array.isArray(applicationData) ? applicationData : []);
    } catch (error) {
      console.error('Failed to load vacancy management data', error);
      addToast('Failed to load vacancy management data', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, searchQuery, departmentFilter, statusFilter]);

  useEffect(() => {
    initialLoadDone.current = false;
    scrollPageToTop();
  }, [location.pathname, scrollPageToTop]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!loading && !initialLoadDone.current) {
      initialLoadDone.current = true;
      requestAnimationFrame(() => {
        scrollPageToTop();
      });
    }
  }, [loading, scrollPageToTop]);

  useEffect(() => {
    setCurrentPage(1);
  }, [departmentFilter, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(vacancies.length / VACANCIES_PER_PAGE));
  const paginatedVacancies = useMemo(() => {
    const start = (currentPage - 1) * VACANCIES_PER_PAGE;
    return vacancies.slice(start, start + VACANCIES_PER_PAGE);
  }, [vacancies, currentPage]);

  const recentApplications = useMemo(
    () =>
      [...applications]
        .sort((a, b) => new Date(b.appliedDate || b.createdAt) - new Date(a.appliedDate || a.createdAt))
        .slice(0, APPLICATIONS_PREVIEW),
    [applications]
  );

  const openCreateModal = () => {
    setEditingVacancy(null);
    setFormData(emptyForm());
    setFieldErrors({});
    setModalOpen(true);
  };

  const openEditModal = (vacancy) => {
    setEditingVacancy(vacancy);
    setFormData({
      title: vacancy.title || '',
      department: vacancy.departmentLabel || 'Supermarket',
      employmentType: vacancy.employmentType || 'Full Time',
      status: vacancy.status || 'Active',
      location: vacancy.location || '',
      workingDays: vacancy.workingDays || '',
      workingHours: vacancy.workingHours || '',
      cvRequired: vacancy.cvRequired !== false,
      closingDate: toInputDate(vacancy.closeDate || vacancy.closingDate),
      summary: vacancy.summary || '',
      description: vacancy.description || '',
      icon: vacancy.icon || 'cashier',
    });
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type } = e.target;
    if (type === 'radio' && name === 'cvRequired') {
      setFormData((prev) => ({ ...prev, cvRequired: value === 'true' }));
      return;
    }

    const maxByField = {
      title: vacancyTitle.max,
      location: vacancyLocation.max,
      employmentType: vacancyEmploymentType.max,
      workingDays: vacancyWorkingDays.max,
      workingHours: vacancyWorkingHours.max,
      description: vacancyDescription.max,
    };
    const nextValue = maxByField[name] ? boundAdminText(value, maxByField[name]) : value;

    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const focusFirstVacancyError = (errors) => {
    const order = ['title', 'location', 'employmentType', 'workingDays', 'workingHours', 'description'];
    const firstKey = order.find((key) => errors[key]);
    if (!firstKey) return;
    const node = document.querySelector(`[name="${firstKey}"]`);
    node?.focus();
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanedForm = {
      ...formData,
      title: sanitizeAdminText(formData.title),
      location: sanitizeAdminText(formData.location),
      employmentType: sanitizeAdminText(formData.employmentType),
      workingDays: sanitizeAdminText(formData.workingDays),
      workingHours: sanitizeAdminText(formData.workingHours),
      description: sanitizeAdminText(formData.description, { collapse: false }),
    };
    setFormData(cleanedForm);

    const errors = validateVacancyForm(cleanedForm);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      addToast(Object.values(errors)[0], 'error');
      requestAnimationFrame(() => focusFirstVacancyError(errors));
      return;
    }

    const originalClosingDate = editingVacancy?.closeDate || editingVacancy?.closingDate || '';
    if (!isClosingDateValid(formData.closingDate, originalClosingDate)) {
      addToast('Closing date cannot be earlier than today', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...cleanedForm,
        cvRequired: cleanedForm.cvRequired !== false,
        closingDate: cleanedForm.closingDate ? cleanedForm.closingDate : null,
      };
      if (editingVacancy) {
        await adminVacancyService.updateVacancy(editingVacancy.id, payload);
        addToast('Vacancy updated successfully', 'success');
      } else {
        await adminVacancyService.createVacancy(payload);
        addToast('Vacancy created successfully', 'success');
      }
      setModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to save vacancy', error);
      addToast(error.response?.data?.message || 'Failed to save vacancy', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePause = async (vacancy) => {
    const nextStatus = vacancy.status === 'Inactive' ? 'Active' : 'Inactive';
    try {
      await adminVacancyService.updateStatus(vacancy.id, nextStatus);
      addToast(`Vacancy marked as ${nextStatus}`, 'success');
      loadData();
    } catch (error) {
      addToast('Failed to update vacancy status', 'error');
    }
  };

  const handleExtend = async (vacancy) => {
    const value = window.prompt(
      'Enter new closing date (YYYY-MM-DD):',
      toInputDate(vacancy.closeDate || vacancy.closingDate)
    );
    if (!value) return;
    if (!isClosingDateValid(value)) {
      addToast('Closing date cannot be earlier than today', 'error');
      return;
    }
    try {
      await adminVacancyService.extendVacancy(vacancy.id, value);
      addToast('Vacancy closing date extended', 'success');
      loadData();
    } catch (error) {
      addToast('Failed to extend vacancy', 'error');
    }
  };

  const handleDelete = async (vacancy) => {
    if (!window.confirm(`Delete vacancy "${vacancy.title}"?`)) return;
    try {
      await adminVacancyService.deleteVacancy(vacancy.id);
      addToast('Vacancy deleted', 'success');
      loadData();
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to delete vacancy', 'error');
    }
  };

  const handleApplicationStatus = async (application, status) => {
    try {
      await jobApplicationService.updateStatus(application.id, status);
      addToast('Application status updated', 'success');
      loadData();
    } catch (error) {
      addToast('Failed to update application', 'error');
    }
  };

  const downloadReport = () => {
    if (!applications.length) {
      addToast('No applications to export', 'error');
      return;
    }
    const headers = ['Applicant Name', 'Job Title', 'Email', 'Phone', 'Applied Date', 'Status'];
    const rows = applications.map((app) => [
      app.applicantName,
      app.jobTitle,
      app.email,
      app.phoneNumber,
      formatDate(app.appliedDate || app.createdAt),
      app.status,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vacancy-applications-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const startIndex = vacancies.length ? (currentPage - 1) * VACANCIES_PER_PAGE + 1 : 0;
  const endIndex = Math.min(currentPage * VACANCIES_PER_PAGE, vacancies.length);

  return (
    <div className="admin-vacancies-page">
      <div className="admin-vacancies-header">
        <div>
          <h2>Vacancy Management</h2>
          <p>Manage all job vacancies</p>
        </div>
        <button type="button" className="admin-vacancies-add-btn" onClick={openCreateModal}>
          <FaPlus /> Add New Vacancy
        </button>
      </div>

      <div className="vacancy-stats-row">
        <div className="stat-card-admin">
          <div className="stat-card-icon-wrap icon-blue"><FaBriefcase /></div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats.total || 0}</span>
            <span className="stat-card-label">Total Vacancies</span>
          </div>
        </div>
        <div className="stat-card-admin">
          <div className="stat-card-icon-wrap icon-green"><FaCheckCircle /></div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats.active || 0}</span>
            <span className="stat-card-label">Active Vacancies</span>
          </div>
        </div>
        <div className="stat-card-admin">
          <div className="stat-card-icon-wrap icon-orange"><FaPauseCircle /></div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats.inactive || 0}</span>
            <span className="stat-card-label">Inactive Vacancies</span>
          </div>
        </div>
        <div className="stat-card-admin">
          <div className="stat-card-icon-wrap icon-red"><FaTimesCircle /></div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats.closed || 0}</span>
            <span className="stat-card-label">Closed Vacancies</span>
          </div>
        </div>
      </div>

      <div className="vacancy-filter-bar">
        <select className="admin-filter-select" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
          {DEPARTMENT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select className="admin-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <form onSubmit={applySearchNow} className="view-toolbar-search">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search vacancy..."
            value={searchInput}
            onChange={onSearchChange}
          />
          <button type="submit" className="vacancy-filter-btn">
            <FaFilter /> Filter
          </button>
        </form>
      </div>

      <div className="vacancy-table-panel">
        {loading ? (
          <p style={{ padding: 24 }}>Loading vacancies...</p>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Job Title</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th>Open Date</th>
                  <th>Close Date</th>
                  <th>CV Requirement</th>
                  <th>Status</th>
                  <th>Applications</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVacancies.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', color: '#64748b' }}>
                      {hasActiveSearch ? ADMIN_NO_MATCH_MESSAGE : 'No vacancies found.'}
                    </td>
                  </tr>
                ) : (
                  paginatedVacancies.map((vacancy, index) => (
                    <tr key={vacancy.id}>
                      <td data-label="#">{startIndex + index}</td>
                      <td data-label="Job Title" style={{ fontWeight: 700 }}>{vacancy.title}</td>
                      <td data-label="Department">{vacancy.departmentLabel}</td>
                      <td data-label="Type">{vacancy.employmentType}</td>
                      <td data-label="Open Date">{formatDate(vacancy.openDate || vacancy.createdAt)}</td>
                      <td data-label="Close Date">{formatDate(vacancy.closeDate || vacancy.closingDate)}</td>
                      <td data-label="CV Requirement">{vacancy.cvRequired !== false ? '📄 Required' : '📄 Optional'}</td>
                      <td data-label="Status">
                        <span className={`status-badge-vacancy ${vacancyStatusClass(vacancy.status)}`}>
                          {vacancy.status}
                        </span>
                      </td>
                      <td data-label="Applications">{vacancy.applicationCount || 0}</td>
                      <td data-label="Action">
                        <div className="vacancy-action-group">
                          <button type="button" className="vacancy-icon-btn edit" title="Edit" onClick={() => openEditModal(vacancy)}>
                            <FaEdit />
                          </button>
                          <button type="button" className="vacancy-icon-btn calendar" title="Extend closing date" onClick={() => handleExtend(vacancy)}>
                            <FaCalendarAlt />
                          </button>
                          <button type="button" className="vacancy-icon-btn pause" title="Pause / activate" onClick={() => handleTogglePause(vacancy)}>
                            <FaPause />
                          </button>
                          <button type="button" className="vacancy-icon-btn delete" title="Delete" onClick={() => handleDelete(vacancy)}>
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="vacancy-table-footer">
          <span>Showing {startIndex} to {endIndex} of {vacancies.length} entries</span>
          <div className="vacancy-pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={currentPage === page ? 'active' : ''}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
              Next »
            </button>
          </div>
        </div>
      </div>

      <div className="vacancy-bottom-grid">
        <div className="dashboard-panel">
          <h3 className="panel-title">Vacancy Status</h3>
          <div className="vacancy-legend-list">
            <div className="vacancy-legend-item">
              <span className="status-badge-vacancy active">Active</span>
              <p>Open and accepting applications on the careers page.</p>
            </div>
            <div className="vacancy-legend-item">
              <span className="status-badge-vacancy inactive">Inactive</span>
              <p>Temporarily paused and hidden from applicants.</p>
            </div>
            <div className="vacancy-legend-item">
              <span className="status-badge-vacancy extended">Extended</span>
              <p>Closing date extended while still accepting applications.</p>
            </div>
            <div className="vacancy-legend-item">
              <span className="status-badge-vacancy expired">Expired</span>
              <p>Closing date has passed and applications are no longer accepted.</p>
            </div>
            <div className="vacancy-legend-item">
              <span className="status-badge-vacancy closed">Closed</span>
              <p>No longer accepting applications.</p>
            </div>
            <div className="vacancy-legend-item">
              <span className="status-badge-vacancy hired">Hired</span>
              <p>Position has been filled.</p>
            </div>
          </div>
        </div>

        <div className="dashboard-panel">
          <h3 className="panel-title">Quick Actions</h3>
          <div className="vacancy-quick-actions">
            <button type="button" className="vacancy-quick-btn add" onClick={openCreateModal}>
              <FaPlus /> Add New Vacancy
            </button>
            <button type="button" className="vacancy-quick-btn applications" onClick={() => navigate('/admin/dashboard/job-applications')}>
              <FaBriefcase /> View Applications
            </button>
            <button type="button" className="vacancy-quick-btn report" onClick={downloadReport}>
              <FaDownload /> Download Applications Report
            </button>
          </div>
        </div>
      </div>

      <div className="vacancy-table-panel">
        <div style={{ padding: '20px 20px 0' }}>
          <h3 className="panel-title" style={{ marginBottom: 0 }}>Recent Applications</h3>
        </div>
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Applicant Name</th>
                <th>Job Title</th>
                <th>Applied Date</th>
                <th>Status</th>
                <th>CV</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#64748b' }}>No applications yet.</td>
                </tr>
              ) : (
                recentApplications.map((app, index) => {
                  const statusMeta = appStatusMeta(app.status);
                  return (
                    <tr key={app.id}>
                      <td>{index + 1}</td>
                      <td style={{ fontWeight: 700 }}>{app.applicantName}</td>
                      <td>{app.jobTitle}</td>
                      <td>{formatDate(app.appliedDate || app.createdAt)}</td>
                      <td>
                        <span className={`status-badge-app ${statusMeta.className}`}>{statusMeta.label}</span>
                      </td>
                      <td>
                        {app.cvFile ? (
                          <a href={getImageUrl(app.cvFile)} target="_blank" rel="noopener noreferrer" className="vacancy-icon-btn cv" title="Download CV">
                            <FaFileAlt />
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <div className="vacancy-action-group">
                          <button type="button" className="vacancy-icon-btn view" title="View applications" onClick={() => navigate('/admin/dashboard/job-applications')}>
                            <FaEye />
                          </button>
                          <button type="button" className="vacancy-icon-btn calendar" title="Mark under review" onClick={() => handleApplicationStatus(app, 'reviewed')}>
                            <FaCalendarAlt />
                          </button>
                          <button type="button" className="vacancy-icon-btn approve" title="Shortlist" onClick={() => handleApplicationStatus(app, 'shortlisted')}>
                            <FaCheck />
                          </button>
                          <button type="button" className="vacancy-icon-btn reject" title="Reject" onClick={() => handleApplicationStatus(app, 'rejected')}>
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="vacancy-modal-overlay" onClick={() => !submitting && setModalOpen(false)}>
          <div className="vacancy-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingVacancy ? 'Edit Vacancy' : 'Add New Vacancy'}</h3>
            <form onSubmit={handleSubmit} noValidate>
              <div className="vacancy-form-grid">
                <label className={`full-width${fieldErrors.title ? ' has-error' : ''}`}>
                  <AdminFieldLegend required>Job Title</AdminFieldLegend>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    maxLength={vacancyTitle.max}
                    className={fieldErrors.title ? 'admin-input-invalid' : ''}
                    required
                  />
                  <div className="admin-field-meta">
                    {fieldErrors.title ? (
                      <p className="admin-field-error" role="alert">{fieldErrors.title}</p>
                    ) : (
                      <span />
                    )}
                    <span className="admin-char-counter">{formatCharCounter(formData.title, vacancyTitle.max)}</span>
                  </div>
                </label>
                <label>
                  <AdminFieldLegend optional>Department</AdminFieldLegend>
                  <select name="department" value={formData.department} onChange={handleFormChange}>
                    {DEPARTMENTS.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
                  </select>
                </label>
                <label>
                  <AdminFieldLegend required>Employment Type</AdminFieldLegend>
                  <select name="employmentType" value={formData.employmentType} onChange={handleFormChange}>
                    {EMPLOYMENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </label>
                <label>
                  <AdminFieldLegend optional>Status</AdminFieldLegend>
                  <select name="status" value={formData.status} onChange={handleFormChange}>
                    {STATUS_OPTIONS.filter((item) => item.value !== 'all').map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <AdminFieldLegend required>Closing Date</AdminFieldLegend>
                  <input
                    type="date"
                    name="closingDate"
                    value={formData.closingDate}
                    onChange={handleFormChange}
                    min={editingVacancy ? undefined : getTodayInputDate()}
                    required
                  />
                </label>
                <label className={fieldErrors.location ? 'has-error' : ''}>
                  <AdminFieldLegend required>Location</AdminFieldLegend>
                  <input
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    maxLength={vacancyLocation.max}
                    className={fieldErrors.location ? 'admin-input-invalid' : ''}
                    required
                  />
                  <div className="admin-field-meta">
                    {fieldErrors.location ? (
                      <p className="admin-field-error" role="alert">{fieldErrors.location}</p>
                    ) : (
                      <span />
                    )}
                    <span className="admin-char-counter">{formatCharCounter(formData.location, vacancyLocation.max)}</span>
                  </div>
                </label>
                <label className={fieldErrors.workingDays ? 'has-error' : ''}>
                  <AdminFieldLegend optional>Working Days</AdminFieldLegend>
                  <input
                    name="workingDays"
                    value={formData.workingDays}
                    onChange={handleFormChange}
                    maxLength={vacancyWorkingDays.max}
                    className={fieldErrors.workingDays ? 'admin-input-invalid' : ''}
                  />
                  <div className="admin-field-meta">
                    {fieldErrors.workingDays ? (
                      <p className="admin-field-error" role="alert">{fieldErrors.workingDays}</p>
                    ) : (
                      <span />
                    )}
                    <span className="admin-char-counter">{formatCharCounter(formData.workingDays, vacancyWorkingDays.max)}</span>
                  </div>
                </label>
                <label className={fieldErrors.workingHours ? 'has-error' : ''}>
                  <AdminFieldLegend optional>Working Hours</AdminFieldLegend>
                  <input
                    name="workingHours"
                    value={formData.workingHours}
                    onChange={handleFormChange}
                    maxLength={vacancyWorkingHours.max}
                    className={fieldErrors.workingHours ? 'admin-input-invalid' : ''}
                  />
                  <div className="admin-field-meta">
                    {fieldErrors.workingHours ? (
                      <p className="admin-field-error" role="alert">{fieldErrors.workingHours}</p>
                    ) : (
                      <span />
                    )}
                    <span className="admin-char-counter">{formatCharCounter(formData.workingHours, vacancyWorkingHours.max)}</span>
                  </div>
                </label>
                <div className="full-width vacancy-cv-requirement">
                  <span>Resume / CV Requirement</span>
                  <div className="vacancy-cv-options">
                    <label className="vacancy-cv-option">
                      <input
                        type="radio"
                        name="cvRequired"
                        value="true"
                        checked={formData.cvRequired !== false}
                        onChange={handleFormChange}
                      />
                      CV Required
                    </label>
                    <label className="vacancy-cv-option">
                      <input
                        type="radio"
                        name="cvRequired"
                        value="false"
                        checked={formData.cvRequired === false}
                        onChange={handleFormChange}
                      />
                      CV Optional
                    </label>
                  </div>
                </div>
                <label className="full-width">
                  <AdminFieldLegend optional>Summary</AdminFieldLegend>
                  <textarea name="summary" value={formData.summary} onChange={handleFormChange} />
                </label>
                <label className={`full-width${fieldErrors.description ? ' has-error' : ''}`}>
                  <AdminFieldLegend required>Job Description</AdminFieldLegend>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    maxLength={vacancyDescription.max}
                    className={fieldErrors.description ? 'admin-input-invalid' : ''}
                    required
                  />
                  <div className="admin-field-meta">
                    {fieldErrors.description ? (
                      <p className="admin-field-error" role="alert">{fieldErrors.description}</p>
                    ) : (
                      <span />
                    )}
                    <span className="admin-char-counter">{formatCharCounter(formData.description, vacancyDescription.max)}</span>
                  </div>
                </label>
              </div>
              <div className="vacancy-modal-actions">
                <button type="button" className="action-btn-secondary" onClick={() => setModalOpen(false)} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="admin-vacancies-add-btn" disabled={submitting}>
                  {submitting ? 'Saving...' : editingVacancy ? 'Update Vacancy' : 'Create Vacancy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVacancies;
