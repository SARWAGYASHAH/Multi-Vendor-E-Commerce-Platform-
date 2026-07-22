import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { ShoppingCart, LogOut, User, ShieldCheck, TrendingUp, ShoppingBag } from 'lucide-react';
import { apiRequest } from '../utils/api';

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err.message);
    }
    dispatch(logout());
    navigate('/login');
  };

  const totalCartQty = cartItems.reduce((acc, item) => acc + item.qty, 0);

  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <Link to="/" className="nav-brand">
          <ShoppingBag size={28} style={{ stroke: 'url(#gradient)' }} />
          <span>VeloMarket</span>
        </Link>

        {/* SVG gradient definition for the icon */}
        <svg width="0" height="0">
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </svg>

        <div className="nav-links">
          <Link to="/" className="nav-link">Shop</Link>
          
          {user ? (
            <>
              {/* Role-based dashboard links */}
              {user.role === 'admin' && (
                <Link to="/admin" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={16} /> Admin
                </Link>
              )}

              {user.role === 'seller' && (
                <Link to="/seller" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={16} /> Seller Panel
                </Link>
              )}

              {user.role === 'buyer' && (
                <>
                  <Link to="/my-orders" className="nav-link">My Orders</Link>
                  <Link to="/cart" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
                    <ShoppingCart size={18} />
                    <span>Cart</span>
                    {totalCartQty > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-14px',
                        background: 'var(--accent-gradient)',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: '800',
                        color: '#ffffff'
                      }}>
                        {totalCartQty}
                      </span>
                    )}
                  </Link>
                </>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={14} /> {user.name}
                </span>
                <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Sign In</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
