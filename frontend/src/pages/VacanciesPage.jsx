import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiCalendar,
  FiMapPin,
  FiClock,
  FiUsers,
  FiTrendingUp,
  FiBookOpen,
  FiHeart,
  FiAward,
  FiSun,
  FiChevronRight,
} from 'react-icons/fi';
import {
  FaFacebook,
  FaUtensils,
  FaShoppingCart,
  FaUserTie,
  FaCashRegister,
  FaBoxes,
  FaCarrot,
  FaConciergeBell,
} from 'react-icons/fa';
import { GiChefToque } from 'react-icons/gi';
import { useToast } from '../context/ToastContext';
import vacancyService from '../services/vacancyService';
import { getImageUrl } from '../services/api';
import {
  VACANCY_HERO_BG,
  DEPARTMENT_CARD_IMAGES,
  DEPARTMENT_CARD_BG,
  WHY_JOIN_US,
  ALL_VACANCIES,
  JOBS_PER_PAGE,
} from '../constants/vacancyDefaults';
import usePageBanner from '../hooks/usePageBanner';
import { getBannerOverlayStyle } from '../utils/bannerOverlay';
import './VacanciesPage.css';

const JOB_ICONS = {
  chef: GiChefToque,
  cashier: FaCashRegister,
  service: FaConciergeBell,
  counter: FaUtensils,
  trainee: FaUserTie,
  stock: FaBoxes,
  produce: FaCarrot,
};

