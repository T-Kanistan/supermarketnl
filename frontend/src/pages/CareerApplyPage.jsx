import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiUpload, FiChevronLeft } from 'react-icons/fi';
import vacancyService from '../services/vacancyService';
import jobApplicationService from '../services/jobApplicationService';
import { ALL_VACANCIES } from '../constants/vacancyDefaults';
import './CareerApplyPage.css';

const MAX_CV_BYTES = 2 * 1024 * 1024;
const ALLOWED_CV_EXTENSIONS = ['.pdf', '.doc', '.docx'];
const CV_UPLOAD_ERROR_MESSAGE = 'Please upload your Resume/CV (Maximum 2MB).';

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  address: '',
};

const getFileExtension = (name = '') => {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.slice(idx).toLowerCase() : '';
};

const findFallbackVacancy = (id) => ALL_VACANCIES.find((job) => job.id === id) || null;

const CareerApplyPage = () => {
  const { vacancyId } = useParams();
  const [vacancy, setVacancy] = useState(null);
  const [loadingVacancy, setLoadingVacancy] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [cvFile, setCvFile] = useState(null);
  const [cvLabel, setCvLabel] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadVacancy = async () => {
      setLoadingVacancy(true);
      setLoadError('');
      try {
        const data = await vacancyService.getVacancyById(vacancyId);
        if (!mounted) return;
        if (data) {
          setVacancy(data);
        } else {
          const fallback = findFallbackVacancy(vacancyId);
          if (fallback) setVacancy(fallback);
          else setLoadError('This vacancy could not be found or is no longer accepting applications.');
        }
      } catch (error) {
        if (!mounted) return;
        const fallback = findFallbackVacancy(vacancyId);
        if (fallback) {
          setVacancy(fallback);
        } else {
          setLoadError('This vacancy could not be found or is no longer accepting applications.');
        }
      } finally {
        if (mounted) setLoadingVacancy(false);
      }
    };

    if (vacancyId) loadVacancy();
    return () => {
      mounted = false;
    };
  }, [vacancyId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleCvChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setCvFile(null);
      setCvLabel('');
      if (errors.cv) setErrors((prev) => ({ ...prev, cv: '' }));
      return;
    }

    const ext = getFileExtension(file.name);
    if (!ALLOWED_CV_EXTENSIONS.includes(ext)) {
      setCvFile(null);
      setCvLabel('');
      setErrors((prev) => ({ ...prev, cv: 'Only PDF, DOC, and DOCX files are allowed' }));
      return;
    }

    if (file.size > MAX_CV_BYTES) {
      setCvFile(null);
      setCvLabel('');
      setErrors((prev) => ({ ...prev, cv: CV_UPLOAD_ERROR_MESSAGE }));
      return;
    }

    setCvFile(file);
    setCvLabel(file.name);
    setErrors((prev) => ({ ...prev, cv: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required';
    if (!form.lastName.trim()) next.lastName = 'Last name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Please enter a valid email address';
    }
    if (!form.phoneNumber.trim()) next.phoneNumber = 'Phone number is required';
    if (!form.address.trim()) next.address = 'Address is required';
    const cvRequired = vacancy?.cvRequired !== false;
    if (cvRequired && !cvFile) next.cv = CV_UPLOAD_ERROR_MESSAGE;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vacancy || !validate()) return;

    setIsSubmitting(true);
    try {
      await jobApplicationService.submitApplication({
        fields: {
          vacancyId: vacancy.id,
          vacancyTitle: vacancy.title,
          department: vacancy.departmentLabel || vacancy.department || '',
          employmentType: vacancy.employmentType || '',
          location: vacancy.location || '',
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phoneNumber: form.phoneNumber.trim(),
          address: form.address.trim(),
        },
        cvFile,
      });
      setSubmitted(true);
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to submit application. Please try again.';
      setErrors((prev) => ({ ...prev, form: message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const accentClass =
    vacancy?.department === 'food-corner' ? 'food-corner' : 'supermarket';
  const cvRequired = vacancy?.cvRequired !== false;

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const syntheticEvent = { target: { files: [file] } };
    handleCvChange(syntheticEvent);
  };

  if (loadingVacancy) {
    return (
      <div className="career-apply-page">
        <div className="career-apply-container">
          <p className="career-apply-loading">Loading vacancy details...</p>
        </div>
      </div>
    );
  }

  if (loadError || !vacancy) {
    return (
      <div className="career-apply-page">
        <div className="career-apply-container">
          <div className="career-apply-error-card">
            <h1>Vacancy Not Found</h1>
            <p>{loadError || 'This vacancy is no longer available.'}</p>
            <div className="career-apply-success-actions">
              <Link to="/vacancies" className="career-apply-btn career-apply-btn--primary">
                Back to Vacancies
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="career-apply-page">
        <div className="career-apply-container">
          <div className="career-apply-success-card">
            <div className="career-apply-success-icon" aria-hidden="true">
              ✓
            </div>
            <h1>Application Submitted Successfully</h1>
            <p>
              Thank you for applying.
              <br />
              Our recruitment team will review your application and contact you if you are shortlisted.
            </p>
            <div className="career-apply-success-actions">
              <Link to="/vacancies" className="career-apply-btn career-apply-btn--primary">
                Back to Vacancies
              </Link>
              <Link to="/vacancies#vacancies-list" className="career-apply-btn career-apply-btn--secondary">
                View More Jobs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`career-apply-page career-apply-page--${accentClass}`}>
      <section className="career-apply-hero">
        <div className="career-apply-container">
          <Link to="/vacancies" className="career-apply-back">
            <FiChevronLeft aria-hidden="true" /> Back to Vacancies
          </Link>
          <h1>Apply for {vacancy.title}</h1>
          <p className="career-apply-hero-sub">
            Complete the application form below and submit your details for this position.
          </p>
        </div>
      </section>

      <section className="career-apply-main">
        <div className="career-apply-container career-apply-grid">
          <div className="career-apply-form-card">
            <h2>Application Form</h2>
            <div className={`career-apply-cv-notice career-apply-cv-notice--${cvRequired ? 'required' : 'optional'}`}>
              <span className="career-apply-cv-badge">
                {cvRequired ? '📄 CV Required' : '📄 CV Optional'}
              </span>
              <p>
                {cvRequired
                  ? 'Applicants must upload a Resume/CV.'
                  : 'Resume/CV upload is optional.'}
              </p>
            </div>
            <form className="career-apply-form" onSubmit={handleSubmit} noValidate>
              <div className="career-apply-section">
                <h3>Vacancy Information</h3>
                <div className="career-apply-fields">
                  <div className="career-apply-field full">
                    <label htmlFor="apply-vacancyTitle">Vacancy Title</label>
                    <input
                      id="apply-vacancyTitle"
                      value={vacancy.title || ''}
                      readOnly
                      aria-readonly="true"
                    />
                  </div>
                  <div className="career-apply-field">
                    <label htmlFor="apply-department">Department</label>
                    <input
                      id="apply-department"
                      value={vacancy.departmentLabel || vacancy.department || ''}
                      readOnly
                      aria-readonly="true"
                    />
                  </div>
                  <div className="career-apply-field">
                    <label htmlFor="apply-employmentType">Employment Type</label>
                    <input
                      id="apply-employmentType"
                      value={vacancy.employmentType || ''}
                      readOnly
                      aria-readonly="true"
                    />
                  </div>
                  <div className="career-apply-field full">
                    <label htmlFor="apply-location">Location</label>
                    <input
                      id="apply-location"
                      value={vacancy.location || ''}
                      readOnly
                      aria-readonly="true"
                    />
                  </div>
                </div>
              </div>

              <div className="career-apply-section">
                <h3>Personal Information</h3>
              <div className="career-apply-fields">
                <div className={`career-apply-field ${errors.firstName ? 'has-error' : ''}`}>
                  <label htmlFor="apply-firstName">First Name *</label>
                  <input
                    id="apply-firstName"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="First name"
                    autoComplete="given-name"
                  />
                  {errors.firstName && <span className="field-error">{errors.firstName}</span>}
                </div>

                <div className={`career-apply-field ${errors.lastName ? 'has-error' : ''}`}>
                  <label htmlFor="apply-lastName">Last Name *</label>
                  <input
                    id="apply-lastName"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Last name"
                    autoComplete="family-name"
                  />
                  {errors.lastName && <span className="field-error">{errors.lastName}</span>}
                </div>

                <div className={`career-apply-field full ${errors.email ? 'has-error' : ''}`}>
                  <label htmlFor="apply-email">Email Address *</label>
                  <input
                    id="apply-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    autoComplete="email"
                  />
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>

                <div className={`career-apply-field full ${errors.phoneNumber ? 'has-error' : ''}`}>
                  <label htmlFor="apply-phoneNumber">Phone Number *</label>
                  <input
                    id="apply-phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    placeholder="+31 6 1234 5678"
                    autoComplete="tel"
                  />
                  {errors.phoneNumber && <span className="field-error">{errors.phoneNumber}</span>}
                </div>

                <div className={`career-apply-field full ${errors.address ? 'has-error' : ''}`}>
                  <label htmlFor="apply-address">Address *</label>
                  <input
                    id="apply-address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Street, city, postal code"
                    autoComplete="street-address"
                  />
                  {errors.address && <span className="field-error">{errors.address}</span>}
                </div>

                <div className={`career-apply-field full ${errors.cv ? 'has-error' : ''}`}>
                  <label htmlFor="apply-cv">
                    Upload Resume / CV{cvRequired ? ' *' : ' (Optional)'}
                  </label>
                  <div
                    className={`career-apply-upload ${isDragActive ? 'is-dragging' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragActive(true);
                    }}
                    onDragLeave={() => setIsDragActive(false)}
                    onDrop={handleDrop}
                  >
                    <FiUpload aria-hidden="true" />
                    <div className="career-apply-upload-content">
                      <span>{cvLabel || 'Drag & Drop your CV here'}</span>
                      <label htmlFor="apply-cv" className="career-apply-browse-btn">
                        Browse Files
                      </label>
                    </div>
                    <input
                      id="apply-cv"
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleCvChange}
                    />
                  </div>
                  <p className="career-apply-upload-meta">Accepted: PDF, DOC, DOCX (Max 2MB)</p>
                  {errors.cv && <span className="field-error">{errors.cv}</span>}
                </div>
              </div>
              </div>

              {errors.form && <p className="career-apply-form-error">{errors.form}</p>}

              <button type="submit" className="career-apply-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CareerApplyPage;
