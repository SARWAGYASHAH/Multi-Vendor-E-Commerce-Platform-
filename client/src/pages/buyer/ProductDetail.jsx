import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../redux/slices/cartSlice';
import { apiRequest } from '../../utils/api';
import { Star, ShoppingCart, MessageSquare, AlertCircle } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [qty, setQty] = useState(1);
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(null);
  const [reviewError, setReviewError] = useState(null);

  const fetchProductDetails = async () => {
    try {
      const data = await apiRequest(`/products/${id}`);
      setProduct(data.product);
      setReviews(data.reviews);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    dispatch(
      addToCart({
        product: product._id,
        name: product.name,
        image: product.images && product.images[0] ? product.images[0].url : '',
        price: product.price,
        countInStock: product.stock,
        qty: Number(qty),
        seller: product.seller ? product.seller.name : 'Unknown Seller',
      })
    );
    navigate('/cart');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewSuccess(null);
    setReviewError(null);

    try {
      const data = await apiRequest(`/products/${id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment }),
      });
      setReviewSuccess(data.message || 'Review submitted successfully!');
      setComment('');
      setRating(5);
      fetchProductDetails(); // Reload reviews and product ratings
    } catch (err) {
      setReviewError(err.message);
    }
  };

  if (loading) return <div className="container" style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Loading product details...</div>;
  if (error) return <div className="container" style={{ padding: '40px 0' }}><div className="alert-box alert-error">{error}</div></div>;
  if (!product) return <div className="container" style={{ padding: '40px 0' }}><div className="alert-box alert-error">Product not found.</div></div>;

  return (
    <div className="container animated-page" style={{ padding: '40px 0' }}>
      <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', padding: '32px', marginBottom: '40px' }}>
        
        {/* Product Image */}
        <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={product.images && product.images[0] ? (product.images[0].url.startsWith('/uploads') ? `http://localhost:5000${product.images[0].url}` : product.images[0].url) : 'https://placehold.co/600x450?text=No+Image'}
            alt={product.name}
            style={{ width: '100%', maxHeight: '450px', objectFit: 'contain' }}
          />
        </div>

        {/* Product Information */}
        <div style={{ display: 'flex', flexType: 'column', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent-color)', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>
            {product.category}
          </span>
          <h1 style={{ fontSize: '32px', marginBottom: '12px' }}>{product.name}</h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div className="stars-wrapper">
              {[...Array(5).keys()].map((index) => (
                <Star
                  key={index}
                  size={16}
                  fill={index < Math.round(product.ratings) ? 'currentColor' : 'none'}
                />
              ))}
              <span style={{ marginLeft: '4px', fontWeight: '700', color: '#ffffff' }}>
                {product.ratings.toFixed(1)}
              </span>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              ({product.numReviews} buyer reviews)
            </span>
          </div>

          <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--success-color)', marginBottom: '24px' }}>
            ${product.price.toFixed(2)}
          </div>

          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '28px' }}>
            {product.description}
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', marginBottom: '24px' }} />

          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '28px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Status:</span>
            <span className={`badge ${product.stock > 0 ? 'badge-approved' : 'badge-banned'}`}>
              {product.stock > 0 ? `In Stock (${product.stock})` : 'Out Of Stock'}
            </span>
          </div>

          {product.stock > 0 && (
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <select
                  className="form-control"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  style={{ width: '80px', padding: '10px' }}
                >
                  {[...Array(product.stock).keys()].slice(0, 10).map((x) => (
                    <option key={x + 1} value={x + 1}>
                      {x + 1}
                    </option>
                  ))}
                </select>
              </div>

              <button onClick={handleAddToCart} className="btn btn-primary" style={{ flexGrow: 1 }}>
                <ShoppingCart size={18} /> Add to Cart
              </button>
            </div>
          )}

          <div style={{ marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
            Sold by: <strong style={{ color: '#ffffff' }}>{product.seller ? product.seller.name : 'Unknown Seller'}</strong>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="split-layout">
        
        {/* Reviews List */}
        <div className="glass-card" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={20} /> Buyer Reviews ({reviews.length})
          </h3>

          {reviews.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No reviews yet. Be the first to leave a review!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {reviews.map((rev) => (
                <div key={rev._id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong>{rev.user ? rev.user.name : 'Anonymous'}</strong>
                    <div className="stars-wrapper">
                      {[...Array(5).keys()].map((i) => (
                        <Star key={i} size={12} fill={i < rev.rating ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>{rev.comment}</p>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Review Form */}
        <div className="glass-card" style={{ height: 'fit-content', padding: '32px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '20px' }}>Write a Review</h3>

          {user ? (
            user.role === 'buyer' ? (
              <form onSubmit={handleReviewSubmit}>
                {reviewSuccess && <div className="alert-box alert-success">{reviewSuccess}</div>}
                {reviewError && <div className="alert-box alert-error">{reviewError}</div>}

                <div className="form-group">
                  <label>Rating</label>
                  <select
                    className="form-control"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                  >
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Very Good</option>
                    <option value="3">3 - Good</option>
                    <option value="2">2 - Fair</option>
                    <option value="1">1 - Poor</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Comment</label>
                  <textarea
                    rows="4"
                    className="form-control"
                    placeholder="Write your review here..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    style={{ resize: 'none' }}
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Submit Review
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                <AlertCircle size={16} /> Only buyers can write reviews.
              </div>
            )
          ) : (
            <div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Please sign in to write a review.</p>
              <button onClick={() => navigate('/login')} className="btn btn-secondary" style={{ width: '100%' }}>Sign In</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
