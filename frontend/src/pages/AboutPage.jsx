import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import { FaFacebook, FaInstagram, FaWhatsapp, FaTiktok, FaYoutube } from 'react-icons/fa';
import { useCMS } from '../context/CMSContext';
import aboutUsService from '../services/aboutUsService';
import { getImageUrl } from '../services/api';
import { mapAboutPageFromApi } from '../constants/aboutPageDefaults';
import './AboutPage.css';

const {
  FiEye, FiHeart, FiMapPin, FiPhone, FiMail, FiShoppingBag, FiTarget, FiUsers,
  FiStar, FiGrid, FiCoffee, FiHeadphones, FiCalendar, FiAward,
} = FiIcons;

const resolveIcon = (name, fallback = FiCalendar) => FiIcons[name] || fallback;

const STORY_TIMELINE_ICONS = [FiCalendar, FiUsers, FiCoffee, FiAward];
const statIcons = [FiUsers, FiShoppingBag, FiGrid, FiStar];

const useRevealOnScroll = (threshold = 0.15) => {
  const [visible, setVisible] = useState(false);
  const observerRef = useRef(null);

  const ref = useCallback((node) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(node);
    observerRef.current = observer;
  }, [threshold]);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { ref, visible };
};

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
    <article className="about-stat-card" ref={ref}>
      <span className="about-stat-icon">{Icon ? <Icon /> : null}</span>
      <span className="about-stat-value">{display}</span>
      <span className="about-stat-label">{label}</span>
    </article>
  );
};

const AboutEmptyState = ({ message }) => (
  <div className="about-page about-page-empty">
    <div className="container">
      <p>{message}</p>
    </div>
  </div>
);

