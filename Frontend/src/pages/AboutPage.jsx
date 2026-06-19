import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight, FiEye, FiHeart, FiMapPin, FiPhone, FiShoppingBag, FiSmile, FiTarget, FiUsers
} from 'react-icons/fi';
import { useCMS } from '../context/CMSContext';
import aboutUsService from '../services/aboutUsService';
import { getImageUrl } from '../services/api';
import './AboutPage.css';

const statIcons = [FiUsers, FiShoppingBag, FiTarget, FiSmile];

const useCountUp = (end, suffix, duration = 1600) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let current = 0;
    const step = Math.max(1, Math.ceil(end / (duration / 16)));
    const timer = setInterval(() => {
      current += step;
      if (current >= end) { setCount(end); clearInterval(timer); }
      else setCount(current);
    }, 16);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  return { display: `${count}${suffix}`, ref };
};

const StatCounter = ({ value, suffix, label, icon: Icon }) => {
  const { display, ref } = useCountUp(Number(value) || 0, suffix || '');
  return (
    <div className="about-stat" ref={ref}>
      <span className="about-stat-icon">{Icon ? <Icon /> : null}</span>
      <span className="about-stat-value">{display}</span>
      <span className="about-stat-label">{label}</span>
    </div>
  );
};

const AboutPage = () => {
  const { cmsData } = useCMS();
  const [aboutData, setAboutData] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let active = true;
    aboutUsService.getAboutUs()
      .then((data) => { if (active && data) setAboutData(data); })
      .catch((err) => { if (active) setLoadError(err.message || 'Failed to load About Us content.'); });
    return () => { active = false; };
  }, []);

  const about = aboutData?.aboutPage;

  const storyParagraphs = (about?.storyDescription || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const phone = about?.owner?.phone || cmsData?.contactPhone || '';
  const address = about?.owner?.location || cmsData?.address || '';
  const phoneHref = phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : '#';
  const mapsHref = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : '#';
  const activeOfferings = (about?.offerings || []).filter((item) => item.isActive !== false);

  if (!about && !loadError) {
    return <div className="about-page about-page-loading">Loading About Us content...</div>;
  }

  if (loadError || !about) {
    return (
      <div className="about-page about-page-error">
        {loadError}
      </div>
    );
  }

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="container about-hero-grid">
          <div className="about-hero-text">
            <span className="about-hero-eyebrow">{about.heroEyebrow}</span>
            <h1>
              {about.heroHeading}{' '}
              <span className="about-hero-highlight">{about.heroHighlight}</span>
            </h1>
            <p className="about-hero-lead">{about.heroDescription}</p>
            <div className="about-hero-actions">
              <Link to="/products" className="about-btn about-btn-primary">
                Explore Products <FiArrowRight />
              </Link>
              <Link to="/contact" className="about-btn about-btn-outline">
                Contact Us
              </Link>
            </div>
          </div>
          <div className="about-hero-visual">
            <img src={getImageUrl(about.heroImage)} alt={about.heroHighlight} />
          </div>
        </div>
      </section>

      <section className="about-story-block">
        <div className="container about-story-layout">
          <div className="about-story-image">
            <img src={getImageUrl(about.storyImage)} alt={about.storyTitle} />
          </div>
          <div className="about-story-content">
            <h2 className="about-section-title left">{about.storyTitle}</h2>
            {storyParagraphs.map((para) => (
              <p key={para.slice(0, 48)}>{para}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="about-mvp">
        <div className="container about-mvp-grid">
          <article className="mvp-card">
            <div className="mvp-icon"><FiTarget /></div>
            <h3>{about.missionTitle}</h3>
            <p>{about.missionDescription}</p>
          </article>
          <article className="mvp-card">
            <div className="mvp-icon"><FiEye /></div>
            <h3>{about.visionTitle}</h3>
            <p>{about.visionDescription}</p>
          </article>
          <article className="mvp-card">
            <div className="mvp-icon"><FiHeart /></div>
            <h3>{about.promiseTitle}</h3>
            <p>{about.promiseDescription}</p>
          </article>
        </div>
      </section>

      <section className="about-offer">
        <div className="container">
          <div className="about-section-head">
            <h2 className="about-section-title">What We Offer</h2>
            <div className="about-title-line" />
          </div>
          <div className="about-offer-grid">
            {activeOfferings.map((item) => (
              <article className="offer-card" key={item.id || item.title}>
                <div className="offer-image-wrap">
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.title}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-stats">
        <div className="container about-stats-grid">
          {about.stats.map((stat, index) => (
            <StatCounter
              key={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              icon={statIcons[index % statIcons.length]}
            />
          ))}
        </div>
      </section>

      <section className="about-owner">
        <div className="container">
          <div className="founder-panel">
            <img
              src={getImageUrl(about.owner.photo)}
              alt={about.owner.name}
              className="founder-photo"
            />
            <div className="founder-body">
              {about.owner.badge && <span className="founder-badge">{about.owner.badge}</span>}
              <h2 className="founder-name">{about.owner.name}</h2>
              <p className="founder-role">{about.owner.designation}</p>
              {about.owner.quote && (
                <p className="founder-quote">&ldquo;{about.owner.quote}&rdquo;</p>
              )}
            </div>
            <div className="founder-contact-col">
              <a href={phoneHref} className="founder-contact-item">
                <FiPhone /> {phone}
              </a>
              <a href={mapsHref} target="_blank" rel="noreferrer" className="founder-contact-item">
                <FiMapPin /> {address}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
