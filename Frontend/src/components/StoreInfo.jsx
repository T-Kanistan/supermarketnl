import { FiMapPin, FiClock, FiPhoneCall } from 'react-icons/fi';
import './StoreInfo.css';

const StoreInfo = () => {
  return (
    <section className="store-info section-padding bg-white" id="contact">
      <div className="container">
        <h2 className="section-title">Store Information</h2>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-icon"><FiMapPin /></div>
            <h3 className="info-title">Store Location</h3>
            <p className="info-text">123 Supermarket Ave, Grocer City, GC 12345</p>
            <a href="#" className="info-link">Get Directions</a>
          </div>
          
          <div className="info-card">
            <div className="info-icon"><FiClock /></div>
            <h3 className="info-title">Opening Hours</h3>
            <p className="info-text">Mon - Sat: 8:00 AM - 10:00 PM</p>
            <p className="info-text">Sunday: 9:00 AM - 8:00 PM</p>
          </div>
          
          <div className="info-card">
            <div className="info-icon"><FiPhoneCall /></div>
            <h3 className="info-title">Contact Us</h3>
            <p className="info-text">Phone: +1 234 567 890</p>
            <p className="info-text">Email: info@inswereldwinkel.com</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StoreInfo;