const AboutPage = () => {
  const { cmsData } = useCMS();
  const [about, setAbout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const { ref: storyRef, visible: storyVisible } = useRevealOnScroll(0.12);

  useEffect(() => {
    let active = true;
    aboutUsService.getAboutUs()
      .then((data) => {
        if (active) {
          setAbout(mapAboutPageFromApi(data?.aboutPage));
          setLoadError(null);
        }
      })
      .catch(() => {
        if (active) {
          setAbout(null);
          setLoadError('Unable to load About Us content right now.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  if (loading) {
    return <div className="about-page about-page-loading">Loading About Us content...</div>;
  }

  if (loadError || !about) {
    return <AboutEmptyState message={loadError || 'No About Us content is available yet.'} />;
  }

  const heroParagraphs = about.heroParagraphs?.length
    ? about.heroParagraphs
    : (about.heroDescription || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  const storyTimeline = (about.storyTimeline || []).filter((item) => item.isActive !== false);
  const activeMvpCards = (about.mvpCards || []).filter((item) => item.isActive !== false);
  const activeStats = (about.stats || []).filter((item) => item.isActive !== false);
  const activeOfferings = (about.offerings || []).filter((item) => item.isActive !== false);
  const showOwner = about.owner?.isActive !== false;

  const showIntro = about.heroIsActive !== false && (
    about.heroHeading || about.heroHighlight || about.heroEyebrow || heroParagraphs.length || about.heroImage
  );
  const showStory = about.storyIsActive !== false && (
    about.storyTitle || about.storyDescription || about.storyImage || storyTimeline.length > 0
  );
  const showMvp = activeMvpCards.length > 0;
  const showOffers = activeOfferings.length > 0;
  const showStats = activeStats.length > 0;
  const hasOwnerContent = Boolean(
    about.owner?.name || about.owner?.designation || about.owner?.quote || about.owner?.photo
  );
  const showOwnerSection = showOwner && hasOwnerContent;

  const hasVisibleContent = showIntro || showStory || showMvp || showOffers || showStats || showOwnerSection;
  if (!hasVisibleContent) {
    return <AboutEmptyState message="No About Us content is available yet." />;
  }

  const phone = about.owner?.phone || cmsData?.contactPhone || '';
  const email = cmsData?.contactEmail || '';
  const address = about.owner?.location || cmsData?.address || '';
  const phoneHref = phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : '';
  const emailHref = email ? `mailto:${email}` : '';
  const mapsHref = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : '';
  const socials = cmsData?.socials || {};
  const ownerBadge = about.owner?.badge || '';

  return (
    <div className="about-page">
      {showIntro && (
        <section className="about-intro">
          <div className="container">
            <article className="about-intro-card">
              <div className="about-intro-content">
                {about.heroEyebrow && <span className="about-intro-eyebrow">{about.heroEyebrow}</span>}
                {(about.heroHeading || about.heroHighlight) && (
                  <h1 className="about-intro-title">
                    {about.heroHeading}{' '}
                    {about.heroHighlight && (
                      <span className="about-intro-highlight">{about.heroHighlight}</span>
                    )}
                  </h1>
                )}
                {heroParagraphs.length > 0 && (
                  <div className="about-intro-copy">
                    {heroParagraphs.map((para) => (
                      <p key={para.slice(0, 40)}>{para}</p>
                    ))}
                  </div>
                )}
                {(about.button1Text || about.button2Text) && (
                  <div className="about-intro-actions">
                    {about.button1Text && about.button1Url && (
                      <Link to={about.button1Url} className="about-btn about-btn-primary">
                        {about.button1Text}
                      </Link>
                    )}
                    {about.button2Text && about.button2Url && (
                      <Link to={about.button2Url} className="about-btn about-btn-outline">
                        {about.button2Text}
                      </Link>
                    )}
                  </div>
                )}
              </div>
              {about.heroImage && (
                <div className="about-intro-visual">
                  <img
                    src={getImageUrl(about.heroImage)}
                    alt={`${about.heroHighlight || about.heroHeading || 'About'} at Wins Wereld Winkel`}
                    loading="lazy"
                    decoding="async"
                  />
                  {about.heroBadge && (
                    <span className="about-intro-badge">{about.heroBadge}</span>
                  )}
                </div>
              )}
            </article>
          </div>
        </section>
      )}

      {showStory && (
        <section className="about-story-block" ref={storyRef}>
          <div className="container">
            <article className={`about-story-panel${storyVisible ? ' is-visible' : ''}`}>
              {about.storyImage && (
                <div className="about-story-visual">
                  <div className="about-story-image-wrap">
                    <img
                      src={getImageUrl(about.storyImage)}
                      alt={about.storyTitle || 'Our story'}
                      loading="lazy"
                    />
                    {about.heroBadge && (
                      <span className="about-story-badge">{about.heroBadge}</span>
                    )}
                  </div>
                </div>
              )}
              <div className="about-story-content">
                {about.storyTitle && <h2 className="about-story-heading">{about.storyTitle}</h2>}
                <div className="about-story-heading-accent" aria-hidden="true" />
                {about.storyDescription && (
                  <p className="about-story-description">{about.storyDescription}</p>
                )}
                {storyTimeline.length > 0 && (
                  <ol className="about-story-timeline">
                    {storyTimeline.map((item, index) => {
                      const Icon = resolveIcon(item.icon, STORY_TIMELINE_ICONS[index % STORY_TIMELINE_ICONS.length]);
                      return (
                        <li
                          key={item.id || `${item.marker}-${item.title}`}
                          className="about-story-milestone"
                          style={{ '--milestone-delay': `${0.15 + index * 0.12}s` }}
                        >
                          <span
                            className={`about-story-milestone-icon${index % 2 === 1 ? ' accent' : ''}`}
                            aria-hidden="true"
                          >
                            <Icon />
                          </span>
                          <div className="about-story-milestone-body">
                            {item.marker && <span className="about-story-milestone-marker">{item.marker}</span>}
                            <strong>{item.title}</strong>
                            {item.description && <p>{item.description}</p>}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </article>
          </div>
        </section>
      )}

      {showMvp && (
        <section className="about-mvp">
          <div className="container about-mvp-grid">
            {activeMvpCards.map((card) => {
              const Icon = resolveIcon(card.icon, FiTarget);
              return (
                <article className="mvp-card" key={card.id || card.title}>
                  <div className="mvp-icon"><Icon /></div>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {showOffers && (
        <section className="about-offer">
          <div className="container">
            <div className="about-section-head">
              <h2 className="about-section-title">What We Offer</h2>
              <div className="about-title-line" />
            </div>
            <div className="about-offer-grid">
              {activeOfferings.map((item) => (
                <article className="offer-card" key={item.id || item.title}>
                  {item.image && (
                    <div className="offer-image-wrap">
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.title}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {showStats && (
        <section className="about-stats">
          <div className="container">
            <div className="about-section-head about-section-head--light">
              <h2 className="about-section-title light">Our Impact in Numbers</h2>
              <div className="about-title-line light" />
            </div>
            <div className="about-stats-grid">
              {activeStats.map((stat, index) => (
                <StatCounter
                  key={stat.id || stat.label}
                  value={stat.value}
                  suffix={stat.suffix}
                  label={stat.label}
                  icon={resolveIcon(stat.icon, statIcons[index % statIcons.length])}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {showOwnerSection && (
        <section className="about-owner">
          <div className="container">
            <div className="about-section-head">
              <h2 className="about-section-title">Meet Our Founder</h2>
              <div className="about-title-line" />
            </div>
            <article className="founder-panel">
              {about.owner.photo && (
                <div className="founder-visual">
                  <div className="founder-photo-card">
                    <img
                      src={getImageUrl(about.owner.photo)}
                      alt={about.owner.name || 'Founder'}
                      className="founder-photo"
                      loading="lazy"
                    />
                    {ownerBadge && <span className="founder-photo-badge">{ownerBadge}</span>}
                  </div>
                </div>
              )}
              <div className="founder-details">
                {about.owner.name && <h2 className="founder-name">{about.owner.name}</h2>}
                {about.owner.designation && <p className="founder-role">{about.owner.designation}</p>}
                {(about.owner.sinceYear || about.owner.yearsServing) && (
                  <div className="founder-badges-row">
                    {about.owner.sinceYear && (
                      <span className="founder-meta-badge since">
                        Since {about.owner.sinceYear}
                      </span>
                    )}
                    {about.owner.yearsServing && (
                      <span className="founder-meta-badge experience">
                        {about.owner.yearsServing}
                      </span>
                    )}
                  </div>
                )}
                {about.owner.quote && (
                  <blockquote className="founder-quote-card">
                    <span className="founder-quote-mark" aria-hidden="true">&ldquo;</span>
                    <p>{about.owner.quote}</p>
                  </blockquote>
                )}
                {(phone || email || address) && (
                  <ul className="founder-contact-list">
                    {phone && phoneHref && (
                      <li>
                        <a href={phoneHref} className="founder-contact-item">
                          <span className="founder-contact-icon" aria-hidden="true"><FiPhone /></span>
                          <span className="founder-contact-text">{phone}</span>
                        </a>
                      </li>
                    )}
                    {email && emailHref && (
                      <li>
                        <a href={emailHref} className="founder-contact-item">
                          <span className="founder-contact-icon" aria-hidden="true"><FiMail /></span>
                          <span className="founder-contact-text">{email}</span>
                        </a>
                      </li>
                    )}
                    {address && mapsHref && (
                      <li>
                        <a href={mapsHref} target="_blank" rel="noreferrer" className="founder-contact-item">
                          <span className="founder-contact-icon" aria-hidden="true"><FiMapPin /></span>
                          <span className="founder-contact-text">{address}</span>
                        </a>
                      </li>
                    )}
                  </ul>
                )}
                {(socials.facebook || socials.instagram || socials.whatsapp || socials.tiktok || socials.youtube) && (
                  <div className="founder-social-row">
                    {socials.facebook && (
                      <a href={socials.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="founder-social-link">
                        <FaFacebook />
                      </a>
                    )}
                    {socials.instagram && (
                      <a href={socials.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="founder-social-link">
                        <FaInstagram />
                      </a>
                    )}
                    {socials.whatsapp && (
                      <a href={socials.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="founder-social-link">
                        <FaWhatsapp />
                      </a>
                    )}
                    {socials.tiktok && (
                      <a href={socials.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok" className="founder-social-link">
                        <FaTiktok />
                      </a>
                    )}
                    {socials.youtube && (
                      <a href={socials.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" className="founder-social-link">
                        <FaYoutube />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </article>
          </div>
        </section>
      )}
    </div>
  );
};

export default AboutPage;
