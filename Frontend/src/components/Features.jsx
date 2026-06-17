import { FiCheckCircle, FiTag, FiHeart, FiHeadphones } from 'react-icons/fi';
import './Features.css';

const Features = () => {
  const features = [
    {
      icon: <FiCheckCircle />,
      title: 'Quality Products',
      description: 'Handpicked fresh items'
    },
    {
      icon: <FiTag />,
      title: 'Best Offers',
      description: 'Great discounts daily'
    },
    {
      icon: <FiHeart />,
      title: 'Fresh & Healthy',
      description: '100% organic goods'
    },
    {
      icon: <FiHeadphones />,
      title: 'Customer Support',
      description: '24/7 dedicated support'
    }
  ];

  return (
    <section className="features section-padding bg-white">
      <div className="container">
        <div className="features-grid">
          {features.map((feature, index) => (
            <div className="feature-card" key={index}>
              <div className="feature-icon">{feature.icon}</div>
              <div className="feature-content">
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
