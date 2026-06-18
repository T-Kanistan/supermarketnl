import { useEffect } from 'react';
import './TermsPage.css';

const PrivacyPolicyPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="terms-page">
      <div className="terms-header">
        <div className="container">
          <h1>Privacy Policy</h1>
          <p>Last Updated: June 2026</p>
        </div>
      </div>

      <div className="container terms-content">
        <section className="terms-section">
          <h2>1. Information We Collect</h2>
          <p>
            We may collect personal information such as your name, email address, phone number, and messages
            when you contact us, submit enquiries, or use our website services.
          </p>
        </section>

        <section className="terms-section">
          <h2>2. How We Use Your Information</h2>
          <p>
            Your information is used to respond to enquiries, process orders, improve our services,
            and communicate important updates related to our store and products.
          </p>
        </section>

        <section className="terms-section">
          <h2>3. Data Protection</h2>
          <p>
            We take reasonable measures to protect your personal data from unauthorized access,
            misuse, or disclosure. We do not sell your personal information to third parties.
          </p>
        </section>

        <section className="terms-section">
          <h2>4. Cookies</h2>
          <p>
            Our website may use cookies to improve browsing experience and analyze website traffic.
            You can manage cookie preferences through your browser settings.
          </p>
        </section>

        <section className="terms-section">
          <h2>5. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us through our Contact Us page
            or email us at info@winswereldwinkel.nl.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
