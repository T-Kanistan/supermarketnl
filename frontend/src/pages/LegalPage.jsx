import { useEffect, useState } from 'react';
import legalPagesService from '../services/legalPagesService';
import { defaultLegalPages } from '../constants/legalPageDefaults';
import './TermsPage.css';

const LegalPage = ({ slug }) => {
  const fallback = slug === 'privacy' ? defaultLegalPages.privacy : defaultLegalPages.terms;
  const [page, setPage] = useState(fallback);

  useEffect(() => {
    window.scrollTo(0, 0);
    let active = true;
    legalPagesService
      .getLegalPage(slug)
      .then((data) => {
        if (active && data) setPage(data);
      })
      .catch((err) => {
        console.error('Failed to load legal page content', err);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const sections = Array.isArray(page.sections) ? page.sections : [];

  return (
    <div className="terms-page">
      <div className="terms-header">
        <div className="container">
          <h1>{page.title}</h1>
          {page.lastUpdated ? <p>Last Updated: {page.lastUpdated}</p> : null}
        </div>
      </div>

      <div className="container terms-content">
        {sections.map((section, index) => (
          <section className="terms-section" key={`${slug}-${index}`}>
            {section.heading ? <h2>{section.heading}</h2> : null}
            {section.body
              ? section.body
                  .split(/\n{2,}/)
                  .map((para, i) => <p key={i}>{para}</p>)
              : null}
          </section>
        ))}
      </div>
    </div>
  );
};

export default LegalPage;
