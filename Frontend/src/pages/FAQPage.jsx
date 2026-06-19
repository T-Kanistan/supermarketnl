import { useState, useEffect } from 'react';
import { FiPlus, FiMinus, FiHelpCircle } from 'react-icons/fi';
import faqService from '../services/faqService';
import './FAQPage.css';

const sortFaqs = (list) =>
  [...list].sort((a, b) => {
    const orderDiff = (a.order || 0) - (b.order || 0);
    if (orderDiff !== 0) return orderDiff;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

const formatFaqText = (text) =>
  String(text ?? '')
    .trim()
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n');

const FAQPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchFaqs = async () => {
      try {
        const data = await faqService.getFaqs();
        const active = sortFaqs(data.filter((f) => f.status === 'active'));
        setFaqs(active);
        if (active.length) setOpenId(active[0].id);
      } catch (err) {
        console.error('Failed to load FAQs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const toggleFAQ = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="faq-page">
      <section className="faq-hero">
        <div className="faq-hero-bg" aria-hidden="true" />
        <div className="faq-hero-overlay" />
        <div className="container faq-hero-inner">
          <div className="faq-hero-copy">
            <span className="faq-hero-badge">HELP CENTER</span>
            <h1 className="faq-hero-heading">Frequently Asked Questions</h1>
            <p className="faq-hero-subtitle">
              Find answers about our supermarket, products, food corner, and services.
            </p>
          </div>
          <div className="faq-hero-art" aria-hidden="true">
            <div className="faq-art-ring" />
            <div className="faq-art-bubble faq-art-bubble-main">FAQ</div>
            <div className="faq-art-bubble faq-art-bubble-chat">
              <span /><span /><span />
            </div>
            <div className="faq-art-icon">
              <FiHelpCircle />
            </div>
          </div>
        </div>
      </section>

      <div className="faq-list-section">
        <div className="faq-list-wrap">
          {loading ? (
            <div className="faq-accordion">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="faq-item faq-item-skeleton" />
              ))}
            </div>
          ) : faqs.length > 0 ? (
            <div className="faq-accordion">
              {faqs.map((faq) => {
                const isOpen = openId === faq.id;
                return (
                  <article key={faq.id} className={`faq-item ${isOpen ? 'open' : ''}`}>
                    <button
                      type="button"
                      className="faq-item-header"
                      onClick={() => toggleFAQ(faq.id)}
                      aria-expanded={isOpen}
                    >
                      <h3>{formatFaqText(faq.question)}</h3>
                      <span className="faq-item-icon" aria-hidden="true">
                        {isOpen ? <FiMinus /> : <FiPlus />}
                      </span>
                    </button>
                    <div className="faq-item-body">
                      <div className="faq-item-body-inner">
                        <p>{formatFaqText(faq.answer)}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="faq-empty">No FAQs published at this time.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
