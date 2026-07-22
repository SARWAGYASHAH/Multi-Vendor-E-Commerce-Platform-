import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { ShieldCheck, UserCheck, Users, Ban, RefreshCw, BarChart3, Activity } from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('approvals'); // 'approvals' or 'users'
  const [stats, setStats] = useState(null);
  const [pendingSellers, setPendingSellers] = useState([]);
  const [usersList, setUsersList] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get analytics
      const analyticsData = await apiRequest('/admin/analytics');
      setStats(analyticsData);

      // 2. Get pending sellers
      const pendingData = await apiRequest('/admin/sellers/pending');
      setPendingSellers(pendingData);

      // 3. Get all users
      const usersData = await apiRequest('/admin/users');
      setUsersList(usersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApprove = async (id) => {
    try {
      await apiRequest(`/admin/sellers/${id}/approve`, {
        method: 'PUT',
        body: JSON.stringify({}),
      });
      // Update local lists
      const approvedSeller = pendingSellers.find((s) => s._id === id);
      setPendingSellers(pendingSellers.filter((s) => s._id !== id));
      if (approvedSeller) {
        setUsersList([{ ...approvedSeller, isApproved: true }, ...usersList]);
      }
      // Re-fetch analytics to update totals
      const analyticsData = await apiRequest('/admin/analytics');
      setStats(analyticsData);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBanToggle = async (id, currentBanState) => {
    const actionText = currentBanState ? 'unban' : 'ban';
    if (!window.confirm(`Are you sure you want to ${actionText} this user?`)) return;

    try {
      await apiRequest(`/admin/users/${id}/ban`, {
        method: 'PUT',
        body: JSON.stringify({ isBanned: !currentBanState }),
      });
      // Update state locally
      setUsersList(
        usersList.map((u) => (u._id === id ? { ...u, isBanned: !currentBanState } : u))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="container" style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Admin Panel...</div>;
  if (error) return <div className="container" style={{ padding: '40px 0' }}><div className="alert-box alert-error">{error}</div></div>;

  return (
    <div className="container animated-page" style={{ padding: '40px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={28} color="var(--accent-color)" /> Administrator Console
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Verify seller requests, audit active users, and monitor global sales.</p>
        </div>
        <button onClick={fetchDashboardData} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} /> Sync Logs
        </button>
      </div>

      {/* Global Analytics Overview */}
      {stats && (
        <div className="grid-cols-4" style={{ marginBottom: '40px' }}>
          <div className="glass-card">
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Marketplace Revenue</span>
            <h2 style={{ fontSize: '24px', color: 'var(--success-color)', marginTop: '6px' }}>${stats.totalRevenue.toFixed(2)}</h2>
          </div>
          <div className="glass-card">
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Completed Purchases</span>
            <h2 style={{ fontSize: '24px', color: '#ffffff', marginTop: '6px' }}>{stats.totalOrders} Transactions</h2>
          </div>
          <div className="glass-card">
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Verified Sellers</span>
            <h2 style={{ fontSize: '24px', color: '#ffffff', marginTop: '6px' }}>{stats.totalSellers} Accounts</h2>
          </div>
          <div className="glass-card" style={{ borderColor: stats.pendingSellersCount > 0 ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-color)' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Approval Pipeline</span>
            <h2 style={{ fontSize: '24px', color: stats.pendingSellersCount > 0 ? 'var(--warning-color)' : '#ffffff', marginTop: '6px' }}>
              {stats.pendingSellersCount} Requests
            </h2>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tab-container">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`tab-btn ${activeTab === 'approvals' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <UserCheck size={16} /> Pending Approvals ({pendingSellers.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Users size={16} /> User Audits ({usersList.length})
        </button>
      </div>

      {/* Approvals tab */}
      {activeTab === 'approvals' && (
        pendingSellers.length === 0 ? (
          <div className="glass-card text-center" style={{ padding: '80px 20px' }}>
            <p style={{ color: 'var(--text-muted)' }}>No seller approval requests currently in queue.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Business Name</th>
                  <th>Contact Email</th>
                  <th>Registered Date</th>
                  <th>Status</th>
                  <th>Audit Controls</th>
                </tr>
              </thead>
              <tbody>
                {pendingSellers.map((seller) => (
                  <tr key={seller._id}>
                    <td><strong>{seller.name}</strong></td>
                    <td>{seller.email}</td>
                    <td>{new Date(seller.createdAt).toLocaleDateString()}</td>
                    <td><span className="badge badge-pending">Under Review</span></td>
                    <td>
                      <button onClick={() => handleApprove(seller._id)} className="btn btn-success" style={{ padding: '6px 14px', fontSize: '13px' }}>
                        Approve Registration
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* User audit list tab */}
      {activeTab === 'users' && (
        usersList.length === 0 ? (
          <div className="glass-card text-center" style={{ padding: '80px 20px' }}>
            <p style={{ color: 'var(--text-muted)' }}>No users found on the database.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Account Role</th>
                  <th>State</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((usr) => (
                  <tr key={usr._id}>
                    <td><strong>{usr.name}</strong></td>
                    <td>{usr.email}</td>
                    <td>
                      <span style={{ fontSize: '13px', textTransform: 'capitalize', fontWeight: '700', color: usr.role === 'seller' ? 'var(--accent-color)' : '#9ca3af' }}>
                        {usr.role}
                      </span>
                    </td>
                    <td>
                      {usr.isBanned ? (
                        <span className="badge badge-banned">Banned</span>
                      ) : usr.role === 'seller' && !usr.isApproved ? (
                        <span className="badge badge-pending">Pending</span>
                      ) : (
                        <span className="badge badge-approved">Active</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleBanToggle(usr._id, usr.isBanned)}
                        className={`btn ${usr.isBanned ? 'btn-success' : 'btn-danger'}`}
                        style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Ban size={12} /> {usr.isBanned ? 'Unban Account' : 'Ban Account'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};

export default AdminDashboard;
