import { useNavigate } from 'react-router-dom';
import { FiCheckCircle } from 'react-icons/fi';
import { useCMS } from '../context/CMSContext';
import './About.css';

const About = () => {
  const navigate = useNavigate();
  const { cmsData } = useCMS();

  return (
    <section className="about section-padding bg-white" id="about">
      <div className="container">
        <div className="about-grid">
          {/* Content Left Side */}
          <div className="about-content">
            <h2 className="about-title">About <span>{cmsData.storeName || 'Our Store'}</span></h2>
            <p className="about-desc">
              {cmsData.aboutUs}
            </p>
            <ul className="about-features-modern">
              <li>
                <FiCheckCircle className="check-icon-modern" />
                <span>Fresh & Organic Products</span>
              </li>
              <li>
                <FiCheckCircle className="check-icon-modern" />
                <span>Affordable Prices</span>
              </li>
              <li>
                <FiCheckCircle className="check-icon-modern" />
                <span>Fast Customer Service</span>
              </li>
              <li>
                <FiCheckCircle className="check-icon-modern" />
                <span>International Grocery Selection</span>
              </li>
            </ul>
            <button className="about-gradient-btn" onClick={() => navigate('/about')}>Learn More</button>
          </div>

          {/* Image Right Side */}
          <div className="about-image-container-modern">
            <img src="https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=1200" alt="About Supermarket" className="about-image-modern" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
