import { FiMapPin, FiClock, FiPhoneCall } from 'react-icons/fi';
import { useCMS } from '../context/CMSContext';
import './StoreInfo.css';

const StoreInfo = () => {
  const { cmsData } = useCMS();

  return (
    <section className="store-info section-padding bg-white" id="contact">
      <div className="container">
        <h2 className="section-title">Store Information</h2>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-icon"><FiMapPin /></div>
            <h3 className="info-title">Store Location</h3>
            <p className="info-text">{cmsData?.address || ''}</p>
            <a href="#" className="info-link">Get Directions</a>
          </div>
          
          <div className="info-card">
            <div className="info-icon"><FiClock /></div>
            <h3 className="info-title">Opening Hours</h3>
            {cmsData?.supermarketTimings && (
              <p className="info-text">Supermarket: {cmsData.supermarketTimings}</p>
            )}
            {cmsData?.foodCornerTimings && (
              <p className="info-text">Food Corner: {cmsData.foodCornerTimings}</p>
            )}
          </div>
          
          <div className="info-card">
            <div className="info-icon"><FiPhoneCall /></div>
            <h3 className="info-title">Contact Us</h3>
            {cmsData?.contactPhone && (
              <p className="info-text">Phone: {cmsData.contactPhone}</p>
            )}
            {cmsData?.contactEmail && (
              <p className="info-text">Email: {cmsData.contactEmail}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StoreInfo;
