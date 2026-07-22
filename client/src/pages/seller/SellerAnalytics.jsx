import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, ShoppingBag, DollarSign, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const SellerAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await apiRequest('/seller/analytics');
        setData(res);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="container" style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Loading analytics charts...</div>;
  if (error) return <div className="container" style={{ padding: '40px 0' }}><div className="alert-box alert-error">{error}</div></div>;

  const COLORS = ['#6366F1', '#A855F7', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

  return (
    <div className="container animated-page" style={{ padding: '40px 0' }}>
      <div style={{ marginBottom: '32px' }}>
        <Link to="/seller" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '16px', fontSize: '14px' }}>
          <ArrowLeft size={16} /> Back to Storefront
        </Link>
        <h1 style={{ fontSize: '28px' }}>Storefront Analytics</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Visual overview of your revenue and product demand.</p>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid-cols-3" style={{ marginBottom: '40px' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Earnings</span>
            <h2 style={{ fontSize: '24px', color: 'var(--success-color)' }}>${data.totalRevenue.toFixed(2)}</h2>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-color)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Sales Volume</span>
            <h2 style={{ fontSize: '24px', color: '#ffffff' }}>{data.totalItemsSold} Items</h2>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Active Listings</span>
            <h2 style={{ fontSize: '24px', color: '#ffffff' }}>{data.productsCount} Products</h2>
          </div>
        </div>
      </div>

      {/* Recharts Diagrams */}
      <div className="grid-cols-2">
        {/* Revenue Over Time Chart */}
        <div className="glass-card" style={{ padding: '24px', height: '420px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '24px' }}>Revenue Trends</h3>
          
          {data.revenueOverTime.length === 0 ? (
            <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
              No sales data trends found yet.
            </div>
          ) : (
            <div style={{ flexGrow: 1, width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.revenueOverTime}>
                  <defs>
                    <linearGradient id="lineGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="var(--accent-color)" strokeWidth={3} dot={{ fill: 'var(--accent-color)', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Products Bar Chart */}
        <div className="glass-card" style={{ padding: '24px', height: '420px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '24px' }}>Top Selling Products</h3>

          {data.topSellingProducts.length === 0 ? (
            <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
              No product sales statistics found.
            </div>
          ) : (
            <div style={{ flexGrow: 1, width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topSellingProducts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#fff' }}
                  />
                  <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                    {data.topSellingProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerAnalytics;
