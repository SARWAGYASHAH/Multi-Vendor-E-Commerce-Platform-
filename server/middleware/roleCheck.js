const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role ${req.user.role} is not authorized to access this resource`,
      });
    }

    // Additional check for sellers: must be approved by admin
    if (req.user.role === 'seller' && !req.user.isApproved) {
      return res.status(403).json({
        message: 'Access denied. Your seller account is pending admin approval.',
      });
    }

    next();
  };
};

module.exports = { authorize };
