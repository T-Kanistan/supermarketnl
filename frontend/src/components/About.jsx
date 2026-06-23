import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import homepageAboutService from '../services/homepageAboutService';
import { getImageUrl } from '../services/api';
import './About.css';

const DEFAULT_ABOUT_PATH = '/about';
const BLOCKED_HASH_TARGETS = new Set(['footer', 'contact']);

const normalizeLearnMoreTarget = (link) => {
  const raw = (link || '').trim() || DEFAULT_ABOUT_PATH;

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return { type: 'external', href: raw };
  }

  if (raw.startsWith('#')) {
    const sectionId = raw.slice(1).toLowerCase();
    if (BLOCKED_HASH_TARGETS.has(sectionId)) {
      return { type: 'route', path: DEFAULT_ABOUT_PATH };
    }
    if (sectionId === 'about') {
      return { type: 'hash', id: 'about' };
    }
    return { type: 'route', path: DEFAULT_ABOUT_PATH };
  }

  let path = raw.startsWith('/') ? raw : `/${raw}`;
  if (path === '/about-us') path = DEFAULT_ABOUT_PATH;
  if (path === '/footer' || path === '/contact') path = DEFAULT_ABOUT_PATH;

  const [routePath, hash] = path.split('#');
  if (hash && BLOCKED_HASH_TARGETS.has(hash.toLowerCase())) {
    return { type: 'route', path: DEFAULT_ABOUT_PATH };
  }

  return { type: 'route', path };
};

const About = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    homepageAboutService
      .getHomepageAbout()
      .then((data) => setContent(data))
      .catch(() => {
        setContent(null);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleButtonClick = (link) => {
    const target = normalizeLearnMoreTarget(link);

    if (target.type === 'external') {
      window.location.href = target.href;
      return;
    }

    if (target.type === 'hash') {
      const section = document.getElementById(target.id);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    navigate(target.path);
  };

  if (loading) {
    return (
      <section className="about section-padding bg-white" id="about">
        <div className="container about-loading">Loading...</div>
      </section>
    );
  }

  if (error || !content) {
    return null;
  }

  const image = content.aboutImage ? getImageUrl(content.aboutImage) : '';

  return (
    <section className="about section-padding bg-white" id="about">
      <div className="container">
        <div className="about-grid">
          <div className="about-content">
            {content.sectionHeading && (
              <h2 className="about-title">{content.sectionHeading}</h2>
            )}
            {content.shortDescription && (
              <p className="about-desc">{content.shortDescription}</p>
            )}
            {content.buttonText && (
              <button
                type="button"
                className="about-learn-btn"
                onClick={() => handleButtonClick(content.buttonLink)}
              >
                {content.buttonText}
              </button>
            )}
          </div>
          {image && (
            <div className="about-image-container-modern">
              <img
                key={content.aboutImage}
                src={image}
                alt={content.sectionHeading || 'About our store'}
                className="about-image-modern"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default About;
