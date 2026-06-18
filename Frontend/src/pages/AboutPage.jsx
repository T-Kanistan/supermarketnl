import { useEffect, useRef, useState } from 'react';
import {
  FiPackage, FiShield, FiSmile, FiTruck, FiTarget, FiEye, FiPhone, FiMapPin
} from 'react-icons/fi';
import { useCMS } from '../context/CMSContext';
import {
  FaAppleAlt, FaDrumstickBite, FaGlobeAmericas, FaPepperHot, FaSnowflake, FaUtensils
} from 'react-icons/fa';
import './AboutPage.css';

const offerings = [
  { icon: <FaAppleAlt />, title: 'Fresh Vegetables & Fruits', desc: 'Daily fresh produce for every meal.', tone: 'green' },
  { icon: <FaDrumstickBite />, title: 'Fresh Meat', desc: 'Quality cuts you can trust.', tone: 'red' },
  { icon: <FaGlobeAmericas />, title: 'International Groceries', desc: 'Products from cultures worldwide.', tone: 'blue' },
  { icon: <FaPepperHot />, title: 'Masala Items', desc: 'Authentic spices and blends.', tone: 'orange' },
  { icon: <FaSnowflake />, title: 'Frozen Foods', desc: 'Frozen essentials, always fresh.', tone: 'cyan' },
  { icon: <FaUtensils />, title: 'Food Corner', desc: 'Homemade takeaway meals daily.', tone: 'amber' },
];

const statsConfig = [
  { end: 15, suffix: 'K+', label: 'Happy Customers' },
  { end: 500, suffix: '+', label: 'Products' },
  { end: 50, suffix: '+', label: 'Categories' },
  { end: 99, suffix: '%', label: 'Customer Satisfaction' },
];

const features = [
  { icon: <FiTruck />, title: 'Fresh Daily Stock' },
  { icon: <FiPackage />, title: 'Affordable Prices' },
  { icon: <FiShield />, title: 'Quality Guaranteed' },
  { icon: <FiSmile />, title: 'Friendly Service' },
];

const useCountUp = (end, suffix, duration = 1600) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let current = 0;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      current += step;
      if (current >= end) { setCount(end); clearInterval(timer); }
      else setCount(current);
    }, 16);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  return { display: `${count}${suffix}`, ref };
};

const StatCounter = ({ end, suffix, label }) => {
  const { display, ref } = useCountUp(end, suffix);
  return (
    <div className="about-stat" ref={ref}>
      <span className="about-stat-value">{display}</span>
      <span className="about-stat-label">{label}</span>
    </div>
  );
};

const AboutPage = () => {
  const { cmsData } = useCMS();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const phone = cmsData.contactPhone || '+31659046526';
  const address = cmsData.address || 'Leeuwenstraat 36, 1211ev, Hilversum';
  const phoneHref = `tel:${phone.replace(/[^\d+]/g, '')}`;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="container about-hero-grid">
          <div className="about-hero-text">
            <h1>Your Trusted Supermarket in Hilversum</h1>
            <p>
              Founded in July 2022, Wins Wereld Winkel World Supermarket has become a trusted destination
              for quality groceries, fresh produce, and delicious takeaway food in Hilversum. We welcome
              families, students, and professionals from all backgrounds who are looking for a reliable
              place to shop for everyday essentials and specialty items.
            </p>
            <p>
              We are committed to providing customers with a diverse selection of products from different
              cultures and communities while maintaining the highest standards of quality, freshness, and
              customer service. From fresh vegetables and fruits to masala items, frozen foods, and our
              popular Food Corner meals, we work hard to bring everything you need under one roof.
            </p>
            <p>
              Our supermarket is designed to be more than just a store — it is a community hub where
              customers can discover international groceries, enjoy affordable prices, and receive friendly,
              helpful service every time they visit. Whether you are shopping for your weekly groceries,
              planning a special meal, or looking for hard-to-find products from home, Wins Wereld Winkel
              is here to serve you with care and dedication.
            </p>
            <p>
              Located in Hilversum, we continue to grow with our customers and remain focused on freshness,
              variety, and value. Visit us today and experience a welcoming supermarket built on trust,
              quality, and a passion for serving our community.
            </p>
          </div>
          <div className="about-hero-visual">
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1400"
              alt="Fresh groceries at Wins Wereld Winkel"
            />
          </div>
        </div>
      </section>

      <section className="about-story-block">
        <div className="container about-story-layout">
          <div className="about-story-image">
            <img
              src="https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=800"
              alt="Inside Wins Wereld Winkel"
            />
          </div>
          <div className="about-story-cards">
            <article className="story-card">
              <h2>Our Story</h2>
              <p>
                Established on 01 July 2022 with a vision of creating a supermarket where customers find
                everything under one roof — from everyday groceries to specialty products from Asia, Africa,
                and Arabic countries.
              </p>
            </article>
            <div className="mission-vision-row">
              <article className="story-card story-card-sm">
                <div className="story-card-icon"><FiTarget /></div>
                <h3>Our Mission</h3>
                <p>High-quality products at affordable prices, exceptional service, and a welcoming environment for everyone.</p>
              </article>
              <article className="story-card story-card-sm">
                <div className="story-card-icon accent"><FiEye /></div>
                <h3>Our Vision</h3>
                <p>To become the most trusted multicultural supermarket in the Netherlands through freshness, variety, and value.</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="about-offer">
        <div className="container">
          <div className="about-section-head">
            <span className="about-section-eyebrow">Our Range</span>
            <h2 className="about-section-title">What We Offer</h2>
            <p className="about-section-sub">Quality products for every taste, culture, and occasion.</p>
          </div>
          <div className="about-offer-grid">
            {offerings.map((item) => (
              <article className="offer-card" key={item.title}>
                <div className={`offer-icon-wrap tone-${item.tone}`}>{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-stats">
        <div className="container about-stats-grid">
          {statsConfig.map((s) => (
            <StatCounter key={s.label} end={s.end} suffix={s.suffix} label={s.label} />
          ))}
        </div>
      </section>

      <section className="about-features">
        <div className="container">
          <div className="about-section-head">
            <span className="about-section-eyebrow">Why Shop With Us</span>
            <h2 className="about-section-title">Why Customers Choose Us</h2>
            <p className="about-section-sub">The values that make every visit worthwhile.</p>
          </div>
          <div className="about-features-grid">
            {features.map((item) => (
              <div className="feature-card" key={item.title}>
                <span className="feature-icon-wrap">{item.icon}</span>
                <h3>{item.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="about-owner">
        <div className="container">
          <div className="founder-card">
            <img
              src="/images/owner-raguparan.png"
              alt="Raguparan Murugamoorthy"
              className="founder-photo"
            />
            <div className="founder-body">
              <span className="founder-badge">Since 2022</span>
              <h2 className="founder-name">Raguparan Murugamoorthy</h2>
              <p className="founder-role">Founder &amp; Owner</p>
              <p className="founder-quote">
                &ldquo;Our goal is to provide quality products, fresh groceries, and excellent customer service to every customer.&rdquo;
              </p>
              <div className="founder-contact">
                <a href={phoneHref} className="founder-contact-item">
                  <FiPhone /> {phone}
                </a>
                <a href={mapsHref} target="_blank" rel="noreferrer" className="founder-contact-item">
                  <FiMapPin /> {address}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
