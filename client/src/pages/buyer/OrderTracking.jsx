import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { apiRequest } from '../../utils/api';
import io from 'socket.io-client';
import { RefreshCw, Package, Truck, CheckCircle2, XCircle, Clock } from 'lucide-react';

const OrderTracking = () => {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchOrders = async () => {
    try {
      const data = await apiRequest('/orders/my-orders');
      setOrders(data);
      if (data.length > 0 && !selectedOrder) {
        setSelectedOrder(data[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    if (location.state && location.state.success) {
      setSuccessMsg('Payment completed and order placed successfully!');
    }
  }, []);

  // Socket connection for real-time order status tracking
  useEffect(() => {
    if (!selectedOrder) return;

    // Connect to Socket.io backend
    const socket = io('http://localhost:5000');

    // Join order room
    socket.emit('joinOrderRoom', selectedOrder._id);

    // Listen for live updates
    socket.on('orderStatusUpdated', (updatedStatus) => {
      console.log('Live order update received:', updatedStatus);
      if (updatedStatus.orderId === selectedOrder._id) {
        setSelectedOrder((prev) => ({
          ...prev,
          orderStatus: updatedStatus.status,
        }));
        
        // Also update in the list
        setOrders((prevOrders) =>
          prevOrders.map((o) =>
            o._id === selectedOrder._id
              ? { ...o, orderStatus: updatedStatus.status }
              : o
          )
        );
      }
    });

    // Clean up connections on unmount or selected order changes
    return () => {
      socket.emit('leaveOrderRoom', selectedOrder._id);
      socket.disconnect();
    };
  }, [selectedOrder]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <span className="badge badge-pending">Pending</span>;
      case 'Processing': return <span className="badge badge-processing">Processing</span>;
      case 'Shipped': return <span className="badge badge-shipped">Shipped</span>;
      case 'Delivered': return <span className="badge badge-approved">Delivered</span>;
      case 'Cancelled': return <span className="badge badge-banned">Cancelled</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  const renderStatusStages = (currentStatus) => {
    if (currentStatus === 'Cancelled') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <XCircle size={32} color="var(--error-color)" />
          <div>
            <h4 style={{ color: 'var(--error-color)' }}>Order Cancelled</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>This order was cancelled by the seller or administrator.</p>
          </div>
        </div>
      );
    }

    const stages = ['Pending', 'Processing', 'Shipped', 'Delivered'];
    const currentIdx = stages.indexOf(currentStatus);

    const stageIcons = {
      Pending: <Clock size={20} />,
      Processing: <RefreshCw size={20} />,
      Shipped: <Truck size={20} />,
      Delivered: <CheckCircle2 size={20} />,
    };

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', margin: '40px 0' }}>
        {/* Progress Line */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '5%',
          right: '5%',
          height: '2px',
          background: 'var(--border-color)',
          zIndex: 1
        }}>
          <div style={{
            height: '100%',
            background: 'var(--accent-color)',
            width: `${(currentIdx / (stages.length - 1)) * 100}%`,
            transition: 'width 0.5s ease'
          }}></div>
        </div>

        {stages.map((stage, idx) => {
          const isCompleted = idx <= currentIdx;
          const isActive = idx === currentIdx;
          
          return (
            <div key={stage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: isCompleted ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                border: `2px solid ${isActive ? 'var(--accent-color)' : 'var(--border-color)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isCompleted ? '#ffffff' : 'var(--text-muted)',
                boxShadow: isActive ? 'var(--glow-shadow)' : 'none',
                transition: 'background 0.5s ease, border-color 0.5s ease'
              }}>
                {stageIcons[stage]}
              </div>
              <span style={{
                marginTop: '10px',
                fontSize: '13px',
                fontWeight: isCompleted ? '700' : '500',
                color: isCompleted ? '#ffffff' : 'var(--text-muted)'
              }}>
                {stage}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return <div className="container" style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Loading orders...</div>;
  if (error) return <div className="container" style={{ padding: '40px 0' }}><div className="alert-box alert-error">{error}</div></div>;

  return (
    <div className="container animated-page" style={{ padding: '40px 0' }}>
      {successMsg && <div className="alert-box alert-success">{successMsg}</div>}
      
      <h1 style={{ fontSize: '28px', marginBottom: '32px' }}>Order Tracking</h1>

      {orders.length === 0 ? (
        <div className="glass-card text-center" style={{ padding: '80px 20px' }}>
          <Package size={64} color="var(--text-muted)" style={{ marginBottom: '24px' }} />
          <h2 style={{ marginBottom: '16px' }}>No Orders Found</h2>
          <p style={{ color: 'var(--text-muted)' }}>You haven't made any purchases yet.</p>
        </div>
      ) : (
        <div className="split-layout">
          {/* Orders List Sidebar */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', paddingLeft: '8px' }}>Purchase History</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto', paddingRight: '8px' }}>
              {orders.map((order) => (
                <div
                  key={order._id}
                  onClick={() => setSelectedOrder(order)}
                  className="glass-card"
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    borderColor: selectedOrder && selectedOrder._id === order._id ? 'var(--accent-color)' : 'var(--border-color)',
                    background: selectedOrder && selectedOrder._id === order._id ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-card)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: ...{order._id.slice(-6)}</span>
                    {getStatusBadge(order.orderStatus)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '15px' }}>${order.totalAmount.toFixed(2)}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Active Order Details Panel */}
          {selectedOrder && (
            <main className="glass-card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '22px' }}>Order Details</h2>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Reference ID: {selectedOrder._id}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ marginBottom: '4px' }}>Status: {getStatusBadge(selectedOrder.orderStatus)}</div>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Placed on: {new Date(selectedOrder.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Status Stages */}
              {renderStatusStages(selectedOrder.orderStatus)}

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '32px 0' }} />

              {/* Order Items */}
              <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Items Purchased</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {selectedOrder.items.map((item) => (
                  <div key={item._id} style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '6px', overflow: 'hidden', background: '#111827', flexShrink: 0 }}>
                        <img
                          src={item.product && item.product.images && item.product.images[0] ? (item.product.images[0].url.startsWith('/uploads') ? `http://localhost:5000${item.product.images[0].url}` : item.product.images[0].url) : 'https://placehold.co/48x48?text=No+Img'}
                          alt={item.product ? item.product.name : 'Deleted Product'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '14px', color: '#ffffff' }}>{item.product ? item.product.name : 'Deleted Product'}</h4>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Qty: {item.qty} × ${item.price.toFixed(2)}</span>
                      </div>
                    </div>
                    <strong>${(item.price * item.qty).toFixed(2)}</strong>
                  </div>
                ))}
              </div>

              {/* Shipping Address */}
              <div className="glass-card" style={{ background: 'rgba(255, 255, 255, 0.01)', padding: '20px' }}>
                <h4 style={{ fontSize: '15px', marginBottom: '8px' }}>Shipping Address</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
                  {selectedOrder.shippingAddress.address}<br />
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}<br />
                  {selectedOrder.shippingAddress.country}
                </p>
              </div>
            </main>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
