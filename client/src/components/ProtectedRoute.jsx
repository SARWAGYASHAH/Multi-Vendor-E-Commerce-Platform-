import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Clock, ShieldAlert } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="container" style={{ padding: '80px 20px', minHeight: '70vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="glass-card text-center" style={{ maxWidth: '500px', width: '100%', padding: '40px' }}>
          <ShieldAlert size={64} color="var(--error-color)" style={{ marginBottom: '20px' }} />
          <h2 style={{ marginBottom: '16px' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            You do not have the required permissions to view this dashboard.
          </p>
          <a href="/" className="btn btn-primary">Go to Homepage</a>
        </div>
      </div>
    );
  }

  // Handle pending seller approvals
  if (user.role === 'seller' && !user.isApproved) {
    return (
      <div className="container" style={{ padding: '80px 20px', minHeight: '70vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="glass-card text-center" style={{ maxWidth: '550px', width: '100%', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Clock size={64} color="var(--warning-color)" style={{ marginBottom: '20px' }} />
          <h2 style={{ marginBottom: '16px' }}>Approval Pending</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.6' }}>
            Your seller registration is currently under review by our administration.
          </p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '14px' }}>
            You will gain access to upload products and view dashboard charts once approved.
          </p>
          <a href="/" className="btn btn-secondary">Return to Shop</a>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
