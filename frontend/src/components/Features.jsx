import { useState, useEffect } from 'react';
import { FiCheckCircle, FiTag, FiHeart, FiHeadphones } from 'react-icons/fi';
import { useCMS } from '../context/CMSContext';
import './Features.css';

const iconMap = {
  check: <FiCheckCircle />,
  tag: <FiTag />,
  heart: <FiHeart />,
  headphones: <FiHeadphones />,
};

const Features = () => {
  const { cmsData } = useCMS();
  const features = cmsData?.featuresSection?.items || [];

  if (!features.length) return null;

  return (
    <section className="features section-padding bg-white">
      <div className="container">
        <div className="features-grid">
          {features.map((feature, index) => (
            <div className="feature-card" key={feature.title || index}>
              <div className="feature-icon">{iconMap[feature.icon] || <FiCheckCircle />}</div>
              <div className="feature-content">
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
