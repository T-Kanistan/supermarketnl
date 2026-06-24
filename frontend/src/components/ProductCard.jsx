import { FiStar } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { getImageUrl } from '../services/api';
import { buildProductAlt } from '../utils/seoImageAlt';
import './ProductCard.css';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800';

const ProductCard = ({
  product,
  onEnquiry,
  className = '',
  variant = 'default',
}) => {
  const inStock = Number(product.stock) > 0;
  const rating = Number(product.rating) || 4.0;
  const isMinimal = variant === 'minimal';

  return (
    <article
      className={`store-product-card ${isMinimal ? 'store-product-card--minimal' : ''} ${className}`.trim()}
    >
      <div className="store-product-image-wrap">
        <img
          src={getImageUrl(product.image)}
          alt={buildProductAlt(product.name)}
          className="store-product-image"
          loading="lazy"
          decoding="async"
          width="320"
          height="240"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = FALLBACK_IMAGE;
          }}
        />
      </div>

      <div className="store-product-body">
        {!isMinimal && (
          <div className="store-product-rating" aria-label={`Rating ${rating.toFixed(1)} out of 5`}>
            {[1, 2, 3, 4, 5].map((star) => (
              <FiStar key={star} className={`store-star-icon ${star <= Math.round(rating) ? 'filled' : ''}`} />
            ))}
            <span>({rating.toFixed(1)})</span>
          </div>
        )}

        <h3 className="store-product-name" title={product.name}>
          {product.name}
        </h3>

        {!isMinimal && (
          <div className="store-product-price-block">
            <span className="store-product-price">€{Number(product.price || 0).toFixed(2)}</span>
            {product.oldPrice != null && product.oldPrice > product.price && (
              <span className="store-product-old-price">€{Number(product.oldPrice).toFixed(2)}</span>
            )}
          </div>
        )}

        <div className={`store-product-availability ${inStock ? 'available' : 'unavailable'}`}>
          <span className={`store-status-dot ${inStock ? 'green' : 'red'}`} />
          {inStock ? 'Available' : 'Currently Unavailable'}
        </div>

        <button
          type="button"
          className={`store-product-enquiry-btn ${!inStock ? 'disabled' : ''}`}
          disabled={!inStock}
          aria-label={`Enquire about ${product.name}`}
          title={
            inStock
              ? 'Open product enquiry form'
              : 'Enquiry is unavailable because this product is currently out of stock.'
          }
          onClick={() => onEnquiry?.(product)}
        >
          <FaWhatsapp className="store-whatsapp-icon" />
          Enquiry
        </button>
      </div>
    </article>
  );
};

export default ProductCard;
