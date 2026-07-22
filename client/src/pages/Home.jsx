import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import { Search, SlidersHorizontal, Star } from 'lucide-react';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories] = useState(['All', 'Electronics', 'Fashion', 'Home & Kitchen', 'Books', 'Beauty', 'Sports']);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [rating, setRating] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (selectedCategory && selectedCategory !== 'All') queryParams.append('category', selectedCategory);
      if (minPrice) queryParams.append('minPrice', minPrice);
      if (maxPrice) queryParams.append('maxPrice', maxPrice);
      if (rating) queryParams.append('rating', rating);
      if (sortBy) queryParams.append('sortBy', sortBy);
      queryParams.append('page', page);
      queryParams.append('pageSize', 8);

      const data = await apiRequest(`/products?${queryParams.toString()}`);
      setProducts(data.products);
      setPages(data.pages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, selectedCategory, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setMinPrice('');
    setMaxPrice('');
    setRating('');
    setSortBy('newest');
    setPage(1);
  };

  return (
    <div className="container animated-page" style={{ padding: '40px 0' }}>
      <div className="hero-section">
        <h1 className="hero-title">Discover Unique Products</h1>
        <p className="hero-subtitle">
          Shop directly from trusted local independent sellers with real-time updates and secure Stripe payments.
        </p>
        
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <input
              type="text"
              placeholder="Search products by name or description..."
              className="form-control"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '44px' }}
            />
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </div>

      <div className="split-layout">
        {/* Sidebar Filters */}
        <aside className="glass-card" style={{ height: 'fit-content', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <SlidersHorizontal size={18} />
            <h3 style={{ fontSize: '18px' }}>Filters</h3>
          </div>

          {/* Categories */}
          <div className="form-group">
            <label>Category</label>
            <select
              className="form-control"
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="form-group">
            <label>Price Range ($)</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                placeholder="Min"
                className="form-control"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span style={{ color: 'var(--text-muted)' }}>-</span>
              <input
                type="number"
                placeholder="Max"
                className="form-control"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          {/* Minimum Rating */}
          <div className="form-group">
            <label>Minimum Rating</label>
            <select
              className="form-control"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            >
              <option value="">Any Rating</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="2">2+ Stars</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="form-group">
            <label>Sort By</label>
            <select
              className="form-control"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">New Arrivals</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
            <button onClick={fetchProducts} className="btn btn-primary" style={{ flexGrow: 1 }}>Apply</button>
            <button onClick={handleResetFilters} className="btn btn-secondary">Reset</button>
          </div>
        </aside>

        {/* Products Grid */}
        <main>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p style={{ color: 'var(--text-muted)' }}>Loading products...</p>
            </div>
          ) : error ? (
            <div className="alert-box alert-error">{error}</div>
          ) : products.length === 0 ? (
            <div className="glass-card text-center" style={{ padding: '80px 20px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>No products found matching your search.</p>
            </div>
          ) : (
            <>
              <div className="grid-cols-3">
                {products.map((product) => (
                  <div key={product._id} className="glass-card product-card">
                    <div className="product-image-wrapper">
                      <img
                        src={product.images && product.images[0] ? (product.images[0].url.startsWith('/uploads') ? `http://localhost:5000${product.images[0].url}` : product.images[0].url) : 'https://placehold.co/400x300?text=No+Image'}
                        alt={product.name}
                        className="product-image"
                      />
                    </div>
                    <div className="product-info">
                      <h4 className="product-name">{product.name}</h4>
                      <p className="product-seller">By {product.seller ? product.seller.name : 'Unknown Seller'}</p>
                      
                      <div className="product-meta">
                        <div className="stars-wrapper">
                          <Star size={14} fill="currentColor" />
                          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                            {product.ratings.toFixed(1)}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            ({product.numReviews})
                          </span>
                        </div>
                        <span className="product-price">${product.price.toFixed(2)}</span>
                      </div>

                      <button
                        onClick={() => navigate(`/product/${product._id}`)}
                        className="btn btn-secondary"
                        style={{ marginTop: '16px', width: '100%' }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '40px' }}>
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px' }}
                  >
                    Prev
                  </button>
                  {[...Array(pages).keys()].map((pNum) => (
                    <button
                      key={pNum + 1}
                      onClick={() => setPage(pNum + 1)}
                      className={`btn ${page === pNum + 1 ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '8px 14px' }}
                    >
                      {pNum + 1}
                    </button>
                  ))}
                  <button
                    disabled={page === pages}
                    onClick={() => setPage(page + 1)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px' }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Home;
