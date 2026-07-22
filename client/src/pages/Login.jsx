import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authStart, authSuccess, authFailure, clearError } from '../redux/slices/authSlice';
import { apiRequest } from '../utils/api';
import { LogIn } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    // Clear any leftover auth errors when visiting the page
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    dispatch(authStart());
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      dispatch(
        authSuccess({
          user: {
            _id: data._id,
            name: data.name,
            email: data.email,
            role: data.role,
            isApproved: data.isApproved,
            isBanned: data.isBanned,
          },
          token: data.accessToken,
        })
      );

      // Redirect depending on user role
      if (data.role === 'admin') {
        navigate('/admin');
      } else if (data.role === 'seller') {
        navigate('/seller');
      } else {
        navigate('/');
      }
    } catch (err) {
      dispatch(authFailure(err.message));
    }
  };

  return (
    <div className="container animated-page" style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }}>
      <div className="glass-card" style={{ maxWidth: '450px', width: '100%', padding: '40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{
            background: 'var(--accent-gradient)',
            borderRadius: '12px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: 'var(--glow-shadow)'
          }}>
            <LogIn size={24} color="#ffffff" />
          </div>
          <h2>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Sign in to continue to VeloMarket</p>
        </div>

        {error && <div className="alert-box alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: '24px' }}>
            <Link to="/forgot-password" style={{ color: 'var(--accent-color)', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', marginTop: '28px' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent-color)', fontWeight: '700', textDecoration: 'none' }}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
