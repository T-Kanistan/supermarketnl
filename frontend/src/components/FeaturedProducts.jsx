import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { formatCategoryName } from '../utils/formatCategoryName';
import categoryService from '../services/categoryService';
import productService from '../services/productService';
import { useEnquiry } from '../context/EnquiryContext';
import ProductCard from './ProductCard';
import './ProductCard.css';
import './FeaturedProducts.css';
import 'swiper/css';

const mapProductType = (value) => {
  const raw = value == null ? '' : String(value).trim().toLowerCase();
  if (raw === 'food' || raw === 'food-corner' || raw === 'food corner' || raw === 'foodcorner') {
    return 'food-corner';
  }
  return 'grocery';
};

const isActiveGroceryProduct = (product) =>
  product?.status === 'active' &&
  mapProductType(product.productType || product.type) === 'grocery';

const FEATURED_EMPTY_MESSAGE =
  'No featured products found. Please mark products as Featured in Product Management.';

const getSlidesPerView = (swiper) => {
  if (!swiper) return 1;
  const value = swiper.params?.slidesPerView;
  return typeof value === 'number' ? value : 1;
};

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [canNavigate, setCanNavigate] = useState(false);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const swiperRef = useRef(null);
  const { openEnquiry } = useEnquiry();

  const syncNavigationState = useCallback(
    (swiper) => {
      if (!swiper) return;
      const visibleSlides = getSlidesPerView(swiper);
      setCanNavigate(products.length > visibleSlides);
      setIsBeginning(swiper.isBeginning);
      setIsEnd(swiper.isEnd);
    },
    [products.length]
  );

  useEffect(() => {
    let mounted = true;

    const fetchFeaturedProducts = async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const [productData, categoryData] = await Promise.all([
          productService.getFeaturedProducts(),
          categoryService.getCategories(),
        ]);

        const rawList = Array.isArray(productData) ? productData : [];
        const list = rawList.filter(isActiveGroceryProduct);

        const categories = (Array.isArray(categoryData) ? categoryData : []).filter(
          (c) => c.status === 'active'
        );
        const map = categories.reduce((acc, cat) => {
          acc[cat.id] = cat.name;
          acc[cat.slug] = cat.name;
          return acc;
        }, {});

        if (!mounted) return;
        setCategoryMap(map);
        setProducts(list);
      } catch (err) {
        console.error('[FeaturedProducts] Failed to load featured products', err);
        if (mounted) setProducts([]);
      } finally {
        if (mounted && !silent) setLoading(false);
      }
    };

    fetchFeaturedProducts();

    const handleRefresh = () => {
      if (document.visibilityState === 'visible') {
        fetchFeaturedProducts(true);
      }
    };

    window.addEventListener('focus', handleRefresh);
    document.addEventListener('visibilitychange', handleRefresh);

    return () => {
      mounted = false;
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', handleRefresh);
    };
  }, []);

  const handleEnquiry = (product) => {
    const categoryName = formatCategoryName(categoryMap[product.categoryId] || product.categoryId || '');
    openEnquiry({
      name: product.name || product.productName,
      category: categoryName,
      sku: product.id,
      id: product.id,
    });
  };

  const handlePrev = (event) => {
    event.preventDefault();
    event.stopPropagation();
    swiperRef.current?.slidePrev();
  };

  const handleNext = (event) => {
    event.preventDefault();
    event.stopPropagation();
    swiperRef.current?.slideNext();
  };

  const showPrev = canNavigate && !isBeginning;
  const showNext = canNavigate && !isEnd;

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
          <div className="featured-carousel featured-carousel--loading">
            <div className="featured-carousel-track">
              <div className="featured-swiper-shell">
                <div className="featured-swiper featured-swiper--loading">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="featured-slide-skeleton">
                      <div className="store-product-skeleton store-product-skeleton--minimal" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : products.length > 0 ? (
          <div className="featured-carousel">
            <div
              className={`featured-carousel-track${
                canNavigate ? ' featured-carousel-track--nav' : ''
              }`}
            >
              <button
                type="button"
                className={`featured-nav-btn featured-nav-prev${
                  showPrev ? '' : ' featured-nav-btn--hidden'
                }`}
                aria-label="Previous featured products"
                aria-hidden={!showPrev}
                tabIndex={showPrev ? 0 : -1}
                onClick={handlePrev}
                disabled={!showPrev}
              >
                <FiChevronLeft aria-hidden="true" />
              </button>

              <div className="featured-swiper-shell">
                <Swiper
                  className="featured-swiper"
                  modules={[Autoplay]}
                  spaceBetween={20}
                  slidesPerView={1}
                  slidesPerGroup={1}
                  speed={400}
                  loop={false}
                  watchOverflow
                  grabCursor
                  allowTouchMove
                  centeredSlides={false}
                  autoplay={
                    products.length > 4
                      ? {
                          delay: 5000,
                          disableOnInteraction: false,
                          pauseOnMouseEnter: true,
                        }
                      : false
                  }
                  breakpoints={{
                    768: {
                      slidesPerView: 2,
                      slidesPerGroup: 1,
                      spaceBetween: 18,
                    },
                    1024: {
                      slidesPerView: 3,
                      slidesPerGroup: 1,
                      spaceBetween: 20,
                    },
                    1440: {
                      slidesPerView: 4,
                      slidesPerGroup: 1,
                      spaceBetween: 20,
                    },
                  }}
                  onSwiper={(swiper) => {
                    swiperRef.current = swiper;
                    syncNavigationState(swiper);
                  }}
                  onSlideChange={syncNavigationState}
                  onBreakpoint={syncNavigationState}
                  onResize={syncNavigationState}
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
              </div>

              <button
                type="button"
                className={`featured-nav-btn featured-nav-next${
                  showNext ? '' : ' featured-nav-btn--hidden'
                }`}
                aria-label="Next featured products"
                aria-hidden={!showNext}
                tabIndex={showNext ? 0 : -1}
                onClick={handleNext}
                disabled={!showNext}
              >
                <FiChevronRight aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : (
          <div className="featured-empty">{FEATURED_EMPTY_MESSAGE}</div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
