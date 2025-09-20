const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Get user details from database
    const userTable = decoded.userType === 'candidate' ? 'candidates' : 'users';
    
    db.get(
      `SELECT * FROM ${userTable} WHERE id = ? AND ${decoded.userType === 'candidate' ? '1=1' : 'is_active = 1'}`,
      [decoded.userId],
      (err, user) => {
        if (err || !user) {
          return res.status(403).json({ error: 'User not found or inactive' });
        }

        req.user = {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role || 'candidate',
          userType: decoded.userType
        };
        
        next();
      }
    );
  });
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.userType === 'candidate' && !roles.includes('candidate')) {
      return res.status(403).json({ error: 'Access denied: Insufficient permissions' });
    }

    if (req.user.userType === 'user' && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied: Insufficient permissions' });
    }

    next();
  };
};

const requireAdmin = requireRole(['admin']);
const requireHR = requireRole(['admin', 'hr_manager', 'recruiter']);
const requireManager = requireRole(['admin', 'hr_manager', 'recruiter', 'hiring_manager']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireHR,
  requireManager
};