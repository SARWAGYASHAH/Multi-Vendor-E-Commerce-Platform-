import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Common pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Role pages
import ProductDetail from './pages/buyer/ProductDetail';
import Cart from './pages/buyer/Cart';
import OrderTracking from './pages/buyer/OrderTracking';
import SellerDashboard from './pages/seller/SellerDashboard';
import SellerAnalytics from './pages/seller/SellerAnalytics';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flexGrow: 1, paddingBottom: '40px' }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/product/:id" element={<ProductDetail />} />

            {/* Buyer Protected Routes */}
            <Route
              path="/cart"
              element={
                <ProtectedRoute allowedRoles={['buyer']}>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-orders"
              element={
                <ProtectedRoute allowedRoles={['buyer']}>
                  <OrderTracking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout-success"
              element={
                <ProtectedRoute allowedRoles={['buyer']}>
                  <OrderTracking />
                </ProtectedRoute>
              }
            />

            {/* Seller Protected Routes */}
            <Route
              path="/seller"
              element={
                <ProtectedRoute allowedRoles={['seller']}>
                  <SellerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/analytics"
              element={
                <ProtectedRoute allowedRoles={['seller']}>
                  <SellerAnalytics />
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch-all Redirect */}
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
