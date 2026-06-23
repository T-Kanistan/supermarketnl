import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import { FaLeaf } from 'react-icons/fa';
import { useCMS } from '../context/CMSContext';
import aboutUsService from '../services/aboutUsService';
import { getImageUrl } from '../services/api';
import { ABOUT_STORY_IMAGE, mergeAboutPage } from '../constants/aboutPageDefaults';
import './AboutPage.css';

const {
  FiArrowRight, FiEye, FiHeart, FiMapPin, FiPhone, FiShoppingBag, FiTarget, FiUsers,
  FiCheck, FiStar, FiGrid, FiGlobe, FiCoffee, FiHeadphones, FiCalendar, FiAward,
} = FiIcons;

const resolveIcon = (name, fallback = FiCalendar) => FiIcons[name] || fallback;

const INTRO_PILLARS = [
  { icon: FaLeaf, label: 'Fresh Products' },
  { icon: FiGlobe, label: 'International Groceries' },
  { icon: FiCoffee, label: 'Food Corner' },
  { icon: FiHeadphones, label: 'Customer Service' },
];

const INTRO_FEATURES = [
  'Fresh Produce',
  'International Products',
  'Food Corner Meals',
  'Friendly Customer Service',
];

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

const highlightKeywords = (text, keywords = []) => {
  if (!text || !keywords.length) return text;
  const pattern = new RegExp(`(${keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    keywords.some((k) => k.toLowerCase() === part.toLowerCase()) ? (
      <mark key={`${part}-${i}`} className="about-keyword">{part}</mark>
    ) : (
      part
    )
  );
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

const AboutPage = () => {
  const { cmsData } = useCMS();
  const [about, setAbout] = useState(() => mergeAboutPage());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    aboutUsService.getAboutUs()
      .then((data) => {
        if (active && data?.aboutPage) {
          setAbout(mergeAboutPage(data.aboutPage));
        }
      })
      .catch(() => {
        /* keep merged defaults */
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const heroParagraphs = (about.heroParagraphs?.length
    ? about.heroParagraphs
    : (about.heroDescription || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean));

  const storyTimeline = (about.storyTimeline || []).filter((item) => item.isActive !== false && item.isDeleted !== true);
  const activeMvpCards = (about.mvpCards || []).filter((item) => item.isActive !== false && item.isDeleted !== true);
  const activeStats = (about.stats || []).filter((item) => item.isActive !== false && item.isDeleted !== true);
  const showOwner = about.owner?.isActive !== false;
  const { ref: storyRef, visible: storyVisible } = useRevealOnScroll(0.12);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const phone = about.owner.phone || cmsData?.contactPhone || '+31659046526';
  const address = about.owner.location || cmsData?.address || 'Leeuwenstraat 36, 1211 EV, Hilversum';
  const phoneHref = `tel:${phone.replace(/[^\d+]/g, '')}`;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const activeOfferings = (about.offerings || []).filter((item) => item.isActive !== false);
  const highlightWords = about.heroHighlights || [];

  if (loading) {
    return <div className="about-page about-page-loading">Loading About Us content...</div>;
  }

  return (
    <div className="about-page">
      {/* Section 1 – About Wins Wereld Winkel */}
      {about.heroIsActive !== false && (
      <section className="about-intro">
        <div className="container">
          <article className="about-intro-card">
            <div className="about-intro-content">
              <span className="about-intro-eyebrow">{about.heroEyebrow}</span>
              <h1 className="about-intro-title">
                {about.heroHeading}{' '}
                <span className="about-intro-highlight">{about.heroHighlight}</span>
              </h1>
              <div className="about-intro-copy">
                {heroParagraphs.map((para) => (
                  <p key={para.slice(0, 40)}>{highlightKeywords(para, highlightWords)}</p>
                ))}
              </div>
              <div className="about-intro-pillars">
                {INTRO_PILLARS.map(({ icon: Icon, label }) => (
                  <div className="about-pillar" key={label}>
                    <span className="about-pillar-icon" aria-hidden="true"><Icon /></span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <ul className="about-intro-features">
                {INTRO_FEATURES.map((item) => (
                  <li key={item}><FiCheck aria-hidden="true" /> {item}</li>
                ))}
              </ul>
              <div className="about-intro-actions">
                <Link to={about.button1Url || '/products'} className="about-btn about-btn-primary">
                  {about.button1Text || 'Explore Products'} <FiArrowRight />
                </Link>
                <Link to={about.button2Url || '/contact'} className="about-btn about-btn-outline">
                  {about.button2Text || 'Contact Us'}
                </Link>
              </div>
            </div>
            <div className="about-intro-visual">
              <img src={getImageUrl(about.heroImage)} alt={about.heroHighlight} />
              {about.heroBadge && (
                <span className="about-intro-badge">{about.heroBadge}</span>
              )}
            </div>
          </article>
        </div>
      </section>
      )}
      <section className="about-story-block" ref={storyRef}>
        <div className="container">
          <article className={`about-story-panel${storyVisible ? ' is-visible' : ''}`}>
            <div className="about-story-visual">
              <div className="about-story-image-wrap">
                <img
                  src={getImageUrl(about.storyImage || ABOUT_STORY_IMAGE)}
                  alt="Bright supermarket interior with fresh produce, grocery aisles, and customers shopping"
                  loading="lazy"
                  onError={(e) => {
                    if (!e.target.dataset.fallback) {
                      e.target.dataset.fallback = '1';
                      e.target.src = ABOUT_STORY_IMAGE;
                    }
                  }}
                />
                <span className="about-story-badge">
                  {about.heroBadge || 'Serving Hilversum Since 2022'}
                </span>
              </div>
            </div>
            <div className="about-story-content">
              <h2 className="about-story-heading">{about.storyTitle}</h2>
              <div className="about-story-heading-accent" aria-hidden="true" />
              <ol className="about-story-timeline">
                {storyTimeline.map((item, index) => {
                  const Icon = resolveIcon(item.icon, STORY_TIMELINE_ICONS[index % STORY_TIMELINE_ICONS.length]);
                  return (
                    <li
                      key={`${item.marker}-${item.title}`}
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
                        <span className="about-story-milestone-marker">{item.marker}</span>
                        <strong>{item.title}</strong>
                        <p>{item.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </article>
        </div>
      </section>

      <section className="about-mvp">
        <div className="container about-mvp-grid">
          {(activeMvpCards.length ? activeMvpCards : [
            { title: about.missionTitle, description: about.missionDescription, icon: 'FiTarget' },
            { title: about.visionTitle, description: about.visionDescription, icon: 'FiEye' },
            { title: about.promiseTitle, description: about.promiseDescription, icon: 'FiHeart' },
          ]).map((card) => {
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

      {/* Section 3 – Statistics */}
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

      {/* Section 4 – Founder & Owner */}
      {showOwner && (
      <section className="about-owner">
        <div className="container">
          <article className="founder-panel">
            <div className="founder-photo-wrap">
              <img
                src={getImageUrl(about.owner.photo)}
                alt={about.owner.name}
                className="founder-photo"
              />
            </div>
            <div className="founder-body">
              {about.owner.badge && <span className="founder-badge">{about.owner.badge}</span>}
              <h2 className="founder-name">{about.owner.name}</h2>
              <p className="founder-role">{about.owner.designation}</p>
              <p className="founder-tenure">
                {about.owner.yearsServing || '5+ Years Serving Community'}
                <span>Since {about.owner.sinceYear || '2022'}</span>
              </p>
              {about.owner.quote && (
                <blockquote className="founder-quote">
                  &ldquo;{about.owner.quote}&rdquo;
                </blockquote>
              )}
              <div className="founder-contact-col">
                <a href={phoneHref} className="founder-contact-item">
                  <FiPhone /> {phone}
                </a>
                <a href={mapsHref} target="_blank" rel="noreferrer" className="founder-contact-item">
                  <FiMapPin /> {address}
                </a>
              </div>
            </div>
          </article>
        </div>
      </section>
      )}
    </div>
  );
};

export default AboutPage;
