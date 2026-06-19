import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import productService from '../services/productService';
import categoryService from '../services/categoryService';
import { useEnquiry } from '../context/EnquiryContext';
import ProductCard from './ProductCard';
import './ProductCard.css';
import './FeaturedProducts.css';
import 'swiper/css';

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [loading, setLoading] = useState(true);
  const { openEnquiry } = useEnquiry();
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const [productData, categoryData] = await Promise.all([
          productService.getProducts({ isFeatured: true, type: 'grocery' }),
          categoryService.getCategories(),
        ]);

        const list = (Array.isArray(productData) ? productData : []).filter(
          (p) => p.isFeatured === true && p.status === 'active'
        );

        const categories = (Array.isArray(categoryData) ? categoryData : []).filter(
          (c) => c.status === 'active'
        );
        const map = categories.reduce((acc, cat) => {
          acc[cat.id] = cat.name;
          acc[cat.slug] = cat.name;
          return acc;
        }, {});

        setCategoryMap(map);
        setProducts(list);
      } catch (err) {
        console.error('Failed to load featured products', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const handleEnquiry = (product) => {
    const categoryName = categoryMap[product.categoryId] || product.categoryId || '';
    openEnquiry({
      name: product.name,
      category: categoryName,
      sku: product.id,
      id: product.id,
    });
  };

  const canLoop = products.length > 1;

  return (
    <section className="featured-products pt-40 pb-10" id="products">
      <div className="container">
        <div className="featured-header">
          <h2 className="section-title featured-section-title">
            <span className="featured-title-mark">Featured</span> Products
          </h2>
          <div className="featured-header-actions">
            <Link to="/products" className="view-all-btn">
              View All
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="featured-carousel">
            <div className="featured-swiper featured-swiper--loading">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="featured-slide-skeleton">
                  <div className="store-product-skeleton store-product-skeleton--minimal" />
                </div>
              ))}
            </div>
          </div>
        ) : products.length > 0 ? (
          <div className="featured-carousel">
            <button
              type="button"
              ref={prevRef}
              className="featured-nav-btn featured-nav-prev"
              aria-label="Previous featured products"
            >
              <FiChevronLeft aria-hidden="true" />
            </button>

            <Swiper
              className="featured-swiper"
              modules={[Navigation, Autoplay]}
              spaceBetween={20}
              slidesPerView={1}
              speed={600}
              loop={canLoop}
              loopAdditionalSlides={Math.max(products.length, 4)}
              watchOverflow
              grabCursor
              autoplay={
                canLoop
                  ? {
                      delay: 5000,
                      disableOnInteraction: false,
                      pauseOnMouseEnter: true,
                    }
                  : false
              }
              breakpoints={{
                641: {
                  slidesPerView: 2,
                  spaceBetween: 16,
                },
                1025: {
                  slidesPerView: 4,
                  spaceBetween: 20,
                },
              }}
              navigation={{
                prevEl: prevRef.current,
                nextEl: nextRef.current,
              }}
              onBeforeInit={(swiper) => {
                swiper.params.navigation.prevEl = prevRef.current;
                swiper.params.navigation.nextEl = nextRef.current;
              }}
              onInit={(swiper) => {
                swiper.params.navigation.prevEl = prevRef.current;
                swiper.params.navigation.nextEl = nextRef.current;
                swiper.navigation.init();
                swiper.navigation.update();
              }}
            >
              {products.map((product) => (
                <SwiperSlide key={product.id} className="featured-swiper-slide">
                  <ProductCard
                    product={product}
                    onEnquiry={handleEnquiry}
                    variant="minimal"
                  />
                </SwiperSlide>
              ))}
            </Swiper>

            <button
              type="button"
              ref={nextRef}
              className="featured-nav-btn featured-nav-next"
              aria-label="Next featured products"
            >
              <FiChevronRight aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="featured-empty">No featured products available.</div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
