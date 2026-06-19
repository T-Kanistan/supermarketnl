import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiTool } from 'react-icons/fi';
import './OffersPage.css';

const OffersPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="offers-coming-soon-page">
      <div className="offers-coming-soon-card">
        <div className="offers-coming-soon-icon" aria-hidden="true">
          <FiTool />
        </div>

        <span className="offers-coming-soon-badge">🚧 UNDER CONSTRUCTION</span>

        <h1 className="offers-coming-soon-title">Offers Page Coming Soon</h1>

        <p className="offers-coming-soon-desc">
          We are currently working on exciting offers and promotions for our customers.
          Please check back soon for exclusive supermarket deals and food corner discounts.
        </p>

        <Link to="/" className="offers-coming-soon-btn">
          <FiHome aria-hidden="true" />
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default OffersPage;
