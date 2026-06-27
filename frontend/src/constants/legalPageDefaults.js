export const defaultLegalPages = {
  terms: {
    title: 'Terms and Conditions',
    lastUpdated: 'June 2026',
    sections: [
      {
        heading: '1. General',
        body: 'By accessing and using this website, you agree to be bound by these Terms & Conditions and all applicable laws and regulations.',
      },
      {
        heading: '2. Products',
        body: 'We make every effort to display product information accurately. However, we do not warrant that product descriptions, prices or other content are accurate, complete, reliable, current or error-free.',
      },
      {
        heading: '3. Orders',
        body: 'All orders are subject to availability. We reserve the right to refuse or cancel any order at our sole discretion.',
      },
      {
        heading: '4. Payments',
        body: 'We accept various payment methods. All payments must be made in full before the order is processed.',
      },
      {
        heading: '5. Changes',
        body: 'We reserve the right to update or change these Terms & Conditions at any time without prior notice.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    lastUpdated: 'June 2026',
    sections: [
      {
        heading: '1. Information We Collect',
        body: 'We may collect personal information such as your name, email address, phone number, and messages when you contact us, submit enquiries, or use our website services.',
      },
      {
        heading: '2. How We Use Your Information',
        body: 'Your information is used to respond to enquiries, process orders, improve our services, and communicate important updates related to our store and products.',
      },
      {
        heading: '3. Data Protection',
        body: 'We take reasonable measures to protect your personal data from unauthorized access, misuse, or disclosure. We do not sell your personal information to third parties.',
      },
      {
        heading: '4. Cookies',
        body: 'Our website may use cookies to improve browsing experience and analyze website traffic. You can manage cookie preferences through your browser settings.',
      },
      {
        heading: '5. Contact Us',
        body: 'If you have questions about this Privacy Policy, please contact us through our Contact Us page or email us at info@winswereldwinkel.nl.',
      },
    ],
  },
};

const mergePage = (base, page) => {
  if (!page || typeof page !== 'object') return JSON.parse(JSON.stringify(base));
  const hasSections = Array.isArray(page.sections) && page.sections.length > 0;
  return {
    title: page.title || base.title,
    lastUpdated: page.lastUpdated || base.lastUpdated,
    sections: hasSections
      ? page.sections.map((s) => ({ heading: s.heading || '', body: s.body || '' }))
      : JSON.parse(JSON.stringify(base.sections)),
  };
};

export const mergeLegalPages = (data) => ({
  terms: mergePage(defaultLegalPages.terms, data?.terms),
  privacy: mergePage(defaultLegalPages.privacy, data?.privacy),
});

export const emptyLegalSection = () => ({ heading: '', body: '' });
