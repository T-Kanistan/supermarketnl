import { useEffect } from 'react';
import './TermsPage.css';

const TermsPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="terms-page">
      <div className="terms-header">
        <div className="container">
          <h1>Terms and Conditions</h1>
          <p>Last Updated: June 2026</p>
        </div>
      </div>
      
      <div className="container terms-content">
        <section className="terms-section">
          <h2>1. General</h2>
          <p>
            By accessing and using this website, you agree to be bound by these Terms & Conditions and all applicable laws and regulations.
          </p>
        </section>

        <section className="terms-section">
          <h2>2. Products</h2>
          <p>
            We make every effort to display product information accurately. However, we do not warrant that product descriptions, prices or other content are accurate, complete, reliable, current or error-free.
          </p>
        </section>

        <section className="terms-section">
          <h2>3. Orders</h2>
          <p>
            All orders are subject to availability. We reserve the right to refuse or cancel any order at our sole discretion.
          </p>
        </section>

        <section className="terms-section">
          <h2>4. Payments</h2>
          <p>
            We accept various payment methods. All payments must be made in full before the order is processed.
          </p>
        </section>

        <section className="terms-section">
          <h2>5. Changes</h2>
          <p>
            We reserve the right to update or change these Terms & Conditions at any time without prior notice.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
