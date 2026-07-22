import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      marginTop: 'auto',
      padding: '40px 0',
      borderTop: '1px solid var(--border-color)',
      background: 'rgba(9, 13, 22, 0.5)',
      textAlign: 'center',
      color: 'var(--text-muted)',
      fontSize: '14px'
    }}>
      <div className="container">
        <p>&copy; {new Date().getFullYear()} VeloMarket. All rights reserved.</p>
        <p style={{ marginTop: '8px', fontSize: '12px' }}>
          Crafted with MERN Stack & Premium Vanilla CSS.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
