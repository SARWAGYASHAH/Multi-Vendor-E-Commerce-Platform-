import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { Plus, Trash2, Edit, Package, ShoppingBag, ListOrdered, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';

const SellerDashboard = () => {
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'orders'
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State for Add/Edit Product
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const [categories] = useState(['Electronics', 'Fashion', 'Home & Kitchen', 'Books', 'Beauty', 'Sports']);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Load products for the seller
      const productData = await apiRequest('/products?pageSize=100'); // Get all
      // Filter products belonging to current seller
      // Note: Backend endpoint /api/products returns all products, but we can query them or filter, or since we have a seller controller, let's look:
      // Actually, wait, let's see. In sellerController we have `getSellerAnalytics`.
      // Let's filter products belonging to current seller on the frontend or we can request /products.
      // Wait, is there a seller-specific product endpoint?
      // In productController.js: getProducts returns all. In sellerController.js, we have getSellerAnalytics.
      // Let's fetch all products and filter by seller user _id, OR we can fetch from seller analytics which includes seller's recent orders.
      // Let's fetch seller analytics first, it has products counts and orders.
      const analytics = await apiRequest('/seller/analytics');
      setOrders(analytics.recentOrders || []);

      // To list all products belonging to this seller, we can filter the getProducts call.
      // Let's fetch products and filter by current seller ID.
      const pRes = await apiRequest('/products?pageSize=100');
      const user = JSON.parse(localStorage.getItem('user'));
      const sellerProducts = pRes.products.filter(p => p.seller && (p.seller._id === user._id || p.seller === user._id));
      setProducts(sellerProducts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (product) => {
    setIsEditing(true);
    setEditId(product._id);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price);
    setStock(product.stock);
    setCategory(product.category);
    setExistingImages(product.images || []);
    setImageFiles([]);
    setFormError(null);
    setShowForm(true);
  };

  const handleAddClick = () => {
    setIsEditing(false);
    setEditId(null);
    setName('');
    setDescription('');
    setPrice('');
    setStock('');
    setCategory('Electronics');
    setExistingImages([]);
    setImageFiles([]);
    setFormError(null);
    setShowForm(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await apiRequest(`/products/${id}`, { method: 'DELETE' });
      setProducts(products.filter((p) => p._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('stock', stock);
      formData.append('category', category);

      if (isEditing) {
        formData.append('existingImages', JSON.stringify(existingImages));
      }

      for (const file of imageFiles) {
        formData.append('images', file);
      }

      const endpoint = isEditing ? `/products/${editId}` : '/products';
      const method = isEditing ? 'PUT' : 'POST';

      await apiRequest(endpoint, {
        method,
        body: formData,
      });

      setShowForm(false);
      fetchData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await apiRequest(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      // Update local state
      setOrders(
        orders.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus } : o))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="container" style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Seller Dashboard...</div>;

  return (
    <div className="container animated-page" style={{ padding: '40px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px' }}>Seller Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Manage your storefront, products, and orders.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/seller/analytics" className="btn btn-secondary">View Analytics</Link>
          <button onClick={handleAddClick} className="btn btn-primary">
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      {error && <div className="alert-box alert-error">{error}</div>}

      {/* Tabs */}
      <div className="tab-container">
        <button
          onClick={() => setActiveTab('products')}
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <ShoppingBag size={16} /> My Products ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <ClipboardList size={16} /> Order Management ({orders.length})
        </button>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}>
            <h2 style={{ marginBottom: '24px' }}>{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
            
            {formError && <div className="alert-box alert-error">{formError}</div>}

            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  style={{ resize: 'none' }}
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Stock Count</label>
                  <input
                    type="number"
                    className="form-control"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  className="form-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Existing Images */}
              {isEditing && existingImages.length > 0 && (
                <div className="form-group">
                  <label>Current Images (click to remove)</label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {existingImages.map((img) => (
                      <div
                        key={img.publicId}
                        onClick={() => setExistingImages(existingImages.filter(i => i.publicId !== img.publicId))}
                        style={{ width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer', border: '2px solid red', position: 'relative' }}
                        title="Click to remove"
                      >
                        <img src={img.url.startsWith('/uploads') ? `http://localhost:5000${img.url}` : img.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '32px' }}>
                <label>Upload Images {isEditing ? '(Optional)' : ''}</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="form-control"
                  onChange={(e) => setImageFiles(Array.from(e.target.files))}
                  required={!isEditing}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" disabled={formLoading} className="btn btn-primary" style={{ flexGrow: 1 }}>
                  {formLoading ? 'Saving...' : 'Save Product'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        products.length === 0 ? (
          <div className="glass-card text-center" style={{ padding: '80px 20px' }}>
            <p style={{ color: 'var(--text-muted)' }}>You haven't listed any products yet. Click 'Add Product' to get started!</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', background: '#111827', flexShrink: 0 }}>
                          <img
                            src={product.images && product.images[0] ? (product.images[0].url.startsWith('/uploads') ? `http://localhost:5000${product.images[0].url}` : product.images[0].url) : 'https://placehold.co/40x40'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <strong>{product.name}</strong>
                      </div>
                    </td>
                    <td>{product.category}</td>
                    <td style={{ color: 'var(--success-color)' }}>${product.price.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${product.stock > 0 ? 'badge-approved' : 'badge-banned'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td>{product.ratings.toFixed(1)} ★</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleEditClick(product)} className="btn btn-secondary btn-icon" title="Edit">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDeleteProduct(product._id)} className="btn btn-danger btn-icon" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        orders.length === 0 ? (
          <div className="glass-card text-center" style={{ padding: '80px 20px' }}>
            <p style={{ color: 'var(--text-muted)' }}>No orders placed for your products yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>...{order._id.slice(-6)}</td>
                    <td>{order.buyerName}</td>
                    <td style={{ color: 'var(--success-color)' }}>${order.totalAmount.toFixed(2)}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>
                      {order.orderStatus === 'Pending' && <span className="badge badge-pending">Pending</span>}
                      {order.orderStatus === 'Processing' && <span className="badge badge-processing">Processing</span>}
                      {order.orderStatus === 'Shipped' && <span className="badge badge-shipped">Shipped</span>}
                      {order.orderStatus === 'Delivered' && <span className="badge badge-approved">Delivered</span>}
                      {order.orderStatus === 'Cancelled' && <span className="badge badge-banned">Cancelled</span>}
                    </td>
                    <td>
                      {order.orderStatus !== 'Delivered' && order.orderStatus !== 'Cancelled' ? (
                        <select
                          className="form-control"
                          value={order.orderStatus}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          style={{ width: '130px', padding: '6px', fontSize: '13px' }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Finalized</span>
                      )}
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

export default SellerDashboard;
