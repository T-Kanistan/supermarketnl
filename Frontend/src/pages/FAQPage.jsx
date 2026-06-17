import { useState, useEffect } from 'react';
import { FaPlusCircle, FaMinusCircle } from 'react-icons/fa';
import faqService from '../services/faqService';
import './FAQPage.css';

const FAQPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [openIndex, setOpenIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const data = await faqService.getFaqs();
        setFaqs(data.filter(f => f.status === 'active'));
      } catch (err) {
        console.error('Failed to load FAQs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <div className="faq-page">
      {/* Hero Section */}
      <div className="faq-hero">
        <div className="faq-hero-overlay"></div>
        <div className="container faq-hero-content">
          <h1>FREQUENTLY ASKED QUESTIONS</h1>
          <p className="faq-breadcrumb">Home <span className="arrow">&gt;</span> FAQ</p>
        </div>
      </div>

      {/* FAQ List Section */}
      <div className="container faq-container">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ height: '60px', background: '#e2e8f0', borderRadius: '8px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
            ))}
          </div>
        ) : faqs.length > 0 ? (
          <div className="faq-list">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div 
                  key={faq.id || index} 
                  className={`faq-item ${isOpen ? 'open' : ''}`}
                  onClick={() => toggleFAQ(index)}
                >
                  <div className="faq-question">
                    <h3>{faq.question}</h3>
                    <div className="faq-icon">
                      {isOpen ? <FaMinusCircle className="minus-icon" /> : <FaPlusCircle className="plus-icon" />}
                    </div>
                  </div>
                  {isOpen && (
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            No FAQs published at this time.
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQPage;