const WHY_ICONS = {
  environment: FiHeart,
  growth: FiTrendingUp,
  training: FiBookOpen,
  team: FiUsers,
  benefits: FiAward,
  balance: FiSun,
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const VACANCY_FILTER_OPTIONS = [
  { value: 'all', label: 'All Vacancies', params: { filter: 'all' } },
  { value: 'supermarket', label: 'Supermarket Vacancies', params: { filter: 'supermarket' } },
  { value: 'food-corner', label: 'Food Corner Vacancies', params: { filter: 'food-corner' } },
  { value: 'latest', label: 'Latest Vacancies', params: { sort: 'latest' } },
];

const getFilterParams = (filterValue) => {
  const option = VACANCY_FILTER_OPTIONS.find((item) => item.value === filterValue);
  return option?.params || { filter: 'all' };
};

const VacanciesPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [vacancyFilter, setVacancyFilter] = useState('all');
  const [vacancies, setVacancies] = useState([]);
  const [loadingVacancies, setLoadingVacancies] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { banner: pageBanner, loading: bannerLoading } = usePageBanner('vacancies');

  const filteredVacancies = vacancies;

  const totalPages = Math.max(1, Math.ceil(filteredVacancies.length / JOBS_PER_PAGE));

  const paginatedVacancies = useMemo(() => {
    const start = (currentPage - 1) * JOBS_PER_PAGE;
    return filteredVacancies.slice(start, start + JOBS_PER_PAGE);
  }, [filteredVacancies, currentPage]);

  const selectedVacancy = useMemo(
    () => filteredVacancies.find((job) => job.id === selectedId) || filteredVacancies[0] || null,
    [selectedId, filteredVacancies]
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadVacancies = async () => {
      setLoadingVacancies(true);
      try {
        const params = getFilterParams(vacancyFilter);
        const data = await vacancyService.getVacancies(params);
        const list = Array.isArray(data) ? data : [];
        if (!mounted) return;
        setVacancies(list);
        setCurrentPage(1);
        setSelectedId(list[0]?.id || null);
      } catch (error) {
        if (!mounted) return;
        console.error('Failed to load vacancies', error);
        const fallback = (() => {
          let list = [...ALL_VACANCIES];
          if (vacancyFilter === 'supermarket') {
            list = list.filter((job) => job.department === 'supermarket');
          } else if (vacancyFilter === 'food-corner') {
            list = list.filter((job) => job.department === 'food-corner');
          }
          if (vacancyFilter === 'latest' || vacancyFilter === 'all') {
            list.sort((a, b) => new Date(b.posted) - new Date(a.posted));
          }
          return list;
        })();
        setVacancies(fallback);
        setCurrentPage(1);
        setSelectedId(fallback[0]?.id || null);
        addToast('Could not load vacancies from server. Showing cached listings.', 'error');
      } finally {
        if (mounted) setLoadingVacancies(false);
      }
    };

    loadVacancies();
    return () => {
      mounted = false;
    };
  }, [vacancyFilter, addToast]);

  useEffect(() => {
    if (filteredVacancies.length && !filteredVacancies.some((job) => job.id === selectedId)) {
      setSelectedId(filteredVacancies[0].id);
    }
  }, [filteredVacancies, selectedId]);

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/vacancies${selectedVacancy ? `?job=${selectedVacancy.id}` : ''}`
      : '';

  const handleShareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const scrollToList = (department) => {
    setVacancyFilter(department === 'supermarket' ? 'supermarket' : 'food-corner');
    setCurrentPage(1);
    document.getElementById('vacancies-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openApplyPage = () => {
    if (!selectedVacancy) {
      addToast('Please select a vacancy to apply for.', 'error');
      return;
    }
    navigate(`/careers/apply/${selectedVacancy.id}`);
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="vacancies-page">
      <section className={`careers-hero${bannerLoading ? ' careers-hero--loading' : ''}`}>
        <div
          className="careers-hero-bg"
          style={{ backgroundImage: `url('${getImageUrl(pageBanner.backgroundImage || pageBanner.image) || VACANCY_HERO_BG}')` }}
          aria-hidden="true"
        />
        <div className="careers-hero-overlay" style={getBannerOverlayStyle(pageBanner)} aria-hidden="true" />
        <div className="container careers-hero-grid">
          <div className="careers-hero-copy">
            <span className="careers-hero-badge">
              <span className="careers-hero-badge-icon" aria-hidden="true">💼</span>
              {pageBanner.badgeText || 'JOIN OUR TEAM'}
            </span>
            <h1 className="careers-hero-title">
              {pageBanner.title || pageBanner.mainHeading || 'Join Our Team'}
              {pageBanner.highlightedTitle || pageBanner.highlightText ? (
                <>
                  <br />
                  <span>{pageBanner.highlightedTitle || pageBanner.highlightText}</span>
                </>
              ) : null}
            </h1>
            <p className="careers-hero-desc">
              {pageBanner.description ||
                'Build your career with Ins Wereld Winkel.'}
            </p>
            <nav className="careers-hero-breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span className="careers-breadcrumb-sep" aria-hidden="true">&gt;</span>
              <span>Careers</span>
            </nav>
          </div>
        </div>
      </section>

      <section className="careers-departments">
        <div className="container">
          <h2 className="careers-section-title">
            CHOOSE DEPARTMENT
            <span className="careers-section-title-line" aria-hidden="true" />
          </h2>
          <div className="careers-dept-grid">
            <article className="careers-dept-card careers-dept-card--blue">
              <div
                className="careers-dept-card-bg"
                style={{ backgroundImage: `url('${DEPARTMENT_CARD_BG.supermarket}')` }}
                aria-hidden="true"
              />
              <div className="careers-dept-card-content">
                <div className="careers-dept-icon careers-dept-icon--blue">
                  <FaShoppingCart aria-hidden="true" />
                </div>
                <h3>SUPERMARKET VACANCIES</h3>
                <p>Explore career opportunities in our supermarket departments.</p>
                <button type="button" className="careers-dept-btn careers-dept-btn--blue" onClick={() => scrollToList('supermarket')}>
                  View Vacancies <FiChevronRight aria-hidden="true" />
                </button>
              </div>
              <div className="careers-dept-card-media">
                <img
                  className="careers-dept-card-image"
                  src={DEPARTMENT_CARD_IMAGES.supermarket}
                  alt=""
                  aria-hidden="true"
                />
              </div>
            </article>

            <article className="careers-dept-card careers-dept-card--green">
              <div
                className="careers-dept-card-bg"
                style={{ backgroundImage: `url('${DEPARTMENT_CARD_BG.foodCorner}')` }}
                aria-hidden="true"
              />
              <div className="careers-dept-card-content">
                <div className="careers-dept-icon careers-dept-icon--green">
                  <GiChefToque aria-hidden="true" />
                </div>
                <h3>FOOD CORNER VACANCIES</h3>
                <p>Join our food corner team and be part of our delicious journey.</p>
                <button type="button" className="careers-dept-btn careers-dept-btn--green" onClick={() => scrollToList('food-corner')}>
                  View Vacancies <FiChevronRight aria-hidden="true" />
                </button>
              </div>
              <div className="careers-dept-card-media">
                <img
                  className="careers-dept-card-image"
                  src={DEPARTMENT_CARD_IMAGES.foodCorner}
                  alt=""
                  aria-hidden="true"
                />
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="careers-main" id="vacancies-list">
        <div className="container">
          <div className="careers-main-grid">
          <div className="careers-list-column">
            <div className="careers-list-header">
              <h2>LATEST VACANCIES</h2>
              <label className="careers-sort">
                <span>Sort / Filter Vacancies</span>
                <select
                  value={vacancyFilter}
                  onChange={(e) => setVacancyFilter(e.target.value)}
                  aria-label="Sort or filter vacancies"
                >
                  {VACANCY_FILTER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {loadingVacancies ? (
              <p className="careers-empty">Loading vacancies...</p>
            ) : filteredVacancies.length === 0 ? (
              <p className="careers-empty">No vacancies found for the selected filter.</p>
            ) : (
            <div className="careers-job-list">
              {paginatedVacancies.map((job) => {
                const Icon = JOB_ICONS[job.icon] || FaUtensils;
                const isActive = selectedVacancy?.id === job.id;
                const badgeClass =
                  job.employmentType === 'Part Time' ? 'careers-badge--part' : 'careers-badge--full';

                return (
                  <article
                    key={job.id}
                    className={`careers-job-card ${isActive ? 'active' : ''} ${
                      job.department === 'food-corner' ? 'food-corner' : 'supermarket'
                    }`}
                  >
                    <div className="careers-job-card-main">
                      <div className={`careers-job-icon ${job.department === 'food-corner' ? 'green' : 'blue'}`}>
                        <Icon aria-hidden="true" />
                      </div>
                      <div className="careers-job-info">
                        <h3>{job.title}</h3>
                        <span className="careers-job-dept">{job.departmentLabel}</span>
                        <span className={`careers-badge ${badgeClass}`}>{job.employmentType}</span>
                        <div className="careers-job-meta">
                          <span><FiCalendar aria-hidden="true" /> Open Date: {formatDate(job.posted)}</span>
                          <span><FiMapPin aria-hidden="true" /> {job.location}</span>
                          <span>
                            {job.cvRequired !== false ? '📄 CV Required' : '📄 CV Optional'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`careers-view-btn careers-view-btn--${
                        job.department === 'food-corner' ? 'food-corner' : 'supermarket'
                      }`}
                      onClick={() => setSelectedId(job.id)}
                    >
                      View Details
                    </button>
                  </article>
                );
              })}
            </div>
            )}

            {!loadingVacancies && totalPages > 1 && (
              <div className="careers-pagination">
                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={currentPage === page ? 'active' : ''}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next »
                </button>
              </div>
            )}
          </div>

          <aside className="careers-sidebar">
            <div className="careers-sidebar-header">
              <h2>JOB DETAILS</h2>
            </div>
            <div
              className={`careers-details-card careers-details-card--${
                selectedVacancy?.department === 'food-corner' ? 'food-corner' : 'supermarket'
              }`}
              aria-live="polite"
            >
              {selectedVacancy ? (
                <>
                  <div className="careers-details-head">
                    <div className={`careers-details-icon ${selectedVacancy.department === 'food-corner' ? 'green' : 'blue'}`}>
                      {(() => {
                        const Icon = JOB_ICONS[selectedVacancy.icon] || FaUtensils;
                        return <Icon aria-hidden="true" />;
                      })()}
                    </div>
                    <div className="careers-details-head-text">
                      <h3>{selectedVacancy.title}</h3>
                      <span
                        className={`careers-badge ${
                          selectedVacancy.employmentType === 'Part Time'
                            ? 'careers-badge--part'
                            : 'careers-badge--full'
                        }`}
                      >
                        {selectedVacancy.employmentType}
                      </span>
                    </div>
                  </div>

                  <ul className="careers-details-list">
                    <li><FiCalendar aria-hidden="true" /> <span>Open Date</span> {formatDate(selectedVacancy.posted)}</li>
                    <li><FiCalendar aria-hidden="true" /> <span>Closing Date</span> {formatDate(selectedVacancy.closingDate)}</li>
                    <li><FiClock aria-hidden="true" /> <span>Employment Type</span> {selectedVacancy.employmentType}</li>
                    <li><FiCalendar aria-hidden="true" /> <span>Working Days</span> {selectedVacancy.workingDays}</li>
                    <li><FiClock aria-hidden="true" /> <span>Working Hours</span> {selectedVacancy.workingHours}</li>
                    <li><FiMapPin aria-hidden="true" /> <span>Location</span> {selectedVacancy.location}</li>
                  </ul>

                  <div
                    className={`careers-cv-requirement careers-cv-requirement--${
                      selectedVacancy.cvRequired !== false ? 'required' : 'optional'
                    }`}
                  >
                    <span className="careers-cv-badge">
                      {selectedVacancy.cvRequired !== false ? '📄 CV Required' : '📄 CV Optional'}
                    </span>
                    <p>
                      {selectedVacancy.cvRequired !== false
                        ? 'Applicants must upload a Resume/CV.'
                        : 'Resume/CV upload is optional.'}
                    </p>
                  </div>

                  <div className="careers-details-desc">
                    <h4>Job Description</h4>
                    <p>{selectedVacancy.description}</p>
                  </div>

                  <div className="careers-action-buttons">
                    <button type="button" className="careers-share-btn facebook" onClick={handleShareFacebook}>
                      <FaFacebook aria-hidden="true" /> Share on Facebook
                    </button>
                    <button
                      type="button"
                      className="careers-apply-now-btn"
                      onClick={openApplyPage}
                    >
                      Apply Now <FiChevronRight aria-hidden="true" />
                    </button>
                  </div>
                </>
              ) : (
                <p className="careers-empty">No vacancies available.</p>
              )}
            </div>

            <div className="careers-why-card">
              <h2>WHY JOIN US?</h2>
              <div className="careers-why-grid">
                {WHY_JOIN_US.map((item) => {
                  const Icon = WHY_ICONS[item.icon] || FiAward;
                  return (
                    <div key={item.id} className="careers-why-item">
                      <div className="careers-why-icon"><Icon aria-hidden="true" /></div>
                      <span>{item.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
          </div>
        </div>
      </section>

    </div>
  );
};

export default VacanciesPage;
