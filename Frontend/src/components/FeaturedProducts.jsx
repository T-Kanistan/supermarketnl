import { useState, useEffect } from 'react';
import { FiStar } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import productService from '../services/productService';
import { getImageUrl } from '../services/api';
import { useCMS } from '../context/CMSContext';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import './FeaturedProducts.css';

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { cmsData } = useCMS();

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const data = await productService.getProducts({ isFeatured: true });
        setProducts(data.filter(p => p.status === 'active'));
      } catch (err) {
        console.error('Failed to load featured products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedProducts();
  }, []);

  const handleEnquiry = (productName) => {
    // Extract WhatsApp number or use fallback
    const phoneUrl = cmsData.socials?.whatsapp || 'https://wa.me/31612345678';
    const cleanNumber = phoneUrl.replace(/[^0-9]/g, '');
    const number = cleanNumber || '31612345678';

    const message = `Hello, I would like to know more about this product.\n\nProduct Name: ${productName}\n\nIs this product currently available?\nCould you please provide more details regarding price, stock availability, and delivery options?\n\nThank you.`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${number}?text=${encodedMessage}`, '_blank');
  };

  return (
    <section className="featured-products pt-40 pb-10" id="products">
      <div className="container">
        <div className="featured-header">
          <h2 className="section-title" style={{ marginBottom: 0, textAlign: 'left' }}>Featured Products</h2>
          <Link to="/products" className="view-all-btn">View All</Link>
        </div>
        
        {loading ? (
          <div className="products-slider-container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="product-card skeleton-card" style={{ height: '320px', background: 'white', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ height: '160px', background: '#f1f5f9', borderRadius: '8px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                  <div style={{ height: '20px', width: '80%', background: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                  <div style={{ height: '16px', width: '50%', background: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                  <div style={{ height: '40px', background: '#f1f5f9', borderRadius: '8px', animation: 'pulse 1.5s infinite ease-in-out', marginTop: 'auto' }}></div>
                </div>
              ))}
            </div>
          </div>
        ) : products.length > 0 ? (
          <div className="products-slider-container">
            <Swiper
              modules={[Autoplay, Pagination, Navigation]}
              spaceBetween={16}
              slidesPerView={5}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              navigation={true}
              loop={products.length >= 5}
              className="products-swiper"
              breakpoints={{
                320: { slidesPerView: 1, spaceBetween: 10, navigation: false },
                480: { slidesPerView: 2, spaceBetween: 15 },
                768: { slidesPerView: 3, spaceBetween: 15 },
                1024: { slidesPerView: 5, spaceBetween: 16 }
              }}
            >
              {products.map(product => (
                <SwiperSlide key={product.id}>
                  <div className="product-card">
                    <div className="product-img-container">
                      <img 
                        src={getImageUrl(product.image)} 
                        alt={product.name} 
                        className="product-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800';
                        }}
                      />
                    </div>
                    <div className="product-info">
                      <div className="product-rating">
                        <FiStar className="star-icon filled" />
                        <FiStar className="star-icon filled" />
                        <FiStar className="star-icon filled" />
                        <FiStar className="star-icon filled" />
                        <FiStar className="star-icon" />
                        <span>({(product.rating || 4.0).toFixed(1)})</span>
                      </div>
                      <h3 className="product-name">{product.name}</h3>
                      <div className={`product-availability ${product.stock > 0 ? 'available' : 'unavailable'}`}>
                        <span className={`status-dot ${product.stock > 0 ? 'green' : 'red'}`}></span>
                        {product.stock > 0 ? 'Available' : 'Currently Unavailable'}
                      </div>
                      <div className="product-price-row">
                        <button 
                          className={`enquiry-btn ${product.stock === 0 ? 'disabled' : ''}`} 
                          aria-label="Enquire about product"
                          disabled={product.stock === 0}
                          title={product.stock === 0 ? "Enquiry is unavailable because this product is currently out of stock." : "Enquire via WhatsApp"}
                          onClick={() => handleEnquiry(product.name)}
                        >
                          <FaWhatsapp className="whatsapp-icon" /> Enquiry
                        </button>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0', color: '#64748b' }}>
            No featured products listed at the moment.
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
