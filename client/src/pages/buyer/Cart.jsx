import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart, removeFromCart, saveShippingAddress, clearCart } from '../../redux/slices/cartSlice';
import { apiRequest } from '../../utils/api';
import { Trash2, CreditCard, ChevronRight, ShoppingBag } from 'lucide-react';

const Cart = () => {
  const { cartItems, shippingAddress } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [address, setAddress] = useState(shippingAddress.address || '');
  const [city, setCity] = useState(shippingAddress.city || '');
  const [postalCode, setPostalCode] = useState(shippingAddress.postalCode || '');
  const [country, setCountry] = useState(shippingAddress.country || '');
  
  const [paymentMethod, setPaymentMethod] = useState('simulated'); // 'stripe' or 'simulated'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  const handleQtyChange = (item, qty) => {
    dispatch(
      addToCart({
        ...item,
        qty: Number(qty),
      })
    );
  };

  const handleRemove = (id) => {
    dispatch(removeFromCart(id));
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!user) {
      navigate('/login?redirect=/cart');
      return;
    }

    if (!address || !city || !postalCode || !country) {
      setError('Please fill in all shipping fields');
      return;
    }

    setLoading(true);
    setError(null);

    // Save shipping address to redux
    const addressData = { address, city, postalCode, country };
    dispatch(saveShippingAddress(addressData));

    try {
      const orderData = {
        items: cartItems.map((item) => ({
          product: item.product,
          qty: item.qty,
          price: item.price,
        })),
        shippingAddress: addressData,
        paymentMethod: paymentMethod,
      };

      const response = await apiRequest('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });

      if (paymentMethod === 'stripe' && response.url) {
        // Redirect to Stripe checkout page
        window.location.href = response.url;
      } else {
        // Simulated checkout success
        dispatch(clearCart());
        navigate('/my-orders', { state: { success: true } });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container animated-page" style={{ padding: '80px 20px', display: 'flex', justifyContent: 'center' }}>
        <div className="glass-card text-center" style={{ maxWidth: '500px', width: '100%', padding: '40px' }}>
          <ShoppingBag size={64} color="var(--accent-color)" style={{ marginBottom: '24px' }} />
          <h2 style={{ marginBottom: '16px' }}>Your Cart is Empty</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
            Looks like you haven't added anything to your cart yet.
          </p>
          <Link to="/" className="btn btn-primary">Go Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container animated-page" style={{ padding: '40px 0' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '32px' }}>Shopping Cart</h1>
      
      {error && <div className="alert-box alert-error">{error}</div>}

      <div className="split-layout">
        
        {/* Cart Items List */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {cartItems.map((item) => (
            <div key={item.product} style={{ display: 'flex', gap: '16px', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', background: '#111827', flexShrink: 0 }}>
                <img
                  src={item.image.startsWith('/uploads') ? `http://localhost:5000${item.image}` : item.image || 'https://placehold.co/80x80?text=No+Img'}
                  alt={item.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ flexGrow: 1 }}>
                <h4 style={{ fontSize: '16px', marginBottom: '4px', color: '#ffffff' }}>
                  <Link to={`/product/${item.product}`} style={{ color: '#ffffff', textDecoration: 'none' }}>
                    {item.name}
                  </Link>
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Seller: {item.seller}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  
                  {/* Qty Selector */}
                  <select
                    className="form-control"
                    value={item.qty}
                    onChange={(e) => handleQtyChange(item, e.target.value)}
                    style={{ width: '70px', padding: '6px' }}
                  >
                    {[...Array(item.countInStock).keys()].slice(0, 10).map((x) => (
                      <option key={x + 1} value={x + 1}>
                        {x + 1}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleRemove(item.product)}
                    className="btn btn-secondary btn-icon"
                    style={{ background: 'transparent', borderColor: 'transparent', padding: '6px', color: 'var(--text-muted)' }}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', flexShrink: 0 }}>
                ${(item.price * item.qty).toFixed(2)}
              </div>
            </div>
          ))}

          {/* Subtotal summary */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>Items Subtotal:</span>
            <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--success-color)' }}>
              ${subtotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Shipping Form & Checkout */}
        <aside className="glass-card" style={{ height: 'fit-content', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Shipping Details</h3>
          
          <form onSubmit={handleCheckout}>
            <div className="form-group">
              <label>Delivery Address</label>
              <input
                type="text"
                className="form-control"
                placeholder="123 Street Name"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                className="form-control"
                placeholder="New York"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Postal Code</label>
              <input
                type="text"
                className="form-control"
                placeholder="10001"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                className="form-control"
                placeholder="United States"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginTop: '24px' }}>
              <label>Payment Method</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="simulated"
                    checked={paymentMethod === 'simulated'}
                    onChange={() => setPaymentMethod('simulated')}
                    style={{ accentColor: 'var(--accent-color)' }}
                  />
                  <span>Simulated Checkout (Local Sandbox)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="stripe"
                    checked={paymentMethod === 'stripe'}
                    onChange={() => setPaymentMethod('stripe')}
                    style={{ accentColor: 'var(--accent-color)' }}
                  />
                  <span>Credit Card (Stripe API)</span>
                </label>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '24px' }}>
              <CreditCard size={18} />
              {loading ? 'Processing Checkout...' : `Pay $${subtotal.toFixed(2)}`}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
