import Hero from '../components/Hero';
import Features from '../components/Features';
import FeaturedProducts from '../components/FeaturedProducts';
import Promotions from '../components/Promotions';
import About from '../components/About';
import Reviews from '../components/Reviews';
import './Home.css';

const Home = () => {
  return (
    <div className="home-page">
      <Hero />
      <Features />
      <FeaturedProducts />
      <Promotions />
      <About />
      <Reviews />
    </div>
  );
};

export default Home;
