import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import homepageAboutService from '../services/homepageAboutService';
import { getImageUrl } from '../services/api';
import './About.css';

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
    const target = link || '/about-us';
    if (target.startsWith('http://') || target.startsWith('https://')) {
      window.location.href = target;
      return;
    }
    navigate(target.startsWith('/') ? target : `/${target}`);
  };

  if (loading) {
    return (
      <section className="about section-padding bg-white" id="about">
        <div className="container about-loading">Loading...</div>
      </section>
    );
  }

  if (error || content?.status === 'Inactive') {
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
